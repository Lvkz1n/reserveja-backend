import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class CompanyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;
    const companyId = request.params?.companyId ?? request.headers['x-company-id'];

    if (!companyId) return true;
    if (!user) throw new ForbiddenException('Missing authenticated user');
    if (user.roleGlobal === 'super_admin') return true;

    const membership = await this.prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: user.userId, companyId } },
    });
    if (!membership) {
      throw new NotFoundException('Company not found for this user');
    }

    request.companyMembership = membership;
    return true;
  }
}
