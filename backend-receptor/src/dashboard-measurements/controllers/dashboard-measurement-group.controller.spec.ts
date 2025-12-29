import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DashboardMeasurementGroupController } from './dashboard-measurement-group.controller';
import { DashboardMeasurementGroupService } from '../application/services/dashboard-measurement-group.service';
import { createMockDashboardMeasurementGroup } from '../../test-helpers';

const mockJwtAuthGuard = {
  canActivate: jest.fn(() => true),
};

const mockPermissionGuard = {
  canActivate: jest.fn(() => true),
};

describe('DashboardMeasurementGroupController', () => {
  let controller: DashboardMeasurementGroupController;
  let service: jest.Mocked<DashboardMeasurementGroupService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardMeasurementGroupController],
      providers: [
        {
          provide: DashboardMeasurementGroupService,
          useValue: {
            getAllGroups: jest.fn(),
            getGroupById: jest.fn(),
            createGroup: jest.fn(),
            updateGroup: jest.fn(),
            deleteGroup: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(mockJwtAuthGuard.constructor as any)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(mockPermissionGuard.constructor as any)
      .useValue(mockPermissionGuard)
      .compile();

    controller = module.get<DashboardMeasurementGroupController>(
      DashboardMeasurementGroupController
    );
    service = module.get(DashboardMeasurementGroupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllGroups', () => {
    it('should return list of groups', async () => {
      const mockGroups = [
        createMockDashboardMeasurementGroup({ id: 1 }),
        createMockDashboardMeasurementGroup({ id: 2 }),
      ];
      service.getAllGroups.mockResolvedValue(mockGroups);

      const result = await controller.getAllGroups();

      expect(result.message).toBe(
        'Dashboard measurement groups retrieved successfully'
      );
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(service.getAllGroups).toHaveBeenCalled();
    });
  });

  describe('getGroupById', () => {
    it('should return group when exists', async () => {
      const id = 1;
      const mockGroup = createMockDashboardMeasurementGroup({ id });
      service.getGroupById.mockResolvedValue(mockGroup);

      const result = await controller.getGroupById(id);

      expect(result.message).toBe(
        'Dashboard measurement group retrieved successfully'
      );
      expect(result.data).toEqual(mockGroup);
      expect(service.getGroupById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when group does not exist', async () => {
      const id = 999;
      service.getGroupById.mockRejectedValue(
        new NotFoundException(
          `Dashboard measurement group with ID ${id} not found`
        )
      );

      await expect(controller.getGroupById(id)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('createGroup', () => {
    it('should create group successfully', async () => {
      const createDto = {
        name: 'Test Group',
        dashboardMeasurements: [
          {
            measurementId: 1,
            minValue: 0,
            maxValue: 100,
          },
        ],
      };
      const mockGroup = createMockDashboardMeasurementGroup({
        id: 1,
        name: createDto.name,
      });
      service.createGroup.mockResolvedValue(mockGroup);

      const result = await controller.createGroup(createDto);

      expect(result.message).toBe(
        'Dashboard measurement group created successfully'
      );
      expect(result.data).toEqual(mockGroup);
      expect(service.createGroup).toHaveBeenCalledWith(createDto);
    });

    it('should throw BadRequestException when dashboardMeasurements is empty', async () => {
      const invalidDto = {
        name: 'Test Group',
        dashboardMeasurements: [],
      };
      service.createGroup.mockRejectedValue(
        new BadRequestException(
          'At least one dashboard measurement is required'
        )
      );

      await expect(controller.createGroup(invalidDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('updateGroup', () => {
    it('should update group successfully', async () => {
      const id = 1;
      const updateDto = {
        name: 'Updated Group',
      };
      const mockGroup = createMockDashboardMeasurementGroup({
        id,
        name: updateDto.name,
      });
      service.updateGroup.mockResolvedValue(mockGroup);

      const result = await controller.updateGroup(id, updateDto);

      expect(result.message).toBe(
        'Dashboard measurement group updated successfully'
      );
      expect(result.data).toEqual(mockGroup);
      expect(service.updateGroup).toHaveBeenCalledWith(id, updateDto);
    });

    it('should throw NotFoundException when group does not exist', async () => {
      const id = 999;
      const updateDto = {
        name: 'Updated Group',
      };
      service.updateGroup.mockRejectedValue(
        new NotFoundException(
          `Dashboard measurement group with ID ${id} not found`
        )
      );

      await expect(controller.updateGroup(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteGroup', () => {
    it('should delete group successfully', async () => {
      const id = 1;
      service.deleteGroup.mockResolvedValue(undefined);

      await controller.deleteGroup(id);

      expect(service.deleteGroup).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when group does not exist', async () => {
      const id = 999;
      service.deleteGroup.mockRejectedValue(
        new NotFoundException(
          `Dashboard measurement group with ID ${id} not found`
        )
      );

      await expect(controller.deleteGroup(id)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
