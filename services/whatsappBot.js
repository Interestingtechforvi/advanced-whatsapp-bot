const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
    downloadMediaMessage
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

class WhatsAppBot extends EventEmitter {
    constructor(io) {
        super();
        this.sock = null;
        this.io = io;
        this.isReady = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.qrCode = null;
        this.userSessions = new Map();
        this.messageHandlers = new Map();
        
        // Initialize message handlers
        this.initializeMessageHandlers();
    }

    async initialize() {
        try {
            console.log('🚀 Initializing WhatsApp Bot...');
            
            // Ensure auth directory exists
            const authDir = path.join(__dirname, '..', 'auth_info_multi');
            if (!fs.existsSync(authDir)) {
                fs.mkdirSync(authDir, { recursive: true });
            }
            
            await this.startWhatsApp();
            
        } catch (error) {
            console.error('❌ Bot initialization error:', error);
            this.emit('error', error);
            throw error;
        }
    }

    async startWhatsApp() {
        try {
            const { state, saveCreds } = await useMultiFileAuthState("auth_info_multi");
            const { version } = await fetchLatestBaileysVersion();

            this.sock = makeWASocket({
                version,
                auth: state,
                logger: pino({ level: 'silent' }),
                qrTimeout: 30000,
                defaultQueryTimeoutMs: 60000,
                keepAliveIntervalMs: 30000,
                markOnlineOnConnect: true,
                syncFullHistory: false,
                printQRInTerminal: true,
                browser: ['WhatsApp AI Bot', 'Chrome', '1.0.0']
            });

            this.setupEventHandlers(saveCreds);

        } catch (error) {
            console.error('❌ WhatsApp initialization error:', error);
            throw error;
        }
    }

    setupEventHandlers(saveCreds) {
        // Connection updates
        this.sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                this.qrCode = qr;
                console.log('📱 QR Code generated');
                this.emit('qr', qr);
                
                if (this.io) {
                    this.io.emit('qr-code', qr);
                }
            }
            
