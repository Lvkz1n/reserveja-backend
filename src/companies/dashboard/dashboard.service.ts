import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { endOfDay, startOfDay, endOfWeek, startOfWeek, startOfMonth } from 'date-fns';

@Injectable()
export class CompanyDashboardService {
  constructor(private prisma: PrismaService) {}

  async dashboard(companyId: string) {
    const today = new Date();
    const appointmentsTodayPromise = this.prisma.appointment.count({
      where: { companyId, date: { gte: startOfDay(today), lte: endOfDay(today) } },
    });
    const appointmentsWeekPromise = this.prisma.appointment.count({
      where: { companyId, date: { gte: startOfWeek(today), lte: endOfWeek(today) } },
    });
    const attendancePromise = this.calcAttendance(companyId);
    const nextAppointmentsPromise = this.prisma.appointment.findMany({
      where: { companyId, date: { gte: today } },
      include: { client: true, service: true, professional: { include: { user: true } } },
      orderBy: { date: 'asc' },
      take: 10,
    });

    const [appointmentsToday, appointmentsWeek, attendanceRate, nextAppointments] =
      await Promise.all([
        appointmentsTodayPromise,
        appointmentsWeekPromise,
        attendancePromise,
        nextAppointmentsPromise,
      ]);

    return {
      agendamentos_hoje: appointmentsToday,
      agendamentos_semana: appointmentsWeek,
      taxa_comparecimento_mes: attendanceRate,
      proximos_agendamentos: nextAppointments,
    };
  }

  private async calcAttendance(companyId: string) {
    const startMonth = startOfMonth(new Date());
    const [total, attended] = await this.prisma.$transaction([
      this.prisma.appointment.count({
        where: { companyId, date: { gte: startMonth } },
      }),
      this.prisma.appointment.count({
        where: { companyId, date: { gte: startMonth }, status: 'confirmed' },
      }),
    ]);
    if (total === 0) return 0;
    return Number(((attended / total) * 100).toFixed(2));
  }
}
