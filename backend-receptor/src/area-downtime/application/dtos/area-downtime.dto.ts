import {
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
} from 'class-validator';

export class CreateAreaDowntimeDto {
  @IsNumber()
  areaId!: number;

  @IsDateString()
  startAt!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  relatedEvents?: number[];
}

export class UpdateAreaDowntimeDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  relatedEvents?: number[];
}

export class AreaDowntimeFiltersDto {
  @IsOptional()
  @IsNumber()
  areaId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}
