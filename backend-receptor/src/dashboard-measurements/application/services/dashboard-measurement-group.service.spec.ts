import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, type QueryRunner } from 'typeorm';
import { DashboardMeasurementGroupService } from './dashboard-measurement-group.service';
import { DashboardMeasurementGroupRepository } from '../../domain/repositories/dashboard-measurement-group.repository';
import { DashboardMeasurementRepository } from '../../domain/repositories/dashboard-measurement.repository';
import { MeasurementService } from '../../../measurements/application/services/measurement.service';
import {
  createMockDashboardMeasurementGroup,
  createMockDashboardMeasurement,
  createMockMeasurement,
} from '../../../test-helpers';
import type {
  CreateDashboardMeasurementGroupDto,
  UpdateDashboardMeasurementGroupDto,
} from '../dtos/dashboard-measurement-group.dto';

describe('DashboardMeasurementGroupService', () => {
  let service: DashboardMeasurementGroupService;
  let groupRepository: jest.Mocked<DashboardMeasurementGroupRepository>;
  let dashboardMeasurementRepository: jest.Mocked<DashboardMeasurementRepository>;
  let measurementService: jest.Mocked<MeasurementService>;
  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: jest.Mocked<QueryRunner>;

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        save: jest.fn(),
        remove: jest.fn(),
      },
    } as unknown as jest.Mocked<QueryRunner>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardMeasurementGroupService,
        {
          provide: DashboardMeasurementGroupRepository,
          useValue: {
            findAllWithMeasurements: jest.fn(),
            findByIdWithMeasurements: jest.fn(),
            create: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: DashboardMeasurementRepository,
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: MeasurementService,
          useValue: {
            getMeasurementById: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardMeasurementGroupService>(
      DashboardMeasurementGroupService
    );
    groupRepository = module.get(DashboardMeasurementGroupRepository);
    dashboardMeasurementRepository = module.get(DashboardMeasurementRepository);
    measurementService = module.get(MeasurementService);
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllGroups', () => {
    it('should return all groups with measurements', async () => {
      const mockGroups = [
        createMockDashboardMeasurementGroup({ id: 1 }),
        createMockDashboardMeasurementGroup({ id: 2 }),
      ];

      groupRepository.findAllWithMeasurements.mockResolvedValue(mockGroups);

      const result = await service.getAllGroups();

      expect(result).toEqual(mockGroups);
      expect(groupRepository.findAllWithMeasurements).toHaveBeenCalledTimes(1);
    });
  });

  describe('getGroupById', () => {
    it('should return group when found', async () => {
      const id = 1;
      const mockGroup = createMockDashboardMeasurementGroup({ id });

      groupRepository.findByIdWithMeasurements.mockResolvedValue(mockGroup);

      const result = await service.getGroupById(id);

      expect(result).toEqual(mockGroup);
      expect(groupRepository.findByIdWithMeasurements).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when group not found', async () => {
      const id = 999;

      groupRepository.findByIdWithMeasurements.mockResolvedValue(null);

      await expect(service.getGroupById(id)).rejects.toThrow(NotFoundException);
      await expect(service.getGroupById(id)).rejects.toThrow(
        `Dashboard measurement group with ID ${id} not found`
      );
    });
  });

  describe('createGroup', () => {
    const createDto: CreateDashboardMeasurementGroupDto = {
      name: 'Test Group',
      dashboardMeasurements: [
        {
          measurementId: 1,
          minValue: 0,
          maxValue: 100,
        },
        {
          measurementId: 2,
          minValue: 10,
          maxValue: 90,
        },
      ],
    };

    it('should create group with measurements successfully', async () => {
      const mockGroup = createMockDashboardMeasurementGroup({
        id: 1,
        name: createDto.name,
      });
      const savedGroup = createMockDashboardMeasurementGroup({
        id: 1,
        name: createDto.name,
      });
      const mockMeasurements = [
        createMockMeasurement({ id: 1 }),
        createMockMeasurement({ id: 2 }),
      ];
      const mockDashboardMeasurements = [
        createMockDashboardMeasurement({
          id: 1,
          measurementId: 1,
          groupId: 1,
        }),
        createMockDashboardMeasurement({
          id: 2,
          measurementId: 2,
          groupId: 1,
        }),
      ];

      measurementService.getMeasurementById
        .mockResolvedValueOnce(mockMeasurements[0])
        .mockResolvedValueOnce(mockMeasurements[1]);
      groupRepository.create.mockReturnValue(mockGroup);
      queryRunner.manager.save
        .mockResolvedValueOnce(savedGroup)
        .mockResolvedValueOnce(mockDashboardMeasurements);
      groupRepository.findByIdWithMeasurements.mockResolvedValue(savedGroup);

      const result = await service.createGroup(createDto);

      expect(result).toEqual(savedGroup);
      expect(measurementService.getMeasurementById).toHaveBeenCalledTimes(2);
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException when dashboardMeasurements array is empty', async () => {
      const invalidDto: CreateDashboardMeasurementGroupDto = {
        name: 'Test Group',
        dashboardMeasurements: [],
      };

      await expect(service.createGroup(invalidDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.createGroup(invalidDto)).rejects.toThrow(
        'At least one dashboard measurement is required'
      );
    });

    it('should throw BadRequestException when minValue >= maxValue', async () => {
      const invalidDto: CreateDashboardMeasurementGroupDto = {
        name: 'Test Group',
        dashboardMeasurements: [
          {
            measurementId: 1,
            minValue: 100,
            maxValue: 50,
          },
        ],
      };
      const mockMeasurement = createMockMeasurement({ id: 1 });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);

      await expect(service.createGroup(invalidDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.createGroup(invalidDto)).rejects.toThrow(
        'minValue must be less than maxValue for measurement 1'
      );
    });

    it('should rollback transaction on error', async () => {
      const mockMeasurement = createMockMeasurement({ id: 1 });
      const mockGroup = createMockDashboardMeasurementGroup({ id: 1 });

      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);
      groupRepository.create.mockReturnValue(mockGroup);
      queryRunner.manager.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createGroup(createDto)).rejects.toThrow(
        'Database error'
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('updateGroup', () => {
    const updateDto: UpdateDashboardMeasurementGroupDto = {
      name: 'Updated Group',
    };

    it('should update group name successfully', async () => {
      const id = 1;
      const existingGroup = createMockDashboardMeasurementGroup({
        id,
        name: 'Original Group',
      });
      const updatedGroup = createMockDashboardMeasurementGroup({
        id,
        name: updateDto.name,
      });

      groupRepository.findByIdWithMeasurements.mockResolvedValue(existingGroup);
      queryRunner.manager.save.mockResolvedValue(updatedGroup);
      groupRepository.findByIdWithMeasurements.mockResolvedValueOnce(
        existingGroup
      );
      groupRepository.findByIdWithMeasurements.mockResolvedValueOnce(
        updatedGroup
      );

      const result = await service.updateGroup(id, updateDto);

      expect(result).toEqual(updatedGroup);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should update dashboard measurements successfully', async () => {
      const id = 1;
      const updateDtoWithMeasurements: UpdateDashboardMeasurementGroupDto = {
        dashboardMeasurements: [
          {
            measurementId: 3,
            minValue: 20,
            maxValue: 80,
          },
        ],
      };
      const existingGroup = createMockDashboardMeasurementGroup({ id });
      const existingMeasurements = [
        createMockDashboardMeasurement({ id: 1, groupId: id }),
        createMockDashboardMeasurement({ id: 2, groupId: id }),
      ];
      const mockMeasurement = createMockMeasurement({ id: 3 });
      const newDashboardMeasurements = [
        createMockDashboardMeasurement({
          id: 3,
          measurementId: 3,
          groupId: id,
        }),
      ];
      const updatedGroup = createMockDashboardMeasurementGroup({ id });

      groupRepository.findByIdWithMeasurements.mockResolvedValueOnce(
        existingGroup
      );
      dashboardMeasurementRepository.find.mockResolvedValue(
        existingMeasurements
      );
      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);
      dashboardMeasurementRepository.create.mockReturnValue(
        newDashboardMeasurements[0]
      );
      queryRunner.manager.save
        .mockResolvedValueOnce(updatedGroup)
        .mockResolvedValueOnce(newDashboardMeasurements);
      queryRunner.manager.remove.mockResolvedValue(undefined);
      groupRepository.findByIdWithMeasurements.mockResolvedValueOnce(
        updatedGroup
      );

      const result = await service.updateGroup(id, updateDtoWithMeasurements);

      expect(result).toEqual(updatedGroup);
      expect(queryRunner.manager.remove).toHaveBeenCalledWith(
        existingMeasurements
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when dashboardMeasurements array is empty', async () => {
      const id = 1;
      const invalidUpdateDto: UpdateDashboardMeasurementGroupDto = {
        dashboardMeasurements: [],
      };
      const existingGroup = createMockDashboardMeasurementGroup({ id });

      groupRepository.findByIdWithMeasurements.mockResolvedValue(existingGroup);

      await expect(service.updateGroup(id, invalidUpdateDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.updateGroup(id, invalidUpdateDto)).rejects.toThrow(
        'At least one dashboard measurement is required'
      );
    });

    it('should throw BadRequestException when minValue >= maxValue in update', async () => {
      const id = 1;
      const invalidUpdateDto: UpdateDashboardMeasurementGroupDto = {
        dashboardMeasurements: [
          {
            measurementId: 1,
            minValue: 100,
            maxValue: 50,
          },
        ],
      };
      const existingGroup = createMockDashboardMeasurementGroup({ id });
      const existingMeasurements: never[] = [];
      const mockMeasurement = createMockMeasurement({ id: 1 });

      groupRepository.findByIdWithMeasurements.mockResolvedValue(existingGroup);
      dashboardMeasurementRepository.find.mockResolvedValue(
        existingMeasurements
      );
      measurementService.getMeasurementById.mockResolvedValue(mockMeasurement);

      await expect(service.updateGroup(id, invalidUpdateDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.updateGroup(id, invalidUpdateDto)).rejects.toThrow(
        'minValue must be less than maxValue for measurement 1'
      );
    });

    it('should rollback transaction on error', async () => {
      const id = 1;
      const existingGroup = createMockDashboardMeasurementGroup({ id });

      groupRepository.findByIdWithMeasurements.mockResolvedValue(existingGroup);
      queryRunner.manager.save.mockRejectedValue(new Error('Database error'));

      await expect(service.updateGroup(id, updateDto)).rejects.toThrow(
        'Database error'
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('deleteGroup', () => {
    it('should delete group successfully', async () => {
      const id = 1;
      const mockGroup = createMockDashboardMeasurementGroup({ id });

      groupRepository.findByIdWithMeasurements.mockResolvedValue(mockGroup);
      groupRepository.softDelete.mockResolvedValue(undefined);

      await service.deleteGroup(id);

      expect(groupRepository.findByIdWithMeasurements).toHaveBeenCalledWith(id);
      expect(groupRepository.softDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when group does not exist', async () => {
      const id = 999;

      groupRepository.findByIdWithMeasurements.mockResolvedValue(null);

      await expect(service.deleteGroup(id)).rejects.toThrow(NotFoundException);
    });
  });
});
