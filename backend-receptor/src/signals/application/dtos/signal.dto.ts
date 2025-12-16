import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SignalDto {
  @IsString({ message: 'id must be a string' })
  @IsNotEmpty({ message: 'id is required' })
  id!: string;

  @IsString({ message: 'value must be a string' })
  @IsNotEmpty({ message: 'value is required' })
  value!: string;
}

export class VirtualDeviceSignalDto extends SignalDto {
  @IsString({ message: 'reason must be a string' })
  @IsOptional()
  reason?: string;

  @IsString({ message: 'comment must be a string' })
  @IsOptional()
  comment?: string;
}
