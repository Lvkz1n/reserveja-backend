// Estado da aplicação
let currentSessionId = null;
let isConnected = false;
let statusCheckInterval = null;

// Elementos DOM
const elements = {
    statusCard: document.getElementById('statusCard'),
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    sessionInfo: document.getElementById('sessionInfo'),
    connectBtn: document.getElementById('connectBtn'),
    qrSection: document.getElementById('qrSection'),
    qrImage: document.getElementById('qrImage'),
    qrLoading: document.getElementById('qrLoading'),
    messageForm: document.getElementById('messageForm'),
    messageType: document.getElementById('messageType'),
    textGroup: document.getElementById('textGroup'),
    fileGroup: document.getElementById('fileGroup'),
    captionGroup: document.getElementById('captionGroup'),
    fileHint: document.getElementById('fileHint'),
    recipient: document.getElementById('recipient'),
    messageText: document.getElementById('messageText'),
    messageFile: document.getElementById('messageFile'),
    messageCaption: document.getElementById('messageCaption'),
    sendBtn: document.getElementById('sendBtn'),
    logContainer: document.getElementById('logContainer'),
    clearLogBtn: document.getElementById('clearLogBtn'),
    webhookForm: document.getElementById('webhookForm'),
    webhookUrl: document.getElementById('webhookUrl'),
    eventMessage: document.getElementById('eventMessage'),
    eventStatus: document.getElementById('eventStatus'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    numberPreview: document.getElementById('numberPreview'),
    previewText: document.getElementById('previewText'),
    numberHint: document.getElementById('numberHint')
};

// Utilitários
const utils = {
    showLoading() {
        elements.loadingOverlay.classList.add('show');
    },

    hideLoading() {
        elements.loadingOverlay.classList.remove('show');
    },

    formatTime(date) {
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },

    addLog(message, details = '', isError = false) {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${isError ? 'error' : ''}`;
        
        logEntry.innerHTML = `
            <div class="log-time">${this.formatTime(new Date())}</div>
            <div class="log-message">${message}</div>
            ${details ? `<div class="log-details">${details}</div>` : ''}
        `;

        // Remove mensagem vazia se existir
        const emptyMessage = elements.logContainer.querySelector('.log-empty');
        if (emptyMessage) {
            emptyMessage.remove();
        }

        elements.logContainer.insertBefore(logEntry, elements.logContainer.firstChild);
        
        // Limita a 50 entradas
        const entries = elements.logContainer.querySelectorAll('.log-entry');
        if (entries.length > 50) {
            entries[entries.length - 1].remove();
        }
    },

    showMessage(message, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = isError ? 'error-message' : 'success-message';
        messageDiv.textContent = message;
        
        // Adiciona no topo do container
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);
        
        // Remove após 5 segundos
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
};

// API Client
const api = {
    baseUrl: window.location.origin,

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro na requisição');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async generateQR(sessionId = null) {
        const params = sessionId ? `?session_id=${sessionId}` : '';
        return await this.request(`/api/qr-code${params}`);
    },

    async getStatus(sessionId) {
        return await this.request(`/api/status?session_id=${sessionId}`);
    },

    async sendText(to, message, sessionId) {
        return await this.request('/api/send/text', {
            method: 'POST',
            body: JSON.stringify({ to, message, session_id: sessionId })
        });
    },

    async sendMedia(to, file, caption, sessionId, type) {
        const formData = new FormData();
        formData.append('to', to);
        formData.append('session_id', sessionId);
        formData.append(type, file);
        if (caption) formData.append('caption', caption);

        return await this.request(`/api/send/${type}`, {
            method: 'POST',
            headers: {}, // Remove Content-Type para FormData
            body: formData
        });
    },

    async configureWebhook(webhookUrl, events, sessionId) {
        return await this.request('/api/webhook/configure', {
            method: 'POST',
            body: JSON.stringify({
                webhook_url: webhookUrl,
                events,
                session_id: sessionId
            })
        });
    },

    async formatNumber(number) {
        return await this.request('/api/format-number', {
            method: 'POST',
            body: JSON.stringify({ number })
        });
    }
};

// Gerenciamento de Validação de Números
const numberManager = {
    debounceTimer: null,

    async validateAndFormat(input) {
        const number = input.value.trim();
        
        // Limpa classes de validação anteriores
        input.classList.remove('valid', 'invalid');
        elements.numberPreview.style.display = 'none';
        
        if (!number) {
            elements.numberHint.textContent = 'Digite o número em qualquer formato brasileiro';
            return null;
        }

        // Debounce para evitar muitas requisições
        clearTimeout(this.debounceTimer);
        
        return new Promise((resolve) => {
            this.debounceTimer = setTimeout(async () => {
                try {
                    const result = await api.formatNumber(number);
                    
                    // Mostra preview do formato
                    elements.previewText.textContent = result.display_format;
                    elements.numberPreview.style.display = 'flex';
                    
                    // Adiciona classe de validação
                    input.classList.add('valid');
                    elements.numberHint.textContent = 'Número válido e formatado';
                    
                    resolve(result.jid);
                } catch (error) {
                    // Mostra erro
                    input.classList.add('invalid');
                    elements.numberHint.textContent = 'Número inválido: ' + error.message;
                    resolve(null);
                }
            }, 500);
        });
    },

    // Formatação local simples para melhor UX
    formatLocal(input) {
        let value = input.value.replace(/\D/g, '');
        
        // Limita o tamanho
        if (value.length > 15) {
            value = value.slice(0, 15);
        }
        
        // Aplica máscara básica
        if (value.length > 0) {
            if (value.length <= 2) {
                value = value;
            } else if (value.length <= 4) {
                value = value.slice(0, 2) + ' ' + value.slice(2);
            } else if (value.length <= 9) {
                value = value.slice(0, 2) + ' ' + value.slice(2, 4) + ' ' + value.slice(4);
            } else if (value.length <= 11) {
                value = value.slice(0, 2) + ' ' + value.slice(2, 4) + ' ' + value.slice(4, 9) + '-' + value.slice(9);
            } else {
                value = value.slice(0, 2) + ' ' + value.slice(2, 4) + ' ' + value.slice(4, 9) + '-' + value.slice(9);
            }
        }
        
        input.value = value;
    }
};

// Gerenciamento de Status
const statusManager = {
    updateStatus(connected, phoneNumber = null, sessionId = null) {
        isConnected = connected;
        
        // Atualiza indicador visual
        elements.statusIndicator.className = `status-indicator ${connected ? 'connected' : 'connecting'}`;
        
        // Atualiza texto
        elements.statusText.textContent = connected ? 'Conectado' : 'Desconectado';
        
        // Atualiza informações da sessão
        if (sessionId) {
            elements.sessionInfo.textContent = `Sessão: ${sessionId}`;
            if (phoneNumber) {
                elements.sessionInfo.textContent += ` | Telefone: ${phoneNumber}`;
            }
        }
        
        // Atualiza botão
        elements.connectBtn.innerHTML = connected 
            ? '<i class="fas fa-check"></i> Conectado'
            : '<i class="fas fa-qrcode"></i> Conectar';
        elements.connectBtn.disabled = connected;
        
        // Habilita/desabilita formulário
        elements.sendBtn.disabled = !connected;
        
        // Esconde QR se conectado
        if (connected) {
            elements.qrSection.style.display = 'none';
        }
    },

    async checkStatus() {
        if (!currentSessionId) return;
        
        try {
            const status = await api.getStatus(currentSessionId);
            this.updateStatus(status.connected, status.phone_number, currentSessionId);
        } catch (error) {
            console.error('Erro ao verificar status:', error);
        }
    },

    startStatusCheck() {
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
        }
        
        statusCheckInterval = setInterval(() => {
            this.checkStatus();
        }, 3000); // Verifica a cada 3 segundos
    },

    stopStatusCheck() {
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
            statusCheckInterval = null;
        }
    }
};

// Gerenciamento de QR Code
const qrManager = {
    async generateAndShow() {
        try {
            utils.showLoading();
            
            // Mostra seção do QR
            elements.qrSection.style.display = 'block';
            elements.qrImage.style.display = 'none';
            elements.qrLoading.style.display = 'flex';
            
            // Gera QR Code
            const response = await api.generateQR(currentSessionId);
            currentSessionId = response.session_id;
            
            // Mostra QR Code
            elements.qrImage.src = response.qr_code;
            elements.qrImage.style.display = 'block';
            elements.qrLoading.style.display = 'none';
            
            // Atualiza status
            statusManager.updateStatus(false, null, currentSessionId);
            statusManager.startStatusCheck();
            
            utils.addLog('QR Code gerado com sucesso', `Sessão: ${currentSessionId}`);
            
        } catch (error) {
            utils.addLog('Erro ao gerar QR Code', error.message, true);
            utils.showMessage('Erro ao gerar QR Code: ' + error.message, true);
        } finally {
            utils.hideLoading();
        }
    }
};

// Gerenciamento de Mensagens
const messageManager = {
    updateFormFields() {
        const type = elements.messageType.value;
        
        // Esconde todos os grupos
        elements.textGroup.style.display = 'none';
        elements.fileGroup.style.display = 'none';
        elements.captionGroup.style.display = 'none';
        
        // Mostra campos relevantes
        if (type === 'text') {
            elements.textGroup.style.display = 'block';
            elements.messageText.required = true;
            elements.messageFile.required = false;
        } else {
            elements.fileGroup.style.display = 'block';
            elements.captionGroup.style.display = 'block';
            elements.messageText.required = false;
            elements.messageFile.required = true;
            
            // Atualiza hint do arquivo
            const hints = {
                image: 'Selecione uma imagem (JPG, PNG, GIF)',
                audio: 'Selecione um áudio (MP3, OGG, WAV)',
                video: 'Selecione um vídeo (MP4, AVI, MOV)'
            };
            elements.fileHint.textContent = hints[type];
            
            // Atualiza accept do input
            const accepts = {
                image: 'image/*',
                audio: 'audio/*',
                video: 'video/*'
            };
            elements.messageFile.accept = accepts[type];
        }
    },

    async send(formData) {
        const to = formData.get('to');
        const type = formData.get('type');
        const sessionId = currentSessionId;

        if (!sessionId) {
            throw new Error('Nenhuma sessão ativa');
        }

        if (!isConnected) {
            throw new Error('WhatsApp não está conectado');
        }

        let result;
        
        if (type === 'text') {
            const message = formData.get('message');
            result = await api.sendText(to, message, sessionId);
            utils.addLog('Mensagem de texto enviada', `Para: ${to} | Mensagem: ${message}`);
        } else {
            const file = formData.get('file');
            const caption = formData.get('caption') || '';
            result = await api.sendMedia(to, file, caption, sessionId, type);
            utils.addLog(`${type.charAt(0).toUpperCase() + type.slice(1)} enviado`, 
                        `Para: ${to} | Arquivo: ${file.name} | Legenda: ${caption}`);
        }

        return result;
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Botão conectar
    elements.connectBtn.addEventListener('click', () => {
        qrManager.generateAndShow();
    });

    // Mudança no tipo de mensagem
    elements.messageType.addEventListener('change', () => {
        messageManager.updateFormFields();
    });

    // Validação de número em tempo real
    elements.recipient.addEventListener('input', (e) => {
        // Formatação local primeiro
        numberManager.formatLocal(e.target);
        
        // Validação assíncrona
        numberManager.validateAndFormat(e.target);
    });

    // Validação ao perder o foco
    elements.recipient.addEventListener('blur', (e) => {
        if (e.target.value.trim()) {
            numberManager.validateAndFormat(e.target);
        }
    });

    // Formulário de mensagem
    elements.messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            utils.showLoading();
            
            // Valida e formata o número antes de enviar
            const formattedNumber = await numberManager.validateAndFormat(elements.recipient);
            
            if (!formattedNumber) {
                throw new Error('Número inválido. Verifique o formato do número.');
            }
            
            const formData = new FormData();
            formData.append('to', formattedNumber);
            formData.append('type', elements.messageType.value);
            
            if (elements.messageType.value === 'text') {
                formData.append('message', elements.messageText.value);
            } else {
                formData.append('file', elements.messageFile.files[0]);
                formData.append('caption', elements.messageCaption.value);
            }
            
            await messageManager.send(formData);
            
            // Limpa formulário
            elements.messageForm.reset();
            messageManager.updateFormFields();
            elements.numberPreview.style.display = 'none';
            elements.recipient.classList.remove('valid', 'invalid');
            
            utils.showMessage('Mensagem enviada com sucesso!');
            
        } catch (error) {
            utils.addLog('Erro ao enviar mensagem', error.message, true);
            utils.showMessage('Erro ao enviar mensagem: ' + error.message, true);
        } finally {
            utils.hideLoading();
        }
    });

    // Formulário de webhook
    elements.webhookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            utils.showLoading();
            
            const webhookUrl = elements.webhookUrl.value;
            const events = [];
            
            if (elements.eventMessage.checked) events.push('message');
            if (elements.eventStatus.checked) events.push('status_change');
            
            if (!currentSessionId) {
                throw new Error('Nenhuma sessão ativa');
            }
            
            await api.configureWebhook(webhookUrl, events, currentSessionId);
            
            utils.addLog('Webhook configurado', `URL: ${webhookUrl} | Eventos: ${events.join(', ')}`);
            utils.showMessage('Webhook configurado com sucesso!');
            
        } catch (error) {
            utils.addLog('Erro ao configurar webhook', error.message, true);
            utils.showMessage('Erro ao configurar webhook: ' + error.message, true);
        } finally {
            utils.hideLoading();
        }
    });

    // Limpar log
    elements.clearLogBtn.addEventListener('click', () => {
        elements.logContainer.innerHTML = '<p class="log-empty">Nenhuma mensagem enviada ainda</p>';
        utils.showMessage('Log limpo com sucesso!');
    });

    // Inicialização
    messageManager.updateFormFields();
    statusManager.updateStatus(false);
});

// Cleanup ao sair da página
window.addEventListener('beforeunload', () => {
    statusManager.stopStatusCheck();
});

