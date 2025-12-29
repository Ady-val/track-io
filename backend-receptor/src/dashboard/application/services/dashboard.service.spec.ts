import { Test, type TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { AreaRepository } from '../../../areas/domain/repositories/area.repository';
import { DepartmentRepository } from '../../../departments/domain/repositories/department.repository';
import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';
import {
  createMockArea,
  createMockDepartment,
  createMockEvent,
} from '../../../test-helpers';
import { EventStatus } from '../../../events/domain/entities/event.entity';

describe('DashboardService', () => {
  let service: DashboardService;
  let areaRepository: jest.Mocked<AreaRepository>;
  let departmentRepository: jest.Mocked<DepartmentRepository>;
  let eventRepository: jest.Mocked<TypeOrmEventRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: AreaRepository,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: DepartmentRepository,
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: TypeOrmEventRepository,
          useValue: {
            findAll: jest.fn(),
            findByStatus: jest.fn(),
            findByArea: jest.fn(),
            findRecentClosedEvents: jest.fn(),
            findActiveByArea: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    areaRepository = module.get(AreaRepository);
    departmentRepository = module.get(DepartmentRepository);
    eventRepository = module.get(TypeOrmEventRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAreasWithEvents', () => {
    it('should return areas with events data', async () => {
      const mockAreas = [createMockArea({ id: 1 }), createMockArea({ id: 2 })];
      const mockDepartments = [
        createMockDepartment({ id: 1 }),
        createMockDepartment({ id: 2 }),
      ];
      const mockEvents: any[] = [];

      areaRepository.findAll.mockResolvedValue({ data: mockAreas, total: 2 });
      departmentRepository.findAll.mockResolvedValue({
        data: mockDepartments,
        total: 2,
      });
      eventRepository.findAll.mockResolvedValue(mockEvents);

      const result = await service.getAreasWithEvents();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('area');
      expect(result[0]).toHaveProperty('departments');
      expect(result[0]).toHaveProperty('eventsTime');
      expect(result[0].departments).toHaveLength(2);
    });

    it('should calculate department status correctly', async () => {
      const mockAreas = [createMockArea({ id: 1 })];
      const mockDepartments = [createMockDepartment({ id: 1 })];
      const mockEvents = [
        createMockEvent({
          id: 1,
          areaId: 1,
          departmentId: 1,
          status: EventStatus.OPEN,
        }),
      ];

      areaRepository.findAll.mockResolvedValue({ data: mockAreas, total: 1 });
      departmentRepository.findAll.mockResolvedValue({
        data: mockDepartments,
        total: 1,
      });
      eventRepository.findAll.mockResolvedValue(mockEvents as any);

      const result = await service.getAreasWithEvents();

      expect(result[0].departments[0].status).toBe('alert');
    });

    it('should handle errors correctly', async () => {
      const error = new Error('Database error');
      areaRepository.findAll.mockRejectedValue(error);

      await expect(service.getAreasWithEvents()).rejects.toThrow(error);
    });
  });

  describe('getDepartmentHeaders', () => {
    it('should return department names as headers', async () => {
      const mockDepartments = [
        createMockDepartment({ id: 1, name: 'Dept 1' }),
        createMockDepartment({ id: 2, name: 'Dept 2' }),
      ];

      departmentRepository.findAll.mockResolvedValue({
        data: mockDepartments,
        total: 2,
      });

      const result = await service.getDepartmentHeaders();

      expect(result).toEqual(['Dept 1', 'Dept 2']);
      expect(departmentRepository.findAll).toHaveBeenCalled();
    });

    it('should handle errors correctly', async () => {
      const error = new Error('Database error');
      departmentRepository.findAll.mockRejectedValue(error);

      await expect(service.getDepartmentHeaders()).rejects.toThrow(error);
    });
  });

  describe('getOpenEvents', () => {
    it('should return open events mapped to dashboard data', async () => {
      const mockEvents = [
        createMockEvent({
          id: 1,
          status: EventStatus.OPEN,
          areaName: 'Area 1',
          departmentName: 'Dept 1',
          deviceName: 'Device 1',
          deviceSignalName: 'Signal 1',
        }),
      ];

      eventRepository.findByStatus.mockResolvedValue(mockEvents as any);

      const result = await service.getOpenEvents();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('area');
      expect(result[0]).toHaveProperty('status', EventStatus.OPEN);
      expect(eventRepository.findByStatus).toHaveBeenCalledWith(
        EventStatus.OPEN
      );
    });
  });

  describe('getInProgressEvents', () => {
    it('should return in-progress events mapped to dashboard data', async () => {
      const mockEvents = [
        createMockEvent({
          id: 1,
          status: EventStatus.IN_PROGRESS,
        }),
      ];

      eventRepository.findByStatus.mockResolvedValue(mockEvents as any);

      const result = await service.getInProgressEvents();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(EventStatus.IN_PROGRESS);
      expect(eventRepository.findByStatus).toHaveBeenCalledWith(
        EventStatus.IN_PROGRESS
      );
    });
  });

  describe('getClosedEvents', () => {
    it('should return closed events mapped to dashboard data', async () => {
      const mockEvents = [
        createMockEvent({
          id: 1,
          status: EventStatus.CLOSED,
          closedAt: new Date(),
          durationSeconds: 100,
        }),
      ];

      eventRepository.findByStatus.mockResolvedValue(mockEvents as any);

      const result = await service.getClosedEvents();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(EventStatus.CLOSED);
      expect(result[0]).toHaveProperty('endedAt');
      expect(result[0]).toHaveProperty('duration');
    });
  });

  describe('getRecentClosedEvents', () => {
    it('should return recent closed events with default limit', async () => {
      const mockEvents = [
        createMockEvent({
          id: 1,
          status: EventStatus.CLOSED,
        }),
      ];

      eventRepository.findRecentClosedEvents.mockResolvedValue(
        mockEvents as any
      );

      const result = await service.getRecentClosedEvents();

      expect(result).toHaveLength(1);
      expect(eventRepository.findRecentClosedEvents).toHaveBeenCalledWith(10);
    });

    it('should return recent closed events with custom limit', async () => {
      const limit = 20;
      const mockEvents: any[] = [];

      eventRepository.findRecentClosedEvents.mockResolvedValue(mockEvents);

      await service.getRecentClosedEvents(limit);

      expect(eventRepository.findRecentClosedEvents).toHaveBeenCalledWith(
        limit
      );
    });
  });

  describe('getAllEvents', () => {
    it('should return all events mapped to dashboard data', async () => {
      const mockEvents = [
        createMockEvent({ id: 1 }),
        createMockEvent({ id: 2 }),
      ];

      eventRepository.findAll.mockResolvedValue(mockEvents as any);

      const result = await service.getAllEvents();

      expect(result).toHaveLength(2);
      expect(eventRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('getEventsByArea', () => {
    it('should return events for area mapped to dashboard data', async () => {
      const areaId = 1;
      const mockEvents = [
        createMockEvent({ id: 1, areaId }),
        createMockEvent({ id: 2, areaId }),
      ];

      eventRepository.findByArea.mockResolvedValue(mockEvents as any);

      const result = await service.getEventsByArea(areaId);

      expect(result).toHaveLength(2);
      expect(eventRepository.findByArea).toHaveBeenCalledWith(areaId);
    });
  });
});
