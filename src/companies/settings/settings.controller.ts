import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { CompanySettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CompanyRoles } from '../../common/decorators/roles.decorator';

@Controller('companies/:companyId/settings')
export class CompanySettingsController {
  constructor(private service: CompanySettingsService) {}

  @Get()
  get(@Param('companyId') companyId: string) {
    return this.service.get(companyId);
  }

  @CompanyRoles('admin')
  @Patch()
  update(@Param('companyId') companyId: string, @Body() dto: UpdateSettingsDto) {
    return this.service.update(companyId, dto);
  }
}
