import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsIn,
  Length,
} from 'class-validator';

export class CreateTorretaDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  externalId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Banner fields
  @IsOptional()
  @IsIn(['STANDARD', 'BANNER'])
  type?: 'STANDARD' | 'BANNER';

  @IsOptional()
  @IsIn(['AREA', 'DEPARTMENT'])
  mode?: 'AREA' | 'DEPARTMENT';

  @IsOptional()
  @IsInt()
  @Min(1)
  startRegister?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  registerCount?: number;

  // Associations for BANNER modes
  @IsOptional()
  @IsInt()
  @Min(1)
  areaId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  departmentId?: number;
}

export class UpdateTorretaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  externalId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(['STANDARD', 'BANNER'])
  type?: 'STANDARD' | 'BANNER';

  @IsOptional()
  @IsIn(['AREA', 'DEPARTMENT'])
  mode?: 'AREA' | 'DEPARTMENT';

  @IsOptional()
  @IsInt()
  @Min(1)
  startRegister?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  registerCount?: number;

  // Associations for BANNER modes
  @IsOptional()
  @IsInt()
  @Min(1)
  areaId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  departmentId?: number;
}
