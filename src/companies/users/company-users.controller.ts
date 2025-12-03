import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CompanyUsersService } from './company-users.service';
import { CompanyRoles } from '../../common/decorators/roles.decorator';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';

@Controller('companies/:companyId/users')
@CompanyRoles('admin')
export class CompanyUsersController {
  constructor(private service: CompanyUsersService) {}

  @Get()
  list(@Param('companyId') companyId: string) {
    return this.service.list(companyId);
  }

  @Post()
  create(@Param('companyId') companyId: string, @Body() dto: CreateCompanyUserDto) {
    return this.service.create(companyId, dto);
  }

  @Patch(':id')
  update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyUserDto,
  ) {
    return this.service.update(companyId, id, dto);
  }

  @Delete(':id')
  delete(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.service.delete(companyId, id);
  }
}
