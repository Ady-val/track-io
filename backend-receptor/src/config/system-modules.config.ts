// src/config/system-modules.config.ts
import { registerAs } from '@nestjs/config';
import { SystemModule } from 'src/common/enums/system-module.enum';

export interface SystemModulesConfig {
  [SystemModule.MEASUREMENTS]: boolean;
  [SystemModule.SIGNALS]: boolean;
  [SystemModule.INSIGHTS]: boolean;
}

export default registerAs(
  'systemModules',
  (): SystemModulesConfig => ({
    [SystemModule.MEASUREMENTS]:
      (process.env['MODULE_MEASUREMENTS_ENABLED'] || 'true') === 'true',
    [SystemModule.SIGNALS]:
      (process.env['MODULE_SIGNALS_ENABLED'] || 'true') === 'true',
    // Feature con costo por llamada externa (API de Anthropic): default OFF,
    // se habilita explícitamente por planta.
    [SystemModule.INSIGHTS]:
      (process.env['MODULE_INSIGHTS_ENABLED'] || 'false') === 'true',
  })
);
