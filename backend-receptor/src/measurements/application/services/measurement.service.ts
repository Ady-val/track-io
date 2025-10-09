import { Injectable, Logger } from '@nestjs/common';
import { Measurement } from '../../domain/entities/measurement.entity';
import {
  RawMeasurementRepository,
  CreateRawMeasurementDto,
  RawMeasurementFilters,
} from '../../domain/repositories/raw-measurement.repository';
import { RawMeasurement } from '../../domain/entities/raw-measurement.entity';
import { WebSocketEmitterService } from '../../../websocket/services/websocket-emitter.service';
import { WEBSOCKET_EVENTS } from '../../../websocket/constants/websocket-events.constant';

@Injectable()
export class MeasurementService {
  private readonly logger = new Logger(MeasurementService.name);

  constructor(
    private readonly rawMeasurementRepository: RawMeasurementRepository,
    private readonly webSocketEmitterService: WebSocketEmitterService
  ) {}

  async processMeasurement(id: string, value: string): Promise<RawMeasurement> {
    const measurement = new Measurement(id, value);

    this.logger.log(
      `Received measurement data: ${JSON.stringify({ id, value })}`
    );
    this.logger.log(measurement);

    try {
      const createDto: CreateRawMeasurementDto = {
        externalId: id,
        value: value,
      };

      const savedMeasurement =
        await this.rawMeasurementRepository.create(createDto);

      this.logger.log(
        `Measurement saved to database with ID: ${savedMeasurement.id}`
      );

      try {
        this.webSocketEmitterService.emitNewRawMeasurement({
          id: savedMeasurement.id,
          externalId: savedMeasurement.externalId,
          value: savedMeasurement.value,
          createdAt: savedMeasurement.createdAt,
        });
        this.logger.log(
          `WebSocket message emitted for event: ${WEBSOCKET_EVENTS.NEW_RAW_MEASUREMENT}`
        );
      } catch (wsError) {
        this.logger.error(
          `Error emitting WebSocket message: ${(wsError as Error).message}`,
          (wsError as Error).stack
        );
      }

      return savedMeasurement;
    } catch (error) {
      this.logger.error(
        `Error saving measurement to database: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getAllMeasurements(
    filters?: RawMeasurementFilters
  ): Promise<{ data: RawMeasurement[]; total: number }> {
    try {
      this.webSocketEmitterService.emitNewRawMeasurement({
        id: '1',
        externalId: '1',
        value: '1',
        createdAt: new Date(),
      });
      return await this.rawMeasurementRepository.findAll(filters);
    } catch (error) {
      this.logger.error(
        `Error retrieving measurements: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getMeasurementById(id: number): Promise<RawMeasurement | null> {
    try {
      return await this.rawMeasurementRepository.findById(id);
    } catch (error) {
      this.logger.error(
        `Error retrieving measurement by ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getMeasurementsByExternalId(
    externalId: string
  ): Promise<RawMeasurement[]> {
    try {
      return await this.rawMeasurementRepository.findByExternalId(externalId);
    } catch (error) {
      this.logger.error(
        `Error retrieving measurements by external ID ${externalId}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getMeasurementsCount(): Promise<number> {
    try {
      return await this.rawMeasurementRepository.count();
    } catch (error) {
      this.logger.error(
        `Error getting measurements count: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }
}
