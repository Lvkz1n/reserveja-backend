import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { GlobalRoles } from '../common/decorators/roles.decorator';

@Controller('admin/plans')
@GlobalRoles('super_admin')
export class PlansController {
  constructor(private service: PlansService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body() dto: CreatePlanDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CreatePlanDto) {
    return this.service.update(id, dto);
  }
}
