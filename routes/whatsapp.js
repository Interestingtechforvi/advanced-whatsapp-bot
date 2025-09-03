const express = require('express');
const { body, query, validationResult } = require('express-validator');
const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// Get bot status
router.get('/status', (req, res) => {
    // This will be populated by the main server
    const botStatus = req.app.locals.botStatus || {
        connected: false,
        qrCode: null,
        lastUpdate: new Date().toISOString()
    };
    
    res.json({
        success: true,
        status: botStatus,
        features: {
            multi_device: true,
            auto_reconnect: true,
            message_handling: true,
            media_support: true,
            group_support: false // Currently disabled for security
        },
        timestamp: new Date().toISOString()
    });
});

// Get QR code for WhatsApp connection
router.get('/qr', (req, res) => {
    const botStatus = req.app.locals.botStatus || {};
    
    if (botStatus.qrCode) {
        res.json({
            success: true,
            qrCode: botStatus.qrCode,
            message: 'Scan this QR code with WhatsApp to connect the bot',
            expires_in: '30 seconds'
        });
    } else if (botStatus.connected) {
        res.json({
            success: true,
            message: 'Bot is already connected to WhatsApp',
            connected: true,
            last_connected: botStatus.lastUpdate
        });
    } else {
        res.json({
            success: false,
            message: 'QR code not available. Bot may be starting up or reconnecting...',
            status: 'initializing'
        });
    }
});

// Send message to WhatsApp number
router.post('/send', [
    body('to').isString().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
    body('message').isString().isLength({ min: 1, max: 4096 }).withMessage('Message must be 1-4096 characters'),
    body('type').optional().isIn(['text', 'image', 'audio', 'document']).withMessage('Invalid message type'),
    validateRequest
], async (req, res) => {
    try {
        const { to, message, type = 'text', mediaUrl } = req.body;
        
        // Get bot instance from app locals
        const whatsappBot = req.app.locals.whatsappBot;
        
        if (!whatsappBot || !whatsappBot.isConnected()) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp bot is not connected',
                status: 'disconnected'
            });
        }
        
        // Format phone number
        const phoneNumber = to.replace(/[^\d+]/g, '');
        const jid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;
        
        let result;
        
        switch (type) {
            case 'text':
                result = await whatsappBot.sendMessage(jid, { text: message });
                break;
                
            case 'image':
                if (!mediaUrl) {
                    return res.status(400).json({
                        success: false,
                        error: 'Media URL is required for image messages'
                    });
                }
                result = await whatsappBot.sendMessage(jid, {
                    image: { url: mediaUrl },
                    caption: message
                });
                break;
                
            case 'audio':
                if (!mediaUrl) {
                    return res.status(400).json({
                        success: false,
                        error: 'Media URL is required for audio messages'
                    });
                }
                result = await whatsappBot.sendMessage(jid, {
                    audio: { url: mediaUrl },
                    mimetype: 'audio/mp4'
                });
                break;
                
            case 'document':
                if (!mediaUrl) {
                    return res.status(400).json({
                        success: false,
                        error: 'Media URL is required for document messages'
                    });
                }
                result = await whatsappBot.sendMessage(jid, {
                    document: { url: mediaUrl },
                    fileName: 'document.pdf',
                    caption: message
                });
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Unsupported message type'
                });
        }
        
        res.json({
            success: true,
            message: 'Message sent successfully',
            to: to,
            type: type,
            messageId: result.key.id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Broadcast message to multiple numbers
router.post('/broadcast', [
    body('numbers').isArray().withMessage('Numbers must be an array'),
    body('message').isString().isLength({ min: 1, max: 4096 }).withMessage('Message must be 1-4096 characters'),
    body('delay').optional().isInt({ min: 1, max: 60 }).withMessage('Delay must be 1-60 seconds'),
    validateRequest
], async (req, res) => {
    try {
        const { numbers, message, delay = 2 } = req.body;
        
        const whatsappBot = req.app.locals.whatsappBot;
        
        if (!whatsappBot || !whatsappBot.isConnected()) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp bot is not connected',
                status: 'disconnected'
            });
        }
        
        const results = [];
        
        for (let i = 0; i < numbers.length; i++) {
            try {
                const phoneNumber = numbers[i].replace(/[^\d+]/g, '');
                const jid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;
                
                const result = await whatsappBot.sendMessage(jid, { text: message });
                
                results.push({
                    number: numbers[i],
                    success: true,
                    messageId: result.key.id
                });
                
                // Add delay between messages to avoid spam detection
                if (i < numbers.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * 1000));
                }
                
            } catch (error) {
                results.push({
                    number: numbers[i],
                    success: false,
                    error: error.message
                });
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        
        res.json({
            success: true,
            message: `Broadcast completed: ${successCount}/${numbers.length} messages sent`,
            results: results,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Broadcast error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get chat history (if available)
router.get('/chats/:phoneNumber', [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    validateRequest
], async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        
        const whatsappBot = req.app.locals.whatsappBot;
        
        if (!whatsappBot || !whatsappBot.isConnected()) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp bot is not connected',
                status: 'disconnected'
            });
        }
        
        // Format phone number
        const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
        const jid = cleanNumber.includes('@') ? cleanNumber : `${cleanNumber}@s.whatsapp.net`;
        
        // Get chat history (this is a simplified version)
        // In a real implementation, you would store and retrieve chat history from a database
        const chatHistory = await whatsappBot.getChatHistory(jid, limit);
        
        res.json({
            success: true,
            phoneNumber: phoneNumber,
            messages: chatHistory || [],
            count: chatHistory ? chatHistory.length : 0,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Restart bot connection
router.post('/restart', async (req, res) => {
    try {
        const whatsappBot = req.app.locals.whatsappBot;
        
        if (whatsappBot) {
            await whatsappBot.restart();
            
            res.json({
                success: true,
                message: 'Bot restart initiated',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({
                success: false,
                error: 'Bot instance not available',
                timestamp: new Date().toISOString()
            });
        }
        
    } catch (error) {
        console.error('Restart bot error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Logout and disconnect bot
router.post('/logout', async (req, res) => {
    try {
        const whatsappBot = req.app.locals.whatsappBot;
        
        if (whatsappBot) {
            await whatsappBot.logout();
            
            res.json({
                success: true,
                message: 'Bot logged out successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({
                success: false,
                error: 'Bot instance not available',
                timestamp: new Date().toISOString()
            });
        }
        
    } catch (error) {
        console.error('Logout bot error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Get bot information
router.get('/info', async (req, res) => {
    try {
        const whatsappBot = req.app.locals.whatsappBot;
        
        if (!whatsappBot || !whatsappBot.isConnected()) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp bot is not connected',
                status: 'disconnected'
            });
        }
        
        const botInfo = await whatsappBot.getBotInfo();
        
        res.json({
            success: true,
            info: botInfo,
            capabilities: [
                'Text messaging',
                'Image sharing',
                'Audio messages',
                'Document sharing',
                'AI conversation',
                'Multi-language support',
                'Command processing'
            ],
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Get bot info error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Webhook for receiving messages (if needed for external integrations)
router.post('/webhook', [
    body('event').isString().withMessage('Event type is required'),
    validateRequest
], async (req, res) => {
    try {
        const { event, data } = req.body;
        
        console.log('Webhook received:', { event, data });
        
        // Process webhook event
        switch (event) {
            case 'message':
                // Handle incoming message
                break;
            case 'status':
                // Handle status update
                break;
            default:
                console.log('Unknown webhook event:', event);
        }
        
        res.json({
            success: true,
            message: 'Webhook processed',
            event: event,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;

