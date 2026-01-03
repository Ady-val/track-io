import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AlertMessage, MessageType } from '../../domain/entities/alert-message.entity';
import { TorretaColorService } from '../../../torreta-colors/application/services/torreta-color.service';

type TorretaPayload = {
  type: 'torreta';
  torreta: string;
  color: string;
};

type ReceptorPayload = {
  type: 'receptor';
  capcode: string;
  message: string;
};

type EmailPayload = {
  type: 'email';
  email: string;
  message: string;
};

type EscalationPayload = EmailPayload | ReceptorPayload | TorretaPayload;

@Injectable()
export class AlertMessageSenderService {
  private readonly endpointUrl = 'http://localhost:1880/events';
  private readonly logger = new Logger(AlertMessageSenderService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly torretaColorService: TorretaColorService
  ) {}

  async sendMessages(
    messages: AlertMessage[],
    endpointUrl?: string
  ): Promise<boolean> {
    try {
      const resolvedUrl = this.resolveEndpointUrl(
        endpointUrl || this.endpointUrl
      );
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

  private async transformMessagesToPayload(
    messages: AlertMessage[]
  ): Promise<EscalationPayload[]> {
    const results = await Promise.allSettled(
      messages.map(msg => this.transformMessage(msg))
    );

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

  private async transformMessage(
    msg: AlertMessage
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

  private async transformTorretaMessage(
    msg: AlertMessage
  ): Promise<TorretaPayload> {
    if (!msg.color) {
      throw new Error(
        `Torreta message ${msg.id} is missing color (deviceColorId)`
      );
    }

    const isHexadecimal = msg.color.startsWith('#');

    if (isHexadecimal) {
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

    this.logger.debug(
      `✅ Using deviceColorId "${msg.color}" directly for torreta ${msg.targetId}`
    );

    return {
      type: 'torreta',
      torreta: msg.targetId,
      color: msg.color,
    };
  }

  private logMessages(
    messages: AlertMessage[],
    endpointUrl: string,
    payload: { data: EscalationPayload[] }
  ): void {
    this.logger.log(
      `🚨 ALERT MESSAGE - Sending messages to endpoint ${endpointUrl}:`
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
      if (process.env['NODE_ENV'] === 'development') return endpointUrl;
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
}

