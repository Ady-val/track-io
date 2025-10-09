import { Injectable, Logger } from '@nestjs/common';
import {
  RawMeasurementRepository,
  CreateRawMeasurementDto,
  RawMeasurementFilters,
} from '../../domain/repositories/raw-measurement.repository';
import { RawMeasurement } from '../../domain/entities/raw-measurement.entity';
import { WebSocketEmitterService } from '../../../websocket/services/websocket-emitter.service';
import { WEBSOCKET_EVENTS } from '../../../websocket/constants/websocket-events.constant';
import { MeasurementService } from '../../../measurements/application/services/measurement.service';
import { MeasurementValueRepository } from '../../../measurements/domain/repositories/measurement-value.repository';

@Injectable()
export class RawMeasurementService {
  private readonly logger = new Logger(RawMeasurementService.name);

  constructor(
    private readonly rawMeasurementRepository: RawMeasurementRepository,
    private readonly webSocketEmitterService: WebSocketEmitterService,
    private readonly measurementService: MeasurementService,
    private readonly measurementValueRepository: MeasurementValueRepository
  ) {}

  async processMeasurement(id: string, value: string): Promise<RawMeasurement> {
    this.logger.log(
      `Received raw measurement data: ${JSON.stringify({ id, value })}`
    );

    // Try to save to measurement_values if this raw measurement corresponds to a measurement
    try {
      const measurement =
        await this.measurementService.getMeasurementByExternalId(id);

      if (measurement) {
        try {
          await this.measurementValueRepository.create({
            measurementId: measurement.id,
            value: value,
          });
          this.logger.log(
            `Measurement value saved for measurement ID: ${measurement.id}`
          );
        } catch (measurementValueError) {
          this.logger.error(
            `Error saving measurement value: ${(measurementValueError as Error).message}`,
            (measurementValueError as Error).stack
          );
        }
      }
    } catch (measurementLookupError) {
      this.logger.error(
        `Error looking up measurement by external ID: ${(measurementLookupError as Error).message}`,
        (measurementLookupError as Error).stack
      );
    }

    // Continue with normal flow regardless of measurement value save result
    try {
      const createDto: CreateRawMeasurementDto = {
        externalId: id,
        value: value,
      };

      const savedMeasurement =
        await this.rawMeasurementRepository.create(createDto);

      this.logger.log(
        `Raw measurement saved to database with ID: ${savedMeasurement.id}`
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
        `Error saving raw measurement to database: ${(error as Error).message}`,
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
        `Error retrieving raw measurements: ${(error as Error).message}`,
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
        `Error retrieving raw measurement by ID ${id}: ${(error as Error).message}`,
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
        `Error retrieving raw measurements by external ID ${externalId}: ${(error as Error).message}`,
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
        `Error getting raw measurements count: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }
}
