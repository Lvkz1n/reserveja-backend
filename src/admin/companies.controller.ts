import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { GlobalRoles } from '../common/decorators/roles.decorator';

@Controller('admin/companies')
@GlobalRoles('super_admin')
export class CompaniesController {
  constructor(private service: CompaniesService) {}

  @Get()
  list(@Query('page') page = 1, @Query('perPage') perPage = 20) {
    return this.service.list(Number(page), Number(perPage));
  }

  @Post()
  create(@Body() dto: CreateCompanyDto) {
    return this.service.create(dto);
  }

  @Get(':companyId')
  get(@Param('companyId') companyId: string) {
    return this.service.findById(companyId);
  }

  @Patch(':companyId')
  update(@Param('companyId') companyId: string, @Body() dto: UpdateCompanyDto) {
    return this.service.update(companyId, dto);
  }
}
