const newAiService = require('../services/newAiService');
const translationService = require('../services/translationService');
const searchService = require('../services/searchService');
const mediaService = require('../services/mediaService');
const weatherService = require('../services/weatherService');
const enhancedTtsService = require('../services/enhancedTtsService');
const enhancedTruecallerService = require('../services/enhancedTruecallerService');
const logger = require('../utils/logger');

/**
 * Enhanced Message Handler using the new API services
 * Provides comprehensive message processing with robust error handling
 */
class NewMessageHandler {
    constructor() {
        this.commandPrefix = '/';
        this.supportedCommands = [
            'ai', 'translate', 'search', 'news', 'weather', 'youtube', 'tts', 'phone',
            'help', 'status', 'models', 'voices', 'languages'
        ];
    }

    /**
     * Process incoming message
     * @param {Object} message - WhatsApp message object
     * @returns {Promise<string>} Response message
     */
    async processMessage(message) {
        try {
            const messageText = message.body || message.text || '';
            const messageType = message.type || 'text';
            const from = message.from || 'unknown';

            logger.info(`Processing message from ${from}: ${messageText.substring(0, 100)}...`);

            // Handle different message types
            switch (messageType) {
                case 'text':
                    return await this.handleTextMessage(messageText, from);
                case 'image':
                    return await this.handleImageMessage(message, from);
                case 'audio':
                    return await this.handleAudioMessage(message, from);
                case 'document':
                    return await this.handleDocumentMessage(message, from);
                default:
                    return await this.handleUnsupportedMessage(messageType, from);
            }

        } catch (error) {
            logger.error('Message processing error:', error);
            return `❌ Sorry, I encountered an error while processing your message: ${error.message}`;
        }
    }

    /**
     * Handle text messages
     */
    async handleTextMessage(messageText, from) {
        try {
            const trimmedText = messageText.trim();

            // Check if it's a command
            if (trimmedText.startsWith(this.commandPrefix)) {
                return await this.handleCommand(trimmedText, from);
            }

            // Check for special patterns
            if (this.isYouTubeUrl(trimmedText)) {
                return await this.handleYouTubeUrl(trimmedText, from);
            }

            if (this.isPhoneNumber(trimmedText)) {
                return await this.handlePhoneNumber(trimmedText, from);
            }

            if (this.isTranslationRequest(trimmedText)) {
                return await this.handleTranslationRequest(trimmedText, from);
            }

            // Default: AI chat
            return await this.handleAIChat(trimmedText, from);

        } catch (error) {
            logger.error('Text message handling error:', error);
            return `❌ Error processing text message: ${error.message}`;
        }
    }

    /**
     * Handle commands
     */
    async handleCommand(commandText, from) {
        try {
            const parts = commandText.substring(1).split(' ');
            const command = parts[0].toLowerCase();
            const args = parts.slice(1);

            logger.info(`Processing command: ${command} with args: ${args.join(' ')}`);

            switch (command) {
                case 'ai':
                    return await this.handleAICommand(args, from);
                case 'translate':
                    return await this.handleTranslateCommand(args, from);
                case 'search':
                    return await this.handleSearchCommand(args, from);
                case 'news':
                    return await this.handleNewsCommand(args, from);
                case 'weather':
                    return await this.handleWeatherCommand(args, from);
                case 'youtube':
                    return await this.handleYouTubeCommand(args, from);
                case 'tts':
                    return await this.handleTTSCommand(args, from);
                case 'phone':
                    return await this.handlePhoneCommand(args, from);
                case 'help':
                    return this.getHelpMessage();
                case 'status':
                    return await this.getStatusMessage();
                case 'models':
                    return this.getModelsMessage();
                case 'voices':
                    return this.getVoicesMessage();
                case 'languages':
                    return this.getLanguagesMessage();
                default:
                    return `❌ Unknown command: ${command}. Type /help for available commands.`;
            }

        } catch (error) {
            logger.error('Command handling error:', error);
            return `❌ Error processing command: ${error.message}`;
        }
    }

    /**
     * Handle AI command
     */
    async handleAICommand(args, from) {
        try {
            if (args.length === 0) {
                return '❌ Please provide a message for the AI. Usage: /ai <model> <message> or /ai <message>';
            }

            let model = 'gemini';
            let message = args.join(' ');

            // Check if first argument is a model name
            if (newAiService.isModelAvailable(args[0])) {
                model = args[0];
                message = args.slice(1).join(' ');
            }

            if (!message) {
                return '❌ Please provide a message for the AI.';
            }

            const response = await newAiService.getResponse(message, model);
            return `🤖 *${model.toUpperCase()} AI Response:*\n\n${response}`;

        } catch (error) {
            logger.error('AI command error:', error);
            return `❌ AI command failed: ${error.message}`;
        }
    }

