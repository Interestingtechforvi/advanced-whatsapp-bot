const express = require('express');
const axios = require('axios');
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

// Utility Service Class
class UtilityService {
    constructor() {
        this.services = {
            qr_generator: 'https://api.qrserver.com/v1/create-qr-code/',
            url_shortener: 'https://is.gd/create.php',
            password_generator: null, // Local implementation
            hash_generator: null, // Local implementation
            base64_encoder: null, // Local implementation
            json_formatter: null, // Local implementation
            timestamp_converter: null // Local implementation
        };
    }

    async generateQR(text, options = {}) {
        try {
            const {
                size = '200x200',
                format = 'png',
                errorCorrection = 'L',
                margin = 0,
                color = '000000',
                bgcolor = 'ffffff'
            } = options;

            const params = new URLSearchParams({
                size: size,
                data: text,
                format: format,
                ecc: errorCorrection,
                margin: margin,
                color: color,
                bgcolor: bgcolor
            });

            const qrUrl = `${this.services.qr_generator}?${params.toString()}`;

            return {
                success: true,
                qr_url: qrUrl,
                text: text,
                options: options,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async shortenUrl(url) {
        try {
            const response = await axios.post(this.services.url_shortener, 
                `format=simple&url=${encodeURIComponent(url)}`,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: 10000
                }
            );

            return {
                success: true,
                original_url: url,
                short_url: response.data.trim(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                original_url: url
            };
        }
    }

    generatePassword(options = {}) {
        const {
            length = 12,
            includeUppercase = true,
            includeLowercase = true,
            includeNumbers = true,
            includeSymbols = false,
            excludeSimilar = true
        } = options;

        let charset = '';
        
        if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeNumbers) charset += '0123456789';
        if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        if (excludeSimilar) {
            charset = charset.replace(/[0O1lI]/g, '');
        }

        if (charset === '') {
            return {
                success: false,
                error: 'No character types selected'
            };
        }

        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        return {
            success: true,
            password: password,
            length: length,
            options: options,
            strength: this.calculatePasswordStrength(password),
            timestamp: new Date().toISOString()
        };
    }

    calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        
        const strengths = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        return strengths[Math.min(score, 5)];
    }

    generateHash(text, algorithm = 'sha256') {
        const crypto = require('crypto');
        
        try {
            const hash = crypto.createHash(algorithm).update(text).digest('hex');
            
            return {
                success: true,
                original_text: text,
                hash: hash,
                algorithm: algorithm,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                algorithm: algorithm
            };
        }
    }

    encodeBase64(text, decode = false) {
        try {
            let result;
            
            if (decode) {
                result = Buffer.from(text, 'base64').toString('utf8');
            } else {
                result = Buffer.from(text, 'utf8').toString('base64');
            }
            
            return {
                success: true,
                original: text,
                result: result,
                operation: decode ? 'decode' : 'encode',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                operation: decode ? 'decode' : 'encode'
            };
        }
    }

    formatJson(jsonString, minify = false) {
        try {
            const parsed = JSON.parse(jsonString);
            const formatted = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
            
            return {
                success: true,
                original: jsonString,
                formatted: formatted,
                operation: minify ? 'minify' : 'beautify',
                valid: true,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: 'Invalid JSON format',
                details: error.message,
                valid: false
            };
        }
    }

    convertTimestamp(input, format = 'iso') {
        try {
            let timestamp;
            
            // Try to parse the input
            if (typeof input === 'string' && input.toLowerCase() === 'now') {
                timestamp = new Date();
            } else if (!isNaN(input)) {
                // Unix timestamp
                timestamp = new Date(parseInt(input) * (input.toString().length === 10 ? 1000 : 1));
            } else {
                timestamp = new Date(input);
            }
            
            if (isNaN(timestamp.getTime())) {
                throw new Error('Invalid timestamp format');
            }
            
            const result = {
                success: true,
                input: input,
                formats: {
                    iso: timestamp.toISOString(),
                    unix: Math.floor(timestamp.getTime() / 1000),
                    unix_ms: timestamp.getTime(),
                    utc: timestamp.toUTCString(),
                    local: timestamp.toLocaleString(),
                    date_only: timestamp.toDateString(),
                    time_only: timestamp.toTimeString()
                },
                timestamp: new Date().toISOString()
            };
            
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message,
                input: input
            };
        }
    }
}

const utilityService = new UtilityService();

// List available utilities
router.get('/list', (req, res) => {
    res.json({
        success: true,
        utilities: [
            'qr-generator',
            'url-shortener',
            'password-generator',
            'hash-generator',
            'base64-encoder',
            'json-formatter',
            'timestamp-converter'
        ],
        categories: {
            generators: ['qr-generator', 'password-generator'],
            converters: ['base64-encoder', 'timestamp-converter', 'hash-generator'],
            formatters: ['json-formatter'],
            web: ['url-shortener']
        },
        timestamp: new Date().toISOString()
    });
});

