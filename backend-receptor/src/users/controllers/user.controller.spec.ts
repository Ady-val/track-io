import { Test, type TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from '../application/services/user.service';
import { createMockUser } from '../../test-helpers';
import type { Role } from '../../../permissions/domain/entities/role.entity';

const mockJwtAuthGuard = {
  canActivate: jest.fn(() => true),
};

const mockPermissionGuard = {
  canActivate: jest.fn(() => true),
};

describe('UserController', () => {
  let controller: UserController;
  let service: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            restore: jest.fn(),
            getCount: jest.fn(),
            assignRole: jest.fn(),
            removeRole: jest.fn(),
            getUserRoles: jest.fn(),
            getUserPermissions: jest.fn(),
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

    controller = module.get<UserController>(UserController);
    service = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      const createDto = {
        name: 'Test User',
        username: 'testuser',
        password: 'password123',
      };
      const mockUser = createMockUser({ id: 1, ...createDto });

      service.create.mockResolvedValue(mockUser);

      const result = await controller.create(createDto);

      expect(result.message).toBe('User created successfully');
      expect(result.data.id).toBe(1);
      expect(result.data.username).toBe(createDto.username);
      expect(result.data.password).toBeUndefined();
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when username already exists', async () => {
      const createDto = {
        name: 'Test User',
        username: 'existinguser',
        password: 'password123',
      };

      service.create.mockRejectedValue(
        new ConflictException(
          `User with username '${createDto.username}' already exists`
        )
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('findAll', () => {
    it('should return list of users', async () => {
      const mockUsers = [createMockUser({ id: 1 }), createMockUser({ id: 2 })];

      service.findAll.mockResolvedValue({
        data: mockUsers,
        total: 2,
      });

      const result = await controller.findAll();

      expect(result.message).toBe('Users retrieved successfully');
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.pagination).toBeDefined();
    });

    it('should apply filters when provided', async () => {
      const name = 'Test';
      const username = 'testuser';
      const limit = 20;
      const offset = 10;

      service.findAll.mockResolvedValue({
        data: [],
        total: 0,
      });

      await controller.findAll(name, username, limit, offset, false);

      expect(service.findAll).toHaveBeenCalledWith({
        name,
        username,
        limit,
        offset,
      });
    });
  });

  describe('getCount', () => {
    it('should return user count', async () => {
      const count = 10;

      service.getCount.mockResolvedValue(count);

      const result = await controller.getCount();

      expect(result.message).toBe('Users count retrieved successfully');
      expect(result.count).toBe(count);
    });
  });

  describe('findOne', () => {
    it('should return user when exists', async () => {
      const id = 1;
      const mockUser = createMockUser({ id });

      service.findById.mockResolvedValue(mockUser);

      const result = await controller.findOne(id);

      expect(result.message).toBe('User retrieved successfully');
      expect(result.data.id).toBe(id);
      expect(result.data.password).toBeUndefined();
      expect(service.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const id = 999;

      service.findById.mockRejectedValue(
        new NotFoundException(`User with ID ${id} not found`)
      );

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const id = 1;
      const updateDto = {
        name: 'Updated Name',
      };
      const mockUser = createMockUser({ id, ...updateDto });

      service.update.mockResolvedValue(mockUser);

      const result = await controller.update(id, updateDto);

      expect(result.message).toBe('User updated successfully');
      expect(result.data.name).toBe(updateDto.name);
      expect(result.data.password).toBeUndefined();
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should throw ForbiddenException when trying to change ADMIN username', async () => {
      const id = 1;
      const updateDto = {
        username: 'newusername',
      };

      service.update.mockRejectedValue(
        new ForbiddenException('Cannot change username of ADMIN user')
      );

      await expect(controller.update(id, updateDto)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      const id = 1;

      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id);

      expect(result.message).toBe('User deleted successfully');
      expect(service.remove).toHaveBeenCalledWith(id);
    });

    it('should throw ForbiddenException when trying to delete ADMIN user', async () => {
      const id = 1;

      service.remove.mockRejectedValue(
        new ForbiddenException('Cannot delete ADMIN user')
      );

      await expect(controller.remove(id)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assignRole', () => {
    it('should assign role to user successfully', async () => {
      const userId = 1;
      const roleId = 2;
      const mockUser = createMockUser({ id: userId });

      service.assignRole.mockResolvedValue(mockUser);

      const result = await controller.assignRole(userId, { roleId });

      expect(result.message).toBe('Role assigned to user successfully');
      expect(result.data.id).toBe(userId);
      expect(service.assignRole).toHaveBeenCalledWith(userId, roleId);
    });
  });

  describe('removeRole', () => {
    it('should remove role from user successfully', async () => {
      const userId = 1;
      const roleId = 2;
      const mockUser = createMockUser({ id: userId });

      service.removeRole.mockResolvedValue(mockUser);

      const result = await controller.removeRole(userId, roleId);

      expect(result.message).toBe('Role removed from user successfully');
      expect(result.data.id).toBe(userId);
      expect(service.removeRole).toHaveBeenCalledWith(userId, roleId);
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles', async () => {
      const id = 1;
      const mockRoles: Role[] = [
        { id: 1, name: 'Role 1' } as Role,
        { id: 2, name: 'Role 2' } as Role,
      ];

      service.getUserRoles.mockResolvedValue(mockRoles);

      const result = await controller.getUserRoles(id);

      expect(result.message).toBe('User roles retrieved successfully');
      expect(result.data).toHaveLength(2);
      expect(service.getUserRoles).toHaveBeenCalledWith(id);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      const id = 1;
      const mockPermissions: Array<{
        id: number;
        module: string;
        action: string;
        description?: string;
      }> = [
        {
          id: 1,
          module: 'areas',
          action: 'read',
          description: 'Read areas',
        },
      ];

      service.getUserPermissions.mockResolvedValue(mockPermissions);

      const result = await controller.getUserPermissions(id);

      expect(result.message).toBe('User permissions retrieved successfully');
      expect(result.data).toHaveLength(1);
      expect(service.getUserPermissions).toHaveBeenCalledWith(id);
    });
  });

  describe('restore', () => {
    it('should restore user successfully', async () => {
      const id = 1;
      const mockUser = createMockUser({ id });

      service.restore.mockResolvedValue(mockUser);

      const result = await controller.restore(id);

      expect(result.message).toBe('User restored successfully');
      expect(result.data.id).toBe(id);
      expect(service.restore).toHaveBeenCalledWith(id);
    });
  });
});
