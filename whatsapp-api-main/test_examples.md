# Exemplos de Teste - WhatsApp API

Este documento contém exemplos práticos de como testar todos os endpoints da API WhatsApp usando comandos curl e scripts de teste.

## Pré-requisitos para Testes

1. Servidor rodando em `http://localhost:3000`
2. Curl instalado no sistema
3. Arquivos de teste (imagem, áudio, vídeo) para upload

## 1. Testando Geração de QR Code

### Gerar QR Code (primeira vez)
```bash
curl -X GET "http://localhost:3000/api/qr-code" \
  -H "Accept: application/json"
```

### Gerar QR Code com sessão específica
```bash
curl -X GET "http://localhost:3000/api/qr-code?session_id=test_session_123" \
  -H "Accept: application/json"
```

**Resposta esperada:**
```json
{
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "status": "waiting_for_scan",
  "session_id": "test_session_123"
}
```

## 2. Testando Status da Conexão

```bash
curl -X GET "http://localhost:3000/api/status?session_id=test_session_123" \
  -H "Accept: application/json"
```

**Resposta quando desconectado:**
```json
{
  "connected": false,
  "phone_number": null,
  "session_id": "test_session_123",
  "last_seen": "2024-01-15T10:30:00Z"
}
```

**Resposta quando conectado:**
```json
{
  "connected": true,
  "phone_number": "+5511999999999",
  "session_id": "test_session_123",
  "last_seen": "2024-01-15T10:30:00Z"
}
```

## 3. Testando Envio de Mensagem de Texto

### Formato básico
```bash
curl -X POST "http://localhost:3000/api/send/text" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999@c.us",
    "message": "Olá! Esta é uma mensagem de teste da API.",
    "session_id": "test_session_123"
  }'
```

### Com número simples (será formatado automaticamente)
```bash
curl -X POST "http://localhost:3000/api/send/text" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "11999999999",
    "message": "Teste com número simples",
    "session_id": "test_session_123"
  }'
```

### Mensagem longa
```bash
curl -X POST "http://localhost:3000/api/send/text" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999@c.us",
    "message": "Esta é uma mensagem muito longa para testar o envio de textos extensos através da API do WhatsApp. A mensagem deve ser enviada corretamente mesmo sendo longa.",
    "session_id": "test_session_123"
  }'
```

## 4. Testando Envio de Imagem

### Criar arquivo de teste
```bash
# Baixar uma imagem de teste
curl -o test_image.jpg "https://via.placeholder.com/800x600/0000FF/FFFFFF?text=Teste+API"
```

### Enviar imagem sem legenda
```bash
curl -X POST "http://localhost:3000/api/send/image" \
  -F "to=5511999999999@c.us" \
  -F "image=@test_image.jpg" \
  -F "session_id=test_session_123"
```

### Enviar imagem com legenda
```bash
curl -X POST "http://localhost:3000/api/send/image" \
  -F "to=5511999999999@c.us" \
  -F "image=@test_image.jpg" \
  -F "caption=Esta é uma imagem de teste enviada pela API!" \
  -F "session_id=test_session_123"
```

### Enviar imagem PNG
```bash
curl -o test_image.png "https://via.placeholder.com/600x400/FF0000/FFFFFF?text=PNG+Test"

curl -X POST "http://localhost:3000/api/send/image" \
  -F "to=5511999999999@c.us" \
  -F "image=@test_image.png" \
  -F "caption=Teste com imagem PNG" \
  -F "session_id=test_session_123"
```

## 5. Testando Envio de Áudio

### Criar arquivo de áudio de teste (usando síntese)
```bash
# Gerar um arquivo de áudio simples (requer sox)
# sox -n -r 44100 -c 2 test_audio.wav synth 3 sine 440 vol 0.5

# Ou baixar um arquivo de teste
curl -o test_audio.mp3 "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3"
```

### Enviar áudio MP3
```bash
curl -X POST "http://localhost:3000/api/send/audio" \
  -F "to=5511999999999@c.us" \
  -F "audio=@test_audio.mp3" \
  -F "session_id=test_session_123"
```

### Enviar áudio WAV
```bash
curl -X POST "http://localhost:3000/api/send/audio" \
  -F "to=5511999999999@c.us" \
  -F "audio=@test_audio.wav" \
  -F "session_id=test_session_123"
```

## 6. Testando Envio de Vídeo

### Criar arquivo de vídeo de teste
```bash
# Gerar vídeo simples (requer ffmpeg)
# ffmpeg -f lavfi -i testsrc=duration=5:size=320x240:rate=1 -pix_fmt yuv420p test_video.mp4

# Ou baixar um arquivo pequeno de teste
curl -o test_video.mp4 "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
```

### Enviar vídeo sem legenda
```bash
curl -X POST "http://localhost:3000/api/send/video" \
  -F "to=5511999999999@c.us" \
  -F "video=@test_video.mp4" \
  -F "session_id=test_session_123"
```

### Enviar vídeo com legenda
```bash
curl -X POST "http://localhost:3000/api/send/video" \
  -F "to=5511999999999@c.us" \
  -F "video=@test_video.mp4" \
  -F "caption=Vídeo de teste enviado pela API WhatsApp!" \
  -F "session_id=test_session_123"
```

## 7. Testando Configuração de Webhook

### Configurar webhook básico
```bash
curl -X POST "http://localhost:3000/api/webhook/configure" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "https://webhook.site/unique-id",
    "events": ["message"],
    "session_id": "test_session_123"
  }'
```

