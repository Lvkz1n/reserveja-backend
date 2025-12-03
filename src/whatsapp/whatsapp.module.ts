import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappCompanyController } from './whatsapp-company.controller';

@Module({
  controllers: [WhatsappController, WhatsappCompanyController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