    /**
     * Handle translate command
     */
    async handleTranslateCommand(args, from) {
        try {
            if (args.length < 2) {
                return '❌ Usage: /translate <target_language> <text>\nExample: /translate es Hello world';
            }

            const targetLanguage = args[0];
            const text = args.slice(1).join(' ');

            const result = await translationService.translateText(text, targetLanguage);
            
            if (result.success) {
                return `🌐 *Translation Result:*\n\n*Original:* ${result.originalText}\n*Translated (${targetLanguage}):* ${result.translatedText}\n\n*Service:* ${result.service}`;
            } else {
                return `❌ Translation failed: ${result.error}`;
            }

        } catch (error) {
            logger.error('Translate command error:', error);
            return `❌ Translation command failed: ${error.message}`;
        }
    }

    /**
     * Handle search command
     */
    async handleSearchCommand(args, from) {
        try {
            if (args.length === 0) {
                return '❌ Please provide a search query. Usage: /search <query>';
            }

            const query = args.join(' ');
            const result = await searchService.searchWeb(query, 5);
            
            return searchService.formatResultsForDisplay(result, 5);

        } catch (error) {
            logger.error('Search command error:', error);
            return `❌ Search command failed: ${error.message}`;
        }
    }

    /**
     * Handle news command
     */
    async handleNewsCommand(args, from) {
        try {
            const query = args.length > 0 ? args.join(' ') : 'latest news';
            const result = await searchService.searchNews(query, 5);
            
            return searchService.formatResultsForDisplay(result, 5);

        } catch (error) {
            logger.error('News command error:', error);
            return `❌ News command failed: ${error.message}`;
        }
    }

    /**
     * Handle weather command
     */
    async handleWeatherCommand(args, from) {
        try {
            if (args.length === 0) {
                return '❌ Please provide a city name. Usage: /weather <city>';
            }

            const cityName = args.join(' ');
            const result = await weatherService.getWeatherByCity(cityName);
            
            return weatherService.formatWeatherForDisplay(result);

        } catch (error) {
            logger.error('Weather command error:', error);
            return `❌ Weather command failed: ${error.message}`;
        }
    }

    /**
     * Handle YouTube command
     */
    async handleYouTubeCommand(args, from) {
        try {
            if (args.length === 0) {
                return '❌ Please provide a YouTube URL. Usage: /youtube <url> [summarize|transcribe]';
            }

            const url = args[0];
            const action = args[1] || 'summarize';

            if (!mediaService.isValidYouTubeUrl(url)) {
                return '❌ Please provide a valid YouTube URL.';
            }

            if (action === 'transcribe') {
                const result = await mediaService.transcribeYouTubeVideo(url);
                return mediaService.formatTranscriptionForDisplay(result);
            } else {
                const result = await mediaService.summarizeYouTubeVideo(url, 200);
                return mediaService.formatSummaryForDisplay(result);
            }

        } catch (error) {
            logger.error('YouTube command error:', error);
            return `❌ YouTube command failed: ${error.message}`;
        }
    }

    /**
     * Handle TTS command
     */
    async handleTTSCommand(args, from) {
        try {
            if (args.length === 0) {
                return '❌ Please provide text to convert. Usage: /tts <text> [voice]';
            }

            let voice = 'Salli';
            let text = args.join(' ');

            // Check if last argument is a voice name
            const lastArg = args[args.length - 1];
            if (enhancedTtsService.isVoiceAvailable(lastArg)) {
                voice = lastArg;
                text = args.slice(0, -1).join(' ');
            }

            if (!text) {
                return '❌ Please provide text to convert to speech.';
            }

            const result = await enhancedTtsService.textToSpeech(text, voice);
            
            if (result.success) {
                return enhancedTtsService.formatTTSResultForDisplay(result);
            } else {
                return `❌ TTS conversion failed: ${result.error}`;
            }

        } catch (error) {
            logger.error('TTS command error:', error);
            return `❌ TTS command failed: ${error.message}`;
        }
    }

    /**
     * Handle phone command
     */
    async handlePhoneCommand(args, from) {
        try {
            if (args.length === 0) {
                return '❌ Please provide a phone number. Usage: /phone <number>';
            }

            const phoneNumber = args.join('');
            const result = await enhancedTruecallerService.lookupPhoneNumber(phoneNumber);
            
            return enhancedTruecallerService.formatTruecallerForDisplay(result);

        } catch (error) {
            logger.error('Phone command error:', error);
            return `❌ Phone command failed: ${error.message}`;
        }
    }

