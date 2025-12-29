import { Test, type TestingModule } from '@nestjs/testing';
import type { Server, Socket } from 'socket.io';
import { WebSocketGateway } from './websocket.gateway';

describe('WebSocketGateway', () => {
  let gateway: WebSocketGateway;
  let mockServer: jest.Mocked<Server>;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(async () => {
    const toMock = jest.fn().mockReturnValue({
      emit: jest.fn(),
    });

    mockServer = {
      emit: jest.fn(),
      to: toMock,
    } as unknown as jest.Mocked<Server>;

    mockSocket = {
      id: 'test-client-123',
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as jest.Mocked<Socket>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [WebSocketGateway],
    }).compile();

    gateway = module.get<WebSocketGateway>(WebSocketGateway);
    // Asignar el mock server al gateway
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('afterInit', () => {
    it('should log initialization message', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.afterInit(mockServer);

      expect(logSpy).toHaveBeenCalledWith('WebSocket Gateway initialized');
    });

    it('should receive server as parameter', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.afterInit(mockServer);

      expect(logSpy).toHaveBeenCalled();
      expect(mockServer).toBeDefined();
    });
  });

  describe('handleConnection', () => {
    it('should log client connection with client id', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.handleConnection(mockSocket);

      expect(logSpy).toHaveBeenCalledWith(`Client connected: ${mockSocket.id}`);
    });

    it('should handle connection with multiple arguments', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      const extraArg1 = { some: 'data' };
      const extraArg2 = 'extra';

      gateway.handleConnection(mockSocket, extraArg1, extraArg2);

      expect(logSpy).toHaveBeenCalledWith(`Client connected: ${mockSocket.id}`);
    });

    it('should handle connection with different client ids', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      const differentSocket = {
        ...mockSocket,
        id: 'different-client-456',
      } as jest.Mocked<Socket>;

      gateway.handleConnection(differentSocket);

      expect(logSpy).toHaveBeenCalledWith(
        `Client connected: ${differentSocket.id}`
      );
    });
  });

  describe('handleDisconnect', () => {
    it('should log client disconnection with client id', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');

      gateway.handleDisconnect(mockSocket);

      expect(logSpy).toHaveBeenCalledWith(
        `Client disconnected: ${mockSocket.id}`
      );
    });

    it('should handle disconnection with different client ids', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      const differentSocket = {
        ...mockSocket,
        id: 'another-client-789',
      } as jest.Mocked<Socket>;

      gateway.handleDisconnect(differentSocket);

      expect(logSpy).toHaveBeenCalledWith(
        `Client disconnected: ${differentSocket.id}`
      );
    });
  });

  describe('emitToAll', () => {
    it('should emit event to all clients', () => {
      const event = 'test-event';
      const data = { message: 'test data' };

      gateway.emitToAll(event, data);

      expect(mockServer.emit).toHaveBeenCalledWith(event, data);
    });

    it('should emit with different event names', () => {
      const event1 = 'event-1';
      const event2 = 'event-2';
      const data = { test: 'data' };

      gateway.emitToAll(event1, data);
      gateway.emitToAll(event2, data);

      expect(mockServer.emit).toHaveBeenCalledWith(event1, data);
      expect(mockServer.emit).toHaveBeenCalledWith(event2, data);
      expect(mockServer.emit).toHaveBeenCalledTimes(2);
    });

    it('should emit with different data types', () => {
      const event = 'test-event';

      gateway.emitToAll(event, { object: 'data' });
      gateway.emitToAll(event, ['array', 'data']);
      gateway.emitToAll(event, 'string data');
      gateway.emitToAll(event, 123);

      expect(mockServer.emit).toHaveBeenCalledTimes(4);
      expect(mockServer.emit).toHaveBeenCalledWith(event, {
        object: 'data',
      });
      expect(mockServer.emit).toHaveBeenCalledWith(event, ['array', 'data']);
      expect(mockServer.emit).toHaveBeenCalledWith(event, 'string data');
      expect(mockServer.emit).toHaveBeenCalledWith(event, 123);
    });
  });

  describe('emitToClient', () => {
    it('should emit event to specific client', () => {
      const clientId = 'client-123';
      const event = 'test-event';
      const data = { message: 'test data' };
      const emitMock = jest.fn();
      mockServer.to = jest.fn().mockReturnValue({ emit: emitMock });

      gateway.emitToClient(clientId, event, data);

      expect(mockServer.to).toHaveBeenCalledWith(clientId);
      expect(emitMock).toHaveBeenCalledWith(event, data);
    });

    it('should emit to different client ids', () => {
      const clientId1 = 'client-1';
      const clientId2 = 'client-2';
      const event = 'test-event';
      const data = { test: 'data' };
      const emitMock = jest.fn();
      mockServer.to = jest.fn().mockReturnValue({ emit: emitMock });

      gateway.emitToClient(clientId1, event, data);
      gateway.emitToClient(clientId2, event, data);

      expect(mockServer.to).toHaveBeenCalledWith(clientId1);
      expect(mockServer.to).toHaveBeenCalledWith(clientId2);
      expect(emitMock).toHaveBeenCalledTimes(2);
    });

    it('should emit with different events to same client', () => {
      const clientId = 'client-123';
      const event1 = 'event-1';
      const event2 = 'event-2';
      const data = { test: 'data' };
      const emitMock = jest.fn();
      mockServer.to = jest.fn().mockReturnValue({ emit: emitMock });

      gateway.emitToClient(clientId, event1, data);
      gateway.emitToClient(clientId, event2, data);

      expect(mockServer.to).toHaveBeenCalledWith(clientId);
      expect(emitMock).toHaveBeenCalledWith(event1, data);
      expect(emitMock).toHaveBeenCalledWith(event2, data);
    });
  });

  describe('emitToRoom', () => {
    it('should emit event to specific room', () => {
      const room = 'room-123';
      const event = 'test-event';
      const data = { message: 'test data' };
      const emitMock = jest.fn();
      mockServer.to = jest.fn().mockReturnValue({ emit: emitMock });

      gateway.emitToRoom(room, event, data);

      expect(mockServer.to).toHaveBeenCalledWith(room);
      expect(emitMock).toHaveBeenCalledWith(event, data);
    });

    it('should emit to different rooms', () => {
      const room1 = 'room-1';
      const room2 = 'room-2';
      const event = 'test-event';
      const data = { test: 'data' };
      const emitMock = jest.fn();
      mockServer.to = jest.fn().mockReturnValue({ emit: emitMock });

      gateway.emitToRoom(room1, event, data);
      gateway.emitToRoom(room2, event, data);

      expect(mockServer.to).toHaveBeenCalledWith(room1);
      expect(mockServer.to).toHaveBeenCalledWith(room2);
      expect(emitMock).toHaveBeenCalledTimes(2);
    });

    it('should emit with different events to same room', () => {
      const room = 'room-123';
      const event1 = 'event-1';
      const event2 = 'event-2';
      const data = { test: 'data' };
      const emitMock = jest.fn();
      mockServer.to = jest.fn().mockReturnValue({ emit: emitMock });

      gateway.emitToRoom(room, event1, data);
      gateway.emitToRoom(room, event2, data);

      expect(mockServer.to).toHaveBeenCalledWith(room);
      expect(emitMock).toHaveBeenCalledWith(event1, data);
      expect(emitMock).toHaveBeenCalledWith(event2, data);
    });
  });

  describe('getServer', () => {
    it('should return the server instance', () => {
      const server = gateway.getServer();

      expect(server).toBe(mockServer);
    });

    it('should return the same server instance on multiple calls', () => {
      const server1 = gateway.getServer();
      const server2 = gateway.getServer();

      expect(server1).toBe(server2);
      expect(server1).toBe(mockServer);
    });
  });
});
