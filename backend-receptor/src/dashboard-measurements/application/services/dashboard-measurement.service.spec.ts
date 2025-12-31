import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { DashboardMeasurementService } from './dashboard-measurement.service';
import { DashboardMeasurementRepository } from '../../domain/repositories/dashboard-measurement.repository';
import { DashboardMeasurementGroupRepository } from '../../domain/repositories/dashboard-measurement-group.repository';
import { MeasurementService } from '../../../measurements/application/services/measurement.service';
import {
  createMockDashboardMeasurement,
  createMockMeasurement,
  createMockDashboardMeasurementGroup,
} from '../../../test-helpers';
import type {
  CreateDashboardMeasurementDto,
  UpdateDashboardMeasurementDto,
} from '../dtos/dashboard-measurement.dto';

describe('DashboardMeasurementService', () => {
  let service: DashboardMeasurementService;
  let dashboardMeasurementRepository: jest.Mocked<DashboardMeasurementRepository>;
  let measurementService: jest.Mocked<MeasurementService>;
  let groupRepository: jest.Mocked<DashboardMeasurementGroupRepository>;

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
          },
        },
        {
          provide: DashboardMeasurementGroupRepository,
          useValue: {
            findOneOrFail: jest.fn(),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDashboardMeasurements', () => {
    it('should return all dashboard measurements when no groupId provided', async () => {
      const mockMeasurements = [
        createMockDashboardMeasurement({ id: 1 }),
        createMockDashboardMeasurement({ id: 2 }),
      ];

      dashboardMeasurementRepository.findAllWithMeasurements.mockResolvedValue(
        mockMeasurements
      );

      const result = await service.getAllDashboardMeasurements();

      expect(result).toEqual(mockMeasurements);
      expect(
        dashboardMeasurementRepository.findAllWithMeasurements
      ).toHaveBeenCalledTimes(1);
      expect(
        dashboardMeasurementRepository.findByGroupId
      ).not.toHaveBeenCalled();
    });

    it('should return dashboard measurements filtered by groupId', async () => {
      const groupId = 1;
      const mockMeasurements = [
        createMockDashboardMeasurement({ id: 1, groupId }),
        createMockDashboardMeasurement({ id: 2, groupId }),
      ];

      dashboardMeasurementRepository.findByGroupId.mockResolvedValue(
        mockMeasurements
      );

      const result = await service.getAllDashboardMeasurements(groupId);

      expect(result).toEqual(mockMeasurements);
      expect(dashboardMeasurementRepository.findByGroupId).toHaveBeenCalledWith(
        groupId
      );
      expect(
        dashboardMeasurementRepository.findAllWithMeasurements
      ).not.toHaveBeenCalled();
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
    it('should delete dashboard measurement successfully', async () => {
      const id = 1;
      const mockMeasurement = createMockDashboardMeasurement({ id });

      dashboardMeasurementRepository.findOne.mockResolvedValue(mockMeasurement);
      dashboardMeasurementRepository.softDelete.mockResolvedValue(undefined);

      await service.deleteDashboardMeasurement(id);

      expect(dashboardMeasurementRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['measurement'],
      });
      expect(dashboardMeasurementRepository.softDelete).toHaveBeenCalledWith(
        id
      );
    });

    it('should throw NotFoundException when dashboard measurement does not exist', async () => {
      const id = 999;

      dashboardMeasurementRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteDashboardMeasurement(id)).rejects.toThrow(
        NotFoundException
      );
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
