import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SessionRepository } from '../domain/repositories/session.repository';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly sessionRepository: SessionRepository) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: { id: number; username: string };
    }>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      this.logger.warn('Authorization header not found');
      throw new UnauthorizedException('Authorization header not found');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      this.logger.warn('Token not found in authorization header');
      throw new UnauthorizedException('Token not found');
    }

    try {
      const parentResult = await super.canActivate(context);
      if (!parentResult) {
        this.logger.warn(
          'JWT token validation failed - parent guard returned false'
        );
        throw new UnauthorizedException('Invalid token');
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      const errorName = (error as Error).name;

      this.logger.error(`JWT validation error: ${errorName} - ${errorMessage}`);

      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(
          `JWT validation failed: ${errorMessage}. Please verify JWT_SECRET matches and token is valid.`
        );
      }

      if (
        errorMessage.includes('expired') ||
        errorMessage.includes('jwt expired')
      ) {
        throw new UnauthorizedException('Token has expired');
      } else if (
        errorMessage.includes('invalid signature') ||
        errorMessage.includes('invalid token')
      ) {
        throw new UnauthorizedException(
          'Invalid token signature - JWT_SECRET may not match'
        );
      } else if (errorMessage.includes('jwt malformed')) {
        throw new UnauthorizedException('Malformed token');
      } else {
        throw new UnauthorizedException(
          `Token validation failed: ${errorMessage}`
        );
      }
    }

    const session = await this.sessionRepository.findByToken(token);
    if (!session) {
      this.logger.warn(
        `Session not found for token: ${token.substring(0, 20)}...`
      );
      throw new UnauthorizedException('Session not found or expired');
    }

    if (!request.user) {
      this.logger.warn('User not found in request after JWT validation');
      throw new UnauthorizedException('User not found in request');
    }

    return true;
  }
}
