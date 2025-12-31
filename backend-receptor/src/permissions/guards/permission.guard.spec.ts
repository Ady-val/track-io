import { Test, type TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { Reflector, ModuleRef } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { PermissionGuard } from './permission.guard';
import { UserService } from 'src/users/application/services/user.service';
import { ADMIN_USERNAME } from '../constants/permissions.constants';
import { Module, Action } from '../constants/permissions.constants';
import type { Role } from '../../domain/entities/role.entity';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: jest.Mocked<Reflector>;
  let moduleRef: jest.Mocked<ModuleRef>;
  let userService: jest.Mocked<UserService>;
  let mockContext: jest.Mocked<ExecutionContext>;
  let mockGetRequest: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: ModuleRef,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            getUserRoles: jest.fn(),
            getUserPermissions: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    reflector = module.get(Reflector);
    moduleRef = module.get(ModuleRef);
    userService = module.get(UserService);

    mockGetRequest = jest.fn().mockReturnValue({
      user: undefined,
    });
    const mockSwitchToHttp = {
      getRequest: mockGetRequest,
    };
    mockContext = {
      switchToHttp: jest.fn().mockReturnValue(mockSwitchToHttp),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as jest.Mocked<ExecutionContext>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true when no permission is required', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return true for ADMIN user', async () => {
      const requiredPermission = {
        module: Module.AREAS,
        action: Action.READ,
      };
      const request = {
        user: { id: 1, username: ADMIN_USERNAME },
      };

      reflector.getAllAndOverride.mockReturnValue(requiredPermission);
      mockGetRequest.mockReturnValue(request);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      const requiredPermission = {
        module: Module.AREAS,
        action: Action.READ,
      };
      const request = {
        user: undefined,
      };

      reflector.getAllAndOverride.mockReturnValue(requiredPermission);
      mockGetRequest.mockReturnValue(request);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'User not authenticated'
      );
    });

    it('should throw ForbiddenException when user has no roles', async () => {
      const requiredPermission = {
        module: Module.AREAS,
        action: Action.READ,
      };
      const request = {
        user: { id: 1, username: 'testuser' },
      };

      reflector.getAllAndOverride.mockReturnValue(requiredPermission);
      mockGetRequest.mockReturnValue(request);
      moduleRef.get.mockReturnValue(userService);
      userService.getUserRoles.mockResolvedValue([]);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'You do not have permission to perform this action'
      );
    });

    it('should throw ForbiddenException when user does not have required permission', async () => {
      const requiredPermission = {
        module: Module.AREAS,
        action: Action.READ,
      };
      const request = {
        user: { id: 1, username: 'testuser' },
      };
      const mockRoles: Role[] = [{ id: 1, name: 'Test Role' } as Role];
      const mockPermissions: Array<{
        id: number;
        module: string;
        action: string;
        description?: string;
      }> = [
        {
          id: 1,
          module: Module.DEPARTMENTS,
          action: Action.READ,
        },
      ];

      reflector.getAllAndOverride.mockReturnValue(requiredPermission);
      mockGetRequest.mockReturnValue(request);
      moduleRef.get.mockReturnValue(userService);
      userService.getUserRoles.mockResolvedValue(mockRoles);
      userService.getUserPermissions.mockResolvedValue(mockPermissions);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'You do not have permission to perform this action'
      );
    });

    it('should return true when user has required permission', async () => {
      const requiredPermission = {
        module: Module.AREAS,
        action: Action.READ,
      };
      const request = {
        user: { id: 1, username: 'testuser' },
      };
      const mockRoles: Role[] = [{ id: 1, name: 'Test Role' } as Role];
      const mockPermissions: Array<{
        id: number;
        module: string;
        action: string;
        description?: string;
      }> = [
        {
          id: 1,
          module: Module.AREAS,
          action: Action.READ,
        },
      ];

      reflector.getAllAndOverride.mockReturnValue(requiredPermission);
      mockGetRequest.mockReturnValue(request);
      moduleRef.get.mockReturnValue(userService);
      userService.getUserRoles.mockResolvedValue(mockRoles);
      userService.getUserPermissions.mockResolvedValue(mockPermissions);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(userService.getUserPermissions).toHaveBeenCalledWith(
        request.user.id
      );
    });

    it('should throw ForbiddenException when UserService is not available', async () => {
      const requiredPermission = {
        module: Module.AREAS,
        action: Action.READ,
      };
      const request = {
        user: { id: 1, username: 'testuser' },
      };

      reflector.getAllAndOverride.mockReturnValue(requiredPermission);
      mockGetRequest.mockReturnValue(request);
      moduleRef.get.mockReturnValue(undefined);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'You do not have permission to perform this action'
      );
    });
  });
});
