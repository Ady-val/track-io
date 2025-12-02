import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsArray,
  IsInt,
  ArrayMinSize,
} from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

export class CreateRoleDto {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  @MaxLength(255, { message: 'name must not exceed 255 characters' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  @MaxLength(255, { message: 'name must not exceed 255 characters' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;
}

export class AssignPermissionsDto {
  @IsArray({ message: 'permissionIds must be an array' })
  @ArrayMinSize(1, {
    message: 'permissionIds must contain at least one permission',
  })
  @IsInt({ each: true, message: 'Each permissionId must be an integer' })
  permissionIds!: number[];
}

@Expose()
export class PermissionResponseDto {
  @Expose()
  id!: number;

  @Expose()
  module!: string;

  @Expose()
  action!: string;

  @Expose()
  description?: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}

@Expose()
export class RoleResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  description?: string;

  @Expose()
  permissions?: PermissionResponseDto[];

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  deletedAt?: Date;
}
