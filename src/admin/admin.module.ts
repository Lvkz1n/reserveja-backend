import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  controllers: [CompaniesController, PlansController, StatsController],
  providers: [CompaniesService, PlansService, StatsService],
})
export class AdminModule {}
