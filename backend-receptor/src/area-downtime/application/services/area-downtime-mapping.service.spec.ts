import { Test, type TestingModule } from '@nestjs/testing';
import { AreaDowntimeMappingService } from './area-downtime-mapping.service';
import { TypeOrmAreaDowntimeEventRepository } from '../../domain/repositories/typeorm-area-downtime-event.repository';
import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';
import {
  createMockAreaDowntime,
  createMockAreaDowntimeEvent,
  createMockEvent,
} from '../../../test-helpers';

describe('AreaDowntimeMappingService', () => {
  let service: AreaDowntimeMappingService;
  let areaDowntimeEventRepository: jest.Mocked<TypeOrmAreaDowntimeEventRepository>;
  let eventRepository: jest.Mocked<TypeOrmEventRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreaDowntimeMappingService,
        {
          provide: TypeOrmAreaDowntimeEventRepository,
          useValue: {
            findByAreaDowntimeId: jest.fn(),
          },
        },
        {
          provide: TypeOrmEventRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AreaDowntimeMappingService>(
      AreaDowntimeMappingService
    );
    areaDowntimeEventRepository = module.get(
      TypeOrmAreaDowntimeEventRepository
    );
    eventRepository = module.get(TypeOrmEventRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('enrichDowntimeWithEvents', () => {
    it('should enrich downtime with events', async () => {
      const downtime = createMockAreaDowntime({
        id: 1,
        areaId: 1,
      });
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

      const result = await service.enrichDowntimeWithEvents(downtime);

      expect(result).toBeDefined();
      expect(
        areaDowntimeEventRepository.findByAreaDowntimeId
      ).toHaveBeenCalledWith(1);
      expect(eventRepository.findById).toHaveBeenCalledTimes(2);
    });

    it('should filter out null events', async () => {
      const downtime = createMockAreaDowntime({
        id: 1,
        areaId: 1,
      });
      const mockDowntimeEvents = [
        createMockAreaDowntimeEvent({ id: 1, areaDowntimeId: 1, eventId: 1 }),
        createMockAreaDowntimeEvent({ id: 2, areaDowntimeId: 1, eventId: 2 }),
      ];
      const mockEvent = createMockEvent({ id: 1 });

      areaDowntimeEventRepository.findByAreaDowntimeId.mockResolvedValue(
        mockDowntimeEvents
      );
      eventRepository.findById
        .mockResolvedValueOnce(mockEvent)
        .mockResolvedValueOnce(null);

      const result = await service.enrichDowntimeWithEvents(downtime);

      expect(result).toBeDefined();
    });
  });

  describe('enrichDowntimesWithEvents', () => {
    it('should enrich multiple downtimes with events', async () => {
      const downtimes = [
        createMockAreaDowntime({ id: 1, areaId: 1 }),
        createMockAreaDowntime({ id: 2, areaId: 2 }),
      ];
      const mockDowntimeEvents1 = [
        createMockAreaDowntimeEvent({ id: 1, areaDowntimeId: 1, eventId: 1 }),
      ];
      const mockDowntimeEvents2 = [
        createMockAreaDowntimeEvent({ id: 2, areaDowntimeId: 2, eventId: 2 }),
      ];
      const mockEvents = [
        createMockEvent({ id: 1 }),
        createMockEvent({ id: 2 }),
      ];

      areaDowntimeEventRepository.findByAreaDowntimeId
        .mockResolvedValueOnce(mockDowntimeEvents1)
        .mockResolvedValueOnce(mockDowntimeEvents2);
      eventRepository.findById
        .mockResolvedValueOnce(mockEvents[0])
        .mockResolvedValueOnce(mockEvents[1]);

      const result = await service.enrichDowntimesWithEvents(downtimes);

      expect(result).toHaveLength(2);
      expect(
        areaDowntimeEventRepository.findByAreaDowntimeId
      ).toHaveBeenCalledTimes(2);
    });
  });
});
