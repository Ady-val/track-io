import { Test, type TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from '../../../users/application/services/user.service';
import { SessionRepository } from '../../domain/repositories/session.repository';
import { createMockUser, createMockSession } from '../../../test-helpers';
import type { LoginDto } from '../dtos/auth.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let sessionRepository: jest.Mocked<SessionRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByUsername: jest.fn(),
            validatePassword: jest.fn(),
            getUserPermissions: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: SessionRepository,
          useValue: {
            create: jest.fn(),
            deleteByToken: jest.fn(),
            deleteByUserId: jest.fn(),
            deleteAllExceptToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    sessionRepository = module.get(SessionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testuser',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      const mockUser = createMockUser({
        id: 1,
        username: loginDto.username,
        password: 'hashedPassword123',
      });
      const token = 'jwt-token-123';
      const mockSession = createMockSession({
        userId: mockUser.id,
        token,
      });

      userService.findByUsername.mockResolvedValue(mockUser);
      userService.validatePassword.mockResolvedValue(true);
      jwtService.sign.mockReturnValue(token);
      sessionRepository.create.mockResolvedValue(mockSession);

      const result = await service.login(loginDto, '127.0.0.1', 'test-agent');

      expect(result.access_token).toBe(token);
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.username).toBe(mockUser.username);
      expect(userService.findByUsername).toHaveBeenCalledWith(
        loginDto.username
      );
      expect(userService.validatePassword).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
      });
      expect(sessionRepository.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        token,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      const mockUser = createMockUser({
        username: loginDto.username,
        password: 'hashedPassword123',
      });

      userService.findByUsername.mockResolvedValue(mockUser);
      userService.validatePassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials'
      );
      expect(sessionRepository.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userService.findByUsername.mockRejectedValue(new Error('User not found'));

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should create session without ipAddress and userAgent when not provided', async () => {
      const mockUser = createMockUser({
        id: 1,
        username: loginDto.username,
      });
      const token = 'jwt-token-123';
      const mockSession = createMockSession({ userId: mockUser.id, token });

      userService.findByUsername.mockResolvedValue(mockUser);
      userService.validatePassword.mockResolvedValue(true);
      jwtService.sign.mockReturnValue(token);
      sessionRepository.create.mockResolvedValue(mockSession);

      await service.login(loginDto);

      expect(sessionRepository.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        token,
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const token = 'test-token-123';

      sessionRepository.deleteByToken.mockResolvedValue(true);

      await service.logout(token);

      expect(sessionRepository.deleteByToken).toHaveBeenCalledWith(token);
    });

    it('should throw BadRequestException when session not found', async () => {
      const token = 'invalid-token';

      sessionRepository.deleteByToken.mockResolvedValue(false);

      await expect(service.logout(token)).rejects.toThrow(BadRequestException);
      await expect(service.logout(token)).rejects.toThrow('Session not found');
    });
  });

  describe('logoutAll', () => {
    it('should logout all sessions for user', async () => {
      const userId = 1;

      sessionRepository.deleteByUserId.mockResolvedValue(true);

      await service.logoutAll(userId);

      expect(sessionRepository.deleteByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('logoutAllExceptCurrent', () => {
    it('should logout all sessions except current', async () => {
      const userId = 1;
      const currentToken = 'current-token-123';

      sessionRepository.deleteAllExceptToken.mockResolvedValue(true);

      await service.logoutAllExceptCurrent(userId, currentToken);

      expect(sessionRepository.deleteAllExceptToken).toHaveBeenCalledWith(
        userId,
        currentToken
      );
    });
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const username = 'testuser';
      const password = 'password123';
      const mockUser = createMockUser({
        id: 1,
        username,
        password: 'hashedPassword123',
      });

      userService.findByUsername.mockResolvedValue(mockUser);
      userService.validatePassword.mockResolvedValue(true);

      const result = await service.validateUser(username, password);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockUser.id);
      expect(result?.username).toBe(mockUser.username);
      expect((result as any).password).toBeUndefined();
    });

    it('should return null when password is invalid', async () => {
      const username = 'testuser';
      const password = 'wrongpassword';
      const mockUser = createMockUser({
        username,
        password: 'hashedPassword123',
      });

      userService.findByUsername.mockResolvedValue(mockUser);
      userService.validatePassword.mockResolvedValue(false);

      const result = await service.validateUser(username, password);

      expect(result).toBeNull();
    });

    it('should return null when user not found', async () => {
      const username = 'nonexistent';
      const password = 'password123';

      userService.findByUsername.mockRejectedValue(new Error('User not found'));

      const result = await service.validateUser(username, password);

      expect(result).toBeNull();
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      const userId = 1;
      const mockPermissions = [
        {
          id: 1,
          module: 'areas',
          action: 'read',
        },
      ];

      userService.getUserPermissions.mockResolvedValue(mockPermissions as any);

      const result = await service.getUserPermissions(userId);

      expect(result).toEqual(mockPermissions);
      expect(userService.getUserPermissions).toHaveBeenCalledWith(userId);
    });
  });

  describe('getUserData', () => {
    it('should return user data', async () => {
      const userId = 1;
      const mockUser = createMockUser({
        id: userId,
        name: 'Test User',
        username: 'testuser',
      });

      userService.findById.mockResolvedValue(mockUser);

      const result = await service.getUserData(userId);

      expect(result.id).toBe(userId);
      expect(result.name).toBe(mockUser.name);
      expect(result.username).toBe(mockUser.username);
      expect(userService.findById).toHaveBeenCalledWith(userId);
    });
  });
});
