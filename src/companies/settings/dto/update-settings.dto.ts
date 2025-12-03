import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ScheduleMode } from '@prisma/client';

export class UpdateSettingsDto {
  @IsOptional()
  @IsEnum(ScheduleMode)
  scheduleMode?: ScheduleMode;

  @IsOptional()
  @IsString()
  businessHours?: string;
}
