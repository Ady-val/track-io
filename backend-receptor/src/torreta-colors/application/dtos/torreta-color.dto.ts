import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
  IsInt,
  Min,
} from 'class-validator';

export class CreateTorretaColorDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'htmlColor must be a valid hex color (e.g., #FF0000)',
  })
  htmlColor!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  deviceColorId!: string;

  @IsInt()
  @Min(0)
  order!: number;
}

export class UpdateTorretaColorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'htmlColor must be a valid hex color (e.g., #FF0000)',
  })
  htmlColor?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  deviceColorId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
