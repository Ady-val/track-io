import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

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

@Expose()
export class DepartmentResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  htmlColor?: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  deletedAt?: Date;
}
