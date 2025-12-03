import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class CompanySettingsService {
  constructor(private prisma: PrismaService) {}

  async get(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    return { scheduleMode: company.scheduleMode, businessHours: null };
  }

  async update(companyId: string, dto: UpdateSettingsDto) {
    await this.prisma.company.update({
      where: { id: companyId },
      data: { scheduleMode: dto.scheduleMode },
    });
    return this.get(companyId);
  }
}
