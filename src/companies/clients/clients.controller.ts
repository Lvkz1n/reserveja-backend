import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CompanyRoles } from '../../common/decorators/roles.decorator';

@Controller('companies/:companyId/clients')
export class ClientsController {
  constructor(private service: ClientsService) {}

  @Get()
  list(@Param('companyId') companyId: string, @Query('search') search?: string) {
    return this.service.list(companyId, search);
  }

  @Post()
  create(@Param('companyId') companyId: string, @Body() dto: CreateClientDto) {
    return this.service.create(companyId, dto);
  }

  @Get(':id')
  get(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.service.get(companyId, id);
  }

  @Patch(':id')
  update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.service.update(companyId, id, dto);
  }
}
