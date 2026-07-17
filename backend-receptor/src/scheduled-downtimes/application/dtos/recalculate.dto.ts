import {
  IsOptional,
  IsInt,
  IsPositive,
  IsBoolean,
  IsISO8601,
} from 'class-validator';

/**
 * Recálculo retroactivo de descuentos por paros programados sobre históricos
 * cerrados. `dryRun` es true por defecto: lo destructivo es opt-in explícito.
 * Ver BUILD_SPEC_FASE2 §6.
 */
export class RecalculateDto {
  @IsOptional()
  @IsInt({ message: 'areaId must be an integer' })
  @IsPositive({ message: 'areaId must be a positive integer' })
  areaId?: number;

  @IsISO8601(
    { strict: false },
    { message: 'from debe ser una fecha ISO 8601 (con offset explícito)' }
  )
  from!: string;

  @IsISO8601(
    { strict: false },
    { message: 'to debe ser una fecha ISO 8601 (con offset explícito)' }
  )
  to!: string;

  @IsOptional()
  @IsBoolean({ message: 'dryRun must be a boolean' })
  dryRun?: boolean;
}

export interface RecalculateResult {
  dryRun: boolean;
  eventsAffected: number;
  areaDowntimesAffected: number;
  discountDeltaSeconds: number; // + = ahora se descuenta más que antes
  effectiveDeltaSeconds: number;
}
