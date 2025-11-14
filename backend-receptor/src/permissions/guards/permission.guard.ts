import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  Logger,
  CanActivate,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { ADMIN_USERNAME } from '../constants/permissions.constants';

type UserServiceType = {
  getUserRoles: (userId: number) => Promise<Array<{ id: number }>>;
  getUserPermissions: (
    userId: number
  ) => Promise<Array<{ module: string; action: string }>>;
};

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(forwardRef(() => 'UserService'))
    private readonly userService: UserServiceType
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
      this.logger.warn('User not found in request');
      throw new ForbiddenException('User not authenticated');
    }

    if (user.username === ADMIN_USERNAME) {
      this.logger.debug(`Admin user ${user.username} granted full access`);
      return true;
    }

    const userWithRoles = await this.userService.getUserRoles(user.id);
    if (userWithRoles.length === 0) {
      this.logger.warn(`User ${user.id} has no roles`);
      throw new ForbiddenException(
        'You do not have permission to perform this action'
      );
    }

    const userPermissions = await this.userService.getUserPermissions(user.id);
    const hasPermission = userPermissions.some(
      (permission: { module: string; action: string }) =>
        permission.module === requiredPermission.module &&
        permission.action === requiredPermission.action
    );

    if (!hasPermission) {
      this.logger.warn(
        `User ${user.id} (${user.username}) denied access to ${requiredPermission.module}:${requiredPermission.action}`
      );
      throw new ForbiddenException(
        'You do not have permission to perform this action'
      );
    }

    this.logger.debug(
      `User ${user.id} (${user.username}) granted access to ${requiredPermission.module}:${requiredPermission.action}`
    );
    return true;
  }
}
