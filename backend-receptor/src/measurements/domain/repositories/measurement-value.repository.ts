import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeasurementValue } from '../entities/measurement-value.entity';
import { WebSocketEmitterService } from '../../../websocket/services/websocket-emitter.service';
import { WEBSOCKET_EVENTS } from '../../../websocket/constants/websocket-events.constant';

export interface CreateMeasurementValueDto {
  measurementId: number;
  value: string;
}

@Injectable()
export class MeasurementValueRepository {
  private readonly logger = new Logger(MeasurementValueRepository.name);

  constructor(
    @InjectRepository(MeasurementValue)
    private readonly measurementValueRepository: Repository<MeasurementValue>,
    private readonly webSocketEmitterService: WebSocketEmitterService
  ) {}

  async create(
    createMeasurementValueDto: CreateMeasurementValueDto
  ): Promise<MeasurementValue> {
    const measurementValue = this.measurementValueRepository.create(
      createMeasurementValueDto
    );
    const savedValue =
      await this.measurementValueRepository.save(measurementValue);

    // Emit WebSocket event with measurement value data
    try {
      this.webSocketEmitterService.emitToAll(
        WEBSOCKET_EVENTS.NEW_MEASUREMENT_VALUE,
        {
          type: 'measurement_value',
          data: {
            measurementId: savedValue.measurementId,
            value: savedValue.value,
            createdAt: savedValue.createdAt,
          },
        }
      );
      this.logger.log(
        `WebSocket event emitted for measurement ID: ${savedValue.measurementId}`
      );
    } catch (error) {
      this.logger.error(
        `Error emitting WebSocket event: ${(error as Error).message}`
      );
    }

    return savedValue;
  }

  async findByMeasurementId(
    measurementId: number
  ): Promise<MeasurementValue[]> {
    return await this.measurementValueRepository.find({
      where: { measurementId },
      order: { createdAt: 'DESC' },
    });
  }

  async findLatestByMeasurementId(
    measurementId: number,
    limit: number = 10
  ): Promise<MeasurementValue[]> {
    return await this.measurementValueRepository.find({
      where: { measurementId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async count(): Promise<number> {
    return await this.measurementValueRepository.count();
  }

  async findLatestValueByMeasurementId(
    measurementId: number
  ): Promise<MeasurementValue | null> {
    const values = await this.measurementValueRepository.find({
      where: { measurementId },
      order: { createdAt: 'DESC' },
      take: 1,
    });
    return values.length > 0 && values[0] ? values[0] : null;
  }

  private parseBooleanValue(value: string): boolean | null {
    const str = value.toLowerCase().trim();
    if (str === 'true' || str === '1' || str === 'on') return true;
    if (str === 'false' || str === '0' || str === 'off') return false;
    return null;
  }

  async findStatusOnStartTime(measurementId: number): Promise<Date | null> {
    try {
      const values = await this.measurementValueRepository.find({
        where: { measurementId },
        order: { createdAt: 'ASC' },
      });

      if (values.length === 0) {
        return null;
      }

      const lastValue = values[values.length - 1];
      if (!lastValue) {
        return null;
      }
      const lastParsedValue = this.parseBooleanValue(lastValue.value);
      if (lastParsedValue === false) {
        return null;
      }
      if (lastParsedValue !== true) {
        return null;
      }

      let lastFalseIndex = -1;
      let firstTrueAfterFalseIndex = -1;

      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (!value) continue;

        const parsedValue = this.parseBooleanValue(value.value);

        if (parsedValue === false) {
          lastFalseIndex = i;
          firstTrueAfterFalseIndex = -1;
        } else if (parsedValue === true) {
          if (firstTrueAfterFalseIndex === -1) {
            firstTrueAfterFalseIndex = i;
          }
        }
      }

      if (
        lastFalseIndex !== -1 &&
        firstTrueAfterFalseIndex !== -1 &&
        firstTrueAfterFalseIndex > lastFalseIndex
      ) {
        const value = values[firstTrueAfterFalseIndex];
        return value ? value.createdAt : null;
      }

      if (lastFalseIndex === -1 && firstTrueAfterFalseIndex !== -1) {
        const value = values[firstTrueAfterFalseIndex];
        return value ? value.createdAt : null;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error finding status on start time for measurement ${measurementId}: ${(error as Error).message}`
      );
      return null;
    }
  }
}
