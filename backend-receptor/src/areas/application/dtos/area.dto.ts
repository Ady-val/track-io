import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

export class CreateAreaDto {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name!: string;
}

export class UpdateAreaDto {
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  name?: string;
}

@Expose()
export class AreaResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  deletedAt?: Date;
}