// QR Code Generator
router.all('/qr-generator', [
    query('text').optional().isString().isLength({ min: 1, max: 2000 }).withMessage('Text must be 1-2000 characters'),
    body('text').optional().isString().isLength({ min: 1, max: 2000 }).withMessage('Text must be 1-2000 characters'),
    validateRequest
], async (req, res) => {
    try {
        const text = req.query.text || req.body.text || 'Hello World';
        const options = req.body.options || {};
        
        const result = await utilityService.generateQR(text, options);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// URL Shortener
router.all('/url-shortener', [
    query('url').optional().isURL().withMessage('Invalid URL format'),
    body('url').optional().isURL().withMessage('Invalid URL format'),
    validateRequest
], async (req, res) => {
    try {
        const url = req.query.url || req.body.url;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }
        
        const result = await utilityService.shortenUrl(url);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Password Generator
router.all('/password-generator', [
    query('length').optional().isInt({ min: 4, max: 128 }).withMessage('Length must be 4-128'),
    body('length').optional().isInt({ min: 4, max: 128 }).withMessage('Length must be 4-128'),
    validateRequest
], (req, res) => {
    try {
        const options = {
            length: parseInt(req.query.length || req.body.length) || 12,
            includeUppercase: req.query.uppercase !== 'false' && req.body.includeUppercase !== false,
            includeLowercase: req.query.lowercase !== 'false' && req.body.includeLowercase !== false,
            includeNumbers: req.query.numbers !== 'false' && req.body.includeNumbers !== false,
            includeSymbols: req.query.symbols === 'true' || req.body.includeSymbols === true,
            excludeSimilar: req.query.exclude_similar !== 'false' && req.body.excludeSimilar !== false
        };
        
        const result = utilityService.generatePassword(options);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Hash Generator
router.all('/hash-generator', [
    query('text').optional().isString().isLength({ min: 1 }).withMessage('Text is required'),
    body('text').optional().isString().isLength({ min: 1 }).withMessage('Text is required'),
    query('algorithm').optional().isIn(['md5', 'sha1', 'sha256', 'sha512']).withMessage('Invalid algorithm'),
    body('algorithm').optional().isIn(['md5', 'sha1', 'sha256', 'sha512']).withMessage('Invalid algorithm'),
    validateRequest
], (req, res) => {
    try {
        const text = req.query.text || req.body.text;
        const algorithm = req.query.algorithm || req.body.algorithm || 'sha256';
        
        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Text is required'
            });
        }
        
        const result = utilityService.generateHash(text, algorithm);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Base64 Encoder/Decoder
router.all('/base64', [
    query('text').optional().isString().isLength({ min: 1 }).withMessage('Text is required'),
    body('text').optional().isString().isLength({ min: 1 }).withMessage('Text is required'),
    validateRequest
], (req, res) => {
    try {
        const text = req.query.text || req.body.text;
        const decode = req.query.decode === 'true' || req.body.decode === true;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Text is required'
            });
        }
        
        const result = utilityService.encodeBase64(text, decode);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// JSON Formatter
router.all('/json-formatter', [
    body('json').optional().isString().withMessage('JSON must be a string'),
    validateRequest
], (req, res) => {
    try {
        const jsonString = req.body.json || req.query.json;
        const minify = req.query.minify === 'true' || req.body.minify === true;
        
        if (!jsonString) {
            return res.status(400).json({
                success: false,
                error: 'JSON string is required'
            });
        }
        
        const result = utilityService.formatJson(jsonString, minify);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Timestamp Converter
router.all('/timestamp', [
    query('input').optional().isString().withMessage('Input must be a string'),
    body('input').optional().isString().withMessage('Input must be a string'),
    validateRequest
], (req, res) => {
    try {
        const input = req.query.input || req.body.input || 'now';
        
        const result = utilityService.convertTimestamp(input);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// System Information
router.get('/system-info', (req, res) => {
    const os = require('os');
    
    res.json({
        success: true,
        system: {
            platform: os.platform(),
            architecture: os.arch(),
            node_version: process.version,
            uptime: process.uptime(),
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: process.memoryUsage()
            },
            cpu: {
                model: os.cpus()[0].model,
                cores: os.cpus().length,
                load_average: os.loadavg()
            }
        },
        timestamp: new Date().toISOString()
    });
});

// Health Check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        services: {
            qr_generator: 'online',
            url_shortener: 'online',
            password_generator: 'online',
            hash_generator: 'online',
            base64_encoder: 'online',
            json_formatter: 'online',
            timestamp_converter: 'online'
        },
        timestamp: new Date().toISOString()
    });
});

module.exports = router;

