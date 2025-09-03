const express = require('express');
const axios = require('axios');
const { body, query, validationResult } = require('express-validator');
const router = express.Router();

// API Service Class
class APIService {
    constructor() {
        this.apis = {
            chatgpt4: {
                url: 'https://chatgpt-4-hridoy.vercel.app',
                method: 'GET',
                params: { question: 'text' }
            },
            ai_translator: {
                url: 'https://sheikhhridoy.nagad.my.id/api/AI-translator.php',
                method: 'GET',
                params: { text: 'text', target_language: 'target_lang' }
            },
            text_translator: {
                url: 'https://hs-translate-text.vercel.app',
                method: 'GET',
                params: { text: 'text', targetLang: 'target_lang' }
            },
            truecaller: {
                url: 'https://truecaller.privates-bots.workers.dev',
                method: 'GET',
                params: { q: 'phone_number' }
            },
            youtube_transcribe: {
                url: 'https://api.hazex.sbs/yt-transcribe',
                method: 'GET',
                params: { url: 'youtube_url' }
            },
            google_search: {
                url: 'https://googlesearchapi.nepcoderapis.workers.dev',
                method: 'GET',
                params: { q: 'query', num: 'num_results' }
            },
            weather: {
                url: 'https://weather.itz-ashlynn.workers.dev',
                method: 'GET',
                params: {}
            },
            youtube_summarizer: {
                url: 'https://api.hazex.sbs/yt-summarizer',
                method: 'GET',
                params: { url: 'youtube_url', wordCount: 'word_count' }
            },
            gemini_pro: {
                url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
                method: 'POST',
                api_key: 'AIzaSyC2Fsjk3yCRA8hDVYgg5LlMn4sxwoJJaWU',
                params: { contents: 'contents' }
            },
            instagram_reset: {
                url: 'https://passreset.ziddi.workers.dev/api/reset',
                method: 'GET',
                params: { username: 'username' }
            },
            image_to_pdf: {
                url: 'https://anshimagetopdfapi.onrender.com/anshapi/imagetopdf',
                method: 'GET',
                params: { url: 'image_urls' }
            },
            phone_info: {
                url: 'https://api.yabes-desu.workers.dev/tools/phone-info',
                method: 'GET',
                params: { query: 'phone_model' }
            },
            qwen3_coder: {
                url: 'https://allmodels.revangeapi.workers.dev/revangeapi/qwen3-coder/chat',
                method: 'GET',
                params: { prompt: 'prompt' }
            },
            moonshot_ai: {
                url: 'https://allmodels.revangeapi.workers.dev/revangeapi/moonshotai-Kimi-K2-Instruct/chat',
                method: 'GET',
                params: { prompt: 'prompt' }
            },
            laama_chat: {
                url: 'https://laama.revangeapi.workers.dev/chat',
                method: 'GET',
                params: { prompt: 'prompt' }
            },
            deepseek: {
                url: 'https://deepseek.ytansh038.workers.dev',
                method: 'GET',
                params: { question: 'question' }
            },
            text_to_speech: {
                url: 'https://api.streamelements.com/kappa/v2/speech',
                method: 'GET',
                params: { voice: 'voice', text: 'text' }
            },
            claude_ai: {
                url: 'https://claudeai.anshppt19.workers.dev/api/chat',
                method: 'GET',
                params: { prompt: 'prompt' }
            }
        };
    }

    async makeRequest(apiName, params) {
        try {
            if (!this.apis[apiName]) {
                return {
                    success: false,
                    error: `API ${apiName} not found`,
                    available_apis: Object.keys(this.apis)
                };
            }

            const apiConfig = this.apis[apiName];
            let url = apiConfig.url;
            const method = apiConfig.method;

            // Build request parameters
            const requestParams = {};
            for (const [apiParam, userParam] of Object.entries(apiConfig.params)) {
                if (params[userParam]) {
                    requestParams[apiParam] = params[userParam];
                }
            }

            let response;
            const config = {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };

            // Handle special cases
            if (apiName === 'gemini_pro') {
                url += `?key=${apiConfig.api_key}`;
                config.headers['Content-Type'] = 'application/json';
                
                const data = {
                    contents: [{
                        parts: [{ text: params.contents || params.prompt || 'Hello' }]
                    }]
                };
                
                response = await axios.post(url, data, config);
            } else if (method === 'GET') {
                response = await axios.get(url, { ...config, params: requestParams });
            } else if (method === 'POST') {
                response = await axios.post(url, requestParams, config);
            } else {
                return {
                    success: false,
                    error: `Unsupported method ${method}`
                };
            }

            return {
                success: true,
                api: apiName,
                status_code: response.status,
                data: response.data,
                url: url,
                params: requestParams,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`API ${apiName} error:`, error.message);
            
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                api: apiName,
                status_code: error.response?.status || 500,
                timestamp: new Date().toISOString()
            };
        }
    }
}

const apiService = new APIService();

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

// List all available APIs
router.get('/list', (req, res) => {
    res.json({
        success: true,
        apis: Object.keys(apiService.apis),
        total: Object.keys(apiService.apis).length,
        categories: {
            ai_models: ['chatgpt4', 'gemini_pro', 'deepseek', 'claude_ai', 'qwen3_coder', 'moonshot_ai', 'laama_chat'],
            translation: ['ai_translator', 'text_translator'],
            search: ['google_search'],
            media: ['youtube_transcribe', 'youtube_summarizer', 'image_to_pdf'],
            utility: ['truecaller', 'phone_info', 'weather', 'text_to_speech', 'instagram_reset']
        }
    });
});