    /**
     * Handle image messages
     */
    async handleImageMessage(message, from) {
        try {
            // For image analysis, we would need the image data
            // This is a placeholder for image handling logic
            return '📷 Image received! Image analysis feature will be implemented based on your specific requirements.';

        } catch (error) {
            logger.error('Image message handling error:', error);
            return `❌ Error processing image: ${error.message}`;
        }
    }

    /**
     * Handle audio messages
     */
    async handleAudioMessage(message, from) {
        try {
            // For audio transcription, we would need the audio data
            // This is a placeholder for audio handling logic
            return '🎵 Audio received! Audio transcription feature will be implemented based on your specific requirements.';

        } catch (error) {
            logger.error('Audio message handling error:', error);
            return `❌ Error processing audio: ${error.message}`;
        }
    }

    /**
     * Handle document messages
     */
    async handleDocumentMessage(message, from) {
        try {
            // For document processing, we would need the document data
            // This is a placeholder for document handling logic
            return '📄 Document received! Document processing feature will be implemented based on your specific requirements.';

        } catch (error) {
            logger.error('Document message handling error:', error);
            return `❌ Error processing document: ${error.message}`;
        }
    }

    /**
     * Handle unsupported message types
     */
    async handleUnsupportedMessage(messageType, from) {
        return `❌ Unsupported message type: ${messageType}. I can process text, images, audio, and documents.`;
    }

    /**
     * Handle AI chat (default behavior)
     */
    async handleAIChat(messageText, from) {
        try {
            const response = await newAiService.getResponse(messageText, 'gemini');
            return `🤖 ${response}`;

        } catch (error) {
            logger.error('AI chat error:', error);
            return `❌ AI chat failed: ${error.message}`;
        }
    }

    /**
     * Handle YouTube URLs
     */
    async handleYouTubeUrl(url, from) {
        try {
            const result = await mediaService.summarizeYouTubeVideo(url, 200);
            return mediaService.formatSummaryForDisplay(result);

        } catch (error) {
            logger.error('YouTube URL handling error:', error);
            return `❌ YouTube processing failed: ${error.message}`;
        }
    }

    /**
     * Handle phone numbers
     */
    async handlePhoneNumber(phoneNumber, from) {
        try {
            const result = await enhancedTruecallerService.lookupPhoneNumber(phoneNumber);
            return enhancedTruecallerService.formatTruecallerForDisplay(result);

        } catch (error) {
            logger.error('Phone number handling error:', error);
            return `❌ Phone lookup failed: ${error.message}`;
        }
    }

    /**
     * Handle translation requests
     */
    async handleTranslationRequest(messageText, from) {
        try {
            // Simple pattern matching for translation requests
            const translatePattern = /translate\s+(.+?)\s+to\s+(\w+)/i;
            const match = messageText.match(translatePattern);
            
            if (match) {
                const text = match[1];
                const targetLanguage = match[2];
                
                const result = await translationService.translateText(text, targetLanguage);
                
                if (result.success) {
                    return `🌐 *Translation:* ${result.translatedText}`;
                } else {
                    return `❌ Translation failed: ${result.error}`;
                }
            }

            return null; // Not a translation request

        } catch (error) {
            logger.error('Translation request handling error:', error);
            return `❌ Translation request failed: ${error.message}`;
        }
    }

    /**
     * Check if text is a YouTube URL
     */
    isYouTubeUrl(text) {
        return mediaService.isValidYouTubeUrl(text);
    }

    /**
     * Check if text is a phone number
     */
    isPhoneNumber(text) {
        return enhancedTruecallerService.isValidPhoneNumber(text);
    }

    /**
     * Check if text is a translation request
     */
    isTranslationRequest(text) {
        const patterns = [
            /translate\s+.+\s+to\s+\w+/i,
            /how do you say\s+.+\s+in\s+\w+/i,
            /what is\s+.+\s+in\s+\w+/i
        ];
        
        return patterns.some(pattern => pattern.test(text));
    }

