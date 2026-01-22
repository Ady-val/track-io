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
    measurementValue.createdAt = await this.getDatabaseNow();
    const savedValue =
      await this.measurementValueRepository.save(measurementValue);

    // Emit WebSocket event with measurement value data
    try {
      const createdAtIso =
        savedValue.createdAt instanceof Date
          ? savedValue.createdAt.toISOString()
          : new Date(savedValue.createdAt).toISOString();
      this.webSocketEmitterService.emitToAll(
        WEBSOCKET_EVENTS.NEW_MEASUREMENT_VALUE,
        {
          type: 'measurement_value',
          data: {
            measurementId: savedValue.measurementId,
            value: savedValue.value,
            createdAt: createdAtIso,
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

  private isMSSQL(): boolean {
    const connectionOptions =
      (this.measurementValueRepository.manager as any).connection?.options ??
      (this.measurementValueRepository.manager as any).dataSource?.options;
    return connectionOptions?.type === 'mssql';
  }

  async getDatabaseNow(): Promise<Date> {
    try {
      if (this.isMSSQL()) {
        const result = await this.measurementValueRepository.query(
          'SELECT SYSUTCDATETIME() AS now'
        );
        const value = result?.[0]?.now;
        return value instanceof Date ? value : new Date(value);
      }

      const result = await this.measurementValueRepository.query(
        'SELECT NOW() AS now'
      );
      const value = result?.[0]?.now;
      return value instanceof Date ? value : new Date(value);
    } catch (error) {
      this.logger.error(
        `Error getting database time: ${(error as Error).message}`
      );
      return new Date();
    }
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
      
      // Only calculate onStartTime if the last value is true
      if (lastParsedValue !== true) {
        return null;
      }

      // Find the last false value index
      let lastFalseIndex = -1;
      for (let i = values.length - 1; i >= 0; i--) {
        const value = values[i];
        if (!value) continue;

        const parsedValue = this.parseBooleanValue(value.value);
        if (parsedValue === false) {
          lastFalseIndex = i;
          break;
        }
      }

      // Find the first true after the last false (or first true if no false exists)
      let firstTrueAfterFalseIndex = -1;
      const startIndex = lastFalseIndex !== -1 ? lastFalseIndex + 1 : 0;
      
      for (let i = startIndex; i < values.length; i++) {
        const value = values[i];
        if (!value) continue;

        const parsedValue = this.parseBooleanValue(value.value);
        if (parsedValue === true) {
          firstTrueAfterFalseIndex = i;
          break;
        }
      }

      if (firstTrueAfterFalseIndex !== -1) {
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

  async findStatusOffStartTime(measurementId: number): Promise<Date | null> {
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
      
      // Only calculate offStartTime if the last value is false
      if (lastParsedValue !== false) {
        return null;
      }

      // Find the last true value index
      let lastTrueIndex = -1;
      for (let i = values.length - 1; i >= 0; i--) {
        const value = values[i];
        if (!value) continue;

        const parsedValue = this.parseBooleanValue(value.value);
        if (parsedValue === true) {
          lastTrueIndex = i;
          break;
        }
      }

      // Find the first false after the last true (or first false if no true exists)
      let firstFalseAfterTrueIndex = -1;
      const startIndex = lastTrueIndex !== -1 ? lastTrueIndex + 1 : 0;
      
      for (let i = startIndex; i < values.length; i++) {
        const value = values[i];
        if (!value) continue;

        const parsedValue = this.parseBooleanValue(value.value);
        if (parsedValue === false) {
          firstFalseAfterTrueIndex = i;
          break;
        }
      }

      if (firstFalseAfterTrueIndex !== -1) {
        const value = values[firstFalseAfterTrueIndex];
        return value ? value.createdAt : null;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error finding status off start time for measurement ${measurementId}: ${(error as Error).message}`
      );
      return null;
    }
  }
}
