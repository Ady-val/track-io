import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: number;
  username: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(configService: ConfigService) {
    // Use || instead of ?? to handle empty strings as falsy and fall back to default
    // Empty JWT secrets are security risks and should trigger the fallback
    const jwtSecret =
      configService.get<string>('JWT_SECRET') ||
      'your-secret-key-change-in-production';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: JwtPayload) {
    if (!payload.sub || !payload.username) {
      this.logger.warn('Invalid JWT payload: missing sub or username');
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: payload.sub,
      username: payload.username,
    };
  }
}
