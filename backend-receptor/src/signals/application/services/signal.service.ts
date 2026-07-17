import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
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
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';
import {
  Event,
  EventStatus,
} from '../../../events/domain/entities/event.entity';
import {
  EventScheduledDowntimeSliceRepository,
  type CreateEventSliceDto,
} from '../../../events/domain/repositories/event-scheduled-downtime-slice.repository';
import { SliceSegment } from '../../../events/domain/entities/event-scheduled-downtime-slice.entity';
import { AreaDowntimeService } from '../../../area-downtime/application/services/area-downtime.service';
import { AlertCronService } from '../../../alert-escalation/application/services/alert-cron.service';
import { AreaTorretaSignalService } from '../../../area-torreta-config/application/services/area-torreta-signal.service';
import {
  ScheduledDowntimeCalculatorService,
  type ScheduledDowntimeDiscount,
} from '../../../scheduled-downtimes/application/services/scheduled-downtime-calculator.service';
import type { Device } from '../../../devices/domain/entities/device.entity';
import type { DeviceSignal } from '../../../device-signals/domain/entities/device-signal.entity';

/** Shared by POST /signals and virtual-device flows so event + torreta outbound logic stays identical. */
type EventSignalContext = {
  virtualDevice?: boolean;
  reason?: string;
  comment?: string;
};

@Injectable()
export class SignalService {
  private readonly logger = new Logger(SignalService.name);
  private areaTorretaSignalService?: AreaTorretaSignalService;

  constructor(
    private readonly rawSignalRepository: RawSignalRepository,
    private readonly processedSignalRepository: ProcessedSignalRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly deviceSignalRepository: DeviceSignalRepository,
    private readonly eventRepository: TypeOrmEventRepository,
    private readonly webSocketEmitterService: WebSocketEmitterService,
    private readonly areaDowntimeService: AreaDowntimeService,
    private readonly alertCronService: AlertCronService,
    private readonly scheduledDowntimeCalculatorService: ScheduledDowntimeCalculatorService,
    private readonly eventSliceRepository: EventScheduledDowntimeSliceRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly moduleRef: ModuleRef
  ) {}

  private getAreaTorretaSignalService(): AreaTorretaSignalService {
    if (!this.areaTorretaSignalService) {
      const service = this.moduleRef.get(AreaTorretaSignalService, {
        strict: false,
      });
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!service) {
        throw new Error('AreaTorretaSignalService provider is not available');
      }
      this.areaTorretaSignalService = service;
    }

