import { Test, type TestingModule } from '@nestjs/testing';
import { PermissionController } from './permission.controller';
import { PermissionService } from '../application/services/permission.service';
import { createMockPermission } from '../../test-helpers';
import { Module } from '../constants/permissions.constants';

const mockJwtAuthGuard = {
  canActivate: jest.fn(() => true),
};

const mockPermissionGuard = {
  canActivate: jest.fn(() => true),
};

describe('PermissionController', () => {
  let controller: PermissionController;
  let service: jest.Mocked<PermissionService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionController],
      providers: [
        {
          provide: PermissionService,
          useValue: {
            findAll: jest.fn(),
            findByModule: jest.fn(),
            getAllModules: jest.fn(),
            initializeDefaultPermissions: jest.fn(),
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

    controller = module.get<PermissionController>(PermissionController);
    service = module.get(PermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      const mockPermissions = [
        createMockPermission({ id: 1 }),
        createMockPermission({ id: 2 }),
      ];

      service.findAll.mockResolvedValue(mockPermissions);

      const result = await controller.findAll();

      expect(result.message).toBe('Permissions retrieved successfully');
      expect(result.data).toHaveLength(2);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('getModules', () => {
    it('should return all modules', () => {
      const mockModules = Object.values(Module);

      service.getAllModules.mockReturnValue(mockModules);

      const result = controller.getModules();

      expect(result.message).toBe('Modules retrieved successfully');
      expect(result.data).toEqual(mockModules);
      expect(service.getAllModules).toHaveBeenCalled();
    });
  });

  describe('findByModule', () => {
    it('should return permissions for module', async () => {
      const module = Module.AREAS;
      const mockPermissions = [
        createMockPermission({ id: 1, module }),
        createMockPermission({ id: 2, module }),
      ];

      service.findByModule.mockResolvedValue(mockPermissions);

      const result = await controller.findByModule(module);

      expect(result.message).toBe(
        `Permissions for module '${module}' retrieved successfully`
      );
      expect(result.data).toHaveLength(2);
      expect(service.findByModule).toHaveBeenCalledWith(module);
    });
  });

  describe('initialize', () => {
    it('should initialize default permissions', async () => {
      service.initializeDefaultPermissions.mockResolvedValue(undefined);

      const result = await controller.initialize();

      expect(result.message).toBe(
        'Default permissions initialized successfully'
      );
      expect(service.initializeDefaultPermissions).toHaveBeenCalled();
    });
  });
});
