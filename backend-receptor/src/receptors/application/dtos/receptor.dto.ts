import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Length,
} from 'class-validator';

export class CreateReceptorDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  externalId!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateReceptorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  externalId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
