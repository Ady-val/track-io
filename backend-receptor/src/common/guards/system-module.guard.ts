import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ConfigType } from '@nestjs/config';
import systemModulesConfig from 'src/config/system-modules.config';
import { SystemModule } from '../enums/system-module.enum';
import { SYSTEM_MODULE_KEY } from '../decorators/system-module.decorator';

@Injectable()
export class SystemModuleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(systemModulesConfig.KEY)
    private readonly modulesConfig: ConfigType<typeof systemModulesConfig>
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const module = this.reflector.getAllAndOverride<SystemModule | undefined>(
      SYSTEM_MODULE_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!module) {
      return true;
    }

    const enabled = this.modulesConfig[module];

    if (!enabled) {
      throw new ForbiddenException(
        'You do not have permission to perform this action'
      );
    }

    return true;
  }
}
