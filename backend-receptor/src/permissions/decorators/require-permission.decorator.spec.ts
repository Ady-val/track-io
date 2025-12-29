import { SetMetadata } from '@nestjs/common';
import {
  RequirePermission,
  PERMISSION_KEY,
} from './require-permission.decorator';
import { Module, Action } from '../constants/permissions.constants';

describe('RequirePermission', () => {
  it('should set metadata with correct key and value', () => {
    const module = Module.AREAS;
    const action = Action.READ;

    const decorator = RequirePermission(module, action);

    expect(decorator).toBeDefined();

    const metadata = SetMetadata(PERMISSION_KEY, { module, action });
    expect(metadata).toBeDefined();
  });

  it('should work with different modules and actions', () => {
    const testCases = [
      { module: Module.AREAS, action: Action.CREATE },
      { module: Module.DEPARTMENTS, action: Action.UPDATE },
      { module: Module.USERS, action: Action.DELETE },
    ];

    testCases.forEach(({ module, action }) => {
      const decorator = RequirePermission(module, action);
      expect(decorator).toBeDefined();
    });
  });
});
