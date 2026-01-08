import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { DashboardMeasurementService } from './dashboard-measurement.service';
import { DashboardMeasurementRepository } from '../../domain/repositories/dashboard-measurement.repository';
import { DashboardMeasurementGroupRepository } from '../../domain/repositories/dashboard-measurement-group.repository';
import { MeasurementService } from '../../../measurements/application/services/measurement.service';
import { MeasurementValueRepository } from '../../../measurements/domain/repositories/measurement-value.repository';
import {
  createMockDashboardMeasurement,
  createMockMeasurement,
  createMockDashboardMeasurementGroup,
  createMockMeasurementValue,
} from '../../../test-helpers';
import type {
  CreateDashboardMeasurementDto,
  UpdateDashboardMeasurementDto,
  CreateMeasurementWithDashboardDto,
  UpdateMeasurementWithDashboardDto,
} from '../dtos/dashboard-measurement.dto';
import { MeasurementType } from '../../../measurements/domain/entities/measurement.entity';

describe('DashboardMeasurementService', () => {
  let service: DashboardMeasurementService;
  let dashboardMeasurementRepository: jest.Mocked<DashboardMeasurementRepository>;
  let measurementService: jest.Mocked<MeasurementService>;
  let groupRepository: jest.Mocked<DashboardMeasurementGroupRepository>;
  let measurementValueRepository: jest.Mocked<MeasurementValueRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardMeasurementService,
        {
          provide: DashboardMeasurementRepository,
          useValue: {
            findByGroupId: jest.fn(),
            findAllWithMeasurements: jest.fn(),
            findOne: jest.fn(),
            findByMeasurementId: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: MeasurementService,
          useValue: {
            getMeasurementById: jest.fn(),
            createMeasurement: jest.fn(),
            updateMeasurement: jest.fn(),
            deleteMeasurement: jest.fn(),
          },
        },
        {
          provide: DashboardMeasurementGroupRepository,
          useValue: {
            findOneOrFail: jest.fn(),
          },
        },
        {
          provide: MeasurementValueRepository,
          useValue: {
            findLatestValueByMeasurementId: jest.fn(),
            findStatusOnStartTime: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardMeasurementService>(
      DashboardMeasurementService
    );
    dashboardMeasurementRepository = module.get(DashboardMeasurementRepository);
    measurementService = module.get(MeasurementService);
    groupRepository = module.get(DashboardMeasurementGroupRepository);
    measurementValueRepository = module.get(MeasurementValueRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDashboardMeasurements', () => {
    it('should return all dashboard measurements when no groupId provided', async () => {
      const mockMeasurements = [
        createMockDashboardMeasurement({ id: 1, measurementId: 1 }),
        createMockDashboardMeasurement({ id: 2, measurementId: 2 }),
      ];

      dashboardMeasurementRepository.findAllWithMeasurements.mockResolvedValue(
        mockMeasurements
      );
      measurementValueRepository.findLatestValueByMeasurementId.mockResolvedValue(
        null
      );

      const result = await service.getAllDashboardMeasurements();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        measurementId: 1,
      });
      expect(result[1]).toMatchObject({
        id: 2,
        measurementId: 2,
      });
      expect(
        dashboardMeasurementRepository.findAllWithMeasurements
      ).toHaveBeenCalledTimes(1);
      expect(
        dashboardMeasurementRepository.findByGroupId
      ).not.toHaveBeenCalled();
      expect(
        measurementValueRepository.findLatestValueByMeasurementId
      ).toHaveBeenCalledTimes(2);
    });

    it('should return dashboard measurements filtered by groupId', async () => {
      const groupId = 1;
      const mockMeasurements = [
        createMockDashboardMeasurement({ id: 1, groupId, measurementId: 1 }),
        createMockDashboardMeasurement({ id: 2, groupId, measurementId: 2 }),
      ];

      dashboardMeasurementRepository.findByGroupId.mockResolvedValue(
        mockMeasurements
      );
      measurementValueRepository.findLatestValueByMeasurementId.mockResolvedValue(
        null
      );

      const result = await service.getAllDashboardMeasurements(groupId);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        groupId,
        measurementId: 1,
      });
      expect(dashboardMeasurementRepository.findByGroupId).toHaveBeenCalledWith(
        groupId
      );
      expect(
        dashboardMeasurementRepository.findAllWithMeasurements
      ).not.toHaveBeenCalled();
      expect(
        measurementValueRepository.findLatestValueByMeasurementId
      ).toHaveBeenCalledTimes(2);
    });

    it('should include latestValue when available', async () => {
      const mockMeasurement = createMockDashboardMeasurement({
        id: 1,
        measurementId: 1,
      });
      const mockLatestValue = createMockMeasurementValue({
        id: 1,
        measurementId: 1,
        value: '25.5',
        createdAt: new Date('2025-01-01T10:00:00Z'),
      });

      dashboardMeasurementRepository.findAllWithMeasurements.mockResolvedValue([
        mockMeasurement,
      ]);
      measurementValueRepository.findLatestValueByMeasurementId.mockResolvedValue(
        mockLatestValue
      );

      const result = await service.getAllDashboardMeasurements();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('latestValue');
      expect(result[0].latestValue).toEqual({
        value: '25.5',
        createdAt: '2025-01-01T10:00:00.000Z',
      });
    });

    it('should include onStartTime for status type measurements', async () => {
      const mockStatusMeasurement = createMockMeasurement({
        id: 1,
        type: MeasurementType.STATUS,
      });
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id: 1,
        measurementId: 1,
        measurement: mockStatusMeasurement,
      });
      const onStartTime = new Date('2025-01-01T10:00:00Z');

      dashboardMeasurementRepository.findAllWithMeasurements.mockResolvedValue([
        mockDashboardMeasurement,
      ]);
      measurementValueRepository.findLatestValueByMeasurementId.mockResolvedValue(
        null
      );
      measurementValueRepository.findStatusOnStartTime.mockResolvedValue(
        onStartTime
      );

      const result = await service.getAllDashboardMeasurements();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('onStartTime');
      expect(result[0].onStartTime).toBe('2025-01-01T10:00:00.000Z');
      expect(
        measurementValueRepository.findStatusOnStartTime
      ).toHaveBeenCalledWith(1);
    });

    it('should not include onStartTime for non-status type measurements', async () => {
      const mockTemperatureMeasurement = createMockMeasurement({
        id: 1,
        type: MeasurementType.TEMPERATURE,
      });
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id: 1,
        measurementId: 1,
        measurement: mockTemperatureMeasurement,
      });

      dashboardMeasurementRepository.findAllWithMeasurements.mockResolvedValue([
        mockDashboardMeasurement,
      ]);
      measurementValueRepository.findLatestValueByMeasurementId.mockResolvedValue(
        null
      );

      const result = await service.getAllDashboardMeasurements();

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('onStartTime');
      expect(
        measurementValueRepository.findStatusOnStartTime
      ).not.toHaveBeenCalled();
    });

    it('should handle errors when fetching latestValue gracefully', async () => {
      const mockMeasurement = createMockDashboardMeasurement({
        id: 1,
        measurementId: 1,
      });

      dashboardMeasurementRepository.findAllWithMeasurements.mockResolvedValue([
        mockMeasurement,
      ]);
      measurementValueRepository.findLatestValueByMeasurementId.mockRejectedValue(
        new Error('Database error')
      );

      const result = await service.getAllDashboardMeasurements();

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('latestValue');
    });

    it('should handle errors when fetching onStartTime gracefully', async () => {
      const mockStatusMeasurement = createMockMeasurement({
        id: 1,
        type: MeasurementType.STATUS,
      });
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id: 1,
        measurementId: 1,
        measurement: mockStatusMeasurement,
      });

      dashboardMeasurementRepository.findAllWithMeasurements.mockResolvedValue([
        mockDashboardMeasurement,
      ]);
      measurementValueRepository.findLatestValueByMeasurementId.mockResolvedValue(
        null
      );
      measurementValueRepository.findStatusOnStartTime.mockRejectedValue(
        new Error('Database error')
      );

      const result = await service.getAllDashboardMeasurements();

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('onStartTime');
    });

    it('should include both latestValue and onStartTime for status measurements', async () => {
      const mockStatusMeasurement = createMockMeasurement({
        id: 1,
        type: MeasurementType.STATUS,
      });
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id: 1,
        measurementId: 1,
        measurement: mockStatusMeasurement,
      });
      const mockLatestValue = createMockMeasurementValue({
        id: 1,
        measurementId: 1,
        value: 'true',
        createdAt: new Date('2025-01-01T10:00:00Z'),
      });
      const onStartTime = new Date('2025-01-01T09:00:00Z');

      dashboardMeasurementRepository.findAllWithMeasurements.mockResolvedValue([
        mockDashboardMeasurement,
      ]);
      measurementValueRepository.findLatestValueByMeasurementId.mockResolvedValue(
        mockLatestValue
      );
      measurementValueRepository.findStatusOnStartTime.mockResolvedValue(
        onStartTime
      );

      const result = await service.getAllDashboardMeasurements();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('latestValue');
      expect(result[0]).toHaveProperty('onStartTime');
      expect(result[0].latestValue).toEqual({
        value: 'true',
        createdAt: '2025-01-01T10:00:00.000Z',
      });
      expect(result[0].onStartTime).toBe('2025-01-01T09:00:00.000Z');
    });
  });

  describe('getDashboardMeasurementById', () => {
    it('should return dashboard measurement when found', async () => {
      const id = 1;
      const mockMeasurement = createMockDashboardMeasurement({ id });

      dashboardMeasurementRepository.findOne.mockResolvedValue(mockMeasurement);

      const result = await service.getDashboardMeasurementById(id);

      expect(result).toEqual(mockMeasurement);
      expect(dashboardMeasurementRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['measurement'],
      });
    });

    it('should throw NotFoundException when dashboard measurement not found', async () => {
      const id = 999;

      dashboardMeasurementRepository.findOne.mockResolvedValue(null);

      await expect(service.getDashboardMeasurementById(id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getDashboardMeasurementById(id)).rejects.toThrow(
        `Dashboard measurement with ID ${id} not found`
      );
    });
  });

  describe('getDashboardMeasurementByMeasurementId', () => {
    it('should return dashboard measurement when found', async () => {
      const measurementId = 1;
      const mockMeasurement = createMockDashboardMeasurement({
        measurementId,
      });

      dashboardMeasurementRepository.findByMeasurementId.mockResolvedValue(
        mockMeasurement
      );

      const result =
        await service.getDashboardMeasurementByMeasurementId(measurementId);

      expect(result).toEqual(mockMeasurement);
      expect(
        dashboardMeasurementRepository.findByMeasurementId
      ).toHaveBeenCalledWith(measurementId);
    });

    it('should return null when dashboard measurement not found', async () => {
      const measurementId = 999;

      dashboardMeasurementRepository.findByMeasurementId.mockResolvedValue(
        null
      );

      const result =
        await service.getDashboardMeasurementByMeasurementId(measurementId);

      expect(result).toBeNull();
    });
  });

  describe('createDashboardMeasurement', () => {
    const createDto: CreateDashboardMeasurementDto = {
      measurementId: 1,
      minValue: 0,
      maxValue: 100,
    };

    it('should create dashboard measurement successfully', async () => {
      const mockMeasurement = createMockMeasurement({ id: 1 });
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id: 1,
        ...createDto,
      });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);
      dashboardMeasurementRepository.create.mockReturnValue(
        mockDashboardMeasurement
      );
      dashboardMeasurementRepository.save.mockResolvedValue(
        mockDashboardMeasurement
      );

      const result = await service.createDashboardMeasurement(createDto);

      expect(result).toEqual(mockDashboardMeasurement);
      expect(measurementService.getMeasurementById).toHaveBeenCalledWith(1);
      expect(dashboardMeasurementRepository.create).toHaveBeenCalledWith(
        createDto
      );
      expect(dashboardMeasurementRepository.save).toHaveBeenCalledWith(
        mockDashboardMeasurement
      );
    });

    it('should validate groupId exists when provided', async () => {
      const createDtoWithGroup: CreateDashboardMeasurementDto = {
        ...createDto,
        groupId: 1,
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });
      const mockGroup = createMockDashboardMeasurementGroup({ id: 1 });
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id: 1,
        ...createDtoWithGroup,
      });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);
      groupRepository.findOneOrFail.mockResolvedValue(mockGroup);
      dashboardMeasurementRepository.create.mockReturnValue(
        mockDashboardMeasurement
      );
      dashboardMeasurementRepository.save.mockResolvedValue(
        mockDashboardMeasurement
      );

      const result =
        await service.createDashboardMeasurement(createDtoWithGroup);

      expect(result).toEqual(mockDashboardMeasurement);
      expect(groupRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw BadRequestException when minValue >= maxValue', async () => {
      const invalidDto: CreateDashboardMeasurementDto = {
        ...createDto,
        minValue: 100,
        maxValue: 50,
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);

      await expect(
        service.createDashboardMeasurement(invalidDto)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createDashboardMeasurement(invalidDto)
      ).rejects.toThrow('minValue must be less than maxValue');
    });

    it('should throw NotFoundException when Measurement does not exist', async () => {
      measurementService.getMeasurementById.mockRejectedValue(
        new NotFoundException('Measurement not found')
      );

      await expect(
        service.createDashboardMeasurement(createDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when Group does not exist', async () => {
      const createDtoWithGroup: CreateDashboardMeasurementDto = {
        ...createDto,
        groupId: 999,
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);
      groupRepository.findOneOrFail.mockRejectedValue(
        new NotFoundException('Group not found')
      );

      await expect(
        service.createDashboardMeasurement(createDtoWithGroup)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDashboardMeasurement', () => {
    const updateDto: UpdateDashboardMeasurementDto = {
      minValue: 10,
      maxValue: 90,
    };

    it('should update dashboard measurement successfully', async () => {
      const id = 1;
      const existingMeasurement = createMockDashboardMeasurement({
        id,
        minValue: 0,
        maxValue: 100,
      });
      const updatedMeasurement = createMockDashboardMeasurement({
        id,
        ...updateDto,
      });

      dashboardMeasurementRepository.findOne.mockResolvedValue(
        existingMeasurement
      );
      dashboardMeasurementRepository.save.mockResolvedValue(updatedMeasurement);

      const result = await service.updateDashboardMeasurement(id, updateDto);

      expect(result).toEqual(updatedMeasurement);
      expect(dashboardMeasurementRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['measurement'],
      });
      expect(dashboardMeasurementRepository.save).toHaveBeenCalled();
    });

    it('should validate new measurementId exists when provided', async () => {
      const id = 1;
      const updateDtoWithMeasurement: UpdateDashboardMeasurementDto = {
        ...updateDto,
        measurementId: 2,
      };
      const existingMeasurement = createMockDashboardMeasurement({ id });
      const mockMeasurement = createMockMeasurement({ id: 2 });
      const updatedMeasurement = createMockDashboardMeasurement({
        id,
        ...updateDtoWithMeasurement,
      });

      dashboardMeasurementRepository.findOne.mockResolvedValue(
        existingMeasurement
      );
      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);
      dashboardMeasurementRepository.save.mockResolvedValue(updatedMeasurement);

      await service.updateDashboardMeasurement(id, updateDtoWithMeasurement);

      expect(measurementService.getMeasurementById).toHaveBeenCalledWith(2);
    });

    it('should validate new groupId exists when provided', async () => {
      const id = 1;
      const updateDtoWithGroup: UpdateDashboardMeasurementDto = {
        ...updateDto,
        groupId: 2,
      };
      const existingMeasurement = createMockDashboardMeasurement({ id });
      const mockGroup = createMockDashboardMeasurementGroup({ id: 2 });
      const updatedMeasurement = createMockDashboardMeasurement({
        id,
        ...updateDtoWithGroup,
      });

      dashboardMeasurementRepository.findOne.mockResolvedValue(
        existingMeasurement
      );
      groupRepository.findOneOrFail.mockResolvedValue(mockGroup);
      dashboardMeasurementRepository.save.mockResolvedValue(updatedMeasurement);

      await service.updateDashboardMeasurement(id, updateDtoWithGroup);

      expect(groupRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 2 },
      });
    });

    it('should throw BadRequestException when new minValue >= new maxValue', async () => {
      const id = 1;
      const invalidUpdateDto: UpdateDashboardMeasurementDto = {
        minValue: 100,
        maxValue: 50,
      };
      const existingMeasurement = createMockDashboardMeasurement({
        id,
        minValue: 0,
        maxValue: 100,
      });

      dashboardMeasurementRepository.findOne.mockResolvedValue(
        existingMeasurement
      );

      await expect(
        service.updateDashboardMeasurement(id, invalidUpdateDto)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateDashboardMeasurement(id, invalidUpdateDto)
      ).rejects.toThrow('minValue must be less than maxValue');
    });

    it('should throw BadRequestException when minValue >= existing maxValue', async () => {
      const id = 1;
      const invalidUpdateDto: UpdateDashboardMeasurementDto = {
        minValue: 150,
      };
      const existingMeasurement = createMockDashboardMeasurement({
        id,
        minValue: 0,
        maxValue: 100,
      });

      dashboardMeasurementRepository.findOne.mockResolvedValue(
        existingMeasurement
      );

      await expect(
        service.updateDashboardMeasurement(id, invalidUpdateDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when dashboard measurement does not exist', async () => {
      const id = 999;

      dashboardMeasurementRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateDashboardMeasurement(id, updateDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteDashboardMeasurement', () => {
    it('should soft delete both dashboard measurement and measurement successfully', async () => {
      const id = 1;
      const measurementId = 10;
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id,
        measurementId,
      });

      dashboardMeasurementRepository.findOne.mockResolvedValue(
        mockDashboardMeasurement
      );
      dashboardMeasurementRepository.softDelete.mockResolvedValue(undefined);
      measurementService.deleteMeasurement.mockResolvedValue(undefined);

      await service.deleteDashboardMeasurement(id);

      expect(dashboardMeasurementRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['measurement'],
      });
      expect(dashboardMeasurementRepository.softDelete).toHaveBeenCalledWith(
        id
      );
      expect(measurementService.deleteMeasurement).toHaveBeenCalledWith(
        measurementId
      );
    });

    it('should throw NotFoundException when dashboard measurement does not exist', async () => {
      const id = 999;

      dashboardMeasurementRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteDashboardMeasurement(id)).rejects.toThrow(
        NotFoundException
      );
      expect(measurementService.deleteMeasurement).not.toHaveBeenCalled();
    });
  });

  describe('createMeasurementWithDashboard', () => {
    const createDto: CreateMeasurementWithDashboardDto = {
      externalId: 'TEST-001',
      name: 'Test Measurement',
      type: MeasurementType.TEMPERATURE,
      minValue: 0,
      maxValue: 100,
    };

    it('should create measurement and dashboard measurement successfully', async () => {
      const mockMeasurement = createMockMeasurement({
        id: 1,
        externalId: 'TEST-001',
        name: 'Test Measurement',
        type: MeasurementType.TEMPERATURE,
      });
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id: 1,
        measurementId: 1,
        minValue: 0,
        maxValue: 100,
      });

      measurementService.createMeasurement.mockResolvedValue(mockMeasurement);
      dashboardMeasurementRepository.create.mockReturnValue(
        mockDashboardMeasurement
      );
      dashboardMeasurementRepository.save.mockResolvedValue(
        mockDashboardMeasurement
      );

      const result = await service.createMeasurementWithDashboard(createDto);

      expect(result).toEqual(mockDashboardMeasurement);
      expect(measurementService.createMeasurement).toHaveBeenCalledWith({
        externalId: 'TEST-001',
        name: 'Test Measurement',
        type: MeasurementType.TEMPERATURE,
      });
      expect(dashboardMeasurementRepository.create).toHaveBeenCalledWith({
        measurementId: 1,
        minValue: 0,
        maxValue: 100,
      });
      expect(dashboardMeasurementRepository.save).toHaveBeenCalled();
    });

    it('should create with groupId when provided', async () => {
      const createDtoWithGroup: CreateMeasurementWithDashboardDto = {
        ...createDto,
        groupId: 1,
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });
      const mockGroup = createMockDashboardMeasurementGroup({ id: 1 });
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id: 1,
        measurementId: 1,
        groupId: 1,
      });

      measurementService.createMeasurement.mockResolvedValue(mockMeasurement);
      groupRepository.findOneOrFail.mockResolvedValue(mockGroup);
      dashboardMeasurementRepository.create.mockReturnValue(
        mockDashboardMeasurement
      );
      dashboardMeasurementRepository.save.mockResolvedValue(
        mockDashboardMeasurement
      );

      const result =
        await service.createMeasurementWithDashboard(createDtoWithGroup);

      expect(result).toEqual(mockDashboardMeasurement);
      expect(groupRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(dashboardMeasurementRepository.create).toHaveBeenCalledWith({
        measurementId: 1,
        groupId: 1,
        minValue: 0,
        maxValue: 100,
      });
    });

    it('should handle null groupId correctly', async () => {
      const createDtoWithNullGroup: CreateMeasurementWithDashboardDto = {
        ...createDto,
        groupId: null as any,
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id: 1,
        measurementId: 1,
        groupId: null,
      });

      measurementService.createMeasurement.mockResolvedValue(mockMeasurement);
      dashboardMeasurementRepository.create.mockReturnValue(
        mockDashboardMeasurement
      );
      dashboardMeasurementRepository.save.mockResolvedValue(
        mockDashboardMeasurement
      );

      const result =
        await service.createMeasurementWithDashboard(createDtoWithNullGroup);

      expect(result).toEqual(mockDashboardMeasurement);
      expect(groupRepository.findOneOrFail).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when minValue >= maxValue', async () => {
      const invalidDto: CreateMeasurementWithDashboardDto = {
        ...createDto,
        minValue: 100,
        maxValue: 50,
      };

      await expect(
        service.createMeasurementWithDashboard(invalidDto)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createMeasurementWithDashboard(invalidDto)
      ).rejects.toThrow('minValue must be less than maxValue');
      expect(measurementService.createMeasurement).not.toHaveBeenCalled();
    });

    it('should throw error when group does not exist', async () => {
      const createDtoWithGroup: CreateMeasurementWithDashboardDto = {
        ...createDto,
        groupId: 999,
      };

      groupRepository.findOneOrFail.mockRejectedValue(
        new NotFoundException('Group not found')
      );

      await expect(
        service.createMeasurementWithDashboard(createDtoWithGroup)
      ).rejects.toThrow(NotFoundException);

      // Verify measurement is not created when group validation fails
      expect(measurementService.createMeasurement).not.toHaveBeenCalled();
    });
  });

  describe('updateMeasurementWithDashboard', () => {
    const updateDto: UpdateMeasurementWithDashboardDto = {
      name: 'Updated Measurement',
      minValue: 10,
      maxValue: 90,
    };

    it('should update both measurement and dashboard measurement successfully', async () => {
      const id = 1;
      const measurementId = 10;
      const existingDashboard = createMockDashboardMeasurement({
        id,
        measurementId,
        minValue: 0,
        maxValue: 100,
      });
      const updatedDashboard = createMockDashboardMeasurement({
        id,
        measurementId,
        minValue: 10,
        maxValue: 90,
      });

      dashboardMeasurementRepository.findOne.mockResolvedValue(
        existingDashboard
      );
      measurementService.updateMeasurement.mockResolvedValue(undefined);
      dashboardMeasurementRepository.save.mockResolvedValue(updatedDashboard);

      const result = await service.updateMeasurementWithDashboard(id, updateDto);

      expect(result).toEqual(updatedDashboard);
      expect(measurementService.updateMeasurement).toHaveBeenCalledWith(
        measurementId,
        { name: 'Updated Measurement' }
      );
      expect(dashboardMeasurementRepository.save).toHaveBeenCalled();
    });

    it('should update only dashboard measurement fields when measurement fields not provided', async () => {
      const id = 1;
      const measurementId = 10;
      const dashboardOnlyUpdate: UpdateMeasurementWithDashboardDto = {
        minValue: 10,
        maxValue: 90,
      };
      const existingDashboard = createMockDashboardMeasurement({
        id,
        measurementId,
        minValue: 0,
        maxValue: 100,
      });
      const updatedDashboard = createMockDashboardMeasurement({
        id,
        measurementId,
        minValue: 10,
        maxValue: 90,
      });

      dashboardMeasurementRepository.findOne.mockResolvedValue(
        existingDashboard
      );
      dashboardMeasurementRepository.save.mockResolvedValue(updatedDashboard);

      const result = await service.updateMeasurementWithDashboard(
        id,
        dashboardOnlyUpdate
      );

      expect(result).toEqual(updatedDashboard);
      expect(measurementService.updateMeasurement).not.toHaveBeenCalled();
    });

    it('should update groupId when provided', async () => {
      const id = 1;
      const measurementId = 10;
      const updateDtoWithGroup: UpdateMeasurementWithDashboardDto = {
        ...updateDto,
        groupId: 2,
      };
      const existingDashboard = createMockDashboardMeasurement({
        id,
        measurementId,
      });
      const mockGroup = createMockDashboardMeasurementGroup({ id: 2 });
      const updatedDashboard = createMockDashboardMeasurement({
        id,
        measurementId,
        groupId: 2,
      });

      dashboardMeasurementRepository.findOne.mockResolvedValue(
        existingDashboard
      );
      groupRepository.findOneOrFail.mockResolvedValue(mockGroup);
      measurementService.updateMeasurement.mockResolvedValue(undefined);
      dashboardMeasurementRepository.save.mockResolvedValue(updatedDashboard);

      await service.updateMeasurementWithDashboard(id, updateDtoWithGroup);

      expect(groupRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 2 },
      });
      expect(dashboardMeasurementRepository.save).toHaveBeenCalled();
    });

    it('should remove group assignment when groupId is null', async () => {
      const id = 1;
      const measurementId = 10;
      const updateDtoWithNullGroup: UpdateMeasurementWithDashboardDto = {
        ...updateDto,
        groupId: null,
      };
      const existingDashboard = createMockDashboardMeasurement({
        id,
        measurementId,
        groupId: 1,
      });
      const updatedDashboard = createMockDashboardMeasurement({
        id,
        measurementId,
        groupId: null,
      });

      dashboardMeasurementRepository.findOne.mockResolvedValue(
        existingDashboard
      );
      measurementService.updateMeasurement.mockResolvedValue(undefined);
      dashboardMeasurementRepository.save.mockResolvedValue(updatedDashboard);

      await service.updateMeasurementWithDashboard(
        id,
        updateDtoWithNullGroup
      );

      expect(groupRepository.findOneOrFail).not.toHaveBeenCalled();
      expect(dashboardMeasurementRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when minValue >= maxValue', async () => {
      const id = 1;
      const invalidUpdateDto: UpdateMeasurementWithDashboardDto = {
        minValue: 100,
        maxValue: 50,
      };
      const existingDashboard = createMockDashboardMeasurement({
        id,
        minValue: 0,
        maxValue: 100,
      });

      dashboardMeasurementRepository.findOne.mockResolvedValue(
        existingDashboard
      );

      await expect(
        service.updateMeasurementWithDashboard(id, invalidUpdateDto)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateMeasurementWithDashboard(id, invalidUpdateDto)
      ).rejects.toThrow('minValue must be less than maxValue');
    });

    it('should throw NotFoundException when dashboard measurement does not exist', async () => {
      const id = 999;

      dashboardMeasurementRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateMeasurementWithDashboard(id, updateDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when group does not exist', async () => {
      const id = 1;
      const measurementId = 10;
      const updateDtoWithGroup: UpdateMeasurementWithDashboardDto = {
        ...updateDto,
        groupId: 999,
      };
      const existingDashboard = createMockDashboardMeasurement({
        id,
        measurementId,
      });

      dashboardMeasurementRepository.findOne.mockResolvedValue(
        existingDashboard
      );
      groupRepository.findOneOrFail.mockRejectedValue(
        new NotFoundException('Group not found')
      );

      await expect(
        service.updateMeasurementWithDashboard(id, updateDtoWithGroup)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAvailableDashboardMeasurements', () => {
    it('should return all dashboard measurements not deleted', async () => {
      const mockMeasurements = [
        createMockDashboardMeasurement({
          id: 1,
          groupId: null,
          measurement: createMockMeasurement({ id: 1 }),
        }),
        createMockDashboardMeasurement({
          id: 2,
          groupId: 5, // Ya tiene grupo asignado, pero se devuelve igual
          measurement: createMockMeasurement({ id: 2 }),
        }),
      ];

      dashboardMeasurementRepository.find.mockResolvedValue(mockMeasurements);

      const result = await service.getAvailableDashboardMeasurements();

      expect(result).toEqual(mockMeasurements);
      expect(dashboardMeasurementRepository.find).toHaveBeenCalledWith({
        where: { deletedAt: IsNull() },
        relations: ['measurement'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no measurements exist', async () => {
      dashboardMeasurementRepository.find.mockResolvedValue([]);

      const result = await service.getAvailableDashboardMeasurements();

      expect(result).toEqual([]);
      expect(dashboardMeasurementRepository.find).toHaveBeenCalled();
    });
  });
});
