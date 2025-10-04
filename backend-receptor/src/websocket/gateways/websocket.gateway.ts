import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WSGateway({
  cors: {
    origin: '*',
  },
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger: Logger = new Logger('WebSocketGateway');

  afterInit(_server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket, ..._args: unknown[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitToAll(event: string, data: unknown) {
    this.server.emit(event, data);
  }

  emitToClient(clientId: string, event: string, data: unknown) {
    this.server.to(clientId).emit(event, data);
  }

  emitToRoom(room: string, event: string, data: unknown) {
    this.server.to(room).emit(event, data);
  }

  getServer(): Server {
    return this.server;
  }
}
