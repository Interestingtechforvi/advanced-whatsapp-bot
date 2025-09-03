const apiManager = require('./apiManager');
const apiConfig = require('../config/apiConfig');
const logger = require('../utils/logger');

/**
 * Enhanced AI Service using the new API Manager
 * Provides unified access to multiple AI models with robust error handling
 */
class NewAIService {
    constructor() {
        this.defaultModel = 'gemini';
        this.availableModels = ['gemini', 'openai', 'deepseek', 'claude', 'qwen', 'kimi', 'llama'];
    }

    /**
     * Get AI response from specified model
     * @param {string} message - User message
     * @param {string} model - AI model to use
     * @param {string} context - Optional context for the conversation
     * @returns {Promise<string>} AI response
     */
    async getResponse(message, model = 'gemini', context = null) {
        try {
            // Validate model
            if (!this.availableModels.includes(model.toLowerCase())) {
                logger.warn(`Unknown model '${model}', falling back to ${this.defaultModel}`);
                model = this.defaultModel;
            }

            model = model.toLowerCase();

            // Route to appropriate model handler
            switch (model) {
                case 'gemini':
                    return await this.getGeminiResponse(message, context);
                case 'openai':
                    return await this.getOpenAIResponse(message, context);
                case 'deepseek':
                    return await this.getDeepSeekResponse(message);
                case 'claude':
                    return await this.getClaudeResponse(message);
                case 'qwen':
                    return await this.getQwenResponse(message);
                case 'kimi':
                    return await this.getKimiResponse(message);
                case 'llama':
                    return await this.getLlamaResponse(message);
                default:
                    return await this.getGeminiResponse(message, context);
            }
        } catch (error) {
            logger.error(`Error getting ${model} response:`, error);
            return `Sorry, I'm experiencing technical difficulties with the ${model} model. Please try again or switch to a different model.`;
        }
    }

