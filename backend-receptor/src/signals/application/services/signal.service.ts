import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Signal } from '../../domain/entities/signal.entity';
import {
  RawSignalRepository,
  CreateRawSignalDto,
  RawSignalFilters,
} from '../../domain/repositories/raw-signal.repository';
import { RawSignal } from '../../domain/entities/raw-signal.entity';
import { ProcessedSignal } from '../../domain/entities/processed-signal.entity';
import {
  ProcessedSignalRepository,
  CreateProcessedSignalDto,
  ProcessedSignalFilters,
} from '../../domain/repositories/processed-signal.repository';
import { DeviceRepository } from '../../../devices/domain/repositories/device.repository';
import { DeviceSignalRepository } from '../../../device-signals/domain/repositories/device-signal.repository';
import { WebSocketEmitterService } from '../../../websocket/services/websocket-emitter.service';
import { WEBSOCKET_EVENTS } from '../../../websocket/constants/websocket-events.constant';
import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';
import { EventStatus } from '../../../events/domain/entities/event.entity';
import { AreaDowntimeService } from '../../../area-downtime/application/services/area-downtime.service';
import { AlertCronService } from '../../../alert-escalation/application/services/alert-cron.service';
import type { Event } from '../../../events/domain/entities/event.entity';
import type { Device } from '../../../devices/domain/entities/device.entity';
import type { DeviceSignal } from '../../../device-signals/domain/entities/device-signal.entity';

@Injectable()
export class SignalService {
  private readonly logger = new Logger(SignalService.name);

