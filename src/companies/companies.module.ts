import { Module } from '@nestjs/common';
import { CompanyController } from './company/company.controller';
import { CompanyService } from './company/company.service';
import { CompanyUsersController } from './users/company-users.controller';
import { CompanyUsersService } from './users/company-users.service';
import { ServicesController } from './services/services.controller';
import { ServicesService } from './services/services.service';
import { ClientsController } from './clients/clients.controller';
import { ClientsService } from './clients/clients.service';
import { AppointmentsController } from './appointments/appointments.controller';
import { AppointmentsService } from './appointments/appointments.service';
import { MessageTemplatesController } from './message-templates/message-templates.controller';
import { MessageTemplatesService } from './message-templates/message-templates.service';
import { CompanyDashboardController } from './dashboard/dashboard.controller';
import { CompanyDashboardService } from './dashboard/dashboard.service';
import { CompanySettingsController } from './settings/settings.controller';
import { CompanySettingsService } from './settings/settings.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule],
  controllers: [
    CompanyController,
    CompanyUsersController,
    ServicesController,
    ClientsController,
    AppointmentsController,
    MessageTemplatesController,
    CompanyDashboardController,
    CompanySettingsController,
  ],
  providers: [
    CompanyService,
    CompanyUsersService,
    ServicesService,
    ClientsService,
    AppointmentsService,
    MessageTemplatesService,
    CompanyDashboardService,
    CompanySettingsService,
  ],
})
export class CompaniesModule {}
