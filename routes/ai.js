const express = require('express');
const axios = require('axios');
const { body, query, validationResult } = require('express-validator');
const router = express.Router();

// AI Models Configuration
const AI_MODELS = {
    gemini: {
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
        api_key: 'AIzaSyC2Fsjk3yCRA8hDVYgg5LlMn4sxwoJJaWU',
        method: 'POST'
    },
    chatgpt4: {
        url: 'https://chatgpt-4-hridoy.vercel.app',
        method: 'GET'
    },
    deepseek: {
        url: 'https://deepseek.ytansh038.workers.dev',
        method: 'GET'
    },
    claude: {
        url: 'https://claudeai.anshppt19.workers.dev/api/chat',
        method: 'GET'
    },
    qwen3: {
        url: 'https://allmodels.revangeapi.workers.dev/revangeapi/qwen3-coder/chat',
        method: 'GET'
    },
    moonshot: {
        url: 'https://allmodels.revangeapi.workers.dev/revangeapi/moonshotai-Kimi-K2-Instruct/chat',
        method: 'GET'
    },
    laama: {
        url: 'https://laama.revangeapi.workers.dev/chat',
        method: 'GET'
    }
};

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

// AI Service Class
class AIService {
    async callModel(model, prompt, options = {}) {
        try {
            if (!AI_MODELS[model]) {
                return {
                    success: false,
                    error: `Model ${model} not supported`,
                    available_models: Object.keys(AI_MODELS)
                };
            }

            const config = AI_MODELS[model];
            let response;

            const axiosConfig = {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };

            switch (model) {
                case 'gemini':
                    axiosConfig.headers['Content-Type'] = 'application/json';
                    const geminiData = {
                        contents: [{
                            parts: [{ text: prompt }]
                        }]
                    };
                    response = await axios.post(
                        `${config.url}?key=${config.api_key}`,
                        geminiData,
                        axiosConfig
                    );
                    break;

                case 'chatgpt4':
                    response = await axios.get(config.url, {
                        ...axiosConfig,
                        params: { question: prompt }
                    });
                    break;

                case 'deepseek':
                    response = await axios.get(config.url, {
                        ...axiosConfig,
                        params: { question: prompt }
                    });
                    break;

                case 'claude':
                case 'qwen3':
                case 'moonshot':
                case 'laama':
                    response = await axios.get(config.url, {
                        ...axiosConfig,
                        params: { prompt: prompt }
                    });
                    break;

                default:
                    return {
                        success: false,
                        error: `Model ${model} handler not implemented`
                    };
            }

            return {
                success: true,
                model: model,
                prompt: prompt,
                response: response.data,
                status_code: response.status,
                timestamp: new Date().toISOString(),
                options: options
            };

        } catch (error) {
            console.error(`AI Model ${model} error:`, error.message);
            
            return {
                success: false,
                model: model,
                error: error.response?.data?.message || error.message,
                status_code: error.response?.status || 500,
                timestamp: new Date().toISOString()
            };
        }
    }

