import {
  IsInt,
  IsNumber,
  IsString,
  IsArray,
  IsNotEmpty,
} from 'class-validator';

export class CreateAlertTriggerDto {
  @IsInt()
  alertRuleId!: number;

  @IsInt()
  rawMeasurementId!: number;

  @IsNumber()
  measurementValue!: number;

  @IsString()
  @IsNotEmpty()
  conditionResult!: string;

  @IsArray()
  @IsInt({ each: true })
  messagesTriggered!: number[];
}
