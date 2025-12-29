import { Test, type TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PermissionService } from '../../../permissions/application/services/permission.service';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../../permissions/domain/entities/role.entity';
import type { Permission } from '../../../permissions/domain/entities/permission.entity';
import { createMockUser } from '../../../test-helpers';
import { ADMIN_USERNAME } from '../../../permissions/constants/permissions.constants';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  let userTypeOrmRepository: jest.Mocked<Repository<User>>;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let permissionService: jest.Mocked<PermissionService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findByUsername: jest.fn(),
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByIdWithRoles: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: PermissionService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
    userTypeOrmRepository = module.get(getRepositoryToken(User));
    roleRepository = module.get(getRepositoryToken(Role));
    permissionService = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'Test User',
      username: 'testuser',
      password: 'password123',
    };

    it('should create user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockUser = createMockUser({
        id: 1,
        ...createDto,
        password: hashedPassword,
      });

      userRepository.findByUsername.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      userRepository.create.mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(result).toEqual(mockUser);
      expect(userRepository.findByUsername).toHaveBeenCalledWith(
        createDto.username
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(createDto.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...createDto,
        password: hashedPassword,
      });
    });

    it('should throw ConflictException when username already exists', async () => {
      const existingUser = createMockUser({ username: createDto.username });

      userRepository.findByUsername.mockResolvedValue(existingUser);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.create(createDto)).rejects.toThrow(
        `User with username '${createDto.username}' already exists`
      );
    });
  });

  describe('findAll', () => {
    it('should return all users with filters', async () => {
      const filters = { limit: 10, offset: 0 };
      const mockUsers = [createMockUser({ id: 1 }), createMockUser({ id: 2 })];

      userRepository.findAll.mockResolvedValue({
        data: mockUsers,
        total: 2,
      });

      const result = await service.findAll(filters);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(userRepository.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const id = 1;
      const mockUser = createMockUser({ id });

      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById(id);

      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when user not found', async () => {
      const id = 999;

      userRepository.findById.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
      await expect(service.findById(id)).rejects.toThrow(
        `User with ID ${id} not found`
      );
    });
  });

  describe('findByUsername', () => {
    it('should return user when found', async () => {
      const username = 'testuser';
      const mockUser = createMockUser({ username });

      userRepository.findByUsername.mockResolvedValue(mockUser);

      const result = await service.findByUsername(username);

      expect(result).toEqual(mockUser);
      expect(userRepository.findByUsername).toHaveBeenCalledWith(username);
    });

    it('should throw NotFoundException when user not found', async () => {
      const username = 'nonexistent';

      userRepository.findByUsername.mockResolvedValue(null);

      await expect(service.findByUsername(username)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findByUsername(username)).rejects.toThrow(
        `User with username '${username}' not found`
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Name',
    };

    it('should update user successfully', async () => {
      const id = 1;
      const existingUser = createMockUser({ id });
      const updatedUser = createMockUser({ id, ...updateDto });

      userRepository.findById.mockResolvedValue(existingUser);
      userRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update(id, updateDto);

      expect(result).toEqual(updatedUser);
      expect(userRepository.findById).toHaveBeenCalledWith(id);
      expect(userRepository.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should hash password when provided', async () => {
      const id = 1;
      const updateDtoWithPassword = {
        password: 'newPassword123',
      };
      const hashedPassword = 'hashedNewPassword123';
      const existingUser = createMockUser({ id });
      const updatedUser = createMockUser({ id, password: hashedPassword });

      userRepository.findById.mockResolvedValue(existingUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      userRepository.update.mockResolvedValue(updatedUser);

      await service.update(id, updateDtoWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        updateDtoWithPassword.password,
        10
      );
      expect(userRepository.update).toHaveBeenCalledWith(id, {
        password: hashedPassword,
      });
    });

    it('should throw ForbiddenException when trying to change ADMIN username', async () => {
      const id = 1;
      const adminUser = createMockUser({ id, username: ADMIN_USERNAME });
      const updateDtoWithUsername = {
        username: 'newusername',
      };

      userRepository.findById.mockResolvedValue(adminUser);

      await expect(service.update(id, updateDtoWithUsername)).rejects.toThrow(
        ForbiddenException
      );
      await expect(service.update(id, updateDtoWithUsername)).rejects.toThrow(
        'Cannot change username of ADMIN user'
      );
    });

    it('should throw ConflictException when new username already exists', async () => {
      const id = 1;
      const existingUser = createMockUser({ id });
      const otherUser = createMockUser({ id: 2, username: 'existinguser' });
      const updateDtoWithUsername = {
        username: 'existinguser',
      };

      userRepository.findById.mockResolvedValue(existingUser);
      userRepository.findByUsername.mockResolvedValue(otherUser);

      await expect(service.update(id, updateDtoWithUsername)).rejects.toThrow(
        ConflictException
      );
      await expect(service.update(id, updateDtoWithUsername)).rejects.toThrow(
        `User with username '${updateDtoWithUsername.username}' already exists`
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const id = 999;

      userRepository.findById.mockResolvedValue(null);

      await expect(service.update(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should soft delete user successfully', async () => {
      const id = 1;
      const mockUser = createMockUser({ id });

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.softDelete.mockResolvedValue(true);

      await service.remove(id);

      expect(userRepository.findById).toHaveBeenCalledWith(id);
      expect(userRepository.softDelete).toHaveBeenCalledWith(id);
    });

    it('should throw ForbiddenException when trying to delete ADMIN user', async () => {
      const id = 1;
      const adminUser = createMockUser({ id, username: ADMIN_USERNAME });

      userRepository.findById.mockResolvedValue(adminUser);

      await expect(service.remove(id)).rejects.toThrow(ForbiddenException);
      await expect(service.remove(id)).rejects.toThrow(
        'Cannot delete ADMIN user'
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const id = 999;

      userRepository.findById.mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('should restore user successfully', async () => {
      const id = 1;
      const mockUser = createMockUser({ id });

      userRepository.restore.mockResolvedValue(true);
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.restore(id);

      expect(result).toEqual(mockUser);
      expect(userRepository.restore).toHaveBeenCalledWith(id);
      expect(userRepository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when user cannot be restored', async () => {
      const id = 999;

      userRepository.restore.mockResolvedValue(false);

      await expect(service.restore(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCount', () => {
    it('should return user count', async () => {
      const count = 10;

      userRepository.count.mockResolvedValue(count);

      const result = await service.getCount();

      expect(result).toBe(count);
      expect(userRepository.count).toHaveBeenCalled();
    });
  });

  describe('validatePassword', () => {
    it('should return true when password matches', async () => {
      const plainPassword = 'password123';
      const hashedPassword = 'hashedPassword123';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validatePassword(
        plainPassword,
        hashedPassword
      );

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        plainPassword,
        hashedPassword
      );
    });

    it('should return false when password does not match', async () => {
      const plainPassword = 'wrongpassword';
      const hashedPassword = 'hashedPassword123';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validatePassword(
        plainPassword,
        hashedPassword
      );

      expect(result).toBe(false);
    });
  });

  describe('assignRole', () => {
    it('should assign role to user successfully', async () => {
      const userId = 1;
      const roleId = 2;
      const mockUser = createMockUser({ id: userId, roles: [] });
      const mockRole = { id: roleId, name: 'Test Role' } as Role;
      const updatedUser = createMockUser({
        id: userId,
        roles: [mockRole],
      });

      userRepository.findByIdWithRoles.mockResolvedValue(mockUser);
      roleRepository.findOne.mockResolvedValue(mockRole);
      userTypeOrmRepository.save.mockResolvedValue(updatedUser);
      userRepository.findByIdWithRoles.mockResolvedValueOnce(mockUser);
      userRepository.findByIdWithRoles.mockResolvedValueOnce(updatedUser);

      const result = await service.assignRole(userId, roleId);

      expect(result).toEqual(updatedUser);
      expect(userRepository.findByIdWithRoles).toHaveBeenCalledWith(userId);
      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: roleId },
        withDeleted: false,
      });
      expect(userTypeOrmRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when role is already assigned', async () => {
      const userId = 1;
      const roleId = 2;
      const mockRole = { id: roleId, name: 'Test Role' } as Role;
      const mockUser = createMockUser({
        id: userId,
        roles: [mockRole],
      });

      userRepository.findByIdWithRoles.mockResolvedValue(mockUser);
      roleRepository.findOne.mockResolvedValue(mockRole);

      await expect(service.assignRole(userId, roleId)).rejects.toThrow(
        ConflictException
      );
      await expect(service.assignRole(userId, roleId)).rejects.toThrow(
        `Role ${roleId} is already assigned to user ${userId}`
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const userId = 999;
      const roleId = 1;

      userRepository.findByIdWithRoles.mockResolvedValue(null);

      await expect(service.assignRole(userId, roleId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException when role does not exist', async () => {
      const userId = 1;
      const roleId = 999;
      const mockUser = createMockUser({ id: userId });

      userRepository.findByIdWithRoles.mockResolvedValue(mockUser);
      roleRepository.findOne.mockResolvedValue(null);

      await expect(service.assignRole(userId, roleId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.assignRole(userId, roleId)).rejects.toThrow(
        `Role with ID ${roleId} not found`
      );
    });
  });

  describe('removeRole', () => {
    it('should remove role from user successfully', async () => {
      const userId = 1;
      const roleId = 2;
      const mockRole = { id: roleId, name: 'Test Role' } as Role;
      const mockUser = createMockUser({
        id: userId,
        roles: [mockRole],
      });
      const updatedUser = createMockUser({
        id: userId,
        roles: [],
      });

      userRepository.findByIdWithRoles.mockResolvedValue(mockUser);
      userTypeOrmRepository.save.mockResolvedValue(updatedUser);
      userRepository.findByIdWithRoles.mockResolvedValueOnce(mockUser);
      userRepository.findByIdWithRoles.mockResolvedValueOnce(updatedUser);

      const result = await service.removeRole(userId, roleId);

      expect(result).toEqual(updatedUser);
      expect(userTypeOrmRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user has no roles', async () => {
      const userId = 1;
      const roleId = 2;
      const mockUser = createMockUser({ id: userId, roles: [] });

      userRepository.findByIdWithRoles.mockResolvedValue(mockUser);

      await expect(service.removeRole(userId, roleId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.removeRole(userId, roleId)).rejects.toThrow(
        `User ${userId} has no roles`
      );
    });

    it('should throw NotFoundException when role is not assigned', async () => {
      const userId = 1;
      const roleId = 999;
      const mockRole = { id: 2, name: 'Test Role' } as Role;
      const mockUser = createMockUser({
        id: userId,
        roles: [mockRole],
      });

      userRepository.findByIdWithRoles.mockResolvedValue(mockUser);

      await expect(service.removeRole(userId, roleId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.removeRole(userId, roleId)).rejects.toThrow(
        `Role ${roleId} is not assigned to user ${userId}`
      );
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles', async () => {
      const userId = 1;
      const mockRoles = [
        { id: 1, name: 'Role 1' } as Role,
        { id: 2, name: 'Role 2' } as Role,
      ];
      const mockUser = createMockUser({
        id: userId,
        roles: mockRoles,
      });

      userRepository.findByIdWithRoles.mockResolvedValue(mockUser);

      const result = await service.getUserRoles(userId);

      expect(result).toEqual(mockRoles);
    });

    it('should return empty array when user has no roles', async () => {
      const userId = 1;
      const mockUser = createMockUser({ id: userId, roles: [] });

      userRepository.findByIdWithRoles.mockResolvedValue(mockUser);

      const result = await service.getUserRoles(userId);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const userId = 999;

      userRepository.findByIdWithRoles.mockResolvedValue(null);

      await expect(service.getUserRoles(userId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getUserPermissions', () => {
    it('should return all permissions for ADMIN user', async () => {
      const userId = 1;
      const adminUser = createMockUser({
        id: userId,
        username: ADMIN_USERNAME,
      });
      const mockPermissions = [
        {
          id: 1,
          module: 'areas',
          action: 'read',
          description: 'Read areas',
        },
        {
          id: 2,
          module: 'areas',
          action: 'create',
          description: 'Create areas',
        },
      ] as Permission[];

      userRepository.findByIdWithRoles.mockResolvedValue(adminUser);
      permissionService.findAll.mockResolvedValue(mockPermissions);

      const result = await service.getUserPermissions(userId);

      expect(result).toHaveLength(2);
      expect(result[0].module).toBe('areas');
      expect(permissionService.findAll).toHaveBeenCalled();
    });

    it('should return permissions from user roles', async () => {
      const userId = 1;
      const mockPermission = {
        id: 1,
        module: 'areas',
        action: 'read',
        description: 'Read areas',
      } as Permission;
      const mockRole = {
        id: 1,
        name: 'Test Role',
        permissions: [mockPermission],
        deletedAt: null,
      } as Role;
      const mockUser = createMockUser({
        id: userId,
        username: 'testuser',
        roles: [mockRole],
      });

      userRepository.findByIdWithRoles.mockResolvedValue(mockUser);

      const result = await service.getUserPermissions(userId);

      expect(result).toHaveLength(1);
      expect(result[0].module).toBe('areas');
      expect(result[0].action).toBe('read');
    });

    it('should return empty array when user has no roles', async () => {
      const userId = 1;
      const mockUser = createMockUser({
        id: userId,
        username: 'testuser',
        roles: [],
      });

      userRepository.findByIdWithRoles.mockResolvedValue(mockUser);

      const result = await service.getUserPermissions(userId);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const userId = 999;

      userRepository.findByIdWithRoles.mockResolvedValue(null);

      await expect(service.getUserPermissions(userId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('isAdmin', () => {
    it('should return true for ADMIN username', () => {
      expect(service.isAdmin(ADMIN_USERNAME)).toBe(true);
    });

    it('should return false for non-ADMIN username', () => {
      expect(service.isAdmin('testuser')).toBe(false);
    });
  });
});
