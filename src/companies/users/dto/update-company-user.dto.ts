import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RoleCompany } from '@prisma/client';

export class UpdateCompanyUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(RoleCompany)
  roleCompany?: RoleCompany;
}