            if (connection === "open") {
                this.isReady = true;
                this.reconnectAttempts = 0;
                this.qrCode = null;
                console.log('✅ WhatsApp Connected Successfully!');
                this.emit('ready');
                
                if (this.io) {
                    this.io.emit('bot-ready');
                }
                
                // Send startup notification
                await this.sendStartupNotification();
                
            } else if (connection === "close") {
                this.isReady = false;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                
                console.warn(`❌ Connection closed. Status: ${statusCode}`);
                this.emit('disconnected', statusCode);
                
                if (this.io) {
                    this.io.emit('bot-disconnected', statusCode);
                }
                
                await this.handleDisconnection(statusCode);
            }
        });

        // Save credentials
        this.sock.ev.on("creds.update", saveCreds);

        // Handle incoming messages
        this.sock.ev.on("messages.upsert", async ({ messages }) => {
            for (const msg of messages) {
                if (!msg.message || msg.key.fromMe) continue;
                
                try {
                    await this.handleMessage(msg);
                } catch (error) {
                    console.error('❌ Message handling error:', error);
                }
            }
        });

        // Handle message updates
        this.sock.ev.on("message-receipt.update", (updates) => {
            // Handle read receipts if needed
        });

        // Handle presence updates
        this.sock.ev.on("presence.update", (presence) => {
            // Handle user presence updates if needed
        });
    }

    async handleDisconnection(statusCode) {
        if (statusCode === DisconnectReason.loggedOut) {
            console.error('❌ Bot was logged out. Please scan QR code again.');
            this.qrCode = null;
        } else if (statusCode === DisconnectReason.restartRequired) {
            console.log('🔄 Restart required. Restarting...');
            await this.startWhatsApp();
        } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
            await this.handleReconnection();
        } else {
            console.error(`❌ Max reconnection attempts reached. Status: ${statusCode}`);
        }
    }

    async handleReconnection() {
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        
        console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);
        
        setTimeout(async () => {
            try {
                await this.startWhatsApp();
            } catch (error) {
                console.error('❌ Reconnection failed:', error);
                await this.handleReconnection();
            }
        }, delay);
    }

    initializeMessageHandlers() {
        // Command handlers
        this.messageHandlers.set('/start', this.handleStartCommand.bind(this));
        this.messageHandlers.set('/help', this.handleHelpCommand.bind(this));
        this.messageHandlers.set('/ai', this.handleAICommand.bind(this));
        this.messageHandlers.set('/translate', this.handleTranslateCommand.bind(this));
        this.messageHandlers.set('/search', this.handleSearchCommand.bind(this));
        this.messageHandlers.set('/weather', this.handleWeatherCommand.bind(this));
        this.messageHandlers.set('/tts', this.handleTTSCommand.bind(this));
        this.messageHandlers.set('/truecaller', this.handleTruecallerCommand.bind(this));
        this.messageHandlers.set('/qr', this.handleQRCommand.bind(this));
        this.messageHandlers.set('/status', this.handleStatusCommand.bind(this));
    }

    async handleMessage(msg) {
        try {
            const remoteJid = msg.key.remoteJid;
            const phoneNumber = remoteJid.replace('@s.whatsapp.net', '');
            
            // Skip group messages for security
            if (remoteJid.includes('@g.us')) {
                return;
            }

            // Mark message as read
            await this.sock.readMessages([msg.key]);
            await this.sock.sendPresenceUpdate('composing', remoteJid);

            let messageText = '';
            let response = '';

            // Extract message text
            if (msg.message.conversation) {
                messageText = msg.message.conversation;
            } else if (msg.message.extendedTextMessage) {
                messageText = msg.message.extendedTextMessage.text;
            } else if (msg.message.imageMessage && msg.message.imageMessage.caption) {
                messageText = msg.message.imageMessage.caption;
            } else if (msg.message.documentMessage && msg.message.documentMessage.caption) {
                messageText = msg.message.documentMessage.caption;
            } else if (msg.message.audioMessage) {
                response = await this.handleAudioMessage(msg, remoteJid);
            } else if (msg.message.imageMessage) {
                response = await this.handleImageMessage(msg, remoteJid);
            } else if (msg.message.documentMessage) {
                response = await this.handleDocumentMessage(msg, remoteJid);
            }

            if (messageText) {
                response = await this.processTextMessage(messageText, phoneNumber, remoteJid);
            }

            if (response) {
                await this.sendMessage(remoteJid, { text: response });
            }

            await this.sock.sendPresenceUpdate('paused', remoteJid);

        } catch (error) {
            console.error('❌ Message handling error:', error);
            await this.sendMessage(msg.key.remoteJid, { 
                text: "❌ Sorry, I encountered an error processing your message. Please try again." 
            });
        }
    }

    async processTextMessage(messageText, phoneNumber, remoteJid) {
        try {
            const trimmedMessage = messageText.trim();
            
            // Check if it's a command
            if (trimmedMessage.startsWith('/')) {
                const parts = trimmedMessage.split(' ');
                const command = parts[0].toLowerCase();
                const args = parts.slice(1).join(' ');
                
                if (this.messageHandlers.has(command)) {
                    return await this.messageHandlers.get(command)(args, phoneNumber, remoteJid);
                } else {
                    return `❌ Unknown command: ${command}\n\nType /help to see available commands.`;
                }
            }
            
            // Regular AI conversation
            return await this.handleAIConversation(trimmedMessage, phoneNumber);
            
        } catch (error) {
            console.error('❌ Text message processing error:', error);
            return "❌ Sorry, I couldn't process your message. Please try again.";
        }
    }

    // Command Handlers
    async handleStartCommand(args, phoneNumber, remoteJid) {
        return `🤖 *Welcome to Advanced WhatsApp AI Bot!*\n\n` +
               `I'm your intelligent assistant with multiple AI models and advanced features.\n\n` +
               `🎯 *Quick Start:*\n` +
               `• Just send me any message for AI conversation\n` +
               `• Use /help to see all commands\n` +
               `• Try /ai gemini Hello to chat with Gemini AI\n\n` +
               `🚀 *Features:*\n` +
               `• Multiple AI Models (Gemini, ChatGPT, DeepSeek, Claude)\n` +
               `• Translation Services\n` +
               `• Search & Research\n` +
               `• Weather Information\n` +
               `• Text-to-Speech\n` +
               `• Phone Lookup\n` +
               `• QR Code Generation\n` +
               `• And much more!\n\n` +
               `Type /help for detailed command list.`;
    }

    async handleHelpCommand(args, phoneNumber, remoteJid) {
        return `🤖 *Advanced WhatsApp AI Bot - Commands*\n\n` +
               `*🎯 Basic Commands:*\n` +
               `• /start - Welcome message\n` +
               `• /help - Show this help\n` +
               `• /status - Bot status\n\n` +
               `*🤖 AI Commands:*\n` +
               `• /ai [model] [prompt] - Chat with AI\n` +
               `  Models: gemini, chatgpt4, deepseek, claude\n` +
               `  Example: /ai gemini What is AI?\n\n` +
               `*🌐 Utility Commands:*\n` +
               `• /translate [text] [lang] - Translate text\n` +
               `• /search [query] - Web search\n` +
               `• /weather [location] - Weather info\n` +
               `• /tts [text] - Text to speech\n` +
               `• /truecaller [number] - Phone lookup\n` +
               `• /qr [text] - Generate QR code\n\n` +
               `*💬 Chat:*\n` +
               `Just send any message for AI conversation!\n\n` +
               `Example: "Tell me a joke" or "Explain quantum physics"`;
    }

    async handleAICommand(args, phoneNumber, remoteJid) {
        try {
            if (!args) {
                return `🤖 *AI Chat Command*\n\n` +
                       `Usage: /ai [model] [prompt]\n\n` +
                       `Available models:\n` +
                       `• gemini - Google Gemini AI\n` +
                       `• chatgpt4 - OpenAI ChatGPT-4\n` +
                       `• deepseek - DeepSeek AI\n` +
                       `• claude - Claude AI\n\n` +
                       `Example: /ai gemini What is artificial intelligence?`;
            }

            const parts = args.split(' ');
            const model = parts[0].toLowerCase();
            const prompt = parts.slice(1).join(' ');

            if (!prompt) {
                return `❌ Please provide a prompt.\n\nExample: /ai ${model} Hello, how are you?`;
            }

            // Call AI API
            const axios = require('axios');
            const response = await axios.get(`http://localhost:3000/ai/chat/${model}`, {
                params: { prompt: prompt },
                timeout: 30000
            });

            if (response.data.success) {
                return `🤖 *${model.toUpperCase()} Response:*\n\n${response.data.formatted_response || response.data.response}`;
            } else {
                return `❌ AI Error: ${response.data.error}`;
            }

        } catch (error) {
            console.error('AI command error:', error);
            return `❌ Failed to get AI response. Please try again.`;
        }
    }

    async handleTranslateCommand(args, phoneNumber, remoteJid) {
        try {
            if (!args) {
                return `🌐 *Translation Command*\n\n` +
                       `Usage: /translate [text] [target_language]\n\n` +
                       `Example: /translate Hello World es\n` +
                       `Example: /translate Bonjour en`;
            }

            const parts = args.split(' ');
            const targetLang = parts.pop(); // Last word is target language
            const text = parts.join(' ');

            if (!text || !targetLang) {
                return `❌ Please provide text and target language.\n\nExample: /translate Hello World es`;
            }

            const axios = require('axios');
            const response = await axios.get(`http://localhost:3000/api/translate`, {
                params: { text: text, target_language: targetLang },
                timeout: 15000
            });

            if (response.data.success && response.data.data) {
                const translatedText = response.data.data.translatedText || response.data.data.result;
                return `🌐 *Translation Result:*\n\n` +
                       `📝 *Original:* ${text}\n` +
                       `🎯 *Target Language:* ${targetLang}\n` +
                       `✅ *Translation:* ${translatedText}`;
            } else {
                return `❌ Translation failed. Please try again.`;
            }

        } catch (error) {
            console.error('Translation command error:', error);
            return `❌ Translation service unavailable. Please try again later.`;
        }
    }

    async handleSearchCommand(args, phoneNumber, remoteJid) {
        try {
            if (!args) {
                return `🔍 *Search Command*\n\n` +
                       `Usage: /search [query]\n\n` +
                       `Example: /search latest technology news`;
            }

            const axios = require('axios');
            const response = await axios.get(`http://localhost:3000/api/search`, {
                params: { query: args, num_results: 5 },
                timeout: 15000
            });

            if (response.data.success && response.data.data) {
                let result = `🔍 *Search Results for: ${args}*\n\n`;
                
                if (response.data.data.results && response.data.data.results.length > 0) {
                    response.data.data.results.slice(0, 5).forEach((item, index) => {
                        result += `${index + 1}. *${item.title}*\n`;
                        result += `   ${item.snippet}\n`;
                        if (item.link) {
                            result += `   🔗 ${item.link}\n`;
                        }
                        result += '\n';
                    });
                } else {
                    result += 'No results found.';
                }
                
                return result;
            } else {
                return `❌ Search failed. Please try again.`;
            }

        } catch (error) {
            console.error('Search command error:', error);
            return `❌ Search service unavailable. Please try again later.`;
        }
    }

    async handleWeatherCommand(args, phoneNumber, remoteJid) {
        try {
            const location = args || 'hot-cities';
            
            const axios = require('axios');
            const response = await axios.get(`http://localhost:3000/api/weather/${location}`, {
                timeout: 15000
            });

            if (response.data.success && response.data.data) {
                return `🌤️ *Weather Information*\n\n${JSON.stringify(response.data.data, null, 2)}`;
            } else {
                return `❌ Weather data unavailable for: ${location}`;
            }

        } catch (error) {
            console.error('Weather command error:', error);
            return `❌ Weather service unavailable. Please try again later.`;
        }
    }

    async handleTTSCommand(args, phoneNumber, remoteJid) {
        try {
            if (!args) {
                return `🔊 *Text-to-Speech Command*\n\n` +
                       `Usage: /tts [text]\n\n` +
                       `Example: /tts Hello, how are you today?`;
            }

            const axios = require('axios');
            const response = await axios.get(`http://localhost:3000/api/tts`, {
                params: { text: args, voice: 'Salli' },
                timeout: 15000
            });

            if (response.data.success) {
                return `🔊 *Text-to-Speech Generated*\n\n` +
                       `📝 *Text:* "${args}"\n` +
                       `🎵 *Audio URL:* ${response.data.data || 'Generated successfully'}`;
            } else {
                return `❌ TTS generation failed. Please try again.`;
            }

        } catch (error) {
            console.error('TTS command error:', error);
            return `❌ TTS service unavailable. Please try again later.`;
        }
    }

    async handleTruecallerCommand(args, phoneNumber, remoteJid) {
        try {
            if (!args) {
                return `📞 *Truecaller Lookup Command*\n\n` +
                       `Usage: /truecaller [phone_number]\n\n` +
                       `Example: /truecaller +1234567890`;
            }

            const axios = require('axios');
            const response = await axios.get(`http://localhost:3000/api/truecaller`, {
                params: { phone_number: args },
                timeout: 15000
            });

            if (response.data.success && response.data.data) {
                const data = response.data.data;
                return `📞 *Phone Lookup Result*\n\n` +
                       `📱 *Number:* ${args}\n` +
                       `👤 *Name:* ${data.name || 'Unknown'}\n` +
                       `📡 *Carrier:* ${data.carrier || 'Unknown'}\n` +
                       `📍 *Location:* ${data.location || 'Unknown'}`;
            } else {
                return `❌ No information found for: ${args}`;
            }

        } catch (error) {
            console.error('Truecaller command error:', error);
            return `❌ Truecaller service unavailable. Please try again later.`;
        }
    }

    async handleQRCommand(args, phoneNumber, remoteJid) {
        try {
            if (!args) {
                return `📱 *QR Code Generator Command*\n\n` +
                       `Usage: /qr [text]\n\n` +
                       `Example: /qr https://example.com`;
            }

            const axios = require('axios');
            const response = await axios.get(`http://localhost:3000/utility/qr-generator`, {
                params: { text: args },
                timeout: 15000
            });

            if (response.data.success) {
                return `📱 *QR Code Generated*\n\n` +
                       `📝 *Text:* ${args}\n` +
                       `🔗 *QR Code URL:* ${response.data.qr_url}`;
            } else {
                return `❌ QR code generation failed. Please try again.`;
            }

        } catch (error) {
            console.error('QR command error:', error);
            return `❌ QR code service unavailable. Please try again later.`;
        }
    }

    async handleStatusCommand(args, phoneNumber, remoteJid) {
        return `📊 *Bot Status*\n\n` +
               `✅ *Status:* Online and Ready\n` +
               `🤖 *AI Models:* Available\n` +
               `🌐 *APIs:* Operational\n` +
               `📱 *WhatsApp:* Connected\n` +
               `⏰ *Uptime:* ${Math.floor(process.uptime())} seconds\n` +
               `🔧 *Version:* 2.0.0\n\n` +
               `All systems operational! 🚀`;
    }

    async handleAIConversation(message, phoneNumber) {
        try {
            // Default to Gemini for general conversation
            const axios = require('axios');
            const response = await axios.get(`http://localhost:3000/ai/chat/gemini`, {
                params: { prompt: message },
                timeout: 30000
            });

            if (response.data.success) {
                return response.data.formatted_response || response.data.response;
            } else {
                return `❌ I'm having trouble responding right now. Please try again.`;
            }

        } catch (error) {
            console.error('AI conversation error:', error);
            return `❌ I'm experiencing technical difficulties. Please try again later.`;
        }
    }

    async handleAudioMessage(msg, remoteJid) {
        return `🎤 *Audio Message Received*\n\n` +
               `I can process audio messages!\n` +
               `Audio transcription feature coming soon...`;
    }

    async handleImageMessage(msg, remoteJid) {
        return `🖼️ *Image Received*\n\n` +
               `I can analyze images!\n` +
               `Image analysis feature coming soon...`;
    }

    async handleDocumentMessage(msg, remoteJid) {
        return `📄 *Document Received*\n\n` +
               `I can process documents!\n` +
               `Document analysis feature coming soon...`;
    }

    async sendStartupNotification() {
        // Optional: Send notification to admin
        const adminNumber = process.env.ADMIN_NUMBER;
        if (adminNumber && this.isReady) {
            try {
                await this.sendMessage(adminNumber + '@s.whatsapp.net', {
                    text: '🤖 Advanced WhatsApp AI Bot is now online and ready!\n\n' +
                          '✅ All systems operational\n' +
                          '🚀 Ready to assist users'
                });
            } catch (error) {
                console.error('Failed to send startup notification:', error);
            }
        }
    }

    // Public methods
    async sendMessage(jid, content) {
        if (!this.isReady || !this.sock) {
            throw new Error('Bot is not ready');
        }
        
        return await this.sock.sendMessage(jid, content);
    }

    async getChatHistory(jid, limit = 20) {
        // This is a placeholder - implement based on your storage solution
        return [];
    }

    async getBotInfo() {
        if (!this.isReady || !this.sock) {
            return null;
        }
        
        return {
            user: this.sock.user,
            connected: this.isReady,
            version: '2.0.0'
        };
    }

    isConnected() {
        return this.isReady;
    }

    getQRCode() {
        return this.qrCode;
    }

    async restart() {
        console.log('🔄 Restarting WhatsApp Bot...');
        
        if (this.sock) {
            await this.sock.logout();
        }
        
        this.isReady = false;
        this.reconnectAttempts = 0;
        
        await this.startWhatsApp();
    }

    async logout() {
        console.log('🛑 Logging out WhatsApp Bot...');
        
        if (this.sock) {
            await this.sock.logout();
        }
        
        this.isReady = false;
        this.emit('disconnected');
    }

    async destroy() {
        console.log('🛑 Destroying WhatsApp Bot...');
        
        if (this.sock) {
            try {
                await this.sock.logout();
            } catch (error) {
                console.error('Error during logout:', error);
            }
        }
        
        this.isReady = false;
        this.removeAllListeners();
    }
}

module.exports = WhatsAppBot;

