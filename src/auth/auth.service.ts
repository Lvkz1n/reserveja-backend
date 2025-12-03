import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RoleGlobal } from '@prisma/client';

interface TokenPayload {
  sub: string;
  roleGlobal: RoleGlobal;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        companyUsers: true,
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  private async createTokens(payload: TokenPayload & { companyRoles?: any[] }) {
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    });
    return { accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const companies = await this.prisma.companyUser.findMany({
      where: { userId: user.id },
      include: { company: true },
    });

    const payload: TokenPayload & { companyRoles: any[] } = {
      sub: user.id,
      roleGlobal: user.roleGlobal,
      email: user.email,
      companyRoles: companies.map((c) => ({ companyId: c.companyId, roleCompany: c.roleCompany })),
    };
    const { accessToken, refreshToken } = await this.createTokens(payload);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + this.parseExpires(this.config.get('JWT_REFRESH_EXPIRES_IN'))),
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role_global: user.roleGlobal,
        companies: companies.map((c) => ({
          company_id: c.companyId,
          company_name: c.company.name,
          role_company: c.roleCompany,
        })),
      },
    };
  }

  async refresh(token: string) {
    try {
      const payload = await this.jwt.verifyAsync<TokenPayload>(token, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      const stored = await this.prisma.refreshToken.findUnique({ where: { token } });
      if (!stored || stored.expiresAt < new Date()) {
        throw new ForbiddenException('Refresh token expired');
      }

      const companies = await this.prisma.companyUser.findMany({
        where: { userId: payload.sub },
      });
      const { accessToken, refreshToken } = await this.createTokens({
        sub: payload.sub,
        roleGlobal: payload.roleGlobal,
        email: payload.email,
        companyRoles: companies.map((c) => ({ companyId: c.companyId, roleCompany: c.roleCompany })),
      });

      await this.prisma.refreshToken.upsert({
        where: { token },
        update: {
          token: refreshToken,
          expiresAt: new Date(Date.now() + this.parseExpires(this.config.get('JWT_REFRESH_EXPIRES_IN'))),
        },
        create: {
          token: refreshToken,
          userId: payload.sub,
          expiresAt: new Date(Date.now() + this.parseExpires(this.config.get('JWT_REFRESH_EXPIRES_IN'))),
        },
      });

      return { access_token: accessToken, refresh_token: refreshToken };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(token: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
    return { success: true };
  }

  async seedSuperAdmin() {
    const email = 'admin@reserveja.local';
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) return;
    const passwordHash = await bcrypt.hash('admin123', 10);
    await this.prisma.user.create({
      data: {
        email,
        name: 'Super Admin',
        roleGlobal: 'super_admin',
        passwordHash,
      },
    });
  }

  private parseExpires(value?: string): number {
    if (!value) return 7 * 24 * 60 * 60 * 1000;
    if (value.endsWith('d')) {
      return parseInt(value) * 24 * 60 * 60 * 1000;
    }
    if (value.endsWith('h')) {
      return parseInt(value) * 60 * 60 * 1000;
    }
    if (value.endsWith('m')) {
      return parseInt(value) * 60 * 1000;
    }
    const asNumber = parseInt(value);
    if (Number.isNaN(asNumber)) throw new BadRequestException('Invalid expires config');
    return asNumber * 1000;
  }
}
