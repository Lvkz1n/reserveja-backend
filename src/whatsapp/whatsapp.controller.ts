import { Body, Controller, Post } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('webhooks')
export class WhatsappController {
  constructor(private service: WhatsappService) {}

  @Public()
  @Post('whatsapp')
  webhook(@Body() body: any) {
    return this.service.handleIncoming(body);
  }
}
