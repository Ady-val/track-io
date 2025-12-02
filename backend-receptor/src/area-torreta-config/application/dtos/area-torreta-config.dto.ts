import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
} from 'class-validator';
import { TorretaConfigurationType } from '../../domain/entities/area-torreta-config.entity';

export class CreateAreaTorretaConfigDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty({ message: 'areaId is required' })
  areaId!: number;

  @IsString()
  @IsNotEmpty({ message: 'torretaExternalId is required' })
  torretaExternalId!: string;

  @IsEnum(TorretaConfigurationType, {
    message: 'configurationType must be either "area" or "department"',
  })
  @IsNotEmpty({ message: 'configurationType is required' })
  configurationType!: TorretaConfigurationType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAreaTorretaConfigDto {
  @IsOptional()
  @IsEnum(TorretaConfigurationType, {
    message: 'configurationType must be either "area" or "department"',
  })
  configurationType?: TorretaConfigurationType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
