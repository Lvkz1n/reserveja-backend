import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { buildPagination } from '../../common/utils/pagination';
import { endOfDay, startOfDay } from 'date-fns';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async list(companyId: string, filters: any) {
    const pagination = buildPagination(filters);
    const where: any = { companyId };
    if (filters.date) {
      const start = startOfDay(new Date(filters.date));
      const end = endOfDay(new Date(filters.date));
      where.date = { gte: start, lte: end };
    }
    if (filters.professionalId) where.professionalId = filters.professionalId;
    if (filters.status) where.status = filters.status;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        include: {
          client: true,
          service: true,
          professional: { include: { user: true } },
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);
    return { data, meta: { page: pagination.page, perPage: pagination.perPage, total } };
  }

  async create(companyId: string, dto: CreateAppointmentDto) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    if (company.scheduleMode === 'per_professional' && !dto.professionalId) {
      throw new BadRequestException('professionalId is required for this company');
    }

    return this.prisma.appointment.create({
      data: {
        companyId,
        clientId: dto.clientId,
        serviceId: dto.serviceId,
        professionalId: dto.professionalId,
        date: new Date(dto.date),
        time: dto.time,
        status: dto.status ?? 'scheduled',
        source: dto.source ?? 'manual',
        notes: dto.notes,
      },
    });
  }

  async update(companyId: string, id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.prisma.appointment.findFirst({ where: { id, companyId } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return this.prisma.appointment.update({
      where: { id },
      data: {
        clientId: dto.clientId,
        serviceId: dto.serviceId,
        professionalId: dto.professionalId,
        date: dto.date ? new Date(dto.date) : undefined,
        time: dto.time,
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  async updateStatus(companyId: string, id: string, dto: UpdateStatusDto) {
    const appointment = await this.prisma.appointment.findFirst({ where: { id, companyId } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return this.prisma.appointment.update({ where: { id }, data: { status: dto.status } });
  }
}