### Configurar webhook com múltiplos eventos
```bash
curl -X POST "http://localhost:3000/api/webhook/configure" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "https://meusite.com/webhook/whatsapp",
    "events": ["message", "status_change"],
    "session_id": "test_session_123"
  }'
```

## 8. Testando Utilitários

### Listar contatos
```bash
curl -X GET "http://localhost:3000/api/contacts?session_id=test_session_123" \
  -H "Accept: application/json"
```

### Formatar número
```bash
curl -X POST "http://localhost:3000/api/format-number" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "11999999999"
  }'
```

### Formatar número com código do país
```bash
curl -X POST "http://localhost:3000/api/format-number" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999"
  }'
```

## 9. Testando Documentação

### Acessar documentação da API
```bash
curl -X GET "http://localhost:3000/docs" \
  -H "Accept: application/json"
```

## 10. Script de Teste Automatizado

### Criar script de teste completo
```bash
#!/bin/bash

# test_api.sh - Script de teste automatizado para WhatsApp API

API_URL="http://localhost:3000"
SESSION_ID="test_session_$(date +%s)"
TEST_NUMBER="5511999999999@c.us"

echo "🚀 Iniciando testes da WhatsApp API"
echo "📱 Sessão: $SESSION_ID"
echo "📞 Número de teste: $TEST_NUMBER"
echo ""

# Teste 1: Gerar QR Code
echo "1️⃣ Testando geração de QR Code..."
QR_RESPONSE=$(curl -s -X GET "$API_URL/api/qr-code?session_id=$SESSION_ID")
echo "✅ QR Code: $(echo $QR_RESPONSE | jq -r '.status')"
echo ""

# Teste 2: Verificar status
echo "2️⃣ Testando status da conexão..."
STATUS_RESPONSE=$(curl -s -X GET "$API_URL/api/status?session_id=$SESSION_ID")
echo "✅ Status: $(echo $STATUS_RESPONSE | jq -r '.connected')"
echo ""

# Teste 3: Formatar número
echo "3️⃣ Testando formatação de número..."
FORMAT_RESPONSE=$(curl -s -X POST "$API_URL/api/format-number" \
  -H "Content-Type: application/json" \
  -d '{"number": "11999999999"}')
echo "✅ Formatado: $(echo $FORMAT_RESPONSE | jq -r '.jid')"
echo ""

# Teste 4: Documentação
echo "4️⃣ Testando documentação..."
DOCS_RESPONSE=$(curl -s -X GET "$API_URL/docs")
echo "✅ Docs: $(echo $DOCS_RESPONSE | jq -r '.title')"
echo ""

echo "🎉 Testes básicos concluídos!"
echo "⚠️  Para testes completos, escaneie o QR Code e execute testes de envio"
```

### Tornar executável e rodar
```bash
chmod +x test_api.sh
./test_api.sh
```

## 11. Testes de Erro

### Teste sem session_id
```bash
curl -X POST "http://localhost:3000/api/send/text" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999@c.us",
    "message": "Teste sem session_id"
  }'
```

### Teste com sessão inválida
```bash
curl -X POST "http://localhost:3000/api/send/text" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999@c.us",
    "message": "Teste com sessão inválida",
    "session_id": "sessao_inexistente"
  }'
```

### Teste com dados inválidos
```bash
curl -X POST "http://localhost:3000/api/send/text" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Teste sem destinatário",
    "session_id": "test_session_123"
  }'
```

## 12. Monitoramento e Logs

### Verificar logs do servidor
```bash
# Se usando PM2
pm2 logs whatsapp-api

# Se rodando diretamente
tail -f server.log
```

### Monitorar requisições
```bash
# Usar curl com verbose para debug
curl -v -X GET "http://localhost:3000/api/status?session_id=test_session_123"
```

## Resultados Esperados

### Sucesso (200)
```json
{
  "success": true,
  "message_id": "3EB0C767D82A1E2F4A95_out",
  "to": "5511999999999@c.us",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Erro de Validação (400)
```json
{
  "error": true,
  "message": "Campos obrigatórios: to, message, session_id",
  "code": "MISSING_FIELDS",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Não Conectado (401)
```json
{
  "error": true,
  "message": "WhatsApp não está conectado",
  "code": "NOT_CONNECTED",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Sessão Não Encontrada (404)
```json
{
  "error": true,
  "message": "Sessão não encontrada",
  "code": "SESSION_NOT_FOUND",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Dicas de Teste

1. **Sempre teste com QR Code escaneado** - Muitos endpoints requerem conexão ativa
2. **Use números reais** - Para testes completos, use números de WhatsApp válidos
3. **Monitore logs** - Acompanhe os logs do servidor para debug
4. **Teste arquivos pequenos** - Use arquivos de teste pequenos para evitar timeouts
5. **Valide respostas** - Sempre verifique o formato das respostas JSON
6. **Teste cenários de erro** - Importante testar casos de falha
7. **Use ferramentas de debug** - Postman, Insomnia ou curl verbose para análise detalhada

## Automação de Testes

Para automação completa, considere usar:
- **Jest** para testes unitários
- **Supertest** para testes de API
- **Puppeteer** para testes end-to-end
- **GitHub Actions** para CI/CD

Este documento fornece uma base sólida para testar todos os aspectos da API WhatsApp desenvolvida.

