import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
import { RoleCompany, RoleGlobal } from '@prisma/client';
import { GLOBAL_ROLES_KEY, COMPANY_ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredGlobal = this.reflector.getAllAndOverride<RoleGlobal[]>(GLOBAL_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredCompany = this.reflector.getAllAndOverride<RoleCompany[]>(COMPANY_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no role requirement, allow and let other guards (JWT/Company) handle auth.
    if (!requiredGlobal?.length && !requiredCompany?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;
    if (!user) {
      throw new ForbiddenException('Missing authenticated user');
    }

    if (requiredGlobal?.length) {
      if (!requiredGlobal.includes(user.roleGlobal)) {
        throw new ForbiddenException('Insufficient global role');
      }
    }

    if (requiredCompany?.length) {
      const companyId = request.params?.companyId ?? request.headers['x-company-id'];
      if (!companyId) {
        throw new ForbiddenException('Company not specified');
      }
      const membership =
        user.companyRoles?.find((c) => c.companyId === companyId) ?? request.companyMembership;
      if (!membership || !requiredCompany.includes(membership.roleCompany)) {
        throw new ForbiddenException('Insufficient company permissions');
      }
    }

    return true;
  }
}
