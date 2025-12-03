import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageTemplateDto } from './dto/create-message-template.dto';
import { UpdateMessageTemplateDto } from './dto/update-message-template.dto';

@Injectable()
export class MessageTemplatesService {
  constructor(private prisma: PrismaService) {}

  list(companyId: string) {
    return this.prisma.messageTemplate.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
  }

  create(companyId: string, dto: CreateMessageTemplateDto) {
    return this.prisma.messageTemplate.create({
      data: { companyId, ...dto, active: dto.active ?? true },
    });
  }

  async update(companyId: string, id: string, dto: UpdateMessageTemplateDto) {
    const template = await this.prisma.messageTemplate.findFirst({ where: { id, companyId } });
    if (!template) throw new NotFoundException('Template not found');
    return this.prisma.messageTemplate.update({ where: { id }, data: dto });
  }

  async delete(companyId: string, id: string) {
    const template = await this.prisma.messageTemplate.findFirst({ where: { id, companyId } });
    if (!template) throw new NotFoundException('Template not found');
    await this.prisma.messageTemplate.delete({ where: { id } });
    return { deleted: true };
  }
}
