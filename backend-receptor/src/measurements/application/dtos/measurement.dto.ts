import { IsString, IsNotEmpty } from 'class-validator';

export class MeasurementDto {
  @IsString({ message: 'id must be a string' })
  @IsNotEmpty({ message: 'id is required' })
  id!: string;

  @IsString({ message: 'value must be a string' })
  @IsNotEmpty({ message: 'value is required' })
  value!: string;
}
