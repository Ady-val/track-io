import { Test, type TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from '../application/services/auth.service';
import type { LoginDto } from '../application/dtos/auth.dto';
import type { CurrentUser } from '../decorators/current-user.decorator';
import systemModulesConfig from 'src/config/system-modules.config';
import { SystemModule } from 'src/common/enums/system-module.enum';

const mockJwtAuthGuard = {
  canActivate: jest.fn(() => true),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            logout: jest.fn(),
            logoutAll: jest.fn(),
            logoutAllExceptCurrent: jest.fn(),
            getUserPermissions: jest.fn(),
            getUserData: jest.fn(),
          },
        },
        {
          provide: systemModulesConfig.KEY,
          useValue: {
            [SystemModule.MEASUREMENTS]: true,
            [SystemModule.SIGNALS]: true,
          },
        },
      ],
    })
      .overrideGuard(
        mockJwtAuthGuard.constructor as unknown as new () => unknown
      )
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password123',
      };
      const mockResponse = {
        access_token: 'jwt-token-123',
        user: {
          id: 1,
          name: 'Test User',
          username: 'testuser',
        },
      };
      const mockRequest = {
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
        headers: {
          'user-agent': 'test-agent',
        },
      };

      service.login.mockResolvedValue(mockResponse);

      const result = await controller.login(
        loginDto,
        mockRequest as {
          ip?: string;
          connection?: { remoteAddress?: string };
          headers?: Record<string, string>;
        }
      );

      expect(result).toEqual(mockResponse);
      expect(service.login).toHaveBeenCalledWith(
        loginDto,
        '127.0.0.1',
        'test-agent'
      );
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'wrongpassword',
      };
      const mockRequest = {
        ip: '127.0.0.1',
        headers: {},
      };

      service.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials')
      );

      await expect(
        controller.login(
          loginDto,
          mockRequest as { headers?: Record<string, string> }
        )
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const token = 'test-token-123';
      const mockRequest = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      service.logout.mockResolvedValue(undefined);

      const result = await controller.logout(
        mockRequest as { headers?: Record<string, string> }
      );

      expect(result.message).toBe('Logged out successfully');
      expect(service.logout).toHaveBeenCalledWith(token);
    });

    it('should throw BadRequestException when authorization header is missing', async () => {
      const mockRequest = {
        headers: {},
      };

      await expect(
        controller.logout(mockRequest as { headers?: Record<string, string> })
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.logout(mockRequest as { headers?: Record<string, string> })
      ).rejects.toThrow('Authorization header not found');
    });
  });

  describe('logoutAll', () => {
    it('should logout all sessions successfully', async () => {
      const mockUser = { id: 1, username: 'testuser' };

      service.logoutAll.mockResolvedValue(undefined);

      const result = await controller.logoutAll(
        mockUser as { id: number; username: string }
      );

      expect(result.message).toBe('All sessions closed successfully');
      expect(service.logoutAll).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('logoutAllExceptCurrent', () => {
    it('should logout all sessions except current successfully', async () => {
      const token = 'current-token-123';
      const mockUser = { id: 1, username: 'testuser' };
      const mockRequest = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      service.logoutAllExceptCurrent.mockResolvedValue(undefined);

      const result = await controller.logoutAllExceptCurrent(
        mockUser as { id: number; username: string },
        mockRequest as { headers?: Record<string, string> }
      );

      expect(result.message).toBe('All other sessions closed successfully');
      expect(service.logoutAllExceptCurrent).toHaveBeenCalledWith(
        mockUser.id,
        token
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user with permissions', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockUserData = {
        id: 1,
        name: 'Test User',
        username: 'testuser',
      };
      const mockPermissions = [
        {
          id: 1,
          module: 'areas',
          action: 'read',
        },
      ];

      service.getUserPermissions.mockResolvedValue(
        mockPermissions as Array<{
          id: number;
          module: string;
          action: string;
          description?: string;
        }>
      );
      service.getUserData.mockResolvedValue(mockUserData);

      const result = await controller.getCurrentUser(mockUser as CurrentUser);

      expect(result.message).toBe('Current user retrieved successfully');
      expect(result.data.user).toEqual(mockUserData);
      expect(result.data.permissions).toEqual(mockPermissions);
      expect(result.data.modules).toEqual({
        signals: true,
        measurements: true,
      });
      expect(service.getUserPermissions).toHaveBeenCalledWith(mockUser.id);
      expect(service.getUserData).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
