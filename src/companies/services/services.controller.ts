import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CompanyRoles } from '../../common/decorators/roles.decorator';

@Controller('companies/:companyId/services')
export class ServicesController {
  constructor(private service: ServicesService) {}

  @Get()
  list(@Param('companyId') companyId: string) {
    return this.service.list(companyId);
  }

  @CompanyRoles('admin', 'atendente')
  @Post()
  create(@Param('companyId') companyId: string, @Body() dto: CreateServiceDto) {
    return this.service.create(companyId, dto);
  }

  @CompanyRoles('admin', 'atendente')
  @Patch(':id')
  update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.service.update(companyId, id, dto);
  }

  @CompanyRoles('admin', 'atendente')
  @Delete(':id')
  delete(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.service.delete(companyId, id);
  }
}
