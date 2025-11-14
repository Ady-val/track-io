import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../../users/application/services/user.service';
import { User } from '../../../users/domain/entities/user.entity';
import { SessionRepository } from '../../domain/repositories/session.repository';
import { JwtPayload } from '../../strategies/jwt.strategy';
import { LoginDto, LoginResponseDto } from '../dtos/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly sessionRepository: SessionRepository
  ) {}

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResponseDto> {
    this.logger.log(`Login attempt for username: ${loginDto.username}`);

    try {
      const user = await this.userService.findByUsername(loginDto.username);

      const isPasswordValid = await this.userService.validatePassword(
        loginDto.password,
        user.password
      );

      if (!isPasswordValid) {
        this.logger.warn(
          `Invalid password attempt for username: ${loginDto.username}`
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload: JwtPayload = {
        sub: user.id,
        username: user.username,
      };

      const token = this.jwtService.sign(payload);

      await this.sessionRepository.create({
        userId: user.id,
        token,
        ...(ipAddress && { ipAddress }),
        ...(userAgent && { userAgent }),
      });

      this.logger.log(`User ${user.username} logged in successfully`);

      return {
        access_token: token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        `Error during login: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async logout(token: string): Promise<void> {
    this.logger.log('Logout attempt');

    try {
      const deleted = await this.sessionRepository.deleteByToken(token);
      if (!deleted) {
        throw new BadRequestException('Session not found');
      }

      this.logger.log('User logged out successfully');
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Error during logout: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async logoutAll(userId: number): Promise<void> {
    this.logger.log(`Logout all sessions for user ID: ${userId}`);

    try {
      await this.sessionRepository.deleteByUserId(userId);
      this.logger.log(`All sessions closed for user ID: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error closing all sessions: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async logoutAllExceptCurrent(
    userId: number,
    currentToken: string
  ): Promise<void> {
    this.logger.log(
      `Logout all sessions except current for user ID: ${userId}`
    );

    try {
      await this.sessionRepository.deleteAllExceptToken(userId, currentToken);
      this.logger.log(
        `All sessions closed except current for user ID: ${userId}`
      );
    } catch (error) {
      this.logger.error(
        `Error closing sessions: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async validateUser(
    username: string,
    password: string
  ): Promise<Omit<User, 'password'> | null> {
    try {
      const user = await this.userService.findByUsername(username);
      const isPasswordValid = await this.userService.validatePassword(
        password,
        user.password
      );

      if (!isPasswordValid) {
        return null;
      }

      const { password: _, ...result } = user;
      return result;
    } catch {
      return null;
    }
  }
}

