import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './application/services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SessionRepository } from './domain/repositories/session.repository';
import { Session } from './domain/entities/session.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    TypeOrmModule.forFeature([Session]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: {
          // No expiration - tokens are unlimited but can be invalidated via sessions
          // You can add expiration if needed: expiresIn: '30d'
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, SessionRepository],
  exports: [AuthService, JwtStrategy, JwtAuthGuard, SessionRepository],
})
export class AuthModule {}

