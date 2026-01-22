import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import {
  RawMeasurementRepository,
  RawMeasurementFilters,
} from '../../domain/repositories/raw-measurement.repository';
import { RawMeasurement } from '../../domain/entities/raw-measurement.entity';
import { WebSocketEmitterService } from '../../../websocket/services/websocket-emitter.service';
import { WEBSOCKET_EVENTS } from '../../../websocket/constants/websocket-events.constant';
import { MeasurementService } from '../../../measurements/application/services/measurement.service';
import { MeasurementValueRepository } from '../../../measurements/domain/repositories/measurement-value.repository';
import { AlertEvaluationService } from '../../../alert-rules/application/services/alert-evaluation.service';

@Injectable()
export class RawMeasurementService {
  private readonly logger = new Logger(RawMeasurementService.name);

  constructor(
    private readonly rawMeasurementRepository: RawMeasurementRepository,
    private readonly webSocketEmitterService: WebSocketEmitterService,
    private readonly measurementService: MeasurementService,
    private readonly measurementValueRepository: MeasurementValueRepository,
    @Inject(forwardRef(() => AlertEvaluationService))
    private readonly alertEvaluationService: AlertEvaluationService
  ) {}

  async processMeasurement(id: string, value: string): Promise<RawMeasurement> {
    this.logger.log(
      `Processing raw measurement: ${JSON.stringify({ id, value })}`
    );

    try {
      const savedMeasurement = await this.rawMeasurementRepository.create({
        externalId: id,
        value: value,
      });

      this.logger.log(`Raw measurement saved with ID: ${savedMeasurement.id}`);

      await this.saveMeasurementValue(id, value);
      this.emitWebSocketEvent(savedMeasurement);
      await this.evaluateAlertRules(savedMeasurement);

      return savedMeasurement;
    } catch (error) {
      this.logger.error(
        `Critical error processing measurement: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  private async saveMeasurementValue(
    externalId: string,
    value: string
  ): Promise<void> {
    try {
      const measurement =
        await this.measurementService.getMeasurementByExternalId(externalId);

      if (measurement) {
        await this.measurementValueRepository.create({
          measurementId: measurement.id,
          value: value,
        });
        this.logger.log(
          `Measurement value saved for measurement ID: ${measurement.id}`
        );
      }
    } catch (error) {
      this.logger.debug(
        `Could not save measurement value: ${(error as Error).message}`
      );
    }
  }

  private emitWebSocketEvent(rawMeasurement: RawMeasurement): void {
    try {
      const createdAtIso =
        rawMeasurement.createdAt instanceof Date
          ? rawMeasurement.createdAt.toISOString()
          : new Date(rawMeasurement.createdAt).toISOString();
      this.webSocketEmitterService.emitNewRawMeasurement({
        id: rawMeasurement.id,
        externalId: rawMeasurement.externalId,
        value: rawMeasurement.value,
        createdAt: createdAtIso,
      });
      this.logger.log(
        `WebSocket event emitted: ${WEBSOCKET_EVENTS.NEW_RAW_MEASUREMENT}`
      );
    } catch (error) {
      this.logger.error(
        `WebSocket emission failed: ${(error as Error).message}`
      );
    }
  }

  private async evaluateAlertRules(
    rawMeasurement: RawMeasurement
  ): Promise<void> {
    try {
      await this.alertEvaluationService.evaluateMeasurement(rawMeasurement);
      this.logger.log(
        `Alert evaluation completed for: ${rawMeasurement.externalId}`
      );
    } catch (error) {
      this.logger.error(`Alert evaluation failed: ${(error as Error).message}`);
    }
  }

  async getAllMeasurements(
    filters?: RawMeasurementFilters
  ): Promise<{ data: RawMeasurement[]; total: number }> {
    return this.rawMeasurementRepository.findAll(filters);
  }

  async getMeasurementById(id: number): Promise<RawMeasurement | null> {
    return this.rawMeasurementRepository.findById(id);
  }

  async getMeasurementsByExternalId(
    externalId: string
  ): Promise<RawMeasurement[]> {
    return this.rawMeasurementRepository.findByExternalId(externalId);
  }

  async getMeasurementsCount(): Promise<number> {
    return this.rawMeasurementRepository.count();
  }
}
