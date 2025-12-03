import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ScheduleMode } from '@prisma/client';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsEnum(ScheduleMode)
  scheduleMode?: ScheduleMode;
}
