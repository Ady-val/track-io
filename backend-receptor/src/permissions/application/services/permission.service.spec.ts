import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionRepository } from '../../domain/repositories/permission.repository';
import { createMockPermission } from '../../../test-helpers';
import { Module, Action } from '../../constants/permissions.constants';
import type { CreatePermissionDto } from '../dtos/permission.dto';

describe('PermissionService', () => {
  let service: PermissionService;
  let permissionRepository: jest.Mocked<PermissionRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: PermissionRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByModule: jest.fn(),
            findByModuleAndAction: jest.fn(),
            findByIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    permissionRepository = module.get(PermissionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreatePermissionDto = {
      module: Module.AREAS,
      action: Action.READ,
      description: 'Read areas',
    };

    it('should create permission successfully', async () => {
      const mockPermission = createMockPermission({
        id: 1,
        ...createDto,
      });

      permissionRepository.findByModuleAndAction.mockResolvedValue(null);
      permissionRepository.create.mockResolvedValue(mockPermission);

      const result = await service.create(createDto);

      expect(result).toEqual(mockPermission);
      expect(permissionRepository.findByModuleAndAction).toHaveBeenCalledWith(
        createDto.module,
        createDto.action
      );
      expect(permissionRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when permission already exists', async () => {
      const existingPermission = createMockPermission({
        module: createDto.module,
        action: createDto.action,
      });

      permissionRepository.findByModuleAndAction.mockResolvedValue(
        existingPermission
      );

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.create(createDto)).rejects.toThrow(
        `Permission ${createDto.module}:${createDto.action} already exists`
      );
    });
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      const mockPermissions = [
        createMockPermission({ id: 1 }),
        createMockPermission({ id: 2 }),
      ];

      permissionRepository.findAll.mockResolvedValue(mockPermissions);

      const result = await service.findAll();

      expect(result).toEqual(mockPermissions);
      expect(permissionRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return permission when found', async () => {
      const id = 1;
      const mockPermission = createMockPermission({ id });

      permissionRepository.findById.mockResolvedValue(mockPermission);

      const result = await service.findById(id);

      expect(result).toEqual(mockPermission);
      expect(permissionRepository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when permission not found', async () => {
      const id = 999;

      permissionRepository.findById.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
      await expect(service.findById(id)).rejects.toThrow(
        `Permission with ID ${id} not found`
      );
    });
  });

  describe('findByModule', () => {
    it('should return permissions for module', async () => {
      const module = Module.AREAS;
      const mockPermissions = [
        createMockPermission({ id: 1, module }),
        createMockPermission({ id: 2, module }),
      ];

      permissionRepository.findByModule.mockResolvedValue(mockPermissions);

      const result = await service.findByModule(module);

      expect(result).toEqual(mockPermissions);
      expect(permissionRepository.findByModule).toHaveBeenCalledWith(module);
    });
  });

  describe('findByModuleAndAction', () => {
    it('should return permission when found', async () => {
      const module = Module.AREAS;
      const action = Action.READ;
      const mockPermission = createMockPermission({ module, action });

      permissionRepository.findByModuleAndAction.mockResolvedValue(
        mockPermission
      );

      const result = await service.findByModuleAndAction(module, action);

      expect(result).toEqual(mockPermission);
      expect(permissionRepository.findByModuleAndAction).toHaveBeenCalledWith(
        module,
        action
      );
    });

    it('should throw NotFoundException when permission not found', async () => {
      const module = Module.AREAS;
      const action = Action.READ;

      permissionRepository.findByModuleAndAction.mockResolvedValue(null);

      await expect(
        service.findByModuleAndAction(module, action)
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findByModuleAndAction(module, action)
      ).rejects.toThrow(`Permission ${module}:${action} not found`);
    });
  });

  describe('getAllModules', () => {
    it('should return all module values', () => {
      const result = service.getAllModules();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain(Module.AREAS);
    });
  });

  describe('initializeDefaultPermissions', () => {
    it('should initialize default permissions', async () => {
      permissionRepository.findByModuleAndAction.mockResolvedValue(null);
      permissionRepository.create.mockResolvedValue(
        createMockPermission({ id: 1 })
      );

      await service.initializeDefaultPermissions();

      expect(permissionRepository.findByModuleAndAction).toHaveBeenCalled();
      expect(permissionRepository.create).toHaveBeenCalled();
    });

    it('should skip existing permissions', async () => {
      const existingPermission = createMockPermission({
        module: Module.AREAS,
        action: Action.READ,
      });

      permissionRepository.findByModuleAndAction
        .mockResolvedValueOnce(existingPermission)
        .mockResolvedValueOnce(null);

      permissionRepository.create.mockResolvedValue(
        createMockPermission({ id: 1 })
      );

      await service.initializeDefaultPermissions();

      expect(permissionRepository.create).toHaveBeenCalled();
    });
  });
});
