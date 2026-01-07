import { SetMetadata } from '@nestjs/common';
import type { SystemModule } from '../enums/system-module.enum';

export const SYSTEM_MODULE_KEY = 'systemModule';

export const SystemModuleTag = (module: SystemModule) =>
  SetMetadata(SYSTEM_MODULE_KEY, module);
