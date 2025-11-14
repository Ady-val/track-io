import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SessionRepository } from '../domain/repositories/session.repository';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly sessionRepository: SessionRepository) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, let the parent guard validate the JWT token
    const parentResult = await super.canActivate(context);
    if (!parentResult) {
      return false;
    }

    // Then, verify that the session exists in the database
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: { id: number; username: string };
    }>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header not found');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    const session = await this.sessionRepository.findByToken(token);
    if (!session) {
      throw new UnauthorizedException('Session not found or expired');
    }

    // User info is already attached by the parent guard
    // Just ensure it's properly set
    if (!request.user) {
      throw new UnauthorizedException('User not found in request');
    }

    return true;
  }
}
