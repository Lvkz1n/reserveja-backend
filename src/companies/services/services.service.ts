import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  list(companyId: string) {
    return this.prisma.service.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  create(companyId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        companyId,
        name: dto.name,
        durationMinutes: dto.durationMinutes,
        price: dto.price,
        active: dto.active ?? true,
      },
    });
  }

  async update(companyId: string, id: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.findFirst({ where: { id, companyId } });
    if (!service) throw new NotFoundException('Service not found');
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  async delete(companyId: string, id: string) {
    const service = await this.prisma.service.findFirst({ where: { id, companyId } });
    if (!service) throw new NotFoundException('Service not found');
    await this.prisma.service.delete({ where: { id } });
    return { deleted: true };
  }
}
