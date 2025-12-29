import { Test, type TestingModule } from '@nestjs/testing';
import { AreaDowntimeController } from './area-downtime.controller';
import { AreaDowntimeService } from '../application/services/area-downtime.service';
import { AreaDowntimeMappingService } from '../application/services/area-downtime-mapping.service';
import { TypeOrmAreaDowntimeRepository } from '../domain/repositories/typeorm-area-downtime.repository';
import { createMockAreaDowntime, createMockEvent } from '../../test-helpers';

const mockJwtAuthGuard = {
  canActivate: jest.fn(() => true),
};

const mockPermissionGuard = {
  canActivate: jest.fn(() => true),
};

describe('AreaDowntimeController', () => {
  let controller: AreaDowntimeController;
  let service: jest.Mocked<AreaDowntimeService>;
  let mappingService: jest.Mocked<AreaDowntimeMappingService>;
  let repository: jest.Mocked<TypeOrmAreaDowntimeRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AreaDowntimeController],
      providers: [
        {
          provide: AreaDowntimeService,
          useValue: {
            getAllAreaDowntimesWithEvents: jest.fn(),
            getDowntimeHistoryForArea: jest.fn(),
            getActiveDowntimeForAreaWithEvents: jest.fn(),
            isAreaInDowntime: jest.fn(),
            startDowntimeWithEvents: jest.fn(),
            endDowntime: jest.fn(),
            getAllEventsForDowntime: jest.fn(),
            getDowntimeForEventWithEvents: jest.fn(),
          },
        },
        {
          provide: AreaDowntimeMappingService,
          useValue: {
            enrichDowntimesWithEvents: jest.fn(),
          },
        },
        {
          provide: TypeOrmAreaDowntimeRepository,
          useValue: {
            count: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(mockJwtAuthGuard.constructor as any)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(mockPermissionGuard.constructor as any)
      .useValue(mockPermissionGuard)
      .compile();

    controller = module.get<AreaDowntimeController>(AreaDowntimeController);
    service = module.get(AreaDowntimeService);
    mappingService = module.get(AreaDowntimeMappingService);
    repository = module.get(TypeOrmAreaDowntimeRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAreaDowntimes', () => {
    it('should return all area downtimes with filters', async () => {
      const mockDowntimes = [
        {
          id: 1,
          areaId: 1,
          areaName: 'Test Area',
          startAt: new Date(),
          isActive: true,
          endsAt: null,
          events: [],
        },
      ];

      service.getAllAreaDowntimesWithEvents.mockResolvedValue({
        data: mockDowntimes,
        total: 1,
      });

      const result = await controller.getAllAreaDowntimes();

      expect(result.message).toBe(
        'Area downtime records retrieved successfully'
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.pagination).toBeDefined();
    });

    it('should apply filters when provided', async () => {
      const areaId = 1;
      const isActive = true;
      const limit = 20;
      const offset = 10;

      service.getAllAreaDowntimesWithEvents.mockResolvedValue({
        data: [],
        total: 0,
      });

      await controller.getAllAreaDowntimes(
        areaId,
        isActive,
        undefined,
        undefined,
        limit,
        offset
      );

      expect(service.getAllAreaDowntimesWithEvents).toHaveBeenCalledWith({
        areaId,
        isActive,
        limit,
        offset,
      });
    });
  });

  describe('getDowntimeHistoryForArea', () => {
    it('should return downtime history for area', async () => {
      const areaId = 1;
      const limit = 10;
      const offset = 0;
      const mockDowntimes = [
        createMockAreaDowntime({ id: 1, areaId }),
        createMockAreaDowntime({ id: 2, areaId }),
      ];
      const enrichedDowntimes = [
        {
          id: 1,
          areaId: 1,
          areaName: 'Test Area',
          startAt: new Date(),
          isActive: false,
          endsAt: new Date(),
          events: [],
        },
      ];

      service.getDowntimeHistoryForArea.mockResolvedValue({
        data: mockDowntimes,
        total: 2,
      });
      mappingService.enrichDowntimesWithEvents.mockResolvedValue(
        enrichedDowntimes
      );

      const result = await controller.getDowntimeHistoryForArea(
        areaId,
        limit,
        offset
      );

      expect(result.message).toBe(
        `Downtime history for area ${areaId} retrieved successfully`
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(2);
    });
  });

  describe('getActiveDowntimeForArea', () => {
    it('should return active downtime when area is in downtime', async () => {
      const areaId = 1;
      const mockDowntime = {
        id: 1,
        areaId: 1,
        areaName: 'Test Area',
        startAt: new Date(),
        isActive: true,
        endsAt: null,
        events: [],
      };

      service.getActiveDowntimeForAreaWithEvents.mockResolvedValue(
        mockDowntime
      );
      service.isAreaInDowntime.mockResolvedValue(true);

      const result = await controller.getActiveDowntimeForArea(areaId);

      expect(result.isInDowntime).toBe(true);
      expect(result.data).toEqual(mockDowntime);
      expect(result.message).toContain('is currently in downtime');
    });

    it('should return null when area is not in downtime', async () => {
      const areaId = 1;

      service.getActiveDowntimeForAreaWithEvents.mockResolvedValue(null);
      service.isAreaInDowntime.mockResolvedValue(false);

      const result = await controller.getActiveDowntimeForArea(areaId);

      expect(result.isInDowntime).toBe(false);
      expect(result.data).toBeNull();
      expect(result.message).toContain('is not in downtime');
    });
  });

  describe('checkAreaDowntimeStatus', () => {
    it('should return true when area is in downtime', async () => {
      const areaId = 1;

      service.isAreaInDowntime.mockResolvedValue(true);

      const result = await controller.checkAreaDowntimeStatus(areaId);

      expect(result.isInDowntime).toBe(true);
      expect(result.message).toContain('is in downtime');
    });

    it('should return false when area is not in downtime', async () => {
      const areaId = 1;

      service.isAreaInDowntime.mockResolvedValue(false);

      const result = await controller.checkAreaDowntimeStatus(areaId);

      expect(result.isInDowntime).toBe(false);
      expect(result.message).toContain('is not in downtime');
    });
  });

  describe('startDowntime', () => {
    it('should start downtime for area', async () => {
      const areaId = 1;
      const relatedEventIds = [1, 2];
      const mockDowntime = {
        id: 1,
        areaId: 1,
        areaName: 'Test Area',
        startAt: new Date(),
        isActive: true,
        endsAt: null,
        events: [],
      };

      service.startDowntimeWithEvents.mockResolvedValue(mockDowntime);

      const result = await controller.startDowntime(areaId, {
        relatedEventIds,
      });

      expect(result.message).toBe(`Downtime started for area ${areaId}`);
      expect(result.data).toEqual(mockDowntime);
      expect(service.startDowntimeWithEvents).toHaveBeenCalledWith(
        areaId,
        relatedEventIds
      );
    });
  });

  describe('endDowntime', () => {
    it('should end downtime when active downtime exists', async () => {
      const areaId = 1;

      service.endDowntime.mockResolvedValue(true);

      const result = await controller.endDowntime(areaId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Downtime ended');
    });

    it('should return false when no active downtime exists', async () => {
      const areaId = 1;

      service.endDowntime.mockResolvedValue(false);

      const result = await controller.endDowntime(areaId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No active downtime found');
    });
  });

  describe('getAreaDowntimeCount', () => {
    it('should return count of area downtimes', async () => {
      const count = 5;

      repository.count.mockResolvedValue(count);

      const result = await controller.getAreaDowntimeCount();

      expect(result.count).toBe(count);
      expect(result.message).toBe('Area downtime count retrieved successfully');
    });

    it('should apply filters when provided', async () => {
      const areaId = 1;
      const isActive = true;
      const count = 2;

      repository.count.mockResolvedValue(count);

      const result = await controller.getAreaDowntimeCount(areaId, isActive);

      expect(result.count).toBe(count);
      expect(repository.count).toHaveBeenCalledWith({
        areaId,
        isActive,
      });
    });
  });

  describe('getRelatedEventsForDowntime', () => {
    it('should return related events for downtime', async () => {
      const downtimeId = 1;
      const mockEvents = [
        {
          id: 1,
          departmentId: 1,
          departmentName: 'Test Department',
          deviceId: 1,
          deviceName: 'Test Device',
          deviceSignalId: 1,
          deviceSignalName: 'Test Signal',
          status: 'open' as const,
          createdAt: new Date(),
          inProgressAt: null,
          closedAt: null,
        },
      ];

      service.getAllEventsForDowntime.mockResolvedValue(mockEvents);

      const result = await controller.getRelatedEventsForDowntime(downtimeId);

      expect(result.message).toContain('retrieved successfully');
      expect(result.data).toHaveLength(1);
      expect(service.getAllEventsForDowntime).toHaveBeenCalledWith(downtimeId);
    });
  });

  describe('getDowntimeForEvent', () => {
    it('should return downtime information for event', async () => {
      const eventId = 1;
      const mockDowntimes = [
        {
          id: 1,
          areaId: 1,
          areaName: 'Test Area',
          startAt: new Date(),
          isActive: true,
          endsAt: null,
          events: [],
        },
      ];

      service.getDowntimeForEventWithEvents.mockResolvedValue(mockDowntimes);

      const result = await controller.getDowntimeForEvent(eventId);

      expect(result.message).toContain('retrieved successfully');
      expect(result.data).toHaveLength(1);
      expect(service.getDowntimeForEventWithEvents).toHaveBeenCalledWith(
        eventId
      );
    });
  });
});
