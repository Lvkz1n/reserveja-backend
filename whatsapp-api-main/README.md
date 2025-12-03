# WhatsApp API

Uma API completa para emular o WhatsApp Web, permitindo envio de mensagens de texto, áudio, imagens e vídeos através de endpoints REST e interface web.

## 🚀 Funcionalidades

- ✅ Geração de QR Code para autenticação
- ✅ Envio de mensagens de texto
- ✅ Envio de imagens com legenda
- ✅ Envio de arquivos de áudio
- ✅ Envio de vídeos com legenda
- ✅ Sistema de webhooks para receber mensagens
- ✅ Interface web para uso manual
- ✅ Suporte a múltiplas sessões
- ✅ Formatação automática de números
- ✅ Lista de contatos
- ✅ CORS habilitado

## 📋 Pré-requisitos

- Node.js 14.0.0 ou superior
- NPM ou Yarn
- Google Chrome ou Chromium (para Puppeteer)

## 🔧 Instalação

1. Clone ou baixe o projeto:
```bash
git clone <url-do-repositorio>
cd whatsapp-api
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm start
```

Para desenvolvimento com auto-reload:
```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3000`

## 🌐 Interface Web

Acesse `http://localhost:3000/web` para usar a interface web que permite:

- Gerar QR Code e conectar ao WhatsApp
- Enviar mensagens de forma visual
- Configurar webhooks
- Visualizar log de mensagens enviadas
- Verificar status da conexão

## 📡 Endpoints da API

### Autenticação

#### `GET /api/qr-code`
Gera QR Code para conectar com WhatsApp Web.

**Parâmetros de Query:**
- `session_id` (opcional): ID da sessão

**Resposta:**
```json
{
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "status": "waiting_for_scan",
  "session_id": "session_123"
}
```

#### `GET /api/status`
Verifica status da conexão WhatsApp.

**Parâmetros de Query:**
- `session_id` (obrigatório): ID da sessão

**Resposta:**
```json
{
  "connected": true,
  "phone_number": "+5511999999999",
  "session_id": "session_123",
  "last_seen": "2024-01-15T10:30:00Z"
}
```

### Envio de Mensagens

#### `POST /api/send/text`
Envia mensagem de texto.

**Body (JSON):**
```json
{
  "to": "5511999999999@c.us",
  "message": "Olá! Como você está?",
  "session_id": "session_123"
}
```

**Exemplo curl:**
```bash
curl -X POST http://localhost:3000/api/send/text \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999@c.us",
    "message": "Olá! Como você está?",
    "session_id": "session_123"
  }'
```

#### `POST /api/send/image`
Envia imagem com legenda opcional.

**Body (multipart/form-data):**
- `to`: Número/JID do destinatário
- `image`: Arquivo de imagem
- `caption`: Legenda opcional
- `session_id`: ID da sessão

**Exemplo curl:**
```bash
curl -X POST http://localhost:3000/api/send/image \
  -F "to=5511999999999@c.us" \
  -F "image=@/caminho/para/imagem.jpg" \
  -F "caption=Olha essa foto!" \
  -F "session_id=session_123"
```

#### `POST /api/send/audio`
Envia arquivo de áudio.

**Body (multipart/form-data):**
- `to`: Número/JID do destinatário
- `audio`: Arquivo de áudio (mp3, ogg, wav)
- `session_id`: ID da sessão

**Exemplo curl:**
```bash
curl -X POST http://localhost:3000/api/send/audio \
  -F "to=5511999999999@c.us" \
  -F "audio=@/caminho/para/audio.mp3" \
  -F "session_id=session_123"
```

#### `POST /api/send/video`
Envia vídeo com legenda opcional.

**Body (multipart/form-data):**
- `to`: Número/JID do destinatário
- `video`: Arquivo de vídeo
- `caption`: Legenda opcional
- `session_id`: ID da sessão

**Exemplo curl:**
```bash
curl -X POST http://localhost:3000/api/send/video \
  -F "to=5511999999999@c.us" \
  -F "video=@/caminho/para/video.mp4" \
  -F "caption=Vídeo interessante!" \
  -F "session_id=session_123"
```

### Webhooks

