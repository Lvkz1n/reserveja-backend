import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { MessageTemplateType } from '@prisma/client';

export class CreateMessageTemplateDto {
  @IsEnum(MessageTemplateType)
  type: MessageTemplateType;

  @IsString()
  name: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