    /**
     * Get help message
     */
    getHelpMessage() {
        return `🤖 *WhatsApp AI Bot - Help*

*Available Commands:*
• /ai <model> <message> - Chat with AI (models: gemini, openai, deepseek, claude, qwen, kimi, llama)
• /translate <lang> <text> - Translate text to specified language
• /search <query> - Search the web
• /news [query] - Get latest news
• /weather <city> - Get weather information
• /youtube <url> [action] - Process YouTube videos (summarize/transcribe)
• /tts <text> [voice] - Convert text to speech
• /phone <number> - Lookup phone number information
• /help - Show this help message
• /status - Check system status
• /models - List available AI models
• /voices - List available TTS voices
• /languages - List supported languages

*Smart Features:*
• Send YouTube URLs directly for automatic summarization
• Send phone numbers directly for automatic lookup
• Use natural language for translations (e.g., "translate hello to spanish")
• Default AI chat without commands

*Examples:*
• /ai gemini What is artificial intelligence?
• /translate es Hello world
• /search latest technology news
• /weather New York
• /youtube https://youtu.be/example
• /tts Hello world Salli
• /phone +1234567890

Type any message to start chatting with AI! 🚀`;
    }

    /**
     * Get status message
     */
    async getStatusMessage() {
        try {
            const status = {
                ai: await newAiService.getAvailableModels(),
                translation: await translationService.getServiceStatus(),
                search: await searchService.getServiceStatus(),
                media: await mediaService.getServiceStatus(),
                weather: await weatherService.getServiceStatus(),
                tts: await enhancedTtsService.getServiceStatus(),
                truecaller: await enhancedTruecallerService.getServiceStatus()
            };

            let message = '📊 *System Status*\n\n';
            
            message += `🤖 *AI Models:* ${status.ai.length} available\n`;
            message += `🌐 *Translation:* ${status.translation.primary.available ? '✅' : '❌'} Primary, ${status.translation.fallback.available ? '✅' : '❌'} Fallback\n`;
            message += `🔍 *Search:* ${status.search.available ? '✅' : '❌'} Available\n`;
            message += `🎥 *Media:* ${Object.values(status.media).filter(s => s.available).length}/3 services\n`;
            message += `🌤️ *Weather:* ${Object.values(status.weather).filter(s => s.available).length}/3 services\n`;
            message += `🔊 *TTS:* ${status.tts.available ? '✅' : '❌'} Available (${status.tts.totalVoices} voices)\n`;
            message += `📞 *Phone Lookup:* ${Object.values(status.truecaller).filter(s => s.available).length}/2 services\n`;
            
            message += `\n⏰ *Last Updated:* ${new Date().toLocaleString()}`;
            
            return message;

        } catch (error) {
            logger.error('Status message error:', error);
            return `❌ Error getting system status: ${error.message}`;
        }
    }

    /**
     * Get models message
     */
    getModelsMessage() {
        const models = newAiService.getAvailableModels();
        let message = '🤖 *Available AI Models:*\n\n';
        
        models.forEach(model => {
            const info = newAiService.getModelInfo(model);
            message += `• *${model.toUpperCase()}* - ${info.name}\n`;
            message += `  ${info.description}\n`;
            message += `  Features: ${info.features.join(', ')}\n\n`;
        });
        
        message += 'Usage: /ai <model> <message> or just type your message for default Gemini model.';
        
        return message;
    }

    /**
     * Get voices message
     */
    getVoicesMessage() {
        const voices = enhancedTtsService.getAvailableVoices();
        let message = '🔊 *Available TTS Voices:*\n\n';
        
        // Group by language
        const voicesByLanguage = {};
        voices.forEach(voice => {
            const info = enhancedTtsService.getVoiceInfo(voice);
            const lang = info.language.split('-')[0];
            if (!voicesByLanguage[lang]) {
                voicesByLanguage[lang] = [];
            }
            voicesByLanguage[lang].push({ voice, info });
        });
        
        Object.keys(voicesByLanguage).sort().forEach(lang => {
            message += `*${lang.toUpperCase()}:*\n`;
            voicesByLanguage[lang].forEach(({ voice, info }) => {
                message += `  • ${voice} (${info.gender}, ${info.region})\n`;
            });
            message += '\n';
        });
        
        message += 'Usage: /tts <text> [voice] or /tts <text> for default voice.';
        
        return message;
    }

    /**
     * Get languages message
     */
    getLanguagesMessage() {
        const languages = translationService.getSupportedLanguages();
        let message = '🌐 *Supported Languages:*\n\n';
        
        Object.keys(languages).sort().forEach(code => {
            message += `• *${code}* - ${languages[code]}\n`;
        });
        
        message += '\nUsage: /translate <language_code> <text>';
        
        return message;
    }
}

module.exports = new NewMessageHandler();

