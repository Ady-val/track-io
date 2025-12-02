import { Global, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './controllers/role.controller';
import { PermissionController } from './controllers/permission.controller';
import { RoleService } from './application/services/role.service';
import { PermissionService } from './application/services/permission.service';
import { RoleRepository } from './domain/repositories/role.repository';
import { PermissionRepository } from './domain/repositories/permission.repository';
import { Role } from './domain/entities/role.entity';
import { Permission } from './domain/entities/permission.entity';
import { PermissionGuard } from './guards/permission.guard';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission]),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [RoleController, PermissionController],
  providers: [
    RoleService,
    PermissionService,
    RoleRepository,
    PermissionRepository,
    PermissionGuard,
  ],
  exports: [
    RoleService,
    PermissionService,
    RoleRepository,
    PermissionRepository,
    PermissionGuard,
  ],
})
export class PermissionsModule {}
