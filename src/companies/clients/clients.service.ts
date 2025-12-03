import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  list(companyId: string, search?: string) {
    return this.prisma.client.findMany({
      where: {
        companyId,
        OR: search
          ? [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(companyId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        companyId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        notes: dto.notes,
      },
    });
  }

  async get(companyId: string, id: string) {
    const client = await this.prisma.client.findFirst({ where: { id, companyId } });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(companyId: string, id: string, dto: UpdateClientDto) {
    await this.get(companyId, id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }
}
