import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  CanActivate,
} from '@nestjs/common';
import { Reflector, ModuleRef } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { ADMIN_USERNAME } from '../constants/permissions.constants';
import { UserService } from '../../users/application/services/user.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<
      | {
          module: string;
          action: string;
        }
      | undefined
    >(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (requiredPermission === undefined) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { id: number; username: string };
    }>();

    const user = request.user;
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.username === ADMIN_USERNAME) {
      return true;
    }

    const userService = this.moduleRef.get<UserService>(UserService, {
      strict: false,
    }) as UserService | undefined;

    if (!userService) {
      throw new ForbiddenException(
        'You do not have permission to perform this action'
      );
    }

    const userWithRoles = await userService.getUserRoles(user.id);
    if (userWithRoles.length === 0) {
      throw new ForbiddenException(
        'You do not have permission to perform this action'
      );
    }

    const userPermissions = await userService.getUserPermissions(user.id);
    const hasPermission = userPermissions.some(
      (permission: { module: string; action: string }) =>
        permission.module === requiredPermission.module &&
        permission.action === requiredPermission.action
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to perform this action'
      );
    }

    return true;
  }
}