// Generic API caller
router.all('/call/:apiName', async (req, res) => {
    try {
        const { apiName } = req.params;
        const params = { ...req.query, ...req.body };
        
        const result = await apiService.makeRequest(apiName, params);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(result.status_code || 400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ChatGPT-4 endpoint
router.all('/chatgpt4', [
    query('question').optional().isString().withMessage('Question must be a string'),
    body('question').optional().isString().withMessage('Question must be a string'),
    validateRequest
], async (req, res) => {
    try {
        const question = req.query.question || req.body.question || 'Hello';
        const result = await apiService.makeRequest('chatgpt4', { text: question });
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Translation endpoint
router.all('/translate', [
    query('text').optional().isString().withMessage('Text must be a string'),
    query('target_language').optional().isString().withMessage('Target language must be a string'),
    body('text').optional().isString().withMessage('Text must be a string'),
    body('target_language').optional().isString().withMessage('Target language must be a string'),
    validateRequest
], async (req, res) => {
    try {
        const text = req.query.text || req.body.text || '';
        const targetLang = req.query.target_language || req.body.target_language || 'en';
        
        const result = await apiService.makeRequest('text_translator', {
            text: text,
            target_lang: targetLang
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Truecaller endpoint
router.all('/truecaller', [
    query('phone_number').optional().isString().withMessage('Phone number must be a string'),
    body('phone_number').optional().isString().withMessage('Phone number must be a string'),
    validateRequest
], async (req, res) => {
    try {
        const phoneNumber = req.query.phone_number || req.body.phone_number || '';
        const result = await apiService.makeRequest('truecaller', { phone_number: phoneNumber });
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Google Search endpoint
router.all('/search', [
    query('query').optional().isString().withMessage('Query must be a string'),
    query('num_results').optional().isInt({ min: 1, max: 50 }).withMessage('Number of results must be between 1 and 50'),
    body('query').optional().isString().withMessage('Query must be a string'),
    body('num_results').optional().isInt({ min: 1, max: 50 }).withMessage('Number of results must be between 1 and 50'),
    validateRequest
], async (req, res) => {
    try {
        const query = req.query.query || req.body.query || '';
        const numResults = req.query.num_results || req.body.num_results || '10';
        
        const result = await apiService.makeRequest('google_search', {
            query: query,
            num_results: numResults
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Weather endpoint
router.all('/weather/:endpoint?', async (req, res) => {
    try {
        const endpoint = req.params.endpoint || 'hot-cities';
        const params = { ...req.query, ...req.body };
        
        const weatherUrl = `https://weather.itz-ashlynn.workers.dev/${endpoint}`;
        
        const response = await axios.get(weatherUrl, {
            params: params,
            timeout: 30000
        });
        
        res.json({
            success: true,
            api: 'weather',
            status_code: response.status,
            data: response.data,
            endpoint: endpoint,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            api: 'weather'
        });
    }
});

// YouTube endpoints
router.all('/youtube/:action', [
    query('url').optional().isURL().withMessage('URL must be a valid URL'),
    query('word_count').optional().isInt({ min: 15, max: 1000 }).withMessage('Word count must be between 15 and 1000'),
    body('url').optional().isURL().withMessage('URL must be a valid URL'),
    body('word_count').optional().isInt({ min: 15, max: 1000 }).withMessage('Word count must be between 15 and 1000'),
    validateRequest
], async (req, res) => {
    try {
        const { action } = req.params;
        const youtubeUrl = req.query.url || req.body.url || '';
        const wordCount = req.query.word_count || req.body.word_count || '100';
        
        let result;
        if (action === 'transcribe') {
            result = await apiService.makeRequest('youtube_transcribe', {
                youtube_url: youtubeUrl
            });
        } else if (action === 'summarize') {
            result = await apiService.makeRequest('youtube_summarizer', {
                youtube_url: youtubeUrl,
                word_count: wordCount
            });
        } else {
            return res.status(400).json({
                success: false,
                error: 'Invalid action. Use "transcribe" or "summarize"'
            });
        }
        
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Text-to-Speech endpoint
router.all('/tts', [
    query('text').optional().isString().withMessage('Text must be a string'),
    query('voice').optional().isString().withMessage('Voice must be a string'),
    body('text').optional().isString().withMessage('Text must be a string'),
    body('voice').optional().isString().withMessage('Voice must be a string'),
    validateRequest
], async (req, res) => {
    try {
        const text = req.query.text || req.body.text || 'Hello';
        const voice = req.query.voice || req.body.voice || 'Salli';
        
        const result = await apiService.makeRequest('text_to_speech', {
            text: text,
            voice: voice
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Phone Info endpoint
router.all('/phone-info', [
    query('model').optional().isString().withMessage('Model must be a string'),
    body('model').optional().isString().withMessage('Model must be a string'),
    validateRequest
], async (req, res) => {
    try {
        const phoneModel = req.query.model || req.body.model || '';
        const result = await apiService.makeRequest('phone_info', { phone_model: phoneModel });
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Image to PDF endpoint
router.all('/image-to-pdf', [
    query('urls').optional().isString().withMessage('URLs must be a string'),
    body('urls').optional().isString().withMessage('URLs must be a string'),
    validateRequest
], async (req, res) => {
    try {
        const imageUrls = req.query.urls || req.body.urls || '';
        const result = await apiService.makeRequest('image_to_pdf', { image_urls: imageUrls });
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Instagram Reset endpoint
router.all('/instagram-reset', [
    query('username').optional().isString().withMessage('Username must be a string'),
    body('username').optional().isString().withMessage('Username must be a string'),
    validateRequest
], async (req, res) => {
    try {
        const username = req.query.username || req.body.username || '';
        const result = await apiService.makeRequest('instagram_reset', { username: username });
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;

