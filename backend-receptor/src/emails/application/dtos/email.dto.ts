import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateEmailDto {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name!: string;

  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email is required' })
  email!: string;
}

export class UpdateEmailDto {
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email cannot be empty' })
  email?: string;
}

export class EmailResponseDto {
  id!: number;
  name!: string;
  email!: string;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;
}
