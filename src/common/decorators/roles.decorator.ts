import { SetMetadata } from '@nestjs/common';
import { RoleGlobal, RoleCompany } from '@prisma/client';

export const GLOBAL_ROLES_KEY = 'globalRoles';
export const COMPANY_ROLES_KEY = 'companyRoles';

export const GlobalRoles = (...roles: RoleGlobal[]) => SetMetadata(GLOBAL_ROLES_KEY, roles);
export const CompanyRoles = (...roles: RoleCompany[]) => SetMetadata(COMPANY_ROLES_KEY, roles);
