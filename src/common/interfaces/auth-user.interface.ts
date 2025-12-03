import { RoleCompany, RoleGlobal } from '@prisma/client';

export interface AuthUser {
  userId: string;
  roleGlobal: RoleGlobal;
  email: string;
  companyRoles: { companyId: string; roleCompany: RoleCompany }[];
}
