import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AlertEscalationConfigRepository } from '../../domain/repositories/alert-escalation-config.repository';
import { AlertEscalationMessageRepository } from '../../domain/repositories/alert-escalation-message.repository';
import { EventAlertLogRepository } from '../../domain/repositories/event-alert-log.repository';
import {
  AlertEscalationMessage,
  AlertLevel,
  MessageType,
} from '../../domain/entities/alert-escalation-message.entity';
import { AlertEscalationConfig } from '../../domain/entities/alert-escalation-config.entity';
import { Event } from '../../../events/domain/entities/event.entity';
import { TorretaColorService } from '../../../torreta-colors/application/services/torreta-color.service';

/**
 * Tipo para mensajes de torreta
 */
type TorretaPayload = {
  type: 'torreta';
  torreta: string; // externalId de la torreta
  color: string; // deviceColorId
};

/**
 * Tipo para mensajes de receptor
 */
type ReceptorPayload = {
  type: 'receptor';
  capcode: string; // externalId del receptor
  message: string;
};

/**
 * Tipo para mensajes de email
 */
type EmailPayload = {
  type: 'email';
  email: string; // dirección de correo
  message: string;
};

/**
 * Unión de tipos para el payload según el tipo de mensaje
 */
type EscalationPayload = EmailPayload | ReceptorPayload | TorretaPayload;

@Injectable()
export class AlertEscalationService {
  private readonly logger = new Logger(AlertEscalationService.name);

  constructor(
    private readonly alertEscalationConfigRepository: AlertEscalationConfigRepository,
    private readonly alertEscalationMessageRepository: AlertEscalationMessageRepository,
    private readonly eventAlertLogRepository: EventAlertLogRepository,
    private readonly httpService: HttpService,
    private readonly torretaColorService: TorretaColorService
  ) {}

  async findConfigByDeviceAndSignal(deviceId: number, deviceSignalId: number) {
    return await this.alertEscalationConfigRepository.findByDeviceAndSignal(
      deviceId,
      deviceSignalId
    );
  }

  async getMessagesByLevel(
    configId: number,
    level: AlertLevel
  ): Promise<AlertEscalationMessage[]> {
    return await this.alertEscalationMessageRepository.findByConfigAndLevel(
      configId,
      level
    );
  }

  async hasLevelBeenSent(eventId: number, level: AlertLevel): Promise<boolean> {
    const log = await this.eventAlertLogRepository.findByEventAndLevel(
      eventId,
      level
    );
    return !!log;
  }

