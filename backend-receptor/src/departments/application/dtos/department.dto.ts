import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateDepartmentDto {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'htmlColor must be a valid hex color (e.g., #FF0000)',
  })
  htmlColor?: string;
}

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'htmlColor must be a valid hex color (e.g., #FF0000)',
  })
  htmlColor?: string;
}

export class DepartmentResponseDto {
  id!: number;
  name!: string;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;
}