#### `POST /api/webhook/configure`
Configura URL do webhook para receber mensagens.

**Body (JSON):**
```json
{
  "webhook_url": "https://meusite.com/webhook/whatsapp",
  "events": ["message", "status_change"],
  "session_id": "session_123"
}
```

**Exemplo curl:**
```bash
curl -X POST http://localhost:3000/api/webhook/configure \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "https://meusite.com/webhook/whatsapp",
    "events": ["message"],
    "session_id": "session_123"
  }'
```

### Utilitários

#### `GET /api/contacts`
Lista contatos disponíveis.

**Parâmetros de Query:**
- `session_id` (obrigatório): ID da sessão

**Exemplo curl:**
```bash
curl "http://localhost:3000/api/contacts?session_id=session_123"
```

#### `POST /api/format-number`
Formata número para JID do WhatsApp.

**Body (JSON):**
```json
{
  "number": "11999999999"
}
```

**Exemplo curl:**
```bash
curl -X POST http://localhost:3000/api/format-number \
  -H "Content-Type: application/json" \
  -d '{"number": "11999999999"}'
```

## 🔗 Formatos de Identificação

A API aceita três formatos para identificar contatos:

1. **Número simples**: `11999999999`
2. **JID completo**: `5511999999999@c.us`
3. **LID (contatos business)**: `lid_123456789`

## 📨 Webhook

Quando configurado, o webhook receberá dados no seguinte formato:

```json
{
  "type": "message",
  "from": "5511999999999@c.us",
  "message": {
    "type": "text",
    "content": "Olá!",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "session_id": "session_123"
}
```

## 🚨 Códigos de Resposta

- **200**: Sucesso
- **400**: Dados inválidos
- **401**: Não autenticado (QR Code não escaneado)
- **404**: Contato/Sessão não encontrada
- **429**: Muitas requisições (rate limiting)
- **500**: Erro interno do servidor

## 📝 Estrutura de Erro

```json
{
  "error": true,
  "message": "Descrição do erro",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔧 Configuração

### Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: 3000)

### Limites

- Tamanho máximo de arquivo: 50MB
- Rate limiting: Implementado para evitar spam
- Máximo de contatos retornados: 100

## 🛠️ Desenvolvimento

### Estrutura do Projeto

```
whatsapp-api/
├── server.js          # Servidor principal
├── package.json       # Dependências e scripts
├── public/            # Interface web
│   ├── index.html     # HTML principal
│   ├── style.css      # Estilos
│   └── script.js      # JavaScript frontend
├── uploads/           # Arquivos temporários
└── README.md          # Esta documentação
```

### Scripts Disponíveis

- `npm start`: Inicia o servidor em produção
- `npm run dev`: Inicia com nodemon para desenvolvimento
- `npm test`: Executa testes (não implementado)

## 🔒 Segurança

- CORS habilitado para todas as origens
- Validação de dados de entrada
- Limpeza automática de arquivos temporários
- Rate limiting para prevenir spam
- Sanitização de números de telefone

## 📱 Compatibilidade

- Funciona com WhatsApp Web oficial
- Suporte a múltiplas sessões simultâneas
- Compatible com todos os tipos de mídia suportados pelo WhatsApp
- Funciona em servidores Linux/Windows/macOS

## 🐛 Solução de Problemas

### QR Code não aparece
- Verifique se o Chrome/Chromium está instalado
- Certifique-se de que não há firewall bloqueando

### Mensagens não são enviadas
- Verifique se o QR Code foi escaneado
- Confirme se o número está no formato correto
- Verifique a conexão com a internet

### Erro de autenticação
- Delete a pasta `.wwebjs_auth` e gere um novo QR Code
- Certifique-se de que o WhatsApp está funcionando no celular

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## ⚠️ Aviso Legal

Esta API é para fins educacionais e de desenvolvimento. Use com responsabilidade e respeite os termos de serviço do WhatsApp. O uso inadequado pode resultar no banimento da sua conta WhatsApp.

## 📞 Suporte

Para dúvidas e suporte, abra uma issue no repositório do projeto.

---

Desenvolvido com ❤️ para a comunidade de desenvolvedores.

