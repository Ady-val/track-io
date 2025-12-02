import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { Module, Action } from '../../constants/permissions.constants';

export class CreatePermissionDto {
  @IsEnum(Module, { message: 'module must be a valid Module enum value' })
  module!: Module;

  @IsEnum(Action, { message: 'action must be a valid Action enum value' })
  action!: Action;

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;
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