  async sendMessagesToEndpoint(
    messages: AlertEscalationMessage[],
    endpointUrl: string
  ): Promise<boolean> {
    try {
      const resolvedUrl = this.resolveEndpointUrl(endpointUrl);
      const payloadData = await this.transformMessagesToPayload(messages);
      const payload = { data: payloadData };

      this.logMessages(messages, resolvedUrl, payload);

      try {
        const response = await firstValueFrom(
          this.httpService.post(resolvedUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000,
          })
        );

        this.logger.log(
          `✅ Successfully sent messages to endpoint. Status: ${response.status}`
        );
        return true;
      } catch (httpError) {
        this.logger.error(
          `❌ HTTP Error sending messages to endpoint ${resolvedUrl}:`,
          httpError instanceof Error ? httpError.message : String(httpError)
        );
        return false;
      }
    } catch (error) {
      this.logger.error(
        '❌ General error sending messages to endpoint:',
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }

  /**
   * Transforma los mensajes de escalación al formato de payload requerido.
   * Cada tipo de mensaje tiene su propia estructura específica.
   * Si un mensaje falla (color no encontrado), se omite pero se registra el error.
   */
  private async transformMessagesToPayload(
    messages: AlertEscalationMessage[]
  ): Promise<EscalationPayload[]> {
    const results = await Promise.allSettled(
      messages.map(msg => this.transformMessage(msg))
    );

    // Filtrar solo los mensajes exitosos y loggear los que fallaron
    const successful: EscalationPayload[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        const errorMessage =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason ?? 'Unknown error');
        this.logger.error(
          `❌ Failed to transform message ${index + 1}: ${errorMessage}. Message will be skipped.`
        );
      }
    });

    return successful;
  }

  /**
   * Transforma un mensaje individual al formato de payload según su tipo.
   * Cada tipo tiene su propia estructura específica:
   * - TORRETA: { type: "torreta", torreta: string, color: string }
   * - RECEPTOR: { type: "receptor", capcode: string, message: string }
   * - EMAIL: { type: "email", email: string, message: string }
   */
  private async transformMessage(
    msg: AlertEscalationMessage
  ): Promise<EscalationPayload> {
    switch (msg.messageType) {
      case MessageType.TORRETA:
        return this.transformTorretaMessage(msg);

      case MessageType.RECEPTOR:
        return {
          type: 'receptor',
          capcode: msg.targetId,
          message: msg.message,
        };

      case MessageType.EMAIL:
        return {
          type: 'email',
          email: msg.targetId,
          message: msg.message,
        };

      default:
        throw new Error(`Unknown message type: ${String(msg.messageType)}`);
    }
  }

  /**
   * Transforma un mensaje de tipo TORRETA al formato específico.
   * Maneja la conversión de color hexadecimal a deviceColorId si es necesario.
   */
  private async transformTorretaMessage(
    msg: AlertEscalationMessage
  ): Promise<TorretaPayload> {
    if (!msg.color) {
      throw new Error(
        `Torreta message ${msg.id} is missing color (deviceColorId)`
      );
    }

    // Verificar si msg.color es un deviceColorId válido (formato: letra + número, ej: "R1", "G1")
    // o si es un hexadecimal (formato: #RRGGBB)
    const isHexadecimal = msg.color.startsWith('#');

    if (isHexadecimal) {
      // Compatibilidad: si viene hexadecimal (datos antiguos), convertirlo
      this.logger.warn(
        `⚠️ Found hexadecimal color "${msg.color}" in message ${msg.id}. Converting to deviceColorId...`
      );
      const normalizedColor = msg.color.toUpperCase().trim();
      const torretaColor =
        await this.torretaColorService.getTorretaColorByHtmlColor(
          normalizedColor
        );

      if (!torretaColor) {
        this.logger.error(
          `❌ Cannot convert hex color "${normalizedColor}" to deviceColorId. Message will be skipped.`
        );
        throw new Error(
          `Torreta hex color "${normalizedColor}" not found. Update message ${msg.id} with a valid deviceColorId.`
        );
      }

      this.logger.log(
        `✅ Converted hex "${normalizedColor}" to deviceColorId "${torretaColor.deviceColorId}"`
      );

      return {
        type: 'torreta',
        torreta: msg.targetId,
        color: torretaColor.deviceColorId,
      };
    }

    // msg.color ya contiene el deviceColorId, usarlo directamente
    this.logger.debug(
      `✅ Using deviceColorId "${msg.color}" directly for torreta ${msg.targetId}`
    );

    return {
      type: 'torreta',
      torreta: msg.targetId,
      color: msg.color, // Ya es deviceColorId (ej: "R1", "G1", "Y1")
    };
  }

  /**
   * Registra los detalles de los mensajes que se enviarán.
   */
  private logMessages(
    messages: AlertEscalationMessage[],
    endpointUrl: string,
    payload: { data: EscalationPayload[] }
  ): void {
    this.logger.log(
      `🚨 ALERT ESCALATION - Sending messages to endpoint ${endpointUrl}:`
    );
    this.logger.log('📤 PAYLOAD TO SEND:', JSON.stringify(payload, null, 2));
    this.logger.log('🎯 MESSAGES DETAILS:');
    messages.forEach((msg, index) => {
      this.logger.log(
        `  ${index + 1}. Type: ${msg.messageType}, Target: ${msg.targetId}, Message: ${msg.message}, Color: ${msg.color}`
      );
    });
  }

  private resolveEndpointUrl(endpointUrl: string): string {
    try {
      const url = new URL(endpointUrl);
      if (
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname === '::1'
      ) {
        url.hostname = 'host.docker.internal';
      }
      return url.toString();
    } catch {
      return endpointUrl;
    }
  }

  async logAlertSent(
    eventId: number,
    level: AlertLevel,
    messages: AlertEscalationMessage[],
    success: boolean,
    endpointUrl: string,
    errorMessage?: string
  ): Promise<void> {
    await this.eventAlertLogRepository.create({
      eventId,
      level,
      sentAt: new Date(),
      messagesSent: messages.map(msg => ({
        targetId: msg.targetId,
        message: msg.message,
        color: msg.color,
        messageType: msg.messageType,
      })),
      success,
      errorMessage: errorMessage,
      endpointUrl,
    });
  }

  determineLevelToSend(
    timeElapsedMinutes: number,
    config: AlertEscalationConfig
  ): AlertLevel | null {
    if (timeElapsedMinutes >= config.escalation3DelayMinutes) {
      return AlertLevel.ESCALATION3;
    } else if (timeElapsedMinutes >= config.escalation2DelayMinutes) {
      return AlertLevel.ESCALATION2;
    } else if (timeElapsedMinutes >= config.escalation1DelayMinutes) {
      return AlertLevel.ESCALATION1;
    } else if (timeElapsedMinutes >= config.warningDelayMinutes) {
      return AlertLevel.WARNING;
    } else {
      return AlertLevel.ALERT;
    }
  }

  async sendAlertForLevel(
    event: Event,
    config: AlertEscalationConfig,
    level: AlertLevel
  ): Promise<void> {
    try {
      const alreadySent = await this.hasLevelBeenSent(event.id, level);
      if (alreadySent) {
        return;
      }

      const messages = await this.getMessagesByLevel(config.id, level);

      if (messages.length === 0) {
        return;
      }

      // Enviar mensajes al endpoint
      const success = await this.sendMessagesToEndpoint(
        messages,
        config.endpointUrl
      );

      // Registrar en log
      await this.logAlertSent(
        event.id,
        level,
        messages,
        success,
        config.endpointUrl,
        success ? undefined : 'HTTP request failed'
      );

      this.logger.log(
        `Alert ${level} sent for event ${event.id}: ${success ? 'SUCCESS' : 'FAILED'}`
      );
    } catch (error) {
      this.logger.error(
        `Error sending alert for level ${level} in event ${event.id}:`,
        error
      );
    }
  }

  async sendCloseEventAlert(
    event: Event,
    config: AlertEscalationConfig
  ): Promise<void> {
    try {
      this.logger.log(
        `🔴 PROCESSING CLOSE EVENT: ${event.id} with config: ${config.id}`
      );

      const alreadySent = await this.hasLevelBeenSent(
        event.id,
        AlertLevel.CLOSE
      );
      if (alreadySent) {
        this.logger.log(`Close alert already sent for event ${event.id}`);
        return;
      }

      const messages = await this.getMessagesByLevel(
        config.id,
        AlertLevel.CLOSE
      );

      this.logger.log(
        `🔍 Found ${messages.length} close messages for config ${config.id}`
      );

      if (messages.length === 0) {
        this.logger.warn(
          `No close messages configured for config ${config.id}`
        );
        return;
      }

      // Enviar mensajes al endpoint
      const success = await this.sendMessagesToEndpoint(
        messages,
        config.endpointUrl
      );

      // Registrar en log
      await this.logAlertSent(
        event.id,
        AlertLevel.CLOSE,
        messages,
        success,
        config.endpointUrl,
        success ? undefined : 'HTTP request failed'
      );

      this.logger.log(
        `Close alert sent for event ${event.id}: ${success ? 'SUCCESS' : 'FAILED'}`
      );
    } catch (error) {
      this.logger.error(
        `Error sending close alert for event ${event.id}:`,
        error
      );
    }
  }
}