    /**
     * Get response from Google Gemini
     */
    async getGeminiResponse(message, context = null) {
        try {
            const config = apiConfig.getConfig('gemini');
            
            let prompt = message;
            if (context) {
                prompt = `Context: ${context}\n\nUser: ${message}`;
            }

            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('gemini', 'generateContent'),
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    key: config.apiKey
                },
                body: {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                },
                serviceName: 'Gemini AI',
                cache: false
            });

            if (response.success && response.data.candidates && response.data.candidates[0]) {
                const candidate = response.data.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
                    return candidate.content.parts[0].text;
                }
            }

            throw new Error('Invalid Gemini API response structure');

        } catch (error) {
            logger.error('Gemini API error:', error);
            throw error;
        }
    }

    /**
     * Get response from OpenAI
     */
    async getOpenAIResponse(message, context = null) {
        try {
            const config = apiConfig.getConfig('openai');
            
            let messages = [];
            
            if (context) {
                messages.push({
                    role: "system",
                    content: context
                });
            }
            
            messages.push({
                role: "user",
                content: message
            });

            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('openai', 'chatCompletions'),
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: {
                    model: "gpt-3.5-turbo",
                    messages: messages,
                    max_tokens: 1000,
                    temperature: 0.7
                },
                serviceName: 'OpenAI',
                cache: false
            });

            if (response.success && response.data.choices && response.data.choices[0]) {
                return response.data.choices[0].message.content;
            }

            throw new Error('Invalid OpenAI API response structure');

        } catch (error) {
            logger.error('OpenAI API error:', error);
            throw error;
        }
    }

    /**
     * Get response from DeepSeek
     */
    async getDeepSeekResponse(message) {
        try {
            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('deepseek', 'chat'),
                method: 'GET',
                params: {
                    question: message
                },
                serviceName: 'DeepSeek AI',
                cache: true,
                cacheTTL: 300000 // 5 minutes
            });

            if (response.success) {
                // Handle different possible response formats
                if (response.data.result) {
                    return response.data.result;
                } else if (response.data.response) {
                    return response.data.response;
                } else if (response.data.text) {
                    return response.data.text;
                } else if (typeof response.data === 'string') {
                    return response.data;
                }
            }

            throw new Error('Invalid DeepSeek API response structure');

        } catch (error) {
            logger.error('DeepSeek API error:', error);
            throw error;
        }
    }

    /**
     * Get response from Claude AI
     */
    async getClaudeResponse(message) {
        try {
            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('claude', 'chat'),
                method: 'GET',
                params: {
                    prompt: message
                },
                serviceName: 'Claude AI',
                cache: true,
                cacheTTL: 300000
            });

            if (response.success) {
                if (response.data.response) {
                    return response.data.response;
                } else if (response.data.text) {
                    return response.data.text;
                } else if (typeof response.data === 'string') {
                    return response.data;
                }
            }

            throw new Error('Invalid Claude API response structure');

        } catch (error) {
            logger.error('Claude API error:', error);
            throw error;
        }
    }

    /**
     * Get response from Qwen Coder
     */
    async getQwenResponse(message) {
        try {
            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('qwen', 'chat'),
                method: 'GET',
                params: {
                    prompt: message
                },
                serviceName: 'Qwen Coder',
                cache: true,
                cacheTTL: 300000
            });

            if (response.success) {
                if (response.data.response) {
                    return response.data.response;
                } else if (response.data.text) {
                    return response.data.text;
                } else if (typeof response.data === 'string') {
                    return response.data;
                }
            }

            throw new Error('Invalid Qwen API response structure');

        } catch (error) {
            logger.error('Qwen API error:', error);
            throw error;
        }
    }

    /**
     * Get response from Kimi
     */
    async getKimiResponse(message) {
        try {
            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('kimi', 'chat'),
                method: 'GET',
                params: {
                    prompt: message
                },
                serviceName: 'Moonshot Kimi',
                cache: true,
                cacheTTL: 300000
            });

            if (response.success) {
                if (response.data.response) {
                    return response.data.response;
                } else if (response.data.text) {
                    return response.data.text;
                } else if (typeof response.data === 'string') {
                    return response.data;
                }
            }

            throw new Error('Invalid Kimi API response structure');

        } catch (error) {
            logger.error('Kimi API error:', error);
            throw error;
        }
    }

    /**
     * Get response from Llama
     */
    async getLlamaResponse(message) {
        try {
            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('llama', 'chat'),
                method: 'GET',
                params: {
                    prompt: message
                },
                serviceName: 'Llama AI',
                cache: true,
                cacheTTL: 300000
            });

            if (response.success) {
                if (response.data.response) {
                    return response.data.response;
                } else if (response.data.text) {
                    return response.data.text;
                } else if (typeof response.data === 'string') {
                    return response.data;
                }
            }

            throw new Error('Invalid Llama API response structure');

        } catch (error) {
            logger.error('Llama API error:', error);
            throw error;
        }
    }

    /**
     * Analyze image using Gemini Vision
     */
    async analyzeImage(imageData, prompt = "Describe this image", mimeType = "image/jpeg") {
        try {
            const config = apiConfig.getConfig('gemini');

            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('gemini', 'generateContentVision'),
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    key: config.apiKey
                },
                body: {
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: imageData
                                }
                            }
                        ]
                    }]
                },
                serviceName: 'Gemini Vision',
                cache: false
            });

            if (response.success && response.data.candidates && response.data.candidates[0]) {
                const candidate = response.data.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
                    return candidate.content.parts[0].text;
                }
            }

            throw new Error('Invalid Gemini Vision API response structure');

        } catch (error) {
            logger.error('Image analysis error:', error);
            return "Sorry, I couldn't analyze the image. Please try again.";
        }
    }

    /**
     * Summarize file content
     */
    async summarizeFile(fileContent, fileName, model = 'gemini') {
        try {
            const prompt = `Please provide a comprehensive summary of the following file content from "${fileName}":\n\n${fileContent}`;
            return await this.getResponse(prompt, model);
        } catch (error) {
            logger.error('File summarization error:', error);
            return "Sorry, I couldn't summarize the file. Please try again.";
        }
    }

    /**
     * Get available models
     */
    getAvailableModels() {
        return [...this.availableModels];
    }

    /**
     * Check if model is available
     */
    isModelAvailable(model) {
        return this.availableModels.includes(model.toLowerCase());
    }

    /**
     * Get model information
     */
    getModelInfo(model) {
        const modelInfo = {
            gemini: {
                name: 'Google Gemini Pro',
                description: 'Advanced AI model by Google with strong reasoning capabilities',
                features: ['text', 'vision', 'context-aware']
            },
            openai: {
                name: 'OpenAI GPT-3.5 Turbo',
                description: 'Fast and efficient AI model by OpenAI',
                features: ['text', 'context-aware']
            },
            deepseek: {
                name: 'DeepSeek AI',
                description: 'Specialized AI model for coding and technical tasks',
                features: ['text', 'coding']
            },
            claude: {
                name: 'Claude AI',
                description: 'AI assistant by Anthropic focused on helpful, harmless, and honest responses',
                features: ['text', 'analysis']
            },
            qwen: {
                name: 'Qwen Coder',
                description: 'Specialized coding AI model with strong programming capabilities',
                features: ['text', 'coding', 'technical']
            },
            kimi: {
                name: 'Moonshot Kimi',
                description: 'Advanced AI model with strong multilingual capabilities',
                features: ['text', 'multilingual']
            },
            llama: {
                name: 'Llama AI',
                description: 'Open-source AI model with strong general capabilities',
                features: ['text', 'general']
            }
        };

        return modelInfo[model.toLowerCase()] || null;
    }
}

module.exports = new NewAIService();

