import { Test, type TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy, type JwtPayload } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user data when payload is valid', () => {
      const payload: JwtPayload = {
        sub: 1,
        username: 'testuser',
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        id: payload.sub,
        username: payload.username,
      });
    });

    it('should throw UnauthorizedException when sub is missing', () => {
      const payload: Partial<JwtPayload> = {
        username: 'testuser',
      };

      expect(() => strategy.validate(payload as JwtPayload)).toThrow(
        UnauthorizedException
      );
      expect(() => strategy.validate(payload as JwtPayload)).toThrow(
        'Invalid token payload'
      );
    });

    it('should throw UnauthorizedException when username is missing', () => {
      const payload: Partial<JwtPayload> = {
        sub: 1,
      };

      expect(() => strategy.validate(payload as JwtPayload)).toThrow(
        UnauthorizedException
      );
      expect(() => strategy.validate(payload as JwtPayload)).toThrow(
        'Invalid token payload'
      );
    });

    it('should use default secret when JWT_SECRET is not configured', () => {
      configService.get.mockReturnValue(undefined);

      const _module: TestingModule = Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile();

      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
});
