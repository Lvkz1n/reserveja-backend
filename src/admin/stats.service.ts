import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { subDays, startOfMonth } from 'date-fns';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async stats() {
    const monthStart = startOfMonth(new Date());
    const [totalCompanies, appointmentsThisMonth, messagesSent] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.appointment.count({ where: { createdAt: { gte: monthStart } } }),
      Promise.resolve(0),
    ]);
    return {
      total_empresas: totalCompanies,
      total_agendamentos_mes: appointmentsThisMonth,
      total_mensagens_enviadas: messagesSent,
    };
  }

  async dashboard() {
    const today = new Date();
    const weekStart = subDays(today, 7);
    const [totalCompanies, appointmentsWeek] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.appointment.count({ where: { createdAt: { gte: weekStart } } }),
    ]);
    return {
      total_empresas: totalCompanies,
      agendamentos_semana: appointmentsWeek,
    };
  }
}
