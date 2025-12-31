import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DashboardMeasurementGroupService } from './dashboard-measurement-group.service';
import { DashboardMeasurementGroupRepository } from '../../domain/repositories/dashboard-measurement-group.repository';
import { DashboardMeasurementRepository } from '../../domain/repositories/dashboard-measurement.repository';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardMeasurementGroupService,
        {
          provide: DashboardMeasurementGroupRepository,
          useValue: {
            findAllWithMeasurements: jest.fn(),
            findByIdWithMeasurements: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: DashboardMeasurementRepository,
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              execute: jest.fn(),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardMeasurementGroupService>(
      DashboardMeasurementGroupService
    );
    groupRepository = module.get(DashboardMeasurementGroupRepository);
    dashboardMeasurementRepository = module.get(DashboardMeasurementRepository);
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
          dashboardMeasurementId: 1,
        },
        {
          dashboardMeasurementId: 2,
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
      const mockDashboardMeasurements = [
        createMockDashboardMeasurement({
          id: 1,
          measurementId: 1,
          groupId: null,
          measurement: createMockMeasurement({ id: 1 }),
        }),
        createMockDashboardMeasurement({
          id: 2,
          measurementId: 2,
          groupId: null,
          measurement: createMockMeasurement({ id: 2 }),
        }),
      ];

      dashboardMeasurementRepository.findOne
        .mockResolvedValueOnce(mockDashboardMeasurements[0])
        .mockResolvedValueOnce(mockDashboardMeasurements[1]);
      groupRepository.create.mockReturnValue(mockGroup);
      groupRepository.save.mockResolvedValue(savedGroup);
      dashboardMeasurementRepository.save
        .mockResolvedValueOnce({
          ...mockDashboardMeasurements[0],
          groupId: savedGroup.id,
        })
        .mockResolvedValueOnce({
          ...mockDashboardMeasurements[1],
          groupId: savedGroup.id,
        });
      groupRepository.findByIdWithMeasurements.mockResolvedValue(savedGroup);

      const result = await service.createGroup(createDto);

      expect(result).toEqual(savedGroup);
      expect(dashboardMeasurementRepository.findOne).toHaveBeenCalledTimes(2);
      expect(groupRepository.save).toHaveBeenCalled();
      expect(dashboardMeasurementRepository.save).toHaveBeenCalledTimes(2);
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

    it('should throw BadRequestException when dashboard measurement not found', async () => {
      const invalidDto: CreateDashboardMeasurementGroupDto = {
        name: 'Test Group',
        dashboardMeasurements: [
          {
            dashboardMeasurementId: 999,
          },
        ],
      };

      dashboardMeasurementRepository.findOne.mockResolvedValue(null);

      await expect(service.createGroup(invalidDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.createGroup(invalidDto)).rejects.toThrow(
        'Dashboard measurements not found: 999'
      );
    });

    it('should create group with measurements that are already assigned to another group', async () => {
      const createDtoWithAssigned: CreateDashboardMeasurementGroupDto = {
        name: 'Test Group',
        dashboardMeasurements: [
          {
            dashboardMeasurementId: 1,
          },
        ],
      };
      const mockGroup = createMockDashboardMeasurementGroup({
        id: 1,
        name: createDtoWithAssigned.name,
      });
      const savedGroup = createMockDashboardMeasurementGroup({
        id: 1,
        name: createDtoWithAssigned.name,
      });
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id: 1,
        measurementId: 1,
        groupId: 5, // Ya está asignado a otro grupo
        measurement: createMockMeasurement({ id: 1 }),
      });

      dashboardMeasurementRepository.findOne.mockResolvedValue(
        mockDashboardMeasurement
      );
      groupRepository.create.mockReturnValue(mockGroup);
      groupRepository.save.mockResolvedValue(savedGroup);
      dashboardMeasurementRepository.save.mockResolvedValue({
        ...mockDashboardMeasurement,
        groupId: savedGroup.id, // Se actualiza al nuevo grupo
      });
      groupRepository.findByIdWithMeasurements.mockResolvedValue(savedGroup);

      const result = await service.createGroup(createDtoWithAssigned);

      expect(result).toEqual(savedGroup);
      expect(dashboardMeasurementRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ groupId: savedGroup.id })
      );
    });

    it('should throw error when save fails', async () => {
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id: 1,
        groupId: null,
        measurement: createMockMeasurement({ id: 1 }),
      });
      const mockGroup = createMockDashboardMeasurementGroup({ id: 1 });

      dashboardMeasurementRepository.findOne.mockResolvedValue(
        mockDashboardMeasurement
      );
      groupRepository.create.mockReturnValue(mockGroup);
      groupRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createGroup(createDto)).rejects.toThrow(
        'Database error'
      );
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

      groupRepository.findByIdWithMeasurements
        .mockResolvedValueOnce(existingGroup)
        .mockResolvedValueOnce(updatedGroup);
      groupRepository.save.mockResolvedValue(updatedGroup);

      const result = await service.updateGroup(id, updateDto);

      expect(result).toEqual(updatedGroup);
      expect(groupRepository.save).toHaveBeenCalled();
    });

    it('should update dashboard measurements successfully', async () => {
      const id = 1;
      const updateDtoWithMeasurements: UpdateDashboardMeasurementGroupDto = {
        dashboardMeasurements: [
          {
            dashboardMeasurementId: 3,
          },
        ],
      };
      const existingGroup = createMockDashboardMeasurementGroup({
        id,
        dashboardMeasurements: [
          createMockDashboardMeasurement({ id: 1, groupId: id }),
          createMockDashboardMeasurement({ id: 2, groupId: id }),
        ],
      });
      const newDashboardMeasurement = createMockDashboardMeasurement({
        id: 3,
        measurementId: 3,
        groupId: 10, // Ya está asignado a otro grupo
        measurement: createMockMeasurement({ id: 3 }),
      });
      const updatedGroup = createMockDashboardMeasurementGroup({ id });

      groupRepository.findByIdWithMeasurements
        .mockResolvedValueOnce(existingGroup)
        .mockResolvedValueOnce(updatedGroup);
      dashboardMeasurementRepository.findOne.mockResolvedValue(
        newDashboardMeasurement
      );
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 2 }),
      };
      dashboardMeasurementRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);
      dashboardMeasurementRepository.save.mockResolvedValue({
        ...newDashboardMeasurement,
        groupId: id,
      });
      groupRepository.save.mockResolvedValue(updatedGroup);

      const result = await service.updateGroup(id, updateDtoWithMeasurements);

      expect(result).toEqual(updatedGroup);
      expect(dashboardMeasurementRepository.save).toHaveBeenCalled();
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

    it('should throw BadRequestException when dashboard measurement not found in update', async () => {
      const id = 1;
      const invalidUpdateDto: UpdateDashboardMeasurementGroupDto = {
        dashboardMeasurements: [
          {
            dashboardMeasurementId: 999,
          },
        ],
      };
      const existingGroup = createMockDashboardMeasurementGroup({ id });

      groupRepository.findByIdWithMeasurements.mockResolvedValue(existingGroup);
      dashboardMeasurementRepository.findOne.mockResolvedValue(null);

      await expect(service.updateGroup(id, invalidUpdateDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.updateGroup(id, invalidUpdateDto)).rejects.toThrow(
        'Dashboard measurements not found: 999'
      );
    });

    it('should update group with measurements that are already assigned to another group', async () => {
      const id = 1;
      const updateDtoWithMeasurements: UpdateDashboardMeasurementGroupDto = {
        dashboardMeasurements: [
          {
            dashboardMeasurementId: 5,
          },
        ],
      };
      const existingGroup = createMockDashboardMeasurementGroup({
        id,
        dashboardMeasurements: [],
      });
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id: 5,
        groupId: 10, // Ya está asignado a otro grupo
        measurement: createMockMeasurement({ id: 1 }),
      });
      const updatedGroup = createMockDashboardMeasurementGroup({ id });

      groupRepository.findByIdWithMeasurements
        .mockResolvedValueOnce(existingGroup)
        .mockResolvedValueOnce(updatedGroup);
      dashboardMeasurementRepository.findOne.mockResolvedValue(
        mockDashboardMeasurement
      );
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };
      dashboardMeasurementRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);
      dashboardMeasurementRepository.save.mockResolvedValue({
        ...mockDashboardMeasurement,
        groupId: id,
      });
      groupRepository.save.mockResolvedValue(updatedGroup);

      const result = await service.updateGroup(id, updateDtoWithMeasurements);

      expect(result).toEqual(updatedGroup);
      expect(dashboardMeasurementRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ groupId: id })
      );
    });

    it('should throw error when save fails', async () => {
      const id = 1;
      const existingGroup = createMockDashboardMeasurementGroup({ id });

      groupRepository.findByIdWithMeasurements.mockResolvedValue(existingGroup);
      groupRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.updateGroup(id, updateDto)).rejects.toThrow(
        'Database error'
      );
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
