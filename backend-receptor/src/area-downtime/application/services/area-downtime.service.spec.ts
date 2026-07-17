import { Test, type TestingModule } from '@nestjs/testing';
import { AreaDowntimeService } from './area-downtime.service';
import { TypeOrmAreaDowntimeRepository } from '../../domain/repositories/typeorm-area-downtime.repository';
import { TypeOrmAreaDowntimeEventRepository } from '../../domain/repositories/typeorm-area-downtime-event.repository';
import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';
import {
  createMockAreaDowntime,
  createMockEvent,
  createMockAreaDowntimeEvent,
  createMockArea,
} from '../../../test-helpers';
import { EventStatus } from '../../../events/domain/entities/event.entity';
import type { AreaDowntimeFilters } from '../../domain/repositories/area-downtime.repository';
import { ScheduledDowntimeCalculatorService } from '../../../scheduled-downtimes/application/services/scheduled-downtime-calculator.service';

describe('AreaDowntimeService', () => {
  let service: AreaDowntimeService;
  let areaDowntimeRepository: jest.Mocked<TypeOrmAreaDowntimeRepository>;
  let areaDowntimeEventRepository: jest.Mocked<TypeOrmAreaDowntimeEventRepository>;
  let eventRepository: jest.Mocked<TypeOrmEventRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreaDowntimeService,
        {
          // Por defecto sin descuento: aísla estos tests de la lógica de
          // paros programados (cubierta en su propio spec).
          provide: ScheduledDowntimeCalculatorService,
          useValue: {
            getDiscount: jest.fn().mockResolvedValue({
              timezone: 'America/Chihuahua',
              totalDiscountedSeconds: 0,
              slices: [],
            }),
          },
        },
        {
          provide: TypeOrmAreaDowntimeRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findActiveByAreaId: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: TypeOrmAreaDowntimeEventRepository,
          useValue: {
            create: jest.fn(),
            findByAreaDowntimeId: jest.fn(),
            findByEventId: jest.fn(),
            findRelation: jest.fn(),
          },
        },
        {
          provide: TypeOrmEventRepository,
          useValue: {
            findActiveByArea: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AreaDowntimeService>(AreaDowntimeService);
    areaDowntimeRepository = module.get(TypeOrmAreaDowntimeRepository);
    areaDowntimeEventRepository = module.get(
      TypeOrmAreaDowntimeEventRepository
    );
    eventRepository = module.get(TypeOrmEventRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleEventForAreaDowntime', () => {
    it('should start downtime when event is active and no active downtime exists', async () => {
      const event = createMockEvent({
        id: 1,
        areaId: 1,
        status: EventStatus.OPEN,
      });
      const activeEvents = [event];
      const mockDowntime = createMockAreaDowntime({
        id: 1,
        areaId: 1,
        isActive: true,
      });
      const mockDowntimeEvent = createMockAreaDowntimeEvent({
        id: 1,
        areaDowntimeId: 1,
        eventId: 1,
      });

      eventRepository.findActiveByArea.mockResolvedValue(activeEvents);
      areaDowntimeRepository.findActiveByAreaId.mockResolvedValue(null);
      areaDowntimeRepository.create.mockResolvedValue(mockDowntime);
      areaDowntimeEventRepository.create.mockResolvedValue(mockDowntimeEvent);

      await service.handleEventForAreaDowntime(event);

      expect(areaDowntimeRepository.create).toHaveBeenCalledWith({
        areaId: 1,
        startAt: expect.any(Date) as unknown as Date,
        isActive: true,
      });
      expect(areaDowntimeEventRepository.create).toHaveBeenCalledWith({
        areaDowntimeId: 1,
        eventId: 1,
      });
    });

    it('should end downtime when event is closed and no other active events exist', async () => {
      const event = createMockEvent({
        id: 1,
        areaId: 1,
        status: EventStatus.CLOSED,
      });
      const activeEvents: never[] = [];
      const mockDowntime = createMockAreaDowntime({
        id: 1,
        areaId: 1,
        isActive: true,
      });

      eventRepository.findActiveByArea.mockResolvedValue(activeEvents);
      areaDowntimeRepository.findActiveByAreaId.mockResolvedValue(mockDowntime);
      // endAreaDowntime ahora lee el downtime para conocer su startAt y calcular
      // el descuento por paros programados sobre [startAt, endsAt).
      areaDowntimeRepository.findById.mockResolvedValue(mockDowntime);
      areaDowntimeRepository.update.mockResolvedValue(mockDowntime);

      await service.handleEventForAreaDowntime(event);

      expect(areaDowntimeRepository.update).toHaveBeenCalledWith(1, {
        isActive: false,
        endsAt: expect.any(Date) as unknown as Date,
        durationSeconds: expect.any(Number) as unknown as number,
        scheduledDowntimeDiscountSeconds: 0,
        effectiveDurationSeconds: expect.any(Number) as unknown as number,
        scheduledDowntimeSnapshot: expect.any(Object) as unknown as object,
      });
    });

    it('should add event to existing downtime when event is active', async () => {
      const event = createMockEvent({
        id: 2,
        areaId: 1,
        status: EventStatus.OPEN,
      });
      const activeEvents = [event];
      const mockDowntime = createMockAreaDowntime({
        id: 1,
        areaId: 1,
        isActive: true,
      });
      const mockDowntimeEvent = createMockAreaDowntimeEvent({
        id: 2,
        areaDowntimeId: 1,
        eventId: 2,
      });

      eventRepository.findActiveByArea.mockResolvedValue(activeEvents);
      areaDowntimeRepository.findActiveByAreaId.mockResolvedValue(mockDowntime);
      areaDowntimeEventRepository.findRelation.mockResolvedValue(null);
      areaDowntimeEventRepository.create.mockResolvedValue(mockDowntimeEvent);

      await service.handleEventForAreaDowntime(event);

      expect(areaDowntimeEventRepository.create).toHaveBeenCalledWith({
        areaDowntimeId: 1,
        eventId: 2,
      });
    });

    it('should not add duplicate event to downtime', async () => {
      const event = createMockEvent({
        id: 1,
        areaId: 1,
        status: EventStatus.OPEN,
      });
      const activeEvents = [event];
      const mockDowntime = createMockAreaDowntime({
        id: 1,
        areaId: 1,
        isActive: true,
      });
      const existingRelation = createMockAreaDowntimeEvent({
        id: 1,
        areaDowntimeId: 1,
        eventId: 1,
      });

      eventRepository.findActiveByArea.mockResolvedValue(activeEvents);
      areaDowntimeRepository.findActiveByAreaId.mockResolvedValue(mockDowntime);
      areaDowntimeEventRepository.findRelation.mockResolvedValue(
        existingRelation
      );

      await service.handleEventForAreaDowntime(event);

      expect(areaDowntimeEventRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('isAreaInDowntime', () => {
    it('should return true when area has active downtime', async () => {
      const areaId = 1;
      const mockDowntime = createMockAreaDowntime({
        id: 1,
        areaId,
        isActive: true,
      });

      areaDowntimeRepository.findActiveByAreaId.mockResolvedValue(mockDowntime);

      const result = await service.isAreaInDowntime(areaId);

      expect(result).toBe(true);
      expect(areaDowntimeRepository.findActiveByAreaId).toHaveBeenCalledWith(
        areaId
      );
    });

    it('should return false when area has no active downtime', async () => {
      const areaId = 1;

      areaDowntimeRepository.findActiveByAreaId.mockResolvedValue(null);

      const result = await service.isAreaInDowntime(areaId);

      expect(result).toBe(false);
    });
  });

  describe('getActiveDowntimeForArea', () => {
    it('should return active downtime when exists', async () => {
      const areaId = 1;
      const mockDowntime = createMockAreaDowntime({
        id: 1,
        areaId,
        isActive: true,
      });

      areaDowntimeRepository.findActiveByAreaId.mockResolvedValue(mockDowntime);

      const result = await service.getActiveDowntimeForArea(areaId);

      expect(result).toEqual(mockDowntime);
    });

    it('should return null when no active downtime exists', async () => {
      const areaId = 1;

      areaDowntimeRepository.findActiveByAreaId.mockResolvedValue(null);

      const result = await service.getActiveDowntimeForArea(areaId);

      expect(result).toBeNull();
    });
  });

  describe('getActiveDowntimeForAreaWithEvents', () => {
    it('should return downtime with events when exists', async () => {
      const areaId = 1;
      const mockDowntime = createMockAreaDowntime({
        id: 1,
        areaId,
        isActive: true,
        area: createMockArea({ id: areaId, name: 'Test Area' }),
      });
      const mockEvents = [
        createMockEvent({ id: 1, areaId }),
        createMockEvent({ id: 2, areaId }),
      ];
      const mockDowntimeEvents = [
        createMockAreaDowntimeEvent({ id: 1, areaDowntimeId: 1, eventId: 1 }),
        createMockAreaDowntimeEvent({ id: 2, areaDowntimeId: 1, eventId: 2 }),
      ];

      areaDowntimeRepository.findActiveByAreaId.mockResolvedValue(mockDowntime);
      areaDowntimeEventRepository.findByAreaDowntimeId.mockResolvedValue(
        mockDowntimeEvents
      );
      eventRepository.findById
        .mockResolvedValueOnce(mockEvents[0])
        .mockResolvedValueOnce(mockEvents[1]);

      const result = await service.getActiveDowntimeForAreaWithEvents(areaId);

      expect(result).not.toBeNull();
      expect(result?.areaId).toBe(areaId);
      expect(result?.events).toHaveLength(2);
    });

    it('should return null when no active downtime exists', async () => {
      const areaId = 1;

      areaDowntimeRepository.findActiveByAreaId.mockResolvedValue(null);

      const result = await service.getActiveDowntimeForAreaWithEvents(areaId);

      expect(result).toBeNull();
    });
  });

  describe('getDowntimeHistoryForArea', () => {
    it('should return downtime history with pagination', async () => {
      const areaId = 1;
      const limit = 10;
      const offset = 0;
      const mockDowntimes = [
        createMockAreaDowntime({ id: 1, areaId }),
        createMockAreaDowntime({ id: 2, areaId }),
      ];

      areaDowntimeRepository.findAll.mockResolvedValue({
        data: mockDowntimes,
        total: 2,
      });
      areaDowntimeRepository.count.mockResolvedValue(2);

      const result = await service.getDowntimeHistoryForArea(
        areaId,
        limit,
        offset
      );

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(areaDowntimeRepository.findAll).toHaveBeenCalledWith({
        areaId,
        limit,
        offset,
      });
    });
  });

  describe('startDowntime', () => {
    it('should start downtime with related events', async () => {
      const areaId = 1;
      const relatedEventIds = [1, 2];
      const mockDowntime = createMockAreaDowntime({
        id: 1,
        areaId,
        isActive: true,
      });
      const mockDowntimeEvents = [
        createMockAreaDowntimeEvent({ id: 1, areaDowntimeId: 1, eventId: 1 }),
        createMockAreaDowntimeEvent({ id: 2, areaDowntimeId: 1, eventId: 2 }),
      ];

      areaDowntimeRepository.create.mockResolvedValue(mockDowntime);
      areaDowntimeEventRepository.create
        .mockResolvedValueOnce(mockDowntimeEvents[0])
        .mockResolvedValueOnce(mockDowntimeEvents[1]);

      const result = await service.startDowntime(areaId, relatedEventIds);

      expect(result).toEqual(mockDowntime);
      expect(areaDowntimeRepository.create).toHaveBeenCalledWith({
        areaId,
        startAt: expect.any(Date) as unknown as Date,
        isActive: true,
      });
      expect(areaDowntimeEventRepository.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('endDowntime', () => {
    it('should end downtime when active downtime exists', async () => {
      const areaId = 1;
      const mockDowntime = createMockAreaDowntime({
        id: 1,
        areaId,
        isActive: true,
      });

      areaDowntimeRepository.findActiveByAreaId.mockResolvedValue(mockDowntime);
      // endAreaDowntime ahora lee el downtime para conocer su startAt y poder
      // calcular el descuento por paros programados sobre [startAt, endsAt).
      areaDowntimeRepository.findById.mockResolvedValue(mockDowntime);
      areaDowntimeRepository.update.mockResolvedValue(mockDowntime);

      const result = await service.endDowntime(areaId);

      expect(result).toBe(true);
      expect(areaDowntimeRepository.update).toHaveBeenCalledWith(1, {
        isActive: false,
        endsAt: expect.any(Date) as unknown as Date,
        durationSeconds: expect.any(Number) as unknown as number,
        scheduledDowntimeDiscountSeconds: 0,
        effectiveDurationSeconds: expect.any(Number) as unknown as number,
        scheduledDowntimeSnapshot: expect.any(Object) as unknown as object,
      });
    });

    it('should return false when no active downtime exists', async () => {
      const areaId = 1;

      areaDowntimeRepository.findActiveByAreaId.mockResolvedValue(null);

      const result = await service.endDowntime(areaId);

      expect(result).toBe(false);
      expect(areaDowntimeRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('getRelatedEventsForDowntime', () => {
    it('should return related events for downtime', async () => {
      const downtimeId = 1;
      const mockDowntimeEvents = [
        createMockAreaDowntimeEvent({ id: 1, areaDowntimeId: 1, eventId: 1 }),
        createMockAreaDowntimeEvent({ id: 2, areaDowntimeId: 1, eventId: 2 }),
      ];
      const mockEvents = [
        createMockEvent({ id: 1 }),
        createMockEvent({ id: 2 }),
      ];

      areaDowntimeEventRepository.findByAreaDowntimeId.mockResolvedValue(
        mockDowntimeEvents
      );
      eventRepository.findById
        .mockResolvedValueOnce(mockEvents[0])
        .mockResolvedValueOnce(mockEvents[1]);

      const result = await service.getRelatedEventsForDowntime(downtimeId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });
  });

  describe('getAllAreaDowntimesWithEvents', () => {
    it('should return all downtimes with events', async () => {
      const filters: AreaDowntimeFilters = { areaId: 1 };
      const mockDowntimes = [
        createMockAreaDowntime({
          id: 1,
          areaId: 1,
          area: createMockArea({ id: 1, name: 'Test Area' }),
        }),
      ];
      const mockDowntimeEvents = [
        createMockAreaDowntimeEvent({ id: 1, areaDowntimeId: 1, eventId: 1 }),
      ];
      const mockEvent = createMockEvent({ id: 1 });

      areaDowntimeRepository.findAll.mockResolvedValue({
        data: mockDowntimes,
        total: 1,
      });
      areaDowntimeRepository.count.mockResolvedValue(1);
      areaDowntimeEventRepository.findByAreaDowntimeId.mockResolvedValue(
        mockDowntimeEvents
      );
      eventRepository.findById.mockResolvedValue(mockEvent);

      const result = await service.getAllAreaDowntimesWithEvents(filters);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].events).toHaveLength(1);
    });
  });
});
