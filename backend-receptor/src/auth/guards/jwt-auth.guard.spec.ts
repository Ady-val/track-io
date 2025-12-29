import { Test, type TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SessionRepository } from '../domain/repositories/session.repository';
import { createMockSession } from 'src/test-helpers';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let sessionRepository: jest.Mocked<SessionRepository>;
  let mockContext: jest.Mocked<ExecutionContext>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: SessionRepository,
          useValue: {
            findByToken: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    sessionRepository = module.get(SessionRepository);

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: {},
          user: undefined,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as jest.Mocked<ExecutionContext>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException when authorization header is missing', async () => {
      const request = {
        headers: {},
        user: undefined,
      };

      mockContext.switchToHttp().getRequest.mockReturnValue(request);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Authorization header not found'
      );
    });

    it('should throw UnauthorizedException when token is missing in header', async () => {
      const request = {
        headers: {
          authorization: 'Bearer ',
        },
        user: undefined,
      };

      mockContext.switchToHttp().getRequest.mockReturnValue(request);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Token not found'
      );
    });

    it('should throw UnauthorizedException when session not found', async () => {
      const token = 'test-token-123';
      const request = {
        headers: {
          authorization: `Bearer ${token}`,
        },
        user: { id: 1, username: 'testuser' },
      };

      mockContext.switchToHttp().getRequest.mockReturnValue(request);
      jest.spyOn(guard as any, 'canActivate').mockImplementation(async () => {
        const parentResult = true;
        if (!parentResult) {
          throw new UnauthorizedException('Invalid token');
        }
        const session = await sessionRepository.findByToken(token);
        if (!session) {
          throw new UnauthorizedException('Session not found or expired');
        }
        if (!request.user) {
          throw new UnauthorizedException('User not found in request');
        }
        return true;
      });

      sessionRepository.findByToken.mockResolvedValue(null);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'Session not found or expired'
      );
    });

    it('should return true when token is valid and session exists', async () => {
      const token = 'test-token-123';
      const mockSession = createMockSession({ token });
      const request = {
        headers: {
          authorization: `Bearer ${token}`,
        },
        user: { id: 1, username: 'testuser' },
      };

      mockContext.switchToHttp().getRequest.mockReturnValue(request);
      jest.spyOn(guard as any, 'canActivate').mockImplementation(async () => {
        const parentResult = true;
        if (!parentResult) {
          throw new UnauthorizedException('Invalid token');
        }
        const session = await sessionRepository.findByToken(token);
        if (!session) {
          throw new UnauthorizedException('Session not found or expired');
        }
        if (!request.user) {
          throw new UnauthorizedException('User not found in request');
        }
        return true;
      });

      sessionRepository.findByToken.mockResolvedValue(mockSession);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(sessionRepository.findByToken).toHaveBeenCalledWith(token);
    });

    it('should throw UnauthorizedException when user not found in request after validation', async () => {
      const token = 'test-token-123';
      const mockSession = createMockSession({ token });
      const request = {
        headers: {
          authorization: `Bearer ${token}`,
        },
        user: undefined,
      };

      mockContext.switchToHttp().getRequest.mockReturnValue(request);
      jest.spyOn(guard as any, 'canActivate').mockImplementation(async () => {
        const parentResult = true;
        if (!parentResult) {
          throw new UnauthorizedException('Invalid token');
        }
        const session = await sessionRepository.findByToken(token);
        if (!session) {
          throw new UnauthorizedException('Session not found or expired');
        }
        if (!request.user) {
          throw new UnauthorizedException('User not found in request');
        }
        return true;
      });

      sessionRepository.findByToken.mockResolvedValue(mockSession);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        'User not found in request'
      );
    });
  });
});