    async compareModels(prompt, models = ['gemini', 'chatgpt4', 'deepseek']) {
        try {
            const promises = models.map(model => this.callModel(model, prompt));
            const results = await Promise.allSettled(promises);
            
            return {
                success: true,
                prompt: prompt,
                models: models,
                results: results.map((result, index) => ({
                    model: models[index],
                    status: result.status,
                    data: result.status === 'fulfilled' ? result.value : { error: result.reason.message }
                })),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    formatResponse(modelResponse, model) {
        try {
            let formattedText = '';
            
            switch (model) {
                case 'gemini':
                    if (modelResponse.candidates && modelResponse.candidates[0]) {
                        formattedText = modelResponse.candidates[0].content.parts[0].text;
                    }
                    break;
                    
                case 'chatgpt4':
                    formattedText = modelResponse.answer || modelResponse.response || JSON.stringify(modelResponse);
                    break;
                    
                case 'deepseek':
                    formattedText = modelResponse.result || modelResponse.answer || JSON.stringify(modelResponse);
                    break;
                    
                case 'claude':
                case 'qwen3':
                case 'moonshot':
                case 'laama':
                    formattedText = modelResponse.response || modelResponse.answer || modelResponse.result || JSON.stringify(modelResponse);
                    break;
                    
                default:
                    formattedText = JSON.stringify(modelResponse);
            }
            
            return formattedText || 'No response received';
        } catch (error) {
            return `Error formatting response: ${error.message}`;
        }
    }
}

const aiService = new AIService();

// List available AI models
router.get('/models', (req, res) => {
    res.json({
        success: true,
        models: Object.keys(AI_MODELS),
        total: Object.keys(AI_MODELS).length,
        categories: {
            google: ['gemini'],
            openai: ['chatgpt4'],
            alternative: ['deepseek', 'claude', 'qwen3', 'moonshot', 'laama']
        },
        features: {
            gemini: ['Advanced reasoning', 'Multimodal', 'Long context'],
            chatgpt4: ['General purpose', 'Creative writing', 'Code generation'],
            deepseek: ['Code-focused', 'Technical analysis'],
            claude: ['Helpful assistant', 'Safe responses'],
            qwen3: ['Code generation', 'Technical tasks'],
            moonshot: ['Long context', 'Document analysis'],
            laama: ['Open source', 'Flexible responses']
        }
    });
});

// Chat with specific AI model
router.all('/chat/:model', [
    query('prompt').optional().isString().isLength({ min: 1, max: 10000 }).withMessage('Prompt must be 1-10000 characters'),
    body('prompt').optional().isString().isLength({ min: 1, max: 10000 }).withMessage('Prompt must be 1-10000 characters'),
    validateRequest
], async (req, res) => {
    try {
        const { model } = req.params;
        const prompt = req.query.prompt || req.body.prompt || 'Hello';
        const options = req.body.options || {};
        
        const result = await aiService.callModel(model, prompt, options);
        
        if (result.success) {
            // Format the response for better readability
            const formattedResponse = aiService.formatResponse(result.response, model);
            result.formatted_response = formattedResponse;
        }
        
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Compare multiple AI models
router.all('/compare', [
    query('prompt').optional().isString().isLength({ min: 1, max: 10000 }).withMessage('Prompt must be 1-10000 characters'),
    body('prompt').optional().isString().isLength({ min: 1, max: 10000 }).withMessage('Prompt must be 1-10000 characters'),
    body('models').optional().isArray().withMessage('Models must be an array'),
    validateRequest
], async (req, res) => {
    try {
        const prompt = req.query.prompt || req.body.prompt || 'Hello';
        const models = req.body.models || ['gemini', 'chatgpt4', 'deepseek'];
        
        // Validate models
        const validModels = models.filter(model => AI_MODELS[model]);
        if (validModels.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid models specified',
                available_models: Object.keys(AI_MODELS)
            });
        }
        
        const result = await aiService.compareModels(prompt, validModels);
        
        // Format responses
        if (result.success) {
            result.results.forEach(modelResult => {
                if (modelResult.status === 'fulfilled' && modelResult.data.success) {
                    modelResult.data.formatted_response = aiService.formatResponse(
                        modelResult.data.response,
                        modelResult.model
                    );
                }
            });
        }
        
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Smart AI - automatically selects best model based on prompt
router.all('/smart', [
    query('prompt').optional().isString().isLength({ min: 1, max: 10000 }).withMessage('Prompt must be 1-10000 characters'),
    body('prompt').optional().isString().isLength({ min: 1, max: 10000 }).withMessage('Prompt must be 1-10000 characters'),
    validateRequest
], async (req, res) => {
    try {
        const prompt = req.query.prompt || req.body.prompt || 'Hello';
        
        // Simple model selection logic based on prompt content
        let selectedModel = 'gemini'; // default
        
        const promptLower = prompt.toLowerCase();
        
        if (promptLower.includes('code') || promptLower.includes('programming') || promptLower.includes('function')) {
            selectedModel = 'qwen3';
        } else if (promptLower.includes('creative') || promptLower.includes('story') || promptLower.includes('write')) {
            selectedModel = 'chatgpt4';
        } else if (promptLower.includes('analyze') || promptLower.includes('technical') || promptLower.includes('explain')) {
            selectedModel = 'deepseek';
        } else if (promptLower.includes('help') || promptLower.includes('safe') || promptLower.includes('advice')) {
            selectedModel = 'claude';
        }
        
        const result = await aiService.callModel(selectedModel, prompt);
        
        if (result.success) {
            result.formatted_response = aiService.formatResponse(result.response, selectedModel);
            result.selection_reason = `Selected ${selectedModel} based on prompt analysis`;
        }
        
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Conversation endpoint with context
router.post('/conversation', [
    body('messages').isArray().withMessage('Messages must be an array'),
    body('model').optional().isString().withMessage('Model must be a string'),
    validateRequest
], async (req, res) => {
    try {
        const { messages, model = 'gemini' } = req.body;
        
        // Build conversation context
        const conversationText = messages.map(msg => 
            `${msg.role}: ${msg.content}`
        ).join('\n');
        
        const result = await aiService.callModel(model, conversationText);
        
        if (result.success) {
            result.formatted_response = aiService.formatResponse(result.response, model);
            result.conversation_length = messages.length;
        }
        
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Health check for AI models
router.get('/health', async (req, res) => {
    try {
        const testPrompt = 'Hello, respond with "OK" if you are working.';
        const models = Object.keys(AI_MODELS);
        
        const healthChecks = await Promise.allSettled(
            models.map(async model => {
                const start = Date.now();
                const result = await aiService.callModel(model, testPrompt);
                const responseTime = Date.now() - start;
                
                return {
                    model,
                    status: result.success ? 'healthy' : 'unhealthy',
                    response_time: responseTime,
                    error: result.success ? null : result.error
                };
            })
        );
        
        const results = healthChecks.map((check, index) => ({
            model: models[index],
            ...(check.status === 'fulfilled' ? check.value : {
                status: 'error',
                error: check.reason.message
            })
        }));
        
        const healthyCount = results.filter(r => r.status === 'healthy').length;
        
        res.json({
            success: true,
            overall_health: `${healthyCount}/${models.length} models healthy`,
            models: results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;

