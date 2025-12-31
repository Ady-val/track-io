import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleRepository } from '../../domain/repositories/role.repository';
import { PermissionRepository } from '../../domain/repositories/permission.repository';
import { createMockRole, createMockPermission } from '../../../test-helpers';
import type { CreateRoleDto, UpdateRoleDto } from '../dtos/role.dto';
import type { RoleFilters } from '../../domain/repositories/role.repository';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepository: jest.Mocked<RoleRepository>;
  let permissionRepository: jest.Mocked<PermissionRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: RoleRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByName: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
            assignPermissions: jest.fn(),
            removePermissions: jest.fn(),
            getPermissionsByRoleId: jest.fn(),
          },
        },
        {
          provide: PermissionRepository,
          useValue: {
            findByIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    roleRepository = module.get(RoleRepository);
    permissionRepository = module.get(PermissionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateRoleDto = {
      name: 'Test Role',
      description: 'Test Description',
    };

    it('should create role successfully', async () => {
      const mockRole = createMockRole({ id: 1, ...createDto });

      roleRepository.findByName.mockResolvedValue(null);
      roleRepository.create.mockResolvedValue(mockRole);

      const result = await service.create(createDto);

      expect(result).toEqual(mockRole);
      expect(roleRepository.findByName).toHaveBeenCalledWith(createDto.name);
      expect(roleRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when role name already exists', async () => {
      const existingRole = createMockRole({ name: createDto.name });

      roleRepository.findByName.mockResolvedValue(existingRole);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.create(createDto)).rejects.toThrow(
        `Role with name '${createDto.name}' already exists`
      );
    });
  });

  describe('findAll', () => {
    it('should return all roles with filters', async () => {
      const filters: RoleFilters = { limit: 10, offset: 0 };
      const mockRoles = [createMockRole({ id: 1 }), createMockRole({ id: 2 })];

      roleRepository.findAll.mockResolvedValue({
        data: mockRoles,
        total: 2,
      });

      const result = await service.findAll(filters);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(roleRepository.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('findById', () => {
    it('should return role when found', async () => {
      const id = 1;
      const mockRole = createMockRole({ id });

      roleRepository.findById.mockResolvedValue(mockRole);

      const result = await service.findById(id);

      expect(result).toEqual(mockRole);
      expect(roleRepository.findById).toHaveBeenCalledWith(id, true);
    });

    it('should throw NotFoundException when role not found', async () => {
      const id = 999;

      roleRepository.findById.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
      await expect(service.findById(id)).rejects.toThrow(
        `Role with ID ${id} not found`
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateRoleDto = {
      name: 'Updated Role',
    };

    it('should update role successfully', async () => {
      const id = 1;
      const existingRole = createMockRole({ id });
      const updatedRole = createMockRole({ id, ...updateDto });

      roleRepository.findById.mockResolvedValue(existingRole);
      roleRepository.findByName.mockResolvedValue(null);
      roleRepository.update.mockResolvedValue(updatedRole);

      const result = await service.update(id, updateDto);

      expect(result).toEqual(updatedRole);
      expect(roleRepository.findById).toHaveBeenCalledWith(id, true);
      expect(roleRepository.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should throw ConflictException when new name already exists', async () => {
      const id = 1;
      const existingRole = createMockRole({ id });
      const otherRole = createMockRole({ id: 2, name: updateDto.name });

      roleRepository.findById.mockResolvedValue(existingRole);
      roleRepository.findByName.mockResolvedValue(otherRole);

      await expect(service.update(id, updateDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.update(id, updateDto)).rejects.toThrow(
        `Role with name '${updateDto.name}' already exists`
      );
    });

    it('should throw NotFoundException when role does not exist', async () => {
      const id = 999;

      roleRepository.findById.mockResolvedValue(null);

      await expect(service.update(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should soft delete role successfully', async () => {
      const id = 1;
      const mockRole = createMockRole({ id });

      roleRepository.findById.mockResolvedValue(mockRole);
      roleRepository.softDelete.mockResolvedValue(true);

      await service.remove(id);

      expect(roleRepository.findById).toHaveBeenCalledWith(id, true);
      expect(roleRepository.softDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      const id = 999;

      roleRepository.findById.mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('should restore role successfully', async () => {
      const id = 1;
      const mockRole = createMockRole({ id });

      roleRepository.restore.mockResolvedValue(true);
      roleRepository.findById.mockResolvedValue(mockRole);

      const result = await service.restore(id);

      expect(result).toEqual(mockRole);
      expect(roleRepository.restore).toHaveBeenCalledWith(id);
      expect(roleRepository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when role cannot be restored', async () => {
      const id = 999;

      roleRepository.restore.mockResolvedValue(false);

      await expect(service.restore(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignPermissions', () => {
    it('should assign permissions to role successfully', async () => {
      const roleId = 1;
      const permissionIds = [1, 2];
      const mockRole = createMockRole({ id: roleId });
      const mockPermissions = [
        createMockPermission({ id: 1 }),
        createMockPermission({ id: 2 }),
      ];
      const updatedRole = createMockRole({
        id: roleId,
        permissions: mockPermissions,
      });

      roleRepository.findById.mockResolvedValue(mockRole);
      permissionRepository.findByIds.mockResolvedValue(mockPermissions);
      roleRepository.assignPermissions.mockResolvedValue(updatedRole);

      const result = await service.assignPermissions(roleId, permissionIds);

      expect(result).toEqual(updatedRole);
      expect(permissionRepository.findByIds).toHaveBeenCalledWith(
        permissionIds
      );
      expect(roleRepository.assignPermissions).toHaveBeenCalledWith(
        roleId,
        permissionIds
      );
    });

    it('should throw NotFoundException when one or more permissions not found', async () => {
      const roleId = 1;
      const permissionIds = [1, 2];
      const mockRole = createMockRole({ id: roleId });
      const mockPermissions = [createMockPermission({ id: 1 })];

      roleRepository.findById.mockResolvedValue(mockRole);
      permissionRepository.findByIds.mockResolvedValue(mockPermissions);

      await expect(
        service.assignPermissions(roleId, permissionIds)
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.assignPermissions(roleId, permissionIds)
      ).rejects.toThrow('One or more permissions not found');
    });

    it('should throw NotFoundException when role does not exist', async () => {
      const roleId = 999;
      const permissionIds = [1, 2];

      roleRepository.findById.mockResolvedValue(null);

      await expect(
        service.assignPermissions(roleId, permissionIds)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removePermissions', () => {
    it('should remove permissions from role successfully', async () => {
      const roleId = 1;
      const permissionIds = [1, 2];
      const updatedRole = createMockRole({ id: roleId });

      roleRepository.findById.mockResolvedValue(updatedRole);
      roleRepository.removePermissions.mockResolvedValue(updatedRole);

      const result = await service.removePermissions(roleId, permissionIds);

      expect(result).toEqual(updatedRole);
      expect(roleRepository.removePermissions).toHaveBeenCalledWith(
        roleId,
        permissionIds
      );
    });

    it('should throw NotFoundException when role does not exist', async () => {
      const roleId = 999;
      const permissionIds = [1, 2];

      roleRepository.findById.mockResolvedValue(null);

      await expect(
        service.removePermissions(roleId, permissionIds)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPermissionsByRoleId', () => {
    it('should return permissions for role', async () => {
      const roleId = 1;
      const mockPermissions = [
        createMockPermission({ id: 1 }),
        createMockPermission({ id: 2 }),
      ];
      const mockRole = createMockRole({ id: roleId });

      roleRepository.findById.mockResolvedValue(mockRole);
      roleRepository.getPermissionsByRoleId.mockResolvedValue(mockPermissions);

      const result = await service.getPermissionsByRoleId(roleId);

      expect(result).toEqual(mockPermissions);
      expect(roleRepository.findById).toHaveBeenCalledWith(roleId, true);
      expect(roleRepository.getPermissionsByRoleId).toHaveBeenCalledWith(
        roleId
      );
    });

    it('should throw NotFoundException when role does not exist', async () => {
      const roleId = 999;

      roleRepository.findById.mockResolvedValue(null);

      await expect(service.getPermissionsByRoleId(roleId)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
