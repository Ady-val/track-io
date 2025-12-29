import { Test, type TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from '../application/services/dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: jest.Mocked<DashboardService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            getAreasWithEvents: jest.fn(),
            getDepartmentHeaders: jest.fn(),
            getOpenEvents: jest.fn(),
            getInProgressEvents: jest.fn(),
            getClosedEvents: jest.fn(),
            getRecentClosedEvents: jest.fn(),
            getAllEvents: jest.fn(),
            getEventsByArea: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAreasData', () => {
    it('should return areas data with headers', async () => {
      const mockAreasData = [
        {
          area: 'Area 1',
          departments: [{ department: 'Dept 1', status: 'ok' }],
          eventsTime: '0h 0m 0s',
        },
      ];
      const mockHeaders = ['Dept 1'];

      service.getAreasWithEvents.mockResolvedValue(mockAreasData);
      service.getDepartmentHeaders.mockResolvedValue(mockHeaders);

      const result = await controller.getAreasData();

      expect(result).toEqual({
        success: true,
        headers: mockHeaders,
        data: mockAreasData,
      });
    });

    it('should handle errors and return success false', async () => {
      const error = new Error('Database error');
      service.getAreasWithEvents.mockRejectedValue(error);

      const result = await controller.getAreasData();

      expect(result).toEqual({
        success: false,
        error: error.message,
        headers: [],
        data: [],
      });
    });
  });

  describe('getOpenEvents', () => {
    it('should return open events', async () => {
      const mockEvents = [
        {
          id: 1,
          area: 'Area 1',
          status: 'open',
          startedAt: new Date(),
        },
      ];

      service.getOpenEvents.mockResolvedValue(mockEvents as any);

      const result = await controller.getOpenEvents();

      expect(result).toEqual({
        success: true,
        data: mockEvents,
        total: mockEvents.length,
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      service.getOpenEvents.mockRejectedValue(error);

      const result = await controller.getOpenEvents();

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
    });
  });

  describe('getInProgressEvents', () => {
    it('should return in-progress events', async () => {
      const mockEvents: any[] = [];
      service.getInProgressEvents.mockResolvedValue(mockEvents);

      const result = await controller.getInProgressEvents();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEvents);
    });
  });

  describe('getClosedEvents', () => {
    it('should return closed events', async () => {
      const mockEvents: any[] = [];
      service.getClosedEvents.mockResolvedValue(mockEvents);

      const result = await controller.getClosedEvents();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEvents);
    });
  });

  describe('getRecentClosedEvents', () => {
    it('should return recent closed events', async () => {
      const mockEvents: any[] = [];
      service.getRecentClosedEvents.mockResolvedValue(mockEvents);

      const result = await controller.getRecentClosedEvents();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEvents);
    });
  });

  describe('getAllEvents', () => {
    it('should return all events', async () => {
      const mockEvents: any[] = [];
      service.getAllEvents.mockResolvedValue(mockEvents);

      const result = await controller.getAllEvents();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEvents);
    });
  });

  describe('getEventsByArea', () => {
    it('should return events for area', async () => {
      const areaId = '1';
      const mockEvents: any[] = [];
      service.getEventsByArea.mockResolvedValue(mockEvents);

      const result = await controller.getEventsByArea(areaId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEvents);
      expect(result.areaId).toBe(1);
    });
  });

  describe('getDepartments', () => {
    it('should return department headers', async () => {
      const mockHeaders = ['Dept 1', 'Dept 2'];
      service.getDepartmentHeaders.mockResolvedValue(mockHeaders);

      const result = await controller.getDepartments();

      expect(result).toEqual({
        success: true,
        data: mockHeaders,
      });
    });
  });

  describe('getDashboardStatus', () => {
    it('should return dashboard status', async () => {
      const openEvents: any[] = [{ id: 1 }];
      const inProgressEvents: any[] = [{ id: 2 }];

      service.getOpenEvents.mockResolvedValue(openEvents);
      service.getInProgressEvents.mockResolvedValue(inProgressEvents);

      const result = await controller.getDashboardStatus();

      expect(result).toEqual({
        success: true,
        data: {
          openEvents: 1,
          inProgressEvents: 1,
          closedEvents: 0,
          totalEvents: 2,
        },
      });
    });
  });
});
