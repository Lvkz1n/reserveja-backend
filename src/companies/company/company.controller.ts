import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { CompanyService } from './company.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyRoles } from '../../common/decorators/roles.decorator';

@Controller('companies/:companyId')
export class CompanyController {
  constructor(private service: CompanyService) {}

  @Get()
  get(@Param('companyId') companyId: string) {
    return this.service.get(companyId);
  }

  @Patch()
  @CompanyRoles('admin')
  update(@Param('companyId') companyId: string, @Body() dto: UpdateCompanyDto) {
    return this.service.update(companyId, dto);
  }
}
