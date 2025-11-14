import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './controllers/user.controller';
import { UserService } from './application/services/user.service';
import { User } from './domain/entities/user.entity';
import { UserRepository } from './domain/repositories/user.repository';
import { AuthModule } from '../auth/auth.module';
import { Role } from '../permissions/domain/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    { provide: 'UserService', useExisting: UserService },
  ],
  exports: [UserService, UserRepository, 'UserService'],
})
export class UsersModule {}