    return this.areaTorretaSignalService;
  }

  async processSignal(id: string, value: string): Promise<RawSignal> {
    const signal = new Signal(id, value);

    this.logger.log(`Received signal data: ${JSON.stringify({ id, value })}`);
    this.logger.log(signal);

    try {
      const createDto: CreateRawSignalDto = {
        externalId: id,
        value: value,
      };

      const savedSignal = await this.rawSignalRepository.create(createDto);
      this.logger.log(
        `Raw signal saved to database with ID: ${savedSignal.id}`
      );

      await this.processSignalWithDeviceRelation(id, value);

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
      await this.handleEventLogic(id, value, {
        virtualDevice: true,
        ...(reason !== undefined ? { reason } : {}),
        ...(comment !== undefined ? { comment } : {}),
      });

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
      const device = await this.deviceRepository.findByExternalId(externalId);

      const deviceSignal = device
        ? await this.deviceSignalRepository.findByExternalValueIdAndDeviceId(
            value,
            device.id
          )
        : await this.deviceSignalRepository.findByExternalValueId(value);

      const processedSignalDto: CreateProcessedSignalDto = {};

      if (device) {
        processedSignalDto.deviceId = device.id;
        processedSignalDto.deviceName = device.name;
        this.logger.log(`Found device: ${device.name} (ID: ${device.id})`);
      }

      if (deviceSignal) {
        processedSignalDto.deviceSignalId = deviceSignal.id;
        processedSignalDto.deviceSignalName = deviceSignal.name;
        this.logger.log(
          `Found device-signal: ${deviceSignal.name} (ID: ${deviceSignal.id})`
        );
      }

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

  /**
   * Single path for hardware (`POST /signals`) and virtual-device signals.
   * State machine: in-progress → close; open → in-progress; none → new event.
   */
  private async handleEventLogic(
    externalId: string,
    value: string,
    context?: EventSignalContext
  ): Promise<void> {
    try {
      const device = await this.deviceRepository.findByExternalId(externalId);

      if (!device) {
        this.logger.log(`No device found for externalId: ${externalId}`);
        return;
      }

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

      const flowLabel = context?.virtualDevice
        ? 'virtual device'
        : 'hardware signal';
      this.logger.log(
        `Processing event logic (${flowLabel}) for device: ${device.name}, signal: ${deviceSignal.name}`
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
        await this.createNewEvent(device, deviceSignal, context);
      }
    } catch (error) {
      this.logger.error(
        `Error handling event logic: ${(error as Error).message}`,
        (error as Error).stack
      );
    }
  }

  private async createNewEvent(
    device: Device,
    deviceSignal: DeviceSignal,
    context?: EventSignalContext
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
        ...(context?.virtualDevice && { virtualDevice: true }),
        ...(context?.reason && { reason: context.reason }),
        ...(context?.comment && { comment: context.comment }),
      });

      this.logger.log(`Created new event with ID: ${event.id}`);

      try {
        await this.areaDowntimeService.handleEventForAreaDowntime(event);
      } catch (downtimeError) {
        this.logger.error(
          `Error handling area downtime for new event: ${(downtimeError as Error).message}`,
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
        `WebSocket event 'new-event' emitted for event ID: ${event.id}`
      );

      try {
        await this.getAreaTorretaSignalService().processEventForAreaTorretas(
          event
        );
      } catch (torretaError) {
        this.logger.error(
          `Error processing area torreta signals for new event: ${(torretaError as Error).message}`,
          (torretaError as Error).stack
        );
      }
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

      try {
        await this.areaDowntimeService.handleEventForAreaDowntime(updatedEvent);
      } catch (downtimeError) {
        this.logger.error(
          `Error handling area downtime for event update: ${(downtimeError as Error).message}`,
          (downtimeError as Error).stack
        );
      }

      this.webSocketEmitterService.emitToAll('event-updated', {
        eventId: updatedEvent.id,
        status: updatedEvent.status,
        area: updatedEvent.areaName,
        department: updatedEvent.departmentName,
      });

      this.logger.log(
        `WebSocket event 'event-updated' emitted for event ID: ${updatedEvent.id}`
      );

      try {
        await this.getAreaTorretaSignalService().processEventForAreaTorretas(
          updatedEvent
        );
      } catch (torretaError) {
        this.logger.error(
          `Error processing area torreta signals for in-progress event: ${(torretaError as Error).message}`,
          (torretaError as Error).stack
        );
      }
    } catch (error) {
      this.logger.error(
        `Error setting event in progress: ${(error as Error).message}`,
        (error as Error).stack
      );
    }
  }

  /**
   * Calcula el descuento por paros programados sin poder romper nunca el cierre
   * del evento. Si algo falla, degrada a "sin descuento" (efectivo = crudo),
   * que es el peor caso conservador: reporta más paro del real, nunca menos.
   * Ver BUILD_SPEC_FASE2 §4.3 / degradación segura de la Fase 1.
   */
  private async safeCalculateDiscount(
    areaId: number,
    rangeStart: Date,
    rangeEnd: Date
  ): Promise<ScheduledDowntimeDiscount> {
    try {
      return await this.scheduledDowntimeCalculatorService.getDiscount(
        areaId,
        rangeStart,
        rangeEnd
      );
    } catch (error) {
      this.logger.error(
        `Fallo al calcular descuento de paros programados para área ${areaId}; ` +
          `se cierra el evento sin descuento: ${(error as Error).message}`,
        (error as Error).stack
      );

      return { timezone: '', totalDiscountedSeconds: 0, slices: [] };
    }
  }

  /** Rebanadas de un descuento → DTOs de persistencia, etiquetadas por tramo. */
  private toSliceDtos(
    eventId: number,
    discount: ScheduledDowntimeDiscount,
    segment: SliceSegment
  ): CreateEventSliceDto[] {
    return discount.slices.map(slice => ({
      eventId,
      scheduledDowntimeId: slice.scheduledDowntimeId,
      name: slice.name,
      configuredStartTime: slice.configuredStartTime,
      configuredEndTime: slice.configuredEndTime,
      occurredFrom: slice.from,
      occurredTo: slice.to,
      seconds: slice.seconds,
      segment,
      timezone: discount.timezone,
    }));
  }

  private async closeEvent(event: Event): Promise<void> {
    try {
      const closedAt = new Date();
      // ⌊cierre⌋ − ⌊inicio⌋ (no ⌊cierre − inicio⌋): misma retícula de segundo
      // entero que usa el calculador para las rebanadas, de modo que en un
      // evento totalmente cubierto el descuento sea EXACTAMENTE la duración y
      // nunca la exceda por redondeo.
      const durationSeconds =
        Math.floor(closedAt.getTime() / 1000) -
        Math.floor(event.createdAt.getTime() / 1000);

      // El descuento se reparte en dos tramos contiguos y disjuntos: atención
      // [created, in_progress) y solución [in_progress, closed). Su unión es
      // [created, closed), así que discount(total) = discount(r) + discount(s)
      // es exacto (§4.1). Cada tramo produce sus rebanadas trazables.
      const inProgressAt = event.inProgressAt ?? null;

      let responseDiscountSeconds: number | null;
      let totalDiscountedSeconds: number;
      const sliceDtos: CreateEventSliceDto[] = [];

      if (inProgressAt) {
        const response = await this.safeCalculateDiscount(
          event.areaId,
          event.createdAt,
          inProgressAt
        );
        const resolution = await this.safeCalculateDiscount(
          event.areaId,
          inProgressAt,
          closedAt
        );

        responseDiscountSeconds = response.totalDiscountedSeconds;
        totalDiscountedSeconds =
          response.totalDiscountedSeconds + resolution.totalDiscountedSeconds;
        sliceDtos.push(
          ...this.toSliceDtos(event.id, response, SliceSegment.RESPONSE),
          ...this.toSliceDtos(event.id, resolution, SliceSegment.RESOLUTION)
        );
      } else {
        // Sin in_progress_at (no debería pasar con el ciclo de 3 pulsaciones):
        // atribuye todo a solución y deja response_discount_seconds = NULL.
        const resolution = await this.safeCalculateDiscount(
          event.areaId,
          event.createdAt,
          closedAt
        );
        responseDiscountSeconds = null;
        totalDiscountedSeconds = resolution.totalDiscountedSeconds;
        sliceDtos.push(
          ...this.toSliceDtos(event.id, resolution, SliceSegment.RESOLUTION)
        );
      }

      const effectiveDurationSeconds = Math.max(
        0,
        durationSeconds - totalDiscountedSeconds
      );

      // Evento y rebanadas en la MISMA transacción (§4.3): un evento con
      // descuento pero sin rebanadas rompería el invariante Σslices === total.
      const updateData: Partial<Event> = {
        status: EventStatus.CLOSED,
        closedAt,
        durationSeconds,
        scheduledDowntimeDiscountSeconds: totalDiscountedSeconds,
        effectiveDurationSeconds,
      };
      if (responseDiscountSeconds !== null) {
        updateData.responseDiscountSeconds = responseDiscountSeconds;
      }

      await this.dataSource.transaction(async manager => {
        await manager.update(Event, event.id, updateData);
        await this.eventSliceRepository.createMany(sliceDtos, manager);
      });

      const updatedEvent = await this.eventRepository.findById(event.id);
      if (!updatedEvent) {
        throw new Error(`Event ${event.id} not found after close`);
      }

      this.logger.log(
        `Event ${event.id} closed with duration: ${durationSeconds} seconds ` +
          `(descuento paros programados: ${totalDiscountedSeconds} s, ` +
          `${sliceDtos.length} rebanadas)`
      );

      try {
        await this.areaDowntimeService.handleEventForAreaDowntime(updatedEvent);
      } catch (downtimeError) {
        this.logger.error(
          `Error handling area downtime for closed event: ${(downtimeError as Error).message}`,
          (downtimeError as Error).stack
        );
      }

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

      try {
        await this.alertCronService.processClosedEvent(updatedEvent);
      } catch (alertError) {
        this.logger.error(
          `Error processing close event alert: ${(alertError as Error).message}`,
          (alertError as Error).stack
        );
      }

      try {
        await this.getAreaTorretaSignalService().processEventForAreaTorretas(
          updatedEvent
        );
      } catch (torretaError) {
        this.logger.error(
          `Error processing area torreta signals for closed event: ${(torretaError as Error).message}`,
          (torretaError as Error).stack
        );
      }
    } catch (error) {
      this.logger.error(
        `Error closing event: ${(error as Error).message}`,
        (error as Error).stack
      );
    }
  }
}
