import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompanyUsersService {
  constructor(private prisma: PrismaService) {}

  list(companyId: string) {
    return this.prisma.companyUser.findMany({
      where: { companyId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(companyId: string, dto: CreateCompanyUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already in use');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.companyUser.create({
      data: {
        roleCompany: dto.roleCompany,
        company: { connect: { id: companyId } },
        user: {
          create: {
            name: dto.name,
            email: dto.email,
            passwordHash,
            roleGlobal: 'user',
          },
        },
      },
      include: { user: true },
    });
  }

  async update(companyId: string, id: string, dto: UpdateCompanyUserDto) {
    const companyUser = await this.prisma.companyUser.findFirst({ where: { id, companyId } });
    if (!companyUser) throw new NotFoundException('User not found');
    return this.prisma.companyUser.update({
      where: { id },
      data: {
        roleCompany: dto.roleCompany,
        user: dto.name ? { update: { name: dto.name } } : undefined,
      },
      include: { user: true },
    });
  }

  async delete(companyId: string, id: string) {
    const companyUser = await this.prisma.companyUser.findFirst({ where: { id, companyId } });
    if (!companyUser) throw new NotFoundException('User not found');
    await this.prisma.companyUser.delete({ where: { id } });
    return { deleted: true };
  }
}
