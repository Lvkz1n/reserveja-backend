import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AppointmentSource, AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @IsUUID()
  clientId: string;

  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsUUID()
  professionalId?: string;

  @IsDateString()
  date: string;

  @IsString()
  time: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsEnum(AppointmentSource)
  source?: AppointmentSource;

  @IsOptional()
  @IsString()
  notes?: string;
}
