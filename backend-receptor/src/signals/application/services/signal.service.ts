import { Injectable, Logger } from '@nestjs/common';
import { Signal } from '../../domain/entities/signal.entity';
import {
  RawSignalRepository,
  CreateRawSignalDto,
  RawSignalFilters,
} from '../../domain/repositories/raw-signal.repository';
import { RawSignal } from '../../domain/entities/raw-signal.entity';
import { WebSocketEmitterService } from '../../../websocket/services/websocket-emitter.service';
import { WEBSOCKET_EVENTS } from '../../../websocket/constants/websocket-events.constant';

@Injectable()
export class SignalService {
  private readonly logger = new Logger(SignalService.name);

  constructor(
    private readonly rawSignalRepository: RawSignalRepository,
    private readonly webSocketEmitterService: WebSocketEmitterService
  ) {}

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

      this.logger.log(`Signal saved to database with ID: ${savedSignal.id}`);

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
}
