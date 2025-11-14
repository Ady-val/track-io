import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Length,
} from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

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
}

@Expose()
export class TorretaResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  description?: string;

  @Expose()
  externalId?: string;

  @Expose()
  isActive!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  deletedAt?: Date;
}
