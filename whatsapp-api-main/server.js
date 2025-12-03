const express = require('express');
const cors = require('cors');
const multer = require('multer');
const QRCode = require('qrcode');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limite
  }
});

// Armazenamento de sessões e clientes WhatsApp
const sessions = new Map();
const webhooks = new Map();

/**
 * Classe para gerenciar sessões do WhatsApp
 */
class WhatsAppSession {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.client = null;
    this.qrCode = null;
    this.isReady = false;
    this.phoneNumber = null;
    this.lastSeen = new Date();
    this.webhookUrl = null;
    this.webhookEvents = [];
  }

  /**
   * Inicializa o cliente WhatsApp
   */
  async initialize() {
    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: this.sessionId }),
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
          '--disable-gpu'
        ]
      }
    });

    // Event listeners
    this.client.on('qr', async (qr) => {
      console.log(`QR Code gerado para sessão ${this.sessionId}`);
      this.qrCode = await QRCode.toDataURL(qr);
    });

    this.client.on('ready', () => {
      console.log(`Cliente WhatsApp pronto para sessão ${this.sessionId}`);
      this.isReady = true;
      this.phoneNumber = this.client.info.wid.user;
      this.lastSeen = new Date();
    });

    this.client.on('authenticated', () => {
      console.log(`Cliente autenticado para sessão ${this.sessionId}`);
    });

    this.client.on('auth_failure', (msg) => {
      console.error(`Falha na autenticação para sessão ${this.sessionId}:`, msg);
    });

    this.client.on('disconnected', (reason) => {
      console.log(`Cliente desconectado para sessão ${this.sessionId}:`, reason);
      this.isReady = false;
    });

    // Listener para mensagens recebidas (webhook)
    this.client.on('message', async (message) => {
      if (this.webhookUrl && this.webhookEvents.includes('message')) {
        await this.sendWebhook('message', {
          from: message.from,
          message: {
            type: message.type,
            content: message.body,
            timestamp: new Date(message.timestamp * 1000).toISOString()
          }
        });
      }
    });

    await this.client.initialize();
  }

  /**
   * Envia dados para webhook configurado
   */
  async sendWebhook(type, data) {
    if (!this.webhookUrl) return;

    try {
      await axios.post(this.webhookUrl, {
        type,
        ...data,
        session_id: this.sessionId
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error(`Erro ao enviar webhook para sessão ${this.sessionId}:`, error.message);
    }
  }

  /**
   * Formata número para JID do WhatsApp
   * Aceita formatos: 5581999999999, 55 81 99999-9999, 81999999999, 81 99999-9999, etc.
   */
  formatNumber(number) {
    // If already a JID or LID, return as is
    if (number.includes('@') || number.startsWith('lid_')) {
      return number;
    }

    // Remove all non-numeric characters
    let cleanNumber = number.replace(/\D/g, '');

    const countryCode = '55';
    const defaultDdd = '11'; // Default to São Paulo if DDD is missing

    // Case 1: Number already includes country code (55)
    if (cleanNumber.startsWith(countryCode)) {
      // If it's 12 digits (55 + DD + 8 digits) or 13 digits (55 + DD + 9 digits)
      if (cleanNumber.length === 12 || cleanNumber.length === 13) {
        return cleanNumber + '@c.us';
      } else {
        // If it starts with 55 but has an unusual length, it might be malformed
        throw new Error('Número com código de país (55) tem comprimento inválido.');
      }
    }

    // Case 2: Number without country code
    // Check for DDD (2 digits) + Number (8 or 9 digits)
    if (cleanNumber.length >= 10 && cleanNumber.length <= 11) {
      // 10 digits: DD + 8 digits (e.g., 8188888888)
      // 11 digits: DD + 9 digits (e.g., 81988888888)
      return countryCode + cleanNumber + '@c.us';
    }

    // Case 3: Number without DDD (8 or 9 digits)
    if (cleanNumber.length >= 8 && cleanNumber.length <= 9) {
      // Assume default DDD (11 for São Paulo)
      return countryCode + defaultDdd + cleanNumber + '@c.us';
    }

    // If none of the above, it's an unrecognized format
    throw new Error('Formato de número não reconhecido ou inválido.');
  }

  /**
   * Formata um número limpo (55DDNNNNNNNNN) para exibição amigável.
   */
  getDisplayFormat(cleanNumber) {
    if (!cleanNumber || cleanNumber.length < 12) {
      return cleanNumber; // Retorna como está se for muito curto
    }

    const countryCode = cleanNumber.substring(0, 2);
    const ddd = cleanNumber.substring(2, 4);
    const numberPart = cleanNumber.substring(4);

    let formattedNumber;
    if (numberPart.length === 9) { // Celular com 9 dígitos
      formattedNumber = `${numberPart.substring(0, 5)}-${numberPart.substring(5)}`;
    } else if (numberPart.length === 8) { // Fixo ou celular com 8 dígitos
      formattedNumber = `${numberPart.substring(0, 4)}-${numberPart.substring(4)}`;
    } else {
      return cleanNumber; // Formato inesperado
    }

    return `+${countryCode} ${ddd} ${formattedNumber}`;
  }

  /**
   * Envia mensagem de texto
   */
  async sendText(to, message) {
    if (!this.isReady) {
      throw new Error('Cliente WhatsApp não está pronto');
    }

    const chatId = this.formatNumber(to);
    return await this.client.sendMessage(chatId, message);
  }

  /**
   * Envia mídia (imagem, áudio, vídeo)
   */
  async sendMedia(to, filePath, caption = '') {
    if (!this.isReady) {
      throw new Error('Cliente WhatsApp não está pronto');
    }

    const chatId = this.formatNumber(to);
    const media = MessageMedia.fromFilePath(filePath);
    
    return await this.client.sendMessage(chatId, media, { caption });
  }

  /**
   * Obtém lista de contatos
   */
  async getContacts() {
    if (!this.isReady) {
      throw new Error('Cliente WhatsApp não está pronto');
    }

    const contacts = await this.client.getContacts();
    return contacts.map(contact => ({
      jid: contact.id._serialized,
      name: contact.name || contact.pushname || 'Sem nome',
      phone: contact.number
    }));
  }
}

// ENDPOINTS DA API

/**
 * GET /api/qr-code
 * Gera QR Code para conectar com WhatsApp Web
 */
app.get('/api/qr-code', async (req, res) => {
  try {
    const sessionId = req.query.session_id || uuidv4();
    
    let session = sessions.get(sessionId);
    if (!session) {
      session = new WhatsAppSession(sessionId);
      sessions.set(sessionId, session);
      await session.initialize();
    }

    // Aguarda QR Code ser gerado (máximo 30 segundos)
    let attempts = 0;
    while (!session.qrCode && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!session.qrCode) {
      return res.status(500).json({
        error: true,
        message: 'Timeout ao gerar QR Code',
        code: 'QR_TIMEOUT'
      });
    }

    res.json({
      qr_code: session.qrCode,
      status: session.isReady ? 'connected' : 'waiting_for_scan',
      session_id: sessionId
    });
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    res.status(500).json({
      error: true,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/status
 * Verifica status da conexão WhatsApp
 */
app.get('/api/status', (req, res) => {
  try {
    const sessionId = req.query.session_id;
    
    if (!sessionId) {
      return res.status(400).json({
        error: true,
        message: 'session_id é obrigatório',
        code: 'MISSING_SESSION_ID'
      });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        error: true,
        message: 'Sessão não encontrada',
        code: 'SESSION_NOT_FOUND'
      });
    }

    res.json({
      connected: session.isReady,
      phone_number: session.phoneNumber ? `+${session.phoneNumber}` : null,
      session_id: sessionId,
      last_seen: session.lastSeen.toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({
      error: true,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/send/text
 * Envia mensagem de texto
 */
app.post('/api/send/text', async (req, res) => {
  try {
    const { to, message, session_id } = req.body;

    if (!to || !message || !session_id) {
      return res.status(400).json({
        error: true,
        message: 'Campos obrigatórios: to, message, session_id',
        code: 'MISSING_FIELDS'
      });
    }

    const session = sessions.get(session_id);
    if (!session) {
      return res.status(404).json({
        error: true,
        message: 'Sessão não encontrada',
        code: 'SESSION_NOT_FOUND'
      });
    }

    if (!session.isReady) {
      return res.status(401).json({
        error: true,
        message: 'WhatsApp não está conectado',
        code: 'NOT_CONNECTED'
      });
    }

    const result = await session.sendText(to, message);
    
    res.json({
      success: true,
      message_id: result.id._serialized,
      to: result.to,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem de texto:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Erro interno do servidor',
      code: 'SEND_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/send/image
 * Envia imagem com caption opcional
 */
app.post('/api/send/image', upload.single('image'), async (req, res) => {
  try {
    const { to, caption, session_id } = req.body;

    if (!to || !session_id || !req.file) {
      return res.status(400).json({
        error: true,
        message: 'Campos obrigatórios: to, session_id, image (arquivo)',
        code: 'MISSING_FIELDS'
      });
    }

    const session = sessions.get(session_id);
    if (!session) {
      return res.status(404).json({
        error: true,
        message: 'Sessão não encontrada',
        code: 'SESSION_NOT_FOUND'
      });
    }

    if (!session.isReady) {
      return res.status(401).json({
        error: true,
        message: 'WhatsApp não está conectado',
        code: 'NOT_CONNECTED'
      });
    }

    const result = await session.sendMedia(to, req.file.path, caption || '');
    
    // Remove arquivo temporário
    fs.removeSync(req.file.path);
    
    res.json({
      success: true,
      message_id: result.id._serialized,
      to: result.to,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao enviar imagem:', error);
    
    // Remove arquivo temporário em caso de erro
    if (req.file) {
      fs.removeSync(req.file.path);
    }
    
    res.status(500).json({
      error: true,
      message: error.message || 'Erro interno do servidor',
      code: 'SEND_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/send/audio
 * Envia arquivo de áudio
 */
app.post('/api/send/audio', upload.single('audio'), async (req, res) => {
  try {
    const { to, session_id } = req.body;

    if (!to || !session_id || !req.file) {
      return res.status(400).json({
        error: true,
        message: 'Campos obrigatórios: to, session_id, audio (arquivo)',
        code: 'MISSING_FIELDS'
      });
    }

    const session = sessions.get(session_id);
    if (!session) {
      return res.status(404).json({
        error: true,
        message: 'Sessão não encontrada',
        code: 'SESSION_NOT_FOUND'
      });
    }

    if (!session.isReady) {
      return res.status(401).json({
        error: true,
        message: 'WhatsApp não está conectado',
        code: 'NOT_CONNECTED'
      });
    }

    const result = await session.sendMedia(to, req.file.path);
    
    // Remove arquivo temporário
    fs.removeSync(req.file.path);
    
    res.json({
      success: true,
      message_id: result.id._serialized,
      to: result.to,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao enviar áudio:', error);
    
    // Remove arquivo temporário em caso de erro
    if (req.file) {
      fs.removeSync(req.file.path);
    }
    
    res.status(500).json({
      error: true,
      message: error.message || 'Erro interno do servidor',
      code: 'SEND_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/send/video
 * Envia vídeo com caption opcional
 */
app.post('/api/send/video', upload.single('video'), async (req, res) => {
  try {
    const { to, caption, session_id } = req.body;

    if (!to || !session_id || !req.file) {
      return res.status(400).json({
        error: true,
        message: 'Campos obrigatórios: to, session_id, video (arquivo)',
        code: 'MISSING_FIELDS'
      });
    }

    const session = sessions.get(session_id);
    if (!session) {
      return res.status(404).json({
        error: true,
        message: 'Sessão não encontrada',
        code: 'SESSION_NOT_FOUND'
      });
    }

    if (!session.isReady) {
      return res.status(401).json({
        error: true,
        message: 'WhatsApp não está conectado',
        code: 'NOT_CONNECTED'
      });
    }

    const result = await session.sendMedia(to, req.file.path, caption || '');
    
    // Remove arquivo temporário
    fs.removeSync(req.file.path);
    
    res.json({
      success: true,
      message_id: result.id._serialized,
      to: result.to,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao enviar vídeo:', error);
    
    // Remove arquivo temporário em caso de erro
    if (req.file) {
      fs.removeSync(req.file.path);
    }
    
    res.status(500).json({
      error: true,
      message: error.message || 'Erro interno do servidor',
      code: 'SEND_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/webhook/configure
 * Configura URL do webhook para receber mensagens
 */
app.post('/api/webhook/configure', (req, res) => {
  try {
    const { webhook_url, events, session_id } = req.body;

    if (!webhook_url || !session_id) {
      return res.status(400).json({
        error: true,
        message: 'Campos obrigatórios: webhook_url, session_id',
        code: 'MISSING_FIELDS'
      });
    }

    const session = sessions.get(session_id);
    if (!session) {
      return res.status(404).json({
        error: true,
        message: 'Sessão não encontrada',
        code: 'SESSION_NOT_FOUND'
      });
    }

    session.webhookUrl = webhook_url;
    session.webhookEvents = events || ['message'];

    res.json({
      success: true,
      webhook_url: webhook_url,
      events: session.webhookEvents,
      session_id: session_id
    });
  } catch (error) {
    console.error('Erro ao configurar webhook:', error);
    res.status(500).json({
      error: true,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/contacts
 * Lista contatos disponíveis
 */
app.get('/api/contacts', async (req, res) => {
  try {
    const sessionId = req.query.session_id;

    if (!sessionId) {
      return res.status(400).json({
        error: true,
        message: 'session_id é obrigatório',
        code: 'MISSING_SESSION_ID'
      });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        error: true,
        message: 'Sessão não encontrada',
        code: 'SESSION_NOT_FOUND'
      });
    }

    if (!session.isReady) {
      return res.status(401).json({
        error: true,
        message: 'WhatsApp não está conectado',
        code: 'NOT_CONNECTED'
      });
    }

    const contacts = await session.getContacts();
    
    res.json({
      contacts: contacts.slice(0, 100) // Limita a 100 contatos
    });
  } catch (error) {
    console.error('Erro ao listar contatos:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Erro interno do servidor',
      code: 'CONTACTS_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /web
 * Interface web para envio manual de mensagens
 */
app.get('/web', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * GET /docs
 * Documentação da API
 */
app.get('/docs', (req, res) => {
  res.json({
    title: 'WhatsApp API Documentation',
    version: '1.0.0',
    description: 'API para emular WhatsApp Web com envio de mensagens',
    endpoints: {
      'GET /api/qr-code': 'Gera QR Code para autenticação',
      'GET /api/status': 'Verifica status da conexão',
      'POST /api/send/text': 'Envia mensagem de texto',
      'POST /api/send/image': 'Envia imagem',
      'POST /api/send/audio': 'Envia áudio',
      'POST /api/send/video': 'Envia vídeo',
      'POST /api/webhook/configure': 'Configura webhook',
      'GET /api/contacts': 'Lista contatos',
      'POST /api/format-number': 'Formata número para JID',
      'GET /web': 'Interface web',
      'GET /docs': 'Esta documentação'
    },
    examples: {
      curl_text: 'curl -X POST http://localhost:3000/api/send/text -H "Content-Type: application/json" -d \'{"to": "5511999999999@c.us", "message": "Olá!", "session_id": "session_123"}\'',
      curl_image: 'curl -X POST http://localhost:3000/api/send/image -F "to=5511999999999@c.us" -F "image=@image.jpg" -F "session_id=session_123"'
    }
  });
});

/**
 * POST /api/format-number
 * Formata número para JID do WhatsApp
 */
app.post('/api/format-number', (req, res) => {
  try {
    const { number } = req.body;

    if (!number) {
      return res.status(400).json({
        error: true,
        message: 'Campo obrigatório: number',
        code: 'MISSING_NUMBER'
      });
    }

    const session = new WhatsAppSession('temp');
    const jid = session.formatNumber(number);
    
    const cleanNumberForDisplay = jid.replace('@c.us', ''); // Get the 55DDNNNNNNNNN part

    // Now, format this clean number for display using the new helper
    const displayFormat = session.getDisplayFormat(cleanNumberForDisplay); // This was the line causing the error due to re-declaration

    res.json({
      success: true,
      jid: jid,
      clean_number: cleanNumberForDisplay,
      display_format: displayFormat,
      original_input: number,
      is_valid: true
    });
  } catch (error) {
    console.error('Erro ao formatar número:', error);
    res.status(400).json({
      error: true,
      message: error.message || 'Formato de número inválido',
      code: 'INVALID_NUMBER',
      original_input: req.body.number,
      is_valid: false,
      timestamp: new Date().toISOString()
    });
  }
});

// Inicialização do servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API WhatsApp rodando na porta ${PORT}`);
  console.log(`📱 Acesse http://localhost:${PORT}/web para a interface web`);
  console.log(`📋 Documentação da API disponível em http://localhost:${PORT}/docs`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor...');
  
  // Fecha todas as sessões WhatsApp
  for (const [sessionId, session] of sessions) {
    if (session.client) {
      await session.client.destroy();
    }
  }
  
  process.exit(0);
});

module.exports = app;
