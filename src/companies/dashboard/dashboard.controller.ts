import { Controller, Get, Param } from '@nestjs/common';
import { CompanyDashboardService } from './dashboard.service';

@Controller('companies/:companyId/dashboard')
export class CompanyDashboardController {
  constructor(private service: CompanyDashboardService) {}

  @Get()
  dashboard(@Param('companyId') companyId: string) {
    return this.service.dashboard(companyId);
  }
}
