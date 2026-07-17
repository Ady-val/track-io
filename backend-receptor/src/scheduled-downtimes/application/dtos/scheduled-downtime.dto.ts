import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsPositive,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';

const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIME_FORMAT_MESSAGE = 'debe tener formato HH:mm (ej. 12:00)';

/**
 * Nota sobre ventanas que cruzan medianoche (ver PLAN_MIGRACION_IOTRACK.md §1.4b):
 * `endTime` PUEDE ser menor que `startTime`. Eso significa que la ventana cierra
 * al día siguiente (ej. 23:00 -> 02:00), siguiendo el modelo DTSTART+DURATION de
 * RFC 5545: `daysOfWeek` son los días en que la ventana ARRANCA.
 * Lo único inválido es `endTime === startTime` (ambiguo: 0 h o 24 h), y eso se
 * valida en ScheduledDowntimeService porque involucra dos campos.
 */

export class CreateScheduledDowntimeDto {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name!: string;

  @IsInt({ message: 'areaId must be an integer' })
  @IsPositive({ message: 'areaId must be a positive integer' })
  areaId!: number;

  @IsString()
  @Matches(TIME_FORMAT_REGEX, { message: `startTime ${TIME_FORMAT_MESSAGE}` })
  startTime!: string;

  @IsString()
  @Matches(TIME_FORMAT_REGEX, { message: `endTime ${TIME_FORMAT_MESSAGE}` })
  endTime!: string;

  @IsArray({ message: 'daysOfWeek must be an array' })
  @ArrayNotEmpty({ message: 'daysOfWeek cannot be empty' })
  @ArrayUnique({ message: 'daysOfWeek cannot contain duplicate values' })
  @IsInt({ each: true, message: 'each day in daysOfWeek must be an integer' })
  @Min(0, { each: true, message: 'daysOfWeek values must be between 0 and 6' })
  @Max(6, { each: true, message: 'daysOfWeek values must be between 0 and 6' })
  daysOfWeek!: number[];

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}

export class UpdateScheduledDowntimeDto {
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  name?: string;

  @IsOptional()
  @IsInt({ message: 'areaId must be an integer' })
  @IsPositive({ message: 'areaId must be a positive integer' })
  areaId?: number;

  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT_REGEX, { message: `startTime ${TIME_FORMAT_MESSAGE}` })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT_REGEX, { message: `endTime ${TIME_FORMAT_MESSAGE}` })
  endTime?: string;

  @IsOptional()
  @IsArray({ message: 'daysOfWeek must be an array' })
  @ArrayNotEmpty({ message: 'daysOfWeek cannot be empty' })
  @ArrayUnique({ message: 'daysOfWeek cannot contain duplicate values' })
  @IsInt({ each: true, message: 'each day in daysOfWeek must be an integer' })
  @Min(0, { each: true, message: 'daysOfWeek values must be between 0 and 6' })
  @Max(6, { each: true, message: 'daysOfWeek values must be between 0 and 6' })
  daysOfWeek?: number[];

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}

class ScheduledDowntimeAreaDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;
}

@Expose()
export class ScheduledDowntimeResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  areaId!: number;

  @Expose()
  @Type(() => ScheduledDowntimeAreaDto)
  area?: ScheduledDowntimeAreaDto;

  @Expose()
  startTime!: string;

  @Expose()
  endTime!: string;

  @Expose()
  daysOfWeek!: number[];

  @Expose()
  isActive!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  deletedAt?: Date;
}
