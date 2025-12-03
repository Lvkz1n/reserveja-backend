import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.plan.findMany({ orderBy: { createdAt: 'asc' } });
  }

  create(dto: CreatePlanDto) {
    return this.prisma.plan.create({
      data: { name: dto.name, description: dto.description, price: dto.price },
    });
  }

  update(id: string, dto: CreatePlanDto) {
    return this.prisma.plan.update({
      where: { id },
      data: { name: dto.name, description: dto.description, price: dto.price },
    });
  }
}
