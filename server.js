const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const apiRoutes = require('./routes/api');
const whatsappRoutes = require('./routes/whatsapp');
const aiRoutes = require('./routes/ai');
const utilityRoutes = require('./routes/utility');

// Import WhatsApp bot
const WhatsAppBot = require('./services/whatsappBot');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    }
});

app.use('/api/', limiter);

// Static files
app.use(express.static('public'));

// Global variables
let whatsappBot = null;
let botStatus = {
    connected: false,
    qrCode: null,
    lastUpdate: new Date().toISOString()
};

// Initialize WhatsApp Bot
async function initializeBot() {
    try {
        console.log('🚀 Initializing WhatsApp Bot...');
        whatsappBot = new WhatsAppBot(io);
        
        // Set up bot event listeners
        whatsappBot.on('qr', (qr) => {
            botStatus.qrCode = qr;
            botStatus.lastUpdate = new Date().toISOString();
            io.emit('qr-code', qr);
            console.log('📱 QR Code generated');
        });
        
        whatsappBot.on('ready', () => {
            botStatus.connected = true;
            botStatus.qrCode = null;
            botStatus.lastUpdate = new Date().toISOString();
            io.emit('bot-ready');
            console.log('✅ WhatsApp Bot is ready!');
        });
        
        whatsappBot.on('disconnected', () => {
            botStatus.connected = false;
            botStatus.lastUpdate = new Date().toISOString();
            io.emit('bot-disconnected');
            console.log('❌ WhatsApp Bot disconnected');
        });
        
        await whatsappBot.initialize();
        
    } catch (error) {
        console.error('❌ Bot initialization error:', error);
        botStatus.connected = false;
        botStatus.lastUpdate = new Date().toISOString();
    }
}

// Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'WhatsApp AI Bot API Server',
        version: '2.0.0',
        status: 'online',
        features: [
            'Advanced WhatsApp AI Bot',
            'Multiple AI Models (Gemini, OpenAI, DeepSeek, Claude)',
            'Text-to-Speech',
            'Translation Services',
            'Search & Research',
            'Phone Lookup (Truecaller)',
            'YouTube Processing',
            'Weather Data',
            'Image Processing',
            'Real-time WebSocket Support'
        ],
        endpoints: {
            api: '/api/*',
            whatsapp: '/whatsapp/*',
            ai: '/ai/*',
            utility: '/utility/*',
            status: '/status',
            qr: '/qr'
        },
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api', apiRoutes);
app.use('/whatsapp', whatsappRoutes);
app.use('/ai', aiRoutes);
app.use('/utility', utilityRoutes);

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        success: true,
        bot: botStatus,
        server: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version,
            platform: process.platform
        },
        apis: {
            total: 15,
            available: [
                'chatgpt4', 'gemini', 'deepseek', 'claude',
                'translator', 'truecaller', 'google_search',
                'weather', 'youtube', 'tts', 'phone_info'
            ]
        },
        timestamp: new Date().toISOString()
    });
});

// QR Code endpoint
app.get('/qr', (req, res) => {
    if (botStatus.qrCode) {
        res.json({
            success: true,
            qrCode: botStatus.qrCode,
            message: 'Scan this QR code with WhatsApp'
        });
    } else if (botStatus.connected) {
        res.json({
            success: true,
            message: 'Bot is already connected',
            connected: true
        });
    } else {
        res.json({
            success: false,
            message: 'QR code not available. Bot may be connecting...'
        });
    }
});

// WebSocket connections
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    // Send current status
    socket.emit('bot-status', botStatus);
    
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
    
    socket.on('restart-bot', async () => {
        console.log('🔄 Bot restart requested');
        if (whatsappBot) {
            await whatsappBot.destroy();
        }
        await initializeBot();
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    if (whatsappBot) {
        await whatsappBot.destroy();
    }
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    if (whatsappBot) {
        await whatsappBot.destroy();
    }
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 WhatsApp Bot API: http://localhost:${PORT}`);
    console.log(`📊 Status: http://localhost:${PORT}/status`);
    console.log(`📱 QR Code: http://localhost:${PORT}/qr`);
    
    // Initialize WhatsApp Bot
    await initializeBot();
});

module.exports = { app, server, io };

