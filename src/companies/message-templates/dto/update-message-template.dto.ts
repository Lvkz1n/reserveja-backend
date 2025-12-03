import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { MessageTemplateType } from '@prisma/client';

export class UpdateMessageTemplateDto {
  @IsOptional()
  @IsEnum(MessageTemplateType)
  type?: MessageTemplateType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
