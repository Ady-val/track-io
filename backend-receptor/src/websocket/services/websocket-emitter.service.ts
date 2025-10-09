import { Injectable, Logger } from '@nestjs/common';
import { WebSocketGateway } from '../gateways/websocket.gateway';
import { WEBSOCKET_EVENTS } from '../constants/websocket-events.constant';

export interface WebSocketMessage {
  event: string;
  data: unknown;
  timestamp?: Date;
}

@Injectable()
export class WebSocketEmitterService {
  private readonly logger = new Logger(WebSocketEmitterService.name);

  constructor(private readonly webSocketGateway: WebSocketGateway) {}

  emitToAll(event: string, data: unknown): void {
    try {
      const message: WebSocketMessage = {
        event,
        data,
        timestamp: new Date(),
      };

      this.webSocketGateway.emitToAll(event, message);
      this.logger.log(`Message emitted to all clients: ${event}`);
    } catch (error) {
      this.logger.error(
        `Error emitting message to all clients: ${(error as Error).message}`
      );
      throw error;
    }
  }

  emitToClient(clientId: string, event: string, data: unknown): void {
    try {
      const message: WebSocketMessage = {
        event,
        data,
        timestamp: new Date(),
      };

      this.webSocketGateway.emitToClient(clientId, event, message);
      this.logger.log(`Message emitted to client ${clientId}: ${event}`);
    } catch (error) {
      this.logger.error(
        `Error emitting message to client ${clientId}: ${(error as Error).message}`
      );
      throw error;
    }
  }

  emitToRoom(room: string, event: string, data: unknown): void {
    try {
      const message: WebSocketMessage = {
        event,
        data,
        timestamp: new Date(),
      };

      this.webSocketGateway.emitToRoom(room, event, message);
      this.logger.log(`Message emitted to room ${room}: ${event}`);
    } catch (error) {
      this.logger.error(
        `Error emitting message to room ${room}: ${(error as Error).message}`
      );
      throw error;
    }
  }

  emitNewRawSignal(signalData: unknown): void {
    this.emitToAll(WEBSOCKET_EVENTS.NEW_RAW_SIGNAL, {
      type: 'signal',
      data: signalData,
    });
  }

  emitNewRawMeasurement(measurementData: unknown): void {
    this.emitToAll(WEBSOCKET_EVENTS.NEW_RAW_MEASUREMENT, {
      type: 'measurement',
      data: measurementData,
    });
  }

  getServer() {
    return this.webSocketGateway.getServer();
  }
}
