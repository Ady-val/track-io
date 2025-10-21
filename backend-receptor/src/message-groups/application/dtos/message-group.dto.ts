import {
  IsString,
  IsNotEmpty,
  Length,
  Matches,
  IsInt,
  Min,
} from 'class-validator';

export class CreateMessageGroupDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color (e.g., #FF0000)',
  })
  color!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  description!: string;

  @IsInt()
  @Min(0)
  order!: number;
}

export class UpdateMessageGroupDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color (e.g., #FF0000)',
  })
  color?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  description?: string;

  @IsInt()
  @Min(0)
  order?: number;
}
