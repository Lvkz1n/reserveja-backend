import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { MessageTemplatesService } from './message-templates.service';
import { CreateMessageTemplateDto } from './dto/create-message-template.dto';
import { UpdateMessageTemplateDto } from './dto/update-message-template.dto';
import { CompanyRoles } from '../../common/decorators/roles.decorator';

@Controller('companies/:companyId/message-templates')
export class MessageTemplatesController {
  constructor(private service: MessageTemplatesService) {}

  @Get()
  list(@Param('companyId') companyId: string) {
    return this.service.list(companyId);
  }

  @CompanyRoles('admin', 'atendente')
  @Post()
  create(@Param('companyId') companyId: string, @Body() dto: CreateMessageTemplateDto) {
    return this.service.create(companyId, dto);
  }

  @CompanyRoles('admin', 'atendente')
  @Patch(':id')
  update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMessageTemplateDto,
  ) {
    return this.service.update(companyId, id, dto);
  }

  @CompanyRoles('admin', 'atendente')
  @Delete(':id')
  delete(@Param('companyId') companyId: string, @Param('id') id: string) {
    return this.service.delete(companyId, id);
  }
}
