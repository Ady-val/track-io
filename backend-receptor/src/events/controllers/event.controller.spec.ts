import { Test, type TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { TypeOrmEventRepository } from '../domain/repositories/typeorm-event.repository';
import { createMockEvent } from '../../test-helpers';
import { EventStatus } from '../domain/entities/event.entity';

describe('EventController', () => {
  let controller: EventController;
  let repository: jest.Mocked<TypeOrmEventRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        {
          provide: TypeOrmEventRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findOpenEvents: jest.fn(),
            closeEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EventController>(EventController);
    repository = module.get(TypeOrmEventRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findEvents', () => {
    it('should return all events when no filters provided', async () => {
      const mockEvents = [
        createMockEvent({ id: 1 }),
        createMockEvent({ id: 2 }),
      ];

      repository.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findEvents();

      expect(result).toEqual(mockEvents);
      expect(repository.findAll).toHaveBeenCalledWith({});
    });

    it('should filter by deviceId when provided', async () => {
      const deviceId = '1';
      const mockEvents = [createMockEvent({ id: 1, deviceId: 1 })];

      repository.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findEvents(deviceId);

      expect(result).toEqual(mockEvents);
      expect(repository.findAll).toHaveBeenCalledWith({ deviceId: 1 });
    });

    it('should filter by deviceSignalId when provided', async () => {
      const deviceSignalId = '2';
      const mockEvents = [createMockEvent({ id: 1, deviceSignalId: 2 })];

      repository.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findEvents(undefined, deviceSignalId);

      expect(result).toEqual(mockEvents);
      expect(repository.findAll).toHaveBeenCalledWith({ deviceSignalId: 2 });
    });

    it('should filter by single status when provided', async () => {
      const status = 'open';
      const mockEvents = [createMockEvent({ id: 1, status: EventStatus.OPEN })];

      repository.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findEvents(undefined, undefined, status);

      expect(result).toEqual(mockEvents);
      expect(repository.findAll).toHaveBeenCalledWith({
        status: EventStatus.OPEN,
      });
    });

    it('should filter by multiple statuses when comma-separated', async () => {
      const status = 'open,closed';
      const allEvents = [
        createMockEvent({ id: 1, status: EventStatus.OPEN }),
        createMockEvent({ id: 2, status: EventStatus.CLOSED }),
        createMockEvent({ id: 3, status: EventStatus.IN_PROGRESS }),
      ];
      const expectedEvents = [
        createMockEvent({ id: 1, status: EventStatus.OPEN }),
        createMockEvent({ id: 2, status: EventStatus.CLOSED }),
      ];

      repository.findAll.mockResolvedValue(allEvents);

      const result = await controller.findEvents(undefined, undefined, status);

      expect(result).toEqual(expectedEvents);
      expect(repository.findAll).toHaveBeenCalledWith({});
    });

    it('should combine multiple filters', async () => {
      const deviceId = '1';
      const deviceSignalId = '2';
      const status = 'open';
      const mockEvents = [
        createMockEvent({
          id: 1,
          deviceId: 1,
          deviceSignalId: 2,
          status: EventStatus.OPEN,
        }),
      ];

      repository.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findEvents(
        deviceId,
        deviceSignalId,
        status
      );

      expect(result).toEqual(mockEvents);
      expect(repository.findAll).toHaveBeenCalledWith({
        deviceId: 1,
        deviceSignalId: 2,
        status: EventStatus.OPEN,
      });
    });
  });

  describe('findAllEvents', () => {
    it('should return all events', async () => {
      const mockEvents = [
        createMockEvent({ id: 1 }),
        createMockEvent({ id: 2 }),
        createMockEvent({ id: 3 }),
      ];

      repository.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findAllEvents();

      expect(result).toEqual(mockEvents);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('closeAllEvents', () => {
    it('should close all open events', async () => {
      const openEvents = [
        createMockEvent({ id: 1, status: EventStatus.OPEN }),
        createMockEvent({ id: 2, status: EventStatus.OPEN }),
      ];

      repository.findOpenEvents.mockResolvedValue(openEvents);
      repository.closeEvent.mockResolvedValue(openEvents[0]);

      const result = await controller.closeAllEvents();

      expect(result.message).toBe(`Se cerraron ${openEvents.length} eventos`);
      expect(result.closedEvents).toBe(2);
      expect(repository.findOpenEvents).toHaveBeenCalled();
      expect(repository.closeEvent).toHaveBeenCalledTimes(2);
      expect(repository.closeEvent).toHaveBeenCalledWith(1);
      expect(repository.closeEvent).toHaveBeenCalledWith(2);
    });

    it('should return zero when no open events exist', async () => {
      repository.findOpenEvents.mockResolvedValue([]);

      const result = await controller.closeAllEvents();

      expect(result.message).toBe('Se cerraron 0 eventos');
      expect(result.closedEvents).toBe(0);
      expect(repository.closeEvent).not.toHaveBeenCalled();
    });
  });

  describe('closeEventById', () => {
    it('should close event successfully', async () => {
      const id = 1;
      const event = createMockEvent({
        id,
        status: EventStatus.OPEN,
      });
      const closedEvent = createMockEvent({
        id,
        status: EventStatus.CLOSED,
      });

      repository.findById.mockResolvedValue(event);
      repository.closeEvent.mockResolvedValue(closedEvent);

      const result = await controller.closeEventById(id);

      expect(result.message).toBe(`Evento ${id} cerrado exitosamente`);
      expect(result.success).toBe(true);
      expect(result.eventId).toBe(id);
      expect(repository.findById).toHaveBeenCalledWith(id);
      expect(repository.closeEvent).toHaveBeenCalledWith(id);
    });

    it('should return error when event not found', async () => {
      const id = 999;

      repository.findById.mockResolvedValue(null);

      const result = await controller.closeEventById(id);

      expect(result.message).toBe('Evento no encontrado');
      expect(result.success).toBe(false);
      expect(repository.closeEvent).not.toHaveBeenCalled();
    });

    it('should return error when event is already closed', async () => {
      const id = 1;
      const event = createMockEvent({
        id,
        status: EventStatus.CLOSED,
      });

      repository.findById.mockResolvedValue(event);

      const result = await controller.closeEventById(id);

      expect(result.message).toBe('El evento ya está cerrado');
      expect(result.success).toBe(false);
      expect(repository.closeEvent).not.toHaveBeenCalled();
    });
  });
});
