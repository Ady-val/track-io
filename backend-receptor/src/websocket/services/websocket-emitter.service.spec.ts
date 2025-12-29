import { Test, type TestingModule } from '@nestjs/testing';
import { WebSocketEmitterService } from './websocket-emitter.service';
import { WebSocketGateway } from '../gateways/websocket.gateway';
import { WEBSOCKET_EVENTS } from '../constants/websocket-events.constant';
import type { WebSocketMessage } from './websocket-emitter.service';

describe('WebSocketEmitterService', () => {
  let service: WebSocketEmitterService;
  let gateway: jest.Mocked<WebSocketGateway>;

  beforeEach(async () => {
    const mockGateway = {
      emitToAll: jest.fn(),
      emitToClient: jest.fn(),
      emitToRoom: jest.fn(),
      getServer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebSocketEmitterService,
        {
          provide: WebSocketGateway,
          useValue: mockGateway,
        },
      ],
    }).compile();

    service = module.get<WebSocketEmitterService>(WebSocketEmitterService);
    gateway = module.get(WebSocketGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('emitToAll', () => {
    it('should create WebSocketMessage with timestamp and emit to all', () => {
      const event = 'test-event';
      const data = { message: 'test data' };
      const beforeCall = new Date();

      service.emitToAll(event, data);

      const afterCall = new Date();

      expect(gateway.emitToAll).toHaveBeenCalledTimes(1);
      const callArgs = gateway.emitToAll.mock.calls[0];
      expect(callArgs[0]).toBe(event);

      const message = callArgs[1] as WebSocketMessage;
      expect(message.event).toBe(event);
      expect(message.data).toBe(data);
      expect(message.timestamp).toBeInstanceOf(Date);
      expect(message.timestamp!.getTime()).toBeGreaterThanOrEqual(
        beforeCall.getTime()
      );
      expect(message.timestamp!.getTime()).toBeLessThanOrEqual(
        afterCall.getTime()
      );
    });

    it('should log successful emission', () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      const event = 'test-event';
      const data = { message: 'test data' };

      service.emitToAll(event, data);

      expect(logSpy).toHaveBeenCalledWith(
        `Message emitted to all clients: ${event}`
      );
    });

    it('should handle errors and rethrow them', () => {
      const event = 'test-event';
      const data = { message: 'test data' };
      const error = new Error('Emission failed');
      gateway.emitToAll.mockImplementation(() => {
        throw error;
      });
      const errorSpy = jest.spyOn(service['logger'], 'error');

      expect(() => {
        service.emitToAll(event, data);
      }).toThrow(error);
      expect(errorSpy).toHaveBeenCalledWith(
        `Error emitting message to all clients: ${error.message}`
      );
    });

    it('should work with different data types', () => {
      const event = 'test-event';

      service.emitToAll(event, { object: 'data' });
      service.emitToAll(event, ['array', 'data']);
      service.emitToAll(event, 'string data');
      service.emitToAll(event, 123);
      service.emitToAll(event, null);
      service.emitToAll(event, undefined);

      expect(gateway.emitToAll).toHaveBeenCalledTimes(6);
      const calls = gateway.emitToAll.mock.calls;
      expect(calls[0][1]).toMatchObject({
        event,
        data: { object: 'data' },
      });
      expect(calls[1][1]).toMatchObject({
        event,
        data: ['array', 'data'],
      });
      expect(calls[2][1]).toMatchObject({ event, data: 'string data' });
      expect(calls[3][1]).toMatchObject({ event, data: 123 });
      expect(calls[4][1]).toMatchObject({ event, data: null });
      expect(calls[5][1]).toMatchObject({ event, data: undefined });
    });

    it('should generate unique timestamps for each call', async () => {
      const event = 'test-event';
      const data = { message: 'test data' };

      service.emitToAll(event, data);
      await new Promise(resolve => setTimeout(resolve, 10));
      service.emitToAll(event, data);

      const calls = gateway.emitToAll.mock.calls;
      const timestamp1 = (calls[0][1] as WebSocketMessage).timestamp!;
      const timestamp2 = (calls[1][1] as WebSocketMessage).timestamp!;

      expect(timestamp2.getTime()).toBeGreaterThan(timestamp1.getTime());
    });
  });

  describe('emitToClient', () => {
    it('should create WebSocketMessage with timestamp and emit to client', () => {
      const clientId = 'client-123';
      const event = 'test-event';
      const data = { message: 'test data' };
      const beforeCall = new Date();

      service.emitToClient(clientId, event, data);

      const afterCall = new Date();

      expect(gateway.emitToClient).toHaveBeenCalledTimes(1);
      const callArgs = gateway.emitToClient.mock.calls[0];
      expect(callArgs[0]).toBe(clientId);
      expect(callArgs[1]).toBe(event);

      const message = callArgs[2] as WebSocketMessage;
      expect(message.event).toBe(event);
      expect(message.data).toBe(data);
      expect(message.timestamp).toBeInstanceOf(Date);
      expect(message.timestamp!.getTime()).toBeGreaterThanOrEqual(
        beforeCall.getTime()
      );
      expect(message.timestamp!.getTime()).toBeLessThanOrEqual(
        afterCall.getTime()
      );
    });

    it('should log successful emission to client', () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      const clientId = 'client-123';
      const event = 'test-event';
      const data = { message: 'test data' };

      service.emitToClient(clientId, event, data);

      expect(logSpy).toHaveBeenCalledWith(
        `Message emitted to client ${clientId}: ${event}`
      );
    });

    it('should handle errors and rethrow them', () => {
      const clientId = 'client-123';
      const event = 'test-event';
      const data = { message: 'test data' };
      const error = new Error('Emission failed');
      gateway.emitToClient.mockImplementation(() => {
        throw error;
      });
      const errorSpy = jest.spyOn(service['logger'], 'error');

      expect(() => {
        service.emitToClient(clientId, event, data);
      }).toThrow(error);
      expect(errorSpy).toHaveBeenCalledWith(
        `Error emitting message to client ${clientId}: ${error.message}`
      );
    });

    it('should work with different client ids', () => {
      const event = 'test-event';
      const data = { test: 'data' };

      service.emitToClient('client-1', event, data);
      service.emitToClient('client-2', event, data);
      service.emitToClient('client-3', event, data);

      expect(gateway.emitToClient).toHaveBeenCalledTimes(3);
      expect(gateway.emitToClient).toHaveBeenCalledWith(
        'client-1',
        event,
        expect.objectContaining({ event, data })
      );
      expect(gateway.emitToClient).toHaveBeenCalledWith(
        'client-2',
        event,
        expect.objectContaining({ event, data })
      );
      expect(gateway.emitToClient).toHaveBeenCalledWith(
        'client-3',
        event,
        expect.objectContaining({ event, data })
      );
    });
  });

  describe('emitToRoom', () => {
    it('should create WebSocketMessage with timestamp and emit to room', () => {
      const room = 'room-123';
      const event = 'test-event';
      const data = { message: 'test data' };
      const beforeCall = new Date();

      service.emitToRoom(room, event, data);

      const afterCall = new Date();

      expect(gateway.emitToRoom).toHaveBeenCalledTimes(1);
      const callArgs = gateway.emitToRoom.mock.calls[0];
      expect(callArgs[0]).toBe(room);
      expect(callArgs[1]).toBe(event);

      const message = callArgs[2] as WebSocketMessage;
      expect(message.event).toBe(event);
      expect(message.data).toBe(data);
      expect(message.timestamp).toBeInstanceOf(Date);
      expect(message.timestamp!.getTime()).toBeGreaterThanOrEqual(
        beforeCall.getTime()
      );
      expect(message.timestamp!.getTime()).toBeLessThanOrEqual(
        afterCall.getTime()
      );
    });

    it('should log successful emission to room', () => {
      const logSpy = jest.spyOn(service['logger'], 'log');
      const room = 'room-123';
      const event = 'test-event';
      const data = { message: 'test data' };

      service.emitToRoom(room, event, data);

      expect(logSpy).toHaveBeenCalledWith(
        `Message emitted to room ${room}: ${event}`
      );
    });

    it('should handle errors and rethrow them', () => {
      const room = 'room-123';
      const event = 'test-event';
      const data = { message: 'test data' };
      const error = new Error('Emission failed');
      gateway.emitToRoom.mockImplementation(() => {
        throw error;
      });
      const errorSpy = jest.spyOn(service['logger'], 'error');

      expect(() => {
        service.emitToRoom(room, event, data);
      }).toThrow(error);
      expect(errorSpy).toHaveBeenCalledWith(
        `Error emitting message to room ${room}: ${error.message}`
      );
    });

    it('should work with different rooms', () => {
      const event = 'test-event';
      const data = { test: 'data' };

      service.emitToRoom('room-1', event, data);
      service.emitToRoom('room-2', event, data);
      service.emitToRoom('room-3', event, data);

      expect(gateway.emitToRoom).toHaveBeenCalledTimes(3);
      expect(gateway.emitToRoom).toHaveBeenCalledWith(
        'room-1',
        event,
        expect.objectContaining({ event, data })
      );
      expect(gateway.emitToRoom).toHaveBeenCalledWith(
        'room-2',
        event,
        expect.objectContaining({ event, data })
      );
      expect(gateway.emitToRoom).toHaveBeenCalledWith(
        'room-3',
        event,
        expect.objectContaining({ event, data })
      );
    });
  });

  describe('emitNewRawSignal', () => {
    it('should emit with NEW_RAW_SIGNAL event and correct payload structure', () => {
      const signalData = {
        id: 1,
        externalId: 'signal-123',
        value: 'test-value',
        createdAt: new Date(),
      };

      service.emitNewRawSignal(signalData);

      expect(gateway.emitToAll).toHaveBeenCalledTimes(1);
      const callArgs = gateway.emitToAll.mock.calls[0];
      expect(callArgs[0]).toBe(WEBSOCKET_EVENTS.NEW_RAW_SIGNAL);

      const message = callArgs[1] as WebSocketMessage;
      expect(message.event).toBe(WEBSOCKET_EVENTS.NEW_RAW_SIGNAL);
      expect(message.data).toEqual({
        type: 'signal',
        data: signalData,
      });
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('should work with different signal data structures', () => {
      const signalData1 = { id: 1, value: 'value1' };
      const signalData2 = { id: 2, value: 'value2', extra: 'field' };

      service.emitNewRawSignal(signalData1);
      service.emitNewRawSignal(signalData2);

      expect(gateway.emitToAll).toHaveBeenCalledTimes(2);
      expect(gateway.emitToAll).toHaveBeenCalledWith(
        WEBSOCKET_EVENTS.NEW_RAW_SIGNAL,
        expect.objectContaining({
          event: WEBSOCKET_EVENTS.NEW_RAW_SIGNAL,
          data: { type: 'signal', data: signalData1 },
        })
      );
      expect(gateway.emitToAll).toHaveBeenCalledWith(
        WEBSOCKET_EVENTS.NEW_RAW_SIGNAL,
        expect.objectContaining({
          event: WEBSOCKET_EVENTS.NEW_RAW_SIGNAL,
          data: { type: 'signal', data: signalData2 },
        })
      );
    });
  });

  describe('emitNewRawMeasurement', () => {
    it('should emit with NEW_RAW_MEASUREMENT event and correct payload structure', () => {
      const measurementData = {
        id: 1,
        externalId: 'measurement-123',
        value: 'test-value',
        createdAt: new Date(),
      };

      service.emitNewRawMeasurement(measurementData);

      expect(gateway.emitToAll).toHaveBeenCalledTimes(1);
      const callArgs = gateway.emitToAll.mock.calls[0];
      expect(callArgs[0]).toBe(WEBSOCKET_EVENTS.NEW_RAW_MEASUREMENT);

      const message = callArgs[1] as WebSocketMessage;
      expect(message.event).toBe(WEBSOCKET_EVENTS.NEW_RAW_MEASUREMENT);
      expect(message.data).toEqual({
        type: 'measurement',
        data: measurementData,
      });
      expect(message.timestamp).toBeInstanceOf(Date);
    });

    it('should work with different measurement data structures', () => {
      const measurementData1 = { id: 1, value: 'value1' };
      const measurementData2 = {
        id: 2,
        value: 'value2',
        extra: 'field',
      };

      service.emitNewRawMeasurement(measurementData1);
      service.emitNewRawMeasurement(measurementData2);

      expect(gateway.emitToAll).toHaveBeenCalledTimes(2);
      expect(gateway.emitToAll).toHaveBeenCalledWith(
        WEBSOCKET_EVENTS.NEW_RAW_MEASUREMENT,
        expect.objectContaining({
          event: WEBSOCKET_EVENTS.NEW_RAW_MEASUREMENT,
          data: { type: 'measurement', data: measurementData1 },
        })
      );
      expect(gateway.emitToAll).toHaveBeenCalledWith(
        WEBSOCKET_EVENTS.NEW_RAW_MEASUREMENT,
        expect.objectContaining({
          event: WEBSOCKET_EVENTS.NEW_RAW_MEASUREMENT,
          data: { type: 'measurement', data: measurementData2 },
        })
      );
    });
  });

  describe('getServer', () => {
    it('should return server from gateway', () => {
      const mockServer = { test: 'server' };
      gateway.getServer.mockReturnValue(mockServer as any);

      const server = service.getServer();

      expect(server).toBe(mockServer);
      expect(gateway.getServer).toHaveBeenCalledTimes(1);
    });

    it('should return the same server instance on multiple calls', () => {
      const mockServer = { test: 'server' };
      gateway.getServer.mockReturnValue(mockServer as any);

      const server1 = service.getServer();
      const server2 = service.getServer();

      expect(server1).toBe(server2);
      expect(server1).toBe(mockServer);
      expect(gateway.getServer).toHaveBeenCalledTimes(2);
    });
  });
});
