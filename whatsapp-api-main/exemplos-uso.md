# 📱 Exemplos de Uso - API WhatsApp

## 🆕 Melhorias Implementadas

### ✅ Formatação de Números Flexível
A API agora aceita números em diferentes formatos brasileiros:

#### Formatos Aceitos:
- **5581999999999** - Número com código do país (13 dígitos)
- **55 81 99999-9999** - Número com código do país e formatação
- **81999999999** - Número com DDD (11 dígitos)
- **81 99999-9999** - Número com DDD e formatação
- **999999999** - Número sem DDD (9 dígitos, assume SP)
- **99999-9999** - Número sem DDD e formatação
- **5581999999999@c.us** - JID completo
- **lid_123456789** - LID do WhatsApp

## 🔧 Endpoints da API

### 1. Formatar Número
```bash
POST /api/format-number
Content-Type: application/json

{
  "number": "81999999999"
}
```

**Resposta:**
```json
{
  "success": true,
  "jid": "5581999999999@c.us",
  "clean_number": "5581999999999",
  "display_format": "+55 81 9999-9999",
  "original_input": "81999999999",
  "is_valid": true
}
```

### 2. Enviar Mensagem de Texto
```bash
POST /api/send/text
Content-Type: application/json

{
  "to": "81999999999",
  "message": "Olá! Esta é uma mensagem de teste.",
  "session_id": "sua_sessao_id"
}
```

### 3. Enviar Imagem
```bash
POST /api/send/image
Content-Type: multipart/form-data

to: 55 81 99999-9999
image: [arquivo_imagem]
caption: Legenda da imagem
session_id: sua_sessao_id
```

## 🌐 Interface Web

### Como Usar:
1. **Acesse:** `http://localhost:3000/web`
2. **Conecte:** Clique em "Conectar" e escaneie o QR Code
3. **Digite o número:** Em qualquer formato (ex: 81999999999, 55 81 99999-9999)
4. **Validação automática:** O sistema mostra o formato detectado
5. **Envie:** Escolha o tipo de mensagem e envie

### Recursos da Interface:
- ✅ **Validação em tempo real** do número
- ✅ **Preview do formato** detectado
- ✅ **Formatação automática** durante a digitação
- ✅ **Indicadores visuais** (verde = válido, vermelho = inválido)
- ✅ **Suporte a mídia** (imagem, áudio, vídeo)
- ✅ **Log de mensagens** enviadas

## 📋 Exemplos Práticos

### Exemplo 1: Envio via cURL
```bash
# Formatar número primeiro
curl -X POST http://localhost:3000/api/format-number \
  -H "Content-Type: application/json" \
  -d '{"number": "81999999999"}'

# Enviar mensagem
curl -X POST http://localhost:3000/api/send/text \
  -H "Content-Type: application/json" \
  -d '{
    "to": "81999999999",
    "message": "Olá! Mensagem enviada via API.",
    "session_id": "minha_sessao"
  }'
```

### Exemplo 2: JavaScript (Frontend)
```javascript
// Validação automática
const recipient = document.getElementById('recipient');
recipient.addEventListener('input', async (e) => {
  const formatted = await numberManager.validateAndFormat(e.target);
  if (formatted) {
    console.log('Número válido:', formatted);
  }
});

// Envio de mensagem
const sendMessage = async () => {
  const formattedNumber = await numberManager.validateAndFormat(recipient);
  if (formattedNumber) {
    await api.sendText(formattedNumber, 'Mensagem', sessionId);
  }
};
```

### Exemplo 3: Python
```python
import requests

# Formatar número
response = requests.post('http://localhost:3000/api/format-number', 
                        json={'number': '81999999999'})
formatted = response.json()

# Enviar mensagem
requests.post('http://localhost:3000/api/send/text',
              json={
                  'to': formatted['jid'],
                  'message': 'Olá do Python!',
                  'session_id': 'python_session'
              })
```

## 🚀 Como Iniciar

1. **Instalar dependências:**
```bash
npm install
```

2. **Iniciar servidor:**
```bash
npm start
# ou
node server.js
```

3. **Acessar interface:**
- Web: `http://localhost:3000/web`
- API Docs: `http://localhost:3000/docs`

## 🧪 Testes

Execute o script de teste para verificar todos os formatos:
```bash
node test-number-formats.js
```

## 📝 Notas Importantes

- **Validação:** Todos os números são validados antes do envio
- **Formatação:** A API automaticamente adiciona código do país se necessário
- **Compatibilidade:** Suporta JIDs existentes e LIDs do WhatsApp
- **Performance:** Validação com debounce para evitar muitas requisições
- **UX:** Interface intuitiva com feedback visual em tempo real

## 🔒 Segurança

- Validação rigorosa de formatos de entrada
- Tratamento de erros robusto
- Limpeza automática de caracteres especiais
- Verificação de tamanhos mínimos e máximos
