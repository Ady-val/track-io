import { SetMetadata } from '@nestjs/common';
import { Module, Action } from '../constants/permissions.constants';

export const PERMISSION_KEY = 'permission';

export const RequirePermission = (module: Module, action: Action) =>
  SetMetadata(PERMISSION_KEY, { module, action });