  constructor(
    private readonly rawSignalRepository: RawSignalRepository,
    private readonly processedSignalRepository: ProcessedSignalRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly deviceSignalRepository: DeviceSignalRepository,
    private readonly eventRepository: TypeOrmEventRepository,
    private readonly webSocketEmitterService: WebSocketEmitterService,
    private readonly areaDowntimeService: AreaDowntimeService,
    private readonly alertCronService: AlertCronService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async processSignal(id: string, value: string): Promise<RawSignal> {
    const signal = new Signal(id, value);

    this.logger.log(`Received signal data: ${JSON.stringify({ id, value })}`);
    this.logger.log(signal);

    try {
      // 1. Guardar raw signal
      const createDto: CreateRawSignalDto = {
        externalId: id,
        value: value,
      };

      const savedSignal = await this.rawSignalRepository.create(createDto);
      this.logger.log(
        `Raw signal saved to database with ID: ${savedSignal.id}`
      );

      // 2. Procesar signal y relacionar con devices/device-signals
      await this.processSignalWithDeviceRelation(id, value);

      // 3. Manejar lógica de eventos automáticos
      await this.handleEventLogic(id, value);

      try {
        this.webSocketEmitterService.emitNewRawSignal({
          id: savedSignal.id,
          externalId: savedSignal.externalId,
          value: savedSignal.value,
          createdAt: savedSignal.createdAt,
        });
        this.logger.log(
          `WebSocket message emitted for event: ${WEBSOCKET_EVENTS.NEW_RAW_SIGNAL}`
        );
      } catch (wsError) {
        this.logger.error(
          `Error emitting WebSocket message: ${(wsError as Error).message}`,
          (wsError as Error).stack
        );
      }

      return savedSignal;
    } catch (error) {
      this.logger.error(
        `Error saving signal to database: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async processVirtualDeviceSignal(
    id: string,
    value: string,
    reason?: string,
    comment?: string
  ): Promise<RawSignal> {
    this.logger.log(
      `Received virtual device signal data: ${JSON.stringify({ id, value, reason, comment })}`
    );

    try {
      const createDto: CreateRawSignalDto = {
        externalId: id,
        value: value,
        virtualDevice: true,
        ...(reason && { reason }),
        ...(comment && { comment }),
      };

      const savedSignal = await this.rawSignalRepository.create(createDto);
      this.logger.log(
        `Raw virtual device signal saved to database with ID: ${savedSignal.id}`
      );

      await this.processSignalWithDeviceRelation(id, value);
      await this.handleEventLogicForVirtualDevice(id, value, reason, comment);

      try {
        this.webSocketEmitterService.emitNewRawSignal({
          id: savedSignal.id,
          externalId: savedSignal.externalId,
          value: savedSignal.value,
          createdAt: savedSignal.createdAt,
        });
        this.logger.log(
          `WebSocket message emitted for event: ${WEBSOCKET_EVENTS.NEW_RAW_SIGNAL}`
        );
      } catch (wsError) {
        this.logger.error(
          `Error emitting WebSocket message: ${(wsError as Error).message}`,
          (wsError as Error).stack
        );
      }

      return savedSignal;
    } catch (error) {
      this.logger.error(
        `Error saving virtual device signal to database: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  private async processSignalWithDeviceRelation(
    externalId: string,
    value: string
  ): Promise<void> {
    try {
      // Buscar device por externalId
      const device = await this.deviceRepository.findByExternalId(externalId);

      // Buscar device-signal por externalValueId Y deviceId para evitar colisiones
      const deviceSignal = device
        ? await this.deviceSignalRepository.findByExternalValueIdAndDeviceId(
            value,
            device.id
          )
        : await this.deviceSignalRepository.findByExternalValueId(value);

      const processedSignalDto: CreateProcessedSignalDto = {};

      // Si encontramos device, agregar información del device
      if (device) {
        processedSignalDto.deviceId = device.id;
        processedSignalDto.deviceName = device.name;
        this.logger.log(`Found device: ${device.name} (ID: ${device.id})`);
      }

      // Si encontramos device-signal, agregar información del device-signal
      if (deviceSignal) {
        processedSignalDto.deviceSignalId = deviceSignal.id;
        processedSignalDto.deviceSignalName = deviceSignal.name;
        this.logger.log(
          `Found device-signal: ${deviceSignal.name} (ID: ${deviceSignal.id})`
        );
      }

      // Guardar processed signal (aunque no encontremos device o device-signal)
      const savedProcessedSignal =
        await this.processedSignalRepository.create(processedSignalDto);

      this.logger.log(
        `Processed signal saved with ID: ${savedProcessedSignal.id}`,
        {
          deviceId: processedSignalDto.deviceId,
          deviceName: processedSignalDto.deviceName,
          deviceSignalId: processedSignalDto.deviceSignalId,
          deviceSignalName: processedSignalDto.deviceSignalName,
        }
      );
    } catch (error) {
      this.logger.error(
        `Error processing signal with device relation: ${(error as Error).message}`,
        (error as Error).stack
      );
      // No lanzamos el error para que el raw signal se guarde independientemente
    }
  }

  async getAllSignals(
    filters?: RawSignalFilters
  ): Promise<{ data: RawSignal[]; total: number }> {
    try {
      this.webSocketEmitterService.emitNewRawSignal({
        id: '1',
        externalId: '1',
        value: '1',
        createdAt: new Date(),
      });
      return await this.rawSignalRepository.findAll(filters);
    } catch (error) {
      this.logger.error(
        `Error retrieving signals: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getSignalById(id: number): Promise<RawSignal | null> {
    try {
      return await this.rawSignalRepository.findById(id);
    } catch (error) {
      this.logger.error(
        `Error retrieving signal by ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getSignalsByExternalId(externalId: string): Promise<RawSignal[]> {
    try {
      return await this.rawSignalRepository.findByExternalId(externalId);
    } catch (error) {
      this.logger.error(
        `Error retrieving signals by external ID ${externalId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getSignalsCount(): Promise<number> {
    try {
      return await this.rawSignalRepository.count();
    } catch (error) {
      this.logger.error(
        `Error getting signals count: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  // Métodos para señales procesadas
  async getAllProcessedSignals(
    filters?: ProcessedSignalFilters
  ): Promise<{ data: ProcessedSignal[]; total: number }> {
    try {
      return await this.processedSignalRepository.findAll(filters);
    } catch (error) {
      this.logger.error(
        `Error retrieving processed signals: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getProcessedSignalsByDeviceId(
    deviceId: number
  ): Promise<ProcessedSignal[]> {
    try {
      return await this.processedSignalRepository.findByDeviceId(deviceId);
    } catch (error) {
      this.logger.error(
        `Error retrieving processed signals by device ID ${deviceId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getProcessedSignalsByDeviceSignalId(
    deviceSignalId: number
  ): Promise<ProcessedSignal[]> {
    try {
      return await this.processedSignalRepository.findByDeviceSignalId(
        deviceSignalId
      );
    } catch (error) {
      this.logger.error(
        `Error retrieving processed signals by device signal ID ${deviceSignalId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getProcessedSignalsCount(): Promise<number> {
    try {
      return await this.processedSignalRepository.count();
    } catch (error) {
      this.logger.error(
        `Error getting processed signals count: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  // Métodos para manejo de eventos automáticos
  private async handleEventLogic(
    externalId: string,
    value: string
  ): Promise<void> {
    try {
      // Buscar device por externalId
      const device = await this.deviceRepository.findByExternalId(externalId);

      if (!device) {
        this.logger.log(`No device found for externalId: ${externalId}`);
        return;
      }

      // Buscar deviceSignal por externalValueId Y deviceId para evitar colisiones
      const deviceSignal =
        await this.deviceSignalRepository.findByExternalValueIdAndDeviceId(
          value,
          device.id
        );

      if (!deviceSignal) {
        this.logger.log(
          `No deviceSignal found for externalValueId: ${value} and deviceId: ${device.id}`
        );
        return;
      }

      this.logger.log(
        `Processing event logic for device: ${device.name}, signal: ${deviceSignal.name}`
      );

      // Lógica de estados de eventos
      const existingOpenEvent =
        await this.eventRepository.findOpenByDeviceAndSignal(
          device.id,
          deviceSignal.id
        );

      const existingInProgressEvent =
        await this.eventRepository.findInProgressByDeviceAndSignal(
          device.id,
          deviceSignal.id
        );

      if (existingInProgressEvent) {
        // Cambiar de in-progress a closed
        await this.closeEvent(existingInProgressEvent);
      } else if (existingOpenEvent) {
        // Cambiar de open a in-progress
        await this.setEventInProgress(existingOpenEvent);
      } else {
        // Crear nuevo evento open
        await this.createNewEvent(device, deviceSignal);
      }
    } catch (error) {
      this.logger.error(
        `Error handling event logic: ${(error as Error).message}`,
        (error as Error).stack
      );
      // No lanzamos el error para que el raw signal se guarde independientemente
    }
  }

  private async createNewEvent(
    device: Device,
    deviceSignal: DeviceSignal
  ): Promise<void> {
    try {
      const event = await this.eventRepository.create({
        areaId: device.areaId,
        areaName: device.area?.name ?? 'Unknown Area',
        departmentId: deviceSignal.departmentId || 1,
        departmentName: deviceSignal.department?.name ?? 'Unknown Department',
        deviceId: device.id,
        deviceName: device.name,
        deviceSignalId: deviceSignal.id,
        deviceSignalName: deviceSignal.name,
      });

      this.logger.log(`Created new event with ID: ${event.id}`);

      await this.sendEventWebhook(event, 'created');

      // Manejar lógica de tiempo de paro del área
      try {
        await this.areaDowntimeService.handleEventForAreaDowntime(event);
      } catch (downtimeError) {
        this.logger.error(
          `Error handling area downtime for new event: ${(downtimeError as Error).message}`,
          (downtimeError as Error).stack
        );
      }

      // Emitir evento WebSocket
      this.webSocketEmitterService.emitToAll('new-event', {
        area: event.areaName,
        department: event.departmentName,
        status: event.status,
        device: event.deviceName,
        signal: event.deviceSignalName,
      });

      this.logger.log(
        `WebSocket event 'new-event' emitted for event ID: ${event.id}`
      );
    } catch (error) {
      this.logger.error(
        `Error creating new event: ${(error as Error).message}`,
        (error as Error).stack
      );
    }
  }

  private async setEventInProgress(event: Event): Promise<void> {
    try {
      const updatedEvent = await this.eventRepository.updateStatus(
        event.id,
        EventStatus.IN_PROGRESS
      );

      this.logger.log(`Event ${event.id} set to in-progress`);

      await this.sendEventWebhook(updatedEvent, 'updated');

      // Manejar lógica de tiempo de paro del área
      try {
        await this.areaDowntimeService.handleEventForAreaDowntime(updatedEvent);
      } catch (downtimeError) {
        this.logger.error(
          `Error handling area downtime for event update: ${(downtimeError as Error).message}`,
          (downtimeError as Error).stack
        );
      }

      // Emitir evento WebSocket
      this.webSocketEmitterService.emitToAll('event-updated', {
        eventId: updatedEvent.id,
        status: updatedEvent.status,
        area: updatedEvent.areaName,
        department: updatedEvent.departmentName,
      });

      this.logger.log(
        `WebSocket event 'event-updated' emitted for event ID: ${updatedEvent.id}`
      );
    } catch (error) {
      this.logger.error(
        `Error setting event in progress: ${(error as Error).message}`,
        (error as Error).stack
      );
    }
  }

  private async closeEvent(event: Event): Promise<void> {
    try {
      const durationSeconds = Math.floor(
        (new Date().getTime() - event.createdAt.getTime()) / 1000
      );

      const updatedEvent = await this.eventRepository.updateStatus(
        event.id,
        EventStatus.CLOSED,
        {
          durationSeconds,
        }
      );

      this.logger.log(
        `Event ${event.id} closed with duration: ${durationSeconds} seconds`
      );

      await this.sendEventWebhook(updatedEvent, 'closed');

      // Manejar lógica de tiempo de paro del área
      try {
        await this.areaDowntimeService.handleEventForAreaDowntime(updatedEvent);
      } catch (downtimeError) {
        this.logger.error(
          `Error handling area downtime for closed event: ${(downtimeError as Error).message}`,
          (downtimeError as Error).stack
        );
      }

      // Emitir evento WebSocket
      this.webSocketEmitterService.emitToAll('closed-event', {
        eventId: updatedEvent.id,
        area: updatedEvent.areaName,
        department: updatedEvent.departmentName,
        status: updatedEvent.status,
        duration: durationSeconds,
      });

      this.logger.log(
        `WebSocket event 'closed-event' emitted for event ID: ${updatedEvent.id}`
      );

      // NUEVA LÓGICA: Enviar alerta de cierre de evento
      try {
        await this.alertCronService.processClosedEvent(updatedEvent);
      } catch (alertError) {
        this.logger.error(
          `Error processing close event alert: ${(alertError as Error).message}`,
          (alertError as Error).stack
        );
      }
    } catch (error) {
      this.logger.error(
        `Error closing event: ${(error as Error).message}`,
        (error as Error).stack
      );
    }
  }

  private async handleEventLogicForVirtualDevice(
    externalId: string,
    value: string,
    reason?: string,
    comment?: string
  ): Promise<void> {
    try {
      const device = await this.deviceRepository.findByExternalId(externalId);

      if (!device) {
        this.logger.log(`No device found for externalId: ${externalId}`);
        return;
      }

      // CRÍTICO: Buscar deviceSignal por externalValueId Y deviceId para evitar colisiones
      const deviceSignal =
        await this.deviceSignalRepository.findByExternalValueIdAndDeviceId(
          value,
          device.id
        );

      if (!deviceSignal) {
        this.logger.log(
          `No deviceSignal found for externalValueId: ${value} and deviceId: ${device.id}`
        );
        return;
      }

      this.logger.log(
        `Processing virtual device event logic for device: ${device.name} (ID: ${device.id}), signal: ${deviceSignal.name} (ID: ${deviceSignal.id}, ExternalValueId: ${deviceSignal.externalValueId}, DepartmentId: ${deviceSignal.departmentId})`
      );

      const existingOpenEvent =
        await this.eventRepository.findOpenByDeviceAndSignal(
          device.id,
          deviceSignal.id
        );

      const existingInProgressEvent =
        await this.eventRepository.findInProgressByDeviceAndSignal(
          device.id,
          deviceSignal.id
        );

      if (existingInProgressEvent) {
        await this.closeEvent(existingInProgressEvent);
      } else if (existingOpenEvent) {
        await this.setEventInProgress(existingOpenEvent);
      } else {
        await this.createNewVirtualDeviceEvent(
          device,
          deviceSignal,
          reason,
          comment
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling virtual device event logic: ${(error as Error).message}`,
        (error as Error).stack
      );
    }
  }

  private async createNewVirtualDeviceEvent(
    device: Device,
    deviceSignal: DeviceSignal,
    reason?: string,
    comment?: string
  ): Promise<void> {
    try {
      this.logger.log(
        `Creating new virtual device event - Device: ${device.name} (ID: ${device.id}), Signal: ${deviceSignal.name} (ID: ${deviceSignal.id})`
      );

      const event = await this.eventRepository.create({
        areaId: device.areaId,
        areaName: device.area?.name ?? 'Unknown Area',
        departmentId: deviceSignal.departmentId || 1,
        departmentName: deviceSignal.department?.name ?? 'Unknown Department',
        deviceId: device.id,
        deviceName: device.name,
        deviceSignalId: deviceSignal.id,
        deviceSignalName: deviceSignal.name,
        virtualDevice: true,
        ...(reason && { reason }),
        ...(comment && { comment }),
      });

      this.logger.log(`Created new virtual device event with ID: ${event.id}`);

      await this.sendEventWebhook(event, 'created');

      try {
        await this.areaDowntimeService.handleEventForAreaDowntime(event);
      } catch (downtimeError) {
        this.logger.error(
          `Error handling area downtime for new virtual device event: ${(downtimeError as Error).message}`,
          (downtimeError as Error).stack
        );
      }

      this.webSocketEmitterService.emitToAll('new-event', {
        area: event.areaName,
        department: event.departmentName,
        status: event.status,
        device: event.deviceName,
        signal: event.deviceSignalName,
      });

      this.logger.log(
        `WebSocket event 'new-event' emitted for virtual device event ID: ${event.id}`
      );
    } catch (error) {
      this.logger.error(
        `Error creating new virtual device event: ${(error as Error).message}`,
        (error as Error).stack
      );
    }
  }

  private async sendEventWebhook(event: Event, action: 'created' | 'updated' | 'closed'): Promise<void> {
    try {
      const url =
        this.configService.get<string>('EVENTS_WEBHOOK_URL') ||
        // En Windows/macOS, host.docker.internal apunta al host desde Docker
        'http://host.docker.internal:1880/events';
      const payload = {
        action,
        event: {
          id: event.id,
          status: event.status,
          areaId: event.areaId,
          areaName: event.areaName,
          departmentId: event.departmentId,
          departmentName: event.departmentName,
          deviceId: event.deviceId,
          deviceName: event.deviceName,
          deviceSignalId: event.deviceSignalId,
          deviceSignalName: event.deviceSignalName,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          inProgressAt: event.inProgressAt,
          closedAt: event.closedAt,
          durationSeconds: event.durationSeconds,
          virtualDevice: event.virtualDevice,
          reason: event.reason,
          comment: event.comment,
        },
      };

      await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        })
      );
      this.logger.log(`Event webhook sent to ${url} for action ${action}`);
    } catch (error) {
      this.logger.error(
        `Failed to send event webhook: ${(error as Error).message}`,
        (error as Error).stack
      );
    }
  }
}
