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
}
