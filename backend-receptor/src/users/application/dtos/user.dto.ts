import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

export class CreateUserDto {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  @MaxLength(255, { message: 'name must not exceed 255 characters' })
  name!: string;

  @IsString({ message: 'username must be a string' })
  @IsNotEmpty({ message: 'username is required' })
  @MinLength(3, { message: 'username must be at least 3 characters' })
  @MaxLength(255, { message: 'username must not exceed 255 characters' })
  username!: string;

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password is required' })
  @MinLength(6, { message: 'password must be at least 6 characters' })
  @MaxLength(255, { message: 'password must not exceed 255 characters' })
  password!: string;

  @IsOptional()
  @IsString({ message: 'createdBy must be a string' })
  @MaxLength(255, { message: 'createdBy must not exceed 255 characters' })
  createdBy?: string | null;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  @MaxLength(255, { message: 'name must not exceed 255 characters' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'username must be a string' })
  @IsNotEmpty({ message: 'username cannot be empty' })
  @MinLength(3, { message: 'username must be at least 3 characters' })
  @MaxLength(255, { message: 'username must not exceed 255 characters' })
  username?: string;

  @IsOptional()
  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password cannot be empty' })
  @MinLength(6, { message: 'password must be at least 6 characters' })
  @MaxLength(255, { message: 'password must not exceed 255 characters' })
  password?: string;
}

@Expose()
export class UserResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  username!: string;

  @Expose()
  createdBy?: string | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  password?: string;

  @Exclude()
  deletedAt?: Date;
}
