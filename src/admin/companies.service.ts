import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import * as bcrypt from 'bcrypt';
import { buildPagination } from '../common/utils/pagination';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async list(page = 1, perPage = 20) {
    const pagination = buildPagination({ page, perPage });
    const [data, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.company.count(),
    ]);
    return { data, meta: { total, page: pagination.page, perPage: pagination.perPage } };
  }

  async create(dto: CreateCompanyDto) {
    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);
    return this.prisma.company.create({
      data: {
        name: dto.name,
        document: dto.document,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        status: dto.status ?? 'active',
        plan: dto.plan,
        logoUrl: dto.logoUrl,
        primaryColor: dto.primaryColor,
        scheduleMode: dto.scheduleMode ?? 'global',
        companyUsers: {
          create: {
            roleCompany: 'admin',
            user: {
              create: {
                name: dto.adminName,
                email: dto.adminEmail,
                passwordHash,
                roleGlobal: 'user',
              },
            },
          },
        },
      },
      include: { companyUsers: { include: { user: true } } },
    });
  }

  async findById(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(companyId: string, dto: UpdateCompanyDto) {
    await this.findById(companyId);
    return this.prisma.company.update({
      where: { id: companyId },
      data: dto,
    });
  }
}
