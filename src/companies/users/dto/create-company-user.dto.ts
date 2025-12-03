import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RoleCompany } from '@prisma/client';

export class CreateCompanyUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(RoleCompany)
  roleCompany: RoleCompany;
}
