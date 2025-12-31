import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from '../application/services/role.service';
import { createMockRole } from '../../test-helpers';
import type {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
} from '../application/dtos/role.dto';
import type { Permission } from '../../domain/entities/permission.entity';

const mockJwtAuthGuard = {
  canActivate: jest.fn(() => true),
};

const mockPermissionGuard = {
  canActivate: jest.fn(() => true),
};

describe('RoleController', () => {
  let controller: RoleController;
  let service: jest.Mocked<RoleService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            restore: jest.fn(),
            assignPermissions: jest.fn(),
            removePermissions: jest.fn(),
            getPermissionsByRoleId: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(
        mockJwtAuthGuard.constructor as unknown as new () => unknown
      )
      .useValue(mockJwtAuthGuard)
      .overrideGuard(
        mockPermissionGuard.constructor as unknown as new () => unknown
      )
      .useValue(mockPermissionGuard)
      .compile();

    controller = module.get<RoleController>(RoleController);
    service = module.get(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create role successfully', async () => {
      const createDto: CreateRoleDto = {
        name: 'Test Role',
        description: 'Test Description',
      };
      const mockRole = createMockRole({ id: 1, ...createDto });

      service.create.mockResolvedValue(mockRole);

      const result = await controller.create(createDto);

      expect(result.message).toBe('Role created successfully');
      expect(result.data.id).toBe(1);
      expect(result.data.name).toBe(createDto.name);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when role name already exists', async () => {
      const createDto: CreateRoleDto = {
        name: 'Existing Role',
      };

      service.create.mockRejectedValue(
        new ConflictException(
          `Role with name '${createDto.name}' already exists`
        )
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('findAll', () => {
    it('should return list of roles', async () => {
      const mockRoles = [createMockRole({ id: 1 }), createMockRole({ id: 2 })];

      service.findAll.mockResolvedValue({
        data: mockRoles,
        total: 2,
      });

      const result = await controller.findAll();

      expect(result.message).toBe('Roles retrieved successfully');
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.pagination).toBeDefined();
    });

    it('should apply filters when provided', async () => {
      const name = 'Test';
      const limit = 20;
      const offset = 10;

      service.findAll.mockResolvedValue({
        data: [],
        total: 0,
      });

      await controller.findAll(name, limit, offset, false);

      expect(service.findAll).toHaveBeenCalledWith({
        name,
        limit,
        offset,
      });
    });
  });

  describe('findOne', () => {
    it('should return role when exists', async () => {
      const id = 1;
      const mockRole = createMockRole({ id });

      service.findById.mockResolvedValue(mockRole);

      const result = await controller.findOne(id);

      expect(result.message).toBe('Role retrieved successfully');
      expect(result.data.id).toBe(id);
      expect(service.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      const id = 999;

      service.findById.mockRejectedValue(
        new NotFoundException(`Role with ID ${id} not found`)
      );

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update role successfully', async () => {
      const id = 1;
      const updateDto: UpdateRoleDto = {
        name: 'Updated Role',
      };
      const mockRole = createMockRole({ id, ...updateDto });

      service.update.mockResolvedValue(mockRole);

      const result = await controller.update(id, updateDto);

      expect(result.message).toBe('Role updated successfully');
      expect(result.data.name).toBe(updateDto.name);
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete role successfully', async () => {
      const id = 1;

      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id);

      expect(result.message).toBe('Role deleted successfully');
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('restore', () => {
    it('should restore role successfully', async () => {
      const id = 1;
      const mockRole = createMockRole({ id });

      service.restore.mockResolvedValue(mockRole);

      const result = await controller.restore(id);

      expect(result.message).toBe('Role restored successfully');
      expect(result.data.id).toBe(id);
      expect(service.restore).toHaveBeenCalledWith(id);
    });
  });

  describe('assignPermissions', () => {
    it('should assign permissions to role successfully', async () => {
      const id = 1;
      const assignDto: AssignPermissionsDto = {
        permissionIds: [1, 2],
      };
      const mockRole = createMockRole({ id });

      service.assignPermissions.mockResolvedValue(mockRole);

      const result = await controller.assignPermissions(id, assignDto);

      expect(result.message).toBe('Permissions assigned to role successfully');
      expect(result.data.id).toBe(id);
      expect(service.assignPermissions).toHaveBeenCalledWith(
        id,
        assignDto.permissionIds
      );
    });
  });

  describe('removePermissions', () => {
    it('should remove permissions from role successfully', async () => {
      const id = 1;
      const assignDto: AssignPermissionsDto = {
        permissionIds: [1, 2],
      };
      const mockRole = createMockRole({ id });

      service.removePermissions.mockResolvedValue(mockRole);

      const result = await controller.removePermissions(id, assignDto);

      expect(result.message).toBe('Permissions removed from role successfully');
      expect(result.data.id).toBe(id);
      expect(service.removePermissions).toHaveBeenCalledWith(
        id,
        assignDto.permissionIds
      );
    });
  });

  describe('getPermissions', () => {
    it('should return permissions for role', async () => {
      const id = 1;
      const mockPermissions: Permission[] = [
        {
          id: 1,
          module: 'areas',
          action: 'read',
        } as Permission,
      ];

      service.getPermissionsByRoleId.mockResolvedValue(mockPermissions);

      const result = await controller.getPermissions(id);

      expect(result.message).toBe('Role permissions retrieved successfully');
      expect(result.data).toHaveLength(1);
      expect(service.getPermissionsByRoleId).toHaveBeenCalledWith(id);
    });
  });
});
