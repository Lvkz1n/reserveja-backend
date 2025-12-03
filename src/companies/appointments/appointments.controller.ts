import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CompanyRoles } from '../../common/decorators/roles.decorator';
import { WhatsappService } from '../../whatsapp/whatsapp.service';

@Controller('companies/:companyId/appointments')
export class AppointmentsController {
  constructor(
    private service: AppointmentsService,
    private whatsappService: WhatsappService,
  ) {}

  @Get()
  list(
    @Param('companyId') companyId: string,
    @Query('date') date?: string,
    @Query('professionalId') professionalId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.service.list(companyId, { date, professionalId, status, page: Number(page), perPage: Number(perPage) });
  }

  @CompanyRoles('admin', 'atendente')
  @Post()
  create(@Param('companyId') companyId: string, @Body() dto: CreateAppointmentDto) {
    return this.service.create(companyId, dto);
  }

  @CompanyRoles('admin', 'atendente')
  @Patch(':id')
  update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.service.update(companyId, id, dto);
  }

  @CompanyRoles('admin', 'atendente', 'profissional')
  @Patch(':id/status')
  updateStatus(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.service.updateStatus(companyId, id, dto);
  }

  @CompanyRoles('admin', 'atendente')
  @Post(':appointmentId/send-confirmation')
  async sendConfirmation(
    @Param('companyId') companyId: string,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.whatsappService.sendConfirmation(companyId, appointmentId);
  }
}
