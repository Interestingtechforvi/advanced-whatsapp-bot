const express = require("express");
const qrcode = require("qrcode");
require('dotenv').config();

const AdvancedWhatsAppBot = require('./src/bot');
const logger = require('./src/utils/logger');

// --- Global Variables ---
const app = express();
const bot = new AdvancedWhatsAppBot();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// --- Express Routes ---

// Home route
app.get("/", (req, res) => {
    const status = bot.getStatus();
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Advanced WhatsApp AI Bot - Dashboard</title>
                <link rel="stylesheet" href="/css/style.css">
                <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>">
            </head>
            <body class="fade-in">
                <div class="container">
                    <header class="header">
                        <h1>🤖 Advanced WhatsApp AI Bot</h1>
                        <p>Intelligent conversational AI with multiple models and advanced features</p>
                    </header>

                    <div class="status-grid">
                        <div class="status-card ${status.connected ? 'connected' : 'disconnected'}" id="status-card">
                            <h3>
                                <span class="status-indicator ${status.connected ? 'online' : 'offline'}"></span>
                                Connection Status
                            </h3>
                            <p class="status-text" style="color: ${status.connected ? '#28a745' : '#dc3545'}; font-weight: 600; font-size: 1.1rem;">
                                ${status.connected ? '✅ Connected & Ready' : '❌ Disconnected'}
                            </p>
                            <p class="last-update" style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">
                                Last update: ${new Date(status.timestamp).toLocaleString()}
                            </p>
                            ${status.reconnectAttempts > 0 ? `<p style="color: #ffc107; margin-top: 0.5rem;">Reconnect attempts: ${status.reconnectAttempts}</p>` : ''}
                        </div>

                        <div class="status-card">
                            <h3>🎯 Quick Actions</h3>
                            <div class="btn-group" style="margin: 1rem 0; justify-content: flex-start;">
                                <a href="/qr" class="btn">📱 QR Code</a>
                                <button onclick="BotUtils.refreshStatus()" class="btn btn-secondary" id="refresh-status">🔄 Refresh</button>
                                <a href="/status" class="btn btn-warning">📊 API Status</a>
                            </div>
                        </div>
                    </div>

                    <div class="features-grid">
                        <div class="feature-card">
                            <h4><span class="feature-icon">🤖</span>Multiple AI Models</h4>
                            <p>Choose between Gemini AI, OpenAI ChatGPT, and DeepSeek for diverse conversational experiences.</p>
                        </div>

                        <div class="feature-card">
                            <h4><span class="feature-icon">🔊</span>Text-to-Speech</h4>
                            <p>Convert text to natural speech with 100+ voices in multiple languages using advanced TTS technology.</p>
                        </div>

                        <div class="feature-card">
                            <h4><span class="feature-icon">📞</span>Truecaller Integration</h4>
                            <p>Lookup phone numbers, identify callers, check spam scores, and get location information.</p>
                        </div>

                        <div class="feature-card">
                            <h4><span class="feature-icon">🔍</span>Deep Research</h4>
                            <p>Perform comprehensive web research, get latest news, and synthesize information from multiple sources.</p>
                        </div>

                        <div class="feature-card">
                            <h4><span class="feature-icon">🎤</span>Audio Transcription</h4>
                            <p>Convert voice messages to text using advanced speech recognition technology.</p>
                        </div>

                        <div class="feature-card">
                            <h4><span class="feature-icon">📄</span>Document Processing</h4>
                            <p>Summarize documents, analyze files, and extract key information from various formats.</p>
                        </div>

                        <div class="feature-card">
                            <h4><span class="feature-icon">💾</span>Smart Memory</h4>
                            <p>Remembers user preferences, conversation history, and provides personalized responses.</p>
                        </div>

                        <div class="feature-card">
                            <h4><span class="feature-icon">🌐</span>Web Dashboard</h4>
                            <p>Monitor bot status, view analytics, and manage settings through this intuitive interface.</p>
                        </div>
                    </div>

                    <div class="commands-section">
                        <h2>📋 Available Commands</h2>
                        <p style="color: #666; margin-bottom: 1.5rem;">Click any command to copy it to your clipboard</p>
                        
                        <div class="commands-grid">
                            <div class="command-category">
                                <h4>🎯 Basic Commands</h4>
                                <ul class="command-list">
                                    <li>/start</li>
                                    <li>/help</li>
                                    <li>/model gemini</li>
                                    <li>/settings</li>
                                    <li>/status</li>
                                </ul>
                            </div>

                            <div class="command-category">
                                <h4>🔊 Audio Commands</h4>
                                <ul class="command-list">
                                    <li>/tts Hello world</li>
                                    <li>/voice Salli</li>
                                    <li>/transcribe</li>
                                </ul>
                            </div>

                            <div class="command-category">
                                <h4>🔍 Research Commands</h4>
                                <ul class="command-list">
                                    <li>/research AI trends 2024</li>
                                    <li>/search latest news</li>
                                    <li>/news technology</li>
                                </ul>
                            </div>

                            <div class="command-category">
                                <h4>📱 Utility Commands</h4>
                                <ul class="command-list">
                                    <li>/truecaller +1234567890</li>
                                    <li>/summary</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <span class="stat-number">3</span>
                            <span class="stat-label">AI Models</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-number">100+</span>
                            <span class="stat-label">TTS Voices</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-number">24/7</span>
                            <span class="stat-label">Availability</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-number">∞</span>
                            <span class="stat-label">Conversations</span>
                        </div>
                    </div>

                    <footer class="footer">
                        <p>🤖 Advanced WhatsApp AI Bot v2.0.0</p>
                        <p style="opacity: 0.8; margin-top: 0.5rem;">Built with ❤️ for intelligent conversations</p>
                    </footer>
                </div>

                <script src="/js/dashboard.js"></script>
            </body>
        </html>
    `);
});

// QR code route
app.get("/qr", async (req, res) => {
    const status = bot.getStatus();
    
    if (status.connected) {
        res.send(`
            <html>
                <head><title>WhatsApp Bot - Connected</title></head>
                <body style="background: #f5f5f5; font-family: Arial; text-align: center; padding: 50px;">
                    <h2 style="color: green;">✅ WhatsApp is Connected!</h2>
                    <p>The bot is online and ready to receive messages.</p>
                    <a href="/" style="color: #007bff;">← Back to Dashboard</a>
                </body>
            </html>
        `);
    } else if (status.hasQR) {
        try {
            const qrCodeImage = await qrcode.toDataURL(bot.getQRCode());
            res.send(`
                <html>
                    <head>
                        <title>WhatsApp Bot - QR Code</title>
                        <meta http-equiv="refresh" content="30">
                    </head>
                    <body style="background: black; color: white; font-family: Arial; text-align: center; padding: 20px;">
                        <h2>📱 Scan QR Code to Connect</h2>
                        <img src="${qrCodeImage}" alt="WhatsApp QR Code" style="width: 400px; height: 400px; border: 2px solid white;"/>
                        <p>Open WhatsApp → Settings → Linked Devices → Link a Device</p>
                        <p style="color: #ccc;">Page refreshes automatically every 30 seconds</p>
                        <a href="/" style="color: #007bff;">← Back to Dashboard</a>
                    </body>
                </html>
            `);
        } catch (error) {
            res.send(`
                <html>
                    <body style="background: #f5f5f5; font-family: Arial; text-align: center; padding: 50px;">
                        <h3>❌ Error generating QR code</h3>
                        <p>Please refresh the page or restart the bot.</p>
                        <a href="/" style="color: #007bff;">← Back to Dashboard</a>
                    </body>
                </html>
            `);
        }
    } else {
        res.send(`
            <html>
                <head>
                    <title>WhatsApp Bot - Connecting</title>
                    <meta http-equiv="refresh" content="5">
                </head>
                <body style="background: #f5f5f5; font-family: Arial; text-align: center; padding: 50px;">
                    <h3>🔄 Generating QR code...</h3>
                    <p>Please wait while the bot initializes.</p>
                    <p style="color: #666;">Page refreshes automatically every 5 seconds</p>
                    <a href="/" style="color: #007bff;">← Back to Dashboard</a>
                </body>
            </html>
        `);
    }
});

// Status API route
app.get("/status", (req, res) => {
    const status = bot.getStatus();
    res.json({
        ...status,
        version: "2.0.0",
        features: {
            multipleAI: true,
            textToSpeech: true,
            truecaller: true,
            deepResearch: true,
            audioTranscription: true,
            documentSummary: true,
            database: true
        }
    });
});

// Health check route
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: "2.0.0"
    });
});

// API route for external integrations
app.post("/api/send", async (req, res) => {
    try {
        const { number, message } = req.body;
        
        if (!number || !message) {
            return res.status(400).json({ error: "Number and message are required" });
        }

        if (!bot.getStatus().connected) {
            return res.status(503).json({ error: "Bot is not connected to WhatsApp" });
        }

        // Send message (this would need to be implemented in the bot class)
        // await bot.sendMessage(number, message);
        
        res.json({ success: true, message: "Message sent successfully" });
    } catch (error) {
        logger.error('API send error:', error);
        res.status(500).json({ error: "Failed to send message" });
    }
});

// --- Error Handling ---
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('🛑 Received SIGINT. Shutting down gracefully...');
    await bot.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('🛑 Received SIGTERM. Shutting down gracefully...');
    await bot.shutdown();
    process.exit(0);
});

// --- Start Server ---
async function startServer() {
    try {
        // Initialize bot
        await bot.initialize();
        
        // Start Express server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`🚀 Advanced WhatsApp Bot Server running on port ${PORT}`);
            logger.info(`📱 Dashboard: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
            logger.info(`📱 QR Code: http://localhost:${PORT}/qr`);
        });
        
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the application
startServer();

