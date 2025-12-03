import { Controller, Get, Param, Post } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { CompanyRoles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('companies/:companyId/whatsapp')
export class WhatsappCompanyController {
  constructor(private service: WhatsappService, private prisma: PrismaService) {}

  @CompanyRoles('admin', 'atendente')
  @Post('connect')
  async connect(@Param('companyId') companyId: string) {
    const result = await this.service.createOrGetSession(companyId);

    await this.prisma.whatsAppConnection.updateMany({
      where: { companyId },
      data: {
        lastQrCode: result.qrCode,
        status: result.status === 'connected' ? 'connected' : 'pending',
      },
    });

    return { status: result.status, qr_code: result.qrCode };
  }

  @CompanyRoles('admin', 'atendente')
  @Get('status')
  async status(@Param('companyId') companyId: string) {
    const status = await this.service.getSessionStatus(companyId);
    return { status: status.status, phone_number: status.phoneNumber };
  }
}
