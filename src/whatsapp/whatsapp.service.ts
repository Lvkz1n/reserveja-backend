import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { AppointmentStatus, WhatsAppStatus } from '@prisma/client';

/**
 * Lógica adaptada de whatsapp-api-main/server.js (classe WhatsAppSession):
 * - gerenciamento de sessão (LocalAuth, QR code, status)
 * - formatação de número e envio de mensagens
 * - disparo de webhook em mensagens recebidas
 */
type SessionResponseStatus = 'connected' | 'waiting_for_scan' | 'disconnected';

interface WhatsAppSession {
  sessionId: string;
  client: Client;
  qrCode?: string;
  isReady: boolean;
  phoneNumber?: string;
  lastSeen?: Date;
  webhookUrl?: string;
  webhookEvents: string[];
  initializing?: Promise<void>;
}

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private readonly sessions = new Map<string, WhatsAppSession>();
  private readonly logger = new Logger(WhatsappService.name);
  private readonly sessionDataPath: string;

  constructor(private prisma: PrismaService, private config: ConfigService) {
    this.sessionDataPath = path.resolve(process.cwd(), '.wwebjs_auth');
    fs.ensureDirSync(this.sessionDataPath);
  }

  async onModuleInit() {
    // Auto-inicializa sessões existentes ao subir o backend.
    const connections = await this.prisma.whatsAppConnection.findMany();
    for (const connection of connections) {
      const sessionId = connection.externalInstanceId || this.buildSessionId(connection.companyId);
      this.initSession(sessionId).catch((error) =>
        this.logger.warn(`Falha ao reabrir sessão ${sessionId} no startup: ${String(error)}`),
      );
    }
  }

  private buildSessionId(companyId: string) {
    return `reserveja_company_${companyId}`;
  }

  private async ensureConnectionRecord(companyId: string, sessionId: string) {
    const existing = await this.prisma.whatsAppConnection.findFirst({
      where: { companyId },
    });
    if (existing) {
      if (existing.externalInstanceId !== sessionId) {
        return this.prisma.whatsAppConnection.update({
          where: { id: existing.id },
          data: { externalInstanceId: sessionId },
        });
      }
      return existing;
    }

    return this.prisma.whatsAppConnection.create({
      data: {
        companyId,
        externalInstanceId: sessionId,
        status: 'pending',
      },
    });
  }

  private async updateConnectionStatus(
    sessionId: string,
    status: WhatsAppStatus,
    lastQrCode?: string,
  ) {
    try {
      await this.prisma.whatsAppConnection.updateMany({
        where: { externalInstanceId: sessionId },
        data: { status, lastQrCode },
      });
    } catch (error) {
      this.logger.error(`Failed to persist WhatsApp status for ${sessionId}`, error as Error);
    }
  }

  private formatNumber(number: string) {
    // Adaptado de whatsapp-api-main/server.js -> WhatsAppSession.formatNumber
    if (number.includes('@') || number.startsWith('lid_')) {
      return number;
    }

    let cleanNumber = number.replace(/\D/g, '');
    const countryCode = '55';
    const defaultDdd = '11';

    if (cleanNumber.startsWith(countryCode)) {
      if (cleanNumber.length === 12 || cleanNumber.length === 13) {
        return `${cleanNumber}@c.us`;
      }
      throw new BadRequestException('Número com código de país (55) tem comprimento inválido.');
    }

    if (cleanNumber.length >= 10 && cleanNumber.length <= 11) {
      return `${countryCode}${cleanNumber}@c.us`;
    }

    if (cleanNumber.length >= 8 && cleanNumber.length <= 9) {
      return `${countryCode}${defaultDdd}${cleanNumber}@c.us`;
    }

    throw new BadRequestException('Formato de número não reconhecido ou inválido.');
  }

  private normalizePhoneForLookup(value: string | undefined) {
    if (!value) return undefined;
    return value.replace(/\D/g, '').replace(/^(55)/, '');
  }

  private async waitForQr(session: WhatsAppSession) {
    let attempts = 0;
    while (!session.qrCode && !session.isReady && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }
  }

  private async initSession(sessionId: string): Promise<WhatsAppSession> {
    let session = this.sessions.get(sessionId);
    if (session?.initializing) {
      await session.initializing;
      return session;
    }
    if (session?.client) return session;

    const managed: WhatsAppSession = {
      sessionId,
      client: null as unknown as Client,
      isReady: false,
      webhookEvents: [],
    };

    const client = new Client({
      // Referência direta da config do whatsapp-api-main (LocalAuth e puppeteer headless)
      authStrategy: new LocalAuth({ clientId: sessionId, dataPath: this.sessionDataPath }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
      },
    });
    managed.client = client;

    client.on('qr', async (qr) => {
      this.logger.log(`QR Code gerado para sessão ${sessionId}`);
      managed.qrCode = await QRCode.toDataURL(qr);
      managed.isReady = false;
      await this.updateConnectionStatus(sessionId, 'pending', managed.qrCode);
    });

    client.on('ready', async () => {
      this.logger.log(`Cliente WhatsApp pronto para sessão ${sessionId}`);
      managed.isReady = true;
      managed.phoneNumber = managed.client.info?.wid?.user;
      managed.lastSeen = new Date();
      await this.updateConnectionStatus(sessionId, 'connected');
      await this.configureWebhookIfNeeded(sessionId).catch((error) =>
        this.logger.error('Failed to configure webhook', error as Error),
      );
    });

    client.on('authenticated', () => {
      this.logger.log(`Cliente autenticado para sessão ${sessionId}`);
    });

    client.on('auth_failure', async (msg) => {
      this.logger.error(`Falha na autenticação para sessão ${sessionId}: ${msg}`);
      managed.isReady = false;
      await this.updateConnectionStatus(sessionId, 'disconnected');
    });

    client.on('disconnected', async (reason) => {
      this.logger.warn(`Cliente desconectado para sessão ${sessionId}: ${reason}`);
      managed.isReady = false;
      await this.updateConnectionStatus(sessionId, 'disconnected');
    });

    client.on('message', async (message) => {
      await this.handleIncomingMessageEvent(managed, message);
    });

    managed.initializing = client.initialize().catch((error) => {
      this.logger.error(`Erro ao inicializar sessão ${sessionId}`, error as Error);
      throw error;
    });
    this.sessions.set(sessionId, managed);
    await managed.initializing;
    return managed;
  }

  async createOrGetSession(companyId: string): Promise<{ qrCode?: string; status: SessionResponseStatus }> {
    const sessionId = this.buildSessionId(companyId);
    await this.ensureConnectionRecord(companyId, sessionId);

    const session = await this.initSession(sessionId);
    if (!session.isReady) {
      await this.waitForQr(session);
    }

    const status: SessionResponseStatus = session.isReady
      ? 'connected'
      : session.qrCode
        ? 'waiting_for_scan'
        : 'disconnected';

    if (!session.isReady && session.qrCode) {
      await this.updateConnectionStatus(sessionId, 'pending', session.qrCode);
    }

    return { qrCode: session.isReady ? undefined : session.qrCode, status };
  }

  async getSessionStatus(companyId: string): Promise<{ status: SessionResponseStatus; phoneNumber?: string }> {
    const sessionId = this.buildSessionId(companyId);
    await this.ensureConnectionRecord(companyId, sessionId);

    const session = this.sessions.get(sessionId);
    if (session?.isReady) {
      return { status: 'connected', phoneNumber: session.phoneNumber ? `+${session.phoneNumber}` : undefined };
    }

    if (session && !session.isReady) {
      return {
        status: session.qrCode ? 'waiting_for_scan' : 'disconnected',
        phoneNumber: session.phoneNumber ? `+${session.phoneNumber}` : undefined,
      };
    }

    // Nenhuma sessão em memória: tentar inicializar para recuperar status persistido
    try {
      const initialized = await this.initSession(sessionId);
      if (initialized.isReady) {
        return { status: 'connected', phoneNumber: initialized.phoneNumber ? `+${initialized.phoneNumber}` : undefined };
      }
      return { status: initialized.qrCode ? 'waiting_for_scan' : 'disconnected' };
    } catch (error) {
      this.logger.warn(`Não foi possível reabrir sessão ${sessionId}: ${String(error)}`);
      return { status: 'disconnected' };
    }
  }

  async sendTextMessage(companyId: string, to: string, message: string): Promise<void> {
    const sessionId = this.buildSessionId(companyId);
    await this.ensureConnectionRecord(companyId, sessionId);
    const session = await this.initSession(sessionId);

    if (!session.isReady) {
      throw new BadRequestException('Sessão do WhatsApp não está conectada.');
    }

    const chatId = this.formatNumber(to);
    await session.client.sendMessage(chatId, message);
  }

  async sendConfirmation(companyId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, companyId },
      include: {
        client: true,
        service: true,
        company: true,
      },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');

    const template =
      (await this.prisma.messageTemplate.findFirst({
        where: { companyId, type: 'confirmation', active: true },
      })) ??
      ({
        content: 'Olá {{nome_cliente}}, seu horário {{servico}} é dia {{data}} às {{hora}}.',
      } as any);

    const text = template.content
      .replace('{{nome_cliente}}', appointment.client.name)
      .replace('{{servico}}', appointment.service.name)
      .replace('{{data}}', appointment.date.toISOString().split('T')[0])
      .replace('{{hora}}', appointment.time);

    await this.sendTextMessage(companyId, appointment.client.phone, text);
    return { sent: true };
  }

  async configureWebhookIfNeeded(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    if (session.webhookUrl) return;

    const configuredUrl =
      this.config.get<string>('WHATSAPP_WEBHOOK_URL') ??
      `${this.config.get<string>('APP_URL') ?? `http://localhost:${this.config.get<number>('PORT') ?? 3000}`}/webhooks/whatsapp`;

    session.webhookUrl = configuredUrl;
    session.webhookEvents = ['message'];
  }

  private async handleIncomingMessageEvent(session: WhatsAppSession, message: Message) {
    if (!session.webhookUrl || !session.webhookEvents.includes('message')) return;
    try {
      await axios.post(
        session.webhookUrl,
        {
          type: 'message',
          from: message.from,
          message: {
            type: message.type,
            content: message.body,
            timestamp: new Date(message.timestamp * 1000).toISOString(),
          },
          session_id: session.sessionId,
        },
        { timeout: 5000 },
      );
    } catch (error) {
      this.logger.error(`Erro ao enviar webhook para sessão ${session.sessionId}`, error as Error);
    }
  }

  async handleIncoming(body: any) {
    const instanceId = body.session_id ?? body.instance_id;
    const rawMessage = typeof body.message === 'object' ? body.message?.content : body.message;
    const normalizedMessage = (rawMessage ?? '').toString().trim().toLowerCase();
    const fromPhone =
      body.phone ??
      (typeof body.from === 'string' ? body.from.replace(/@c\.us$/, '').replace(/\D/g, '') : undefined);

    if (!instanceId) throw new NotFoundException('Instance not registered');

    const connection = await this.prisma.whatsAppConnection.findFirst({
      where: { externalInstanceId: instanceId },
    });
    if (!connection) throw new NotFoundException('Instance not registered');

    const normalizedPhone = this.normalizePhoneForLookup(fromPhone);
    if (!normalizedPhone) return { acknowledged: true };

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        companyId: connection.companyId,
        client: { phone: { contains: normalizedPhone } },
        date: { gte: new Date() },
      },
      include: { client: true },
      orderBy: { date: 'asc' },
    });

    if (!appointment) return { acknowledged: true };

    let status: AppointmentStatus = appointment.status;
    if (normalizedMessage === '1' || normalizedMessage === 'sim') status = 'confirmed';
    if (normalizedMessage === '2' || normalizedMessage.includes('remarcar')) status = 'reschedule_requested';
    if (normalizedMessage === '3' || normalizedMessage.includes('não vou')) status = 'canceled';

    await this.prisma.appointment.update({ where: { id: appointment.id }, data: { status } });
    return { acknowledged: true, status };
  }

  async onModuleDestroy() {
    for (const session of this.sessions.values()) {
      if (session.client) {
        await session.client.destroy();
      }
    }
  }
}
