const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { initializeDatabase } = require('./config/database');
const MessageHandler = require('./handlers/messageHandler');
const logger = require('./utils/logger');

class AdvancedWhatsAppBot {
    constructor() {
        this.sock = null;
        this.isConnected = false;
        this.messageHandler = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    async initialize() {
        try {
            logger.info('🚀 Initializing Advanced WhatsApp Bot...');
            
            // Initialize database
            await initializeDatabase();
            
            // Start WhatsApp connection
            await this.startWhatsApp();
            
        } catch (error) {
            logger.error('Bot initialization error:', error);
            throw error;
        }
    }

    async startWhatsApp() {
        try {
            // Using multi-file authentication
            const { state, saveCreds } = await useMultiFileAuthState("auth_info_multi");
            const { version } = await fetchLatestBaileysVersion();

            // Create WhatsApp socket
            this.sock = makeWASocket({
                version,
                auth: state,
                logger: pino({ level: 'silent' }),
                qrTimeout: 30000,
                defaultQueryTimeoutMs: 60000,
                keepAliveIntervalMs: 30000,
                markOnlineOnConnect: true,
                syncFullHistory: false,
                printQRInTerminal: true
            });

            // Initialize message handler
            this.messageHandler = new MessageHandler(this.sock);

            // Set up event handlers
            this.setupEventHandlers(saveCreds);

        } catch (error) {
            logger.error('WhatsApp initialization error:', error);
            throw error;
        }
    }

    setupEventHandlers(saveCreds) {
        // Connection updates
        this.sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                logger.info('📱 QR Code generated. Scan with WhatsApp to connect.');
                this.qrCode = qr;
            }
            
            if (connection === "open") {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                logger.info('✅ WhatsApp Connected Successfully!');
                
                // Send startup notification to admin (optional)
                // await this.notifyStartup();
            } else if (connection === "close") {
                this.isConnected = false;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                
                logger.warn(`Connection closed. Status: ${statusCode}`);
                
                // Handle different disconnect reasons
                if (statusCode === DisconnectReason.loggedOut) {
                    logger.error('❌ Bot was logged out. Please scan QR code again.');
                    this.qrCode = null;
                } else if (statusCode === DisconnectReason.restartRequired) {
                    logger.info('🔄 Restart required. Restarting...');
                    await this.startWhatsApp();
                } else if (statusCode === DisconnectReason.connectionClosed) {
                    logger.info('🔄 Connection closed. Reconnecting...');
                    await this.handleReconnection();
                } else if (statusCode === DisconnectReason.connectionLost) {
                    logger.info('🔄 Connection lost. Reconnecting...');
                    await this.handleReconnection();
                } else if (statusCode === DisconnectReason.timedOut) {
                    logger.info('⏰ Connection timed out. Reconnecting...');
                    await this.handleReconnection();
                } else {
                    logger.error(`❌ Unknown disconnect reason: ${statusCode}`);
                    await this.handleReconnection();
                }
            }
        });

        // Save credentials
        this.sock.ev.on("creds.update", saveCreds);

        // Handle incoming messages
        this.sock.ev.on("messages.upsert", async ({ messages }) => {
            for (const msg of messages) {
                if (!msg.message) continue;
                
                try {
                    await this.messageHandler.handleMessage(msg);
                } catch (error) {
                    logger.error('Message handling error:', error);
                }
            }
        });

        // Handle message updates (read receipts, etc.)
        this.sock.ev.on("message-receipt.update", (updates) => {
            // Handle read receipts if needed
        });

        // Handle presence updates
        this.sock.ev.on("presence.update", (presence) => {
            // Handle user presence updates if needed
        });

        // Handle group updates
        this.sock.ev.on("groups.update", (updates) => {
            // Handle group updates if needed
        });
    }

    async handleReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached. Stopping.`);
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
        
        logger.info(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);
        
        setTimeout(async () => {
            try {
                await this.startWhatsApp();
            } catch (error) {
                logger.error('Reconnection failed:', error);
                await this.handleReconnection();
            }
        }, delay);
    }

    async notifyStartup() {
        // Optional: Send startup notification to admin
        // const adminNumber = process.env.ADMIN_NUMBER;
        // if (adminNumber && this.isConnected) {
        //     try {
        //         await this.sock.sendMessage(adminNumber + '@s.whatsapp.net', {
        //             text: '🤖 Advanced WhatsApp Bot is now online and ready!'
        //         });
        //     } catch (error) {
        //         logger.error('Failed to send startup notification:', error);
        //     }
        // }
    }

    getStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            hasQR: !!this.qrCode,
            timestamp: new Date().toISOString()
        };
    }

    getQRCode() {
        return this.qrCode;
    }

    async shutdown() {
        logger.info('🛑 Shutting down bot...');
        
        if (this.sock) {
            try {
                await this.sock.logout();
            } catch (error) {
                logger.error('Error during logout:', error);
            }
        }
        
        this.isConnected = false;
        logger.info('✅ Bot shutdown complete.');
    }
}

module.exports = AdvancedWhatsAppBot;

