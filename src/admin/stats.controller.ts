import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';
import { GlobalRoles } from '../common/decorators/roles.decorator';

@Controller('admin')
@GlobalRoles('super_admin')
export class StatsController {
  constructor(private service: StatsService) {}

  @Get('stats')
  stats() {
    return this.service.stats();
  }

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }
}
