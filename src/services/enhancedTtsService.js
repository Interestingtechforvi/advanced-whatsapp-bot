const apiManager = require('./apiManager');
const apiConfig = require('../config/apiConfig');
const logger = require('../utils/logger');

/**
 * Enhanced Text-to-Speech Service using the new API Manager
 * Provides robust TTS functionality with proper error handling
 */
class EnhancedTTSService {
    constructor() {
        this.defaultVoice = 'Salli';
        this.availableVoices = apiConfig.getConfig('tts').voices;
        this.maxTextLength = 1000; // Reasonable limit for TTS
    }

    /**
     * Convert text to speech
     * @param {string} text - Text to convert to speech
     * @param {string} voice - Voice to use for TTS
     * @returns {Promise<Object>} TTS result with audio data
     */
    async textToSpeech(text, voice = this.defaultVoice) {
        try {
            // Validate inputs
            if (!text || text.trim().length === 0) {
                throw new Error('Text cannot be empty');
            }

            if (text.length > this.maxTextLength) {
                throw new Error(`Text too long. Maximum length is ${this.maxTextLength} characters`);
            }

            // Validate voice
            if (!this.isVoiceAvailable(voice)) {
                logger.warn(`Voice '${voice}' not available, using default voice '${this.defaultVoice}'`);
                voice = this.defaultVoice;
            }

            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('tts', 'speech'),
                method: 'GET',
                params: {
                    voice: voice,
                    text: text.trim()
                },
                serviceName: 'Text-to-Speech',
                cache: true,
                cacheTTL: 3600000 // 1 hour cache for TTS audio
            });

            if (response.success) {
                return {
                    success: true,
                    audioData: response.data.buffer || response.data,
                    text: text,
                    voice: voice,
                    contentType: response.data.contentType || 'audio/mpeg',
                    service: 'Text-to-Speech',
                    timestamp: new Date().toISOString()
                };
            }

            throw new Error('Invalid response from TTS service');

        } catch (error) {
            logger.error('TTS error:', error);
            return {
                success: false,
                error: error.message,
                text: text,
                voice: voice,
                service: 'Text-to-Speech'
            };
        }
    }

    /**
     * Get available voices
     */
    getAvailableVoices() {
        return [...this.availableVoices];
    }

    /**
     * Check if voice is available
     */
    isVoiceAvailable(voice) {
        return this.availableVoices.includes(voice);
    }

    /**
     * Get voice information
     */
    getVoiceInfo(voice) {
        const voiceCategories = {
            // English voices
            'Salli': { language: 'en-US', gender: 'female', region: 'US' },
            'Matthew': { language: 'en-US', gender: 'male', region: 'US' },
            'Joanna': { language: 'en-US', gender: 'female', region: 'US' },
            'Ivy': { language: 'en-US', gender: 'female', region: 'US' },
            'Justin': { language: 'en-US', gender: 'male', region: 'US' },
            'Kendra': { language: 'en-US', gender: 'female', region: 'US' },
            'Kimberly': { language: 'en-US', gender: 'female', region: 'US' },
            'Amy': { language: 'en-GB', gender: 'female', region: 'UK' },
            'Brian': { language: 'en-GB', gender: 'male', region: 'UK' },
            'Emma': { language: 'en-GB', gender: 'female', region: 'UK' },
            'Russell': { language: 'en-AU', gender: 'male', region: 'Australia' },
            'Nicole': { language: 'en-AU', gender: 'female', region: 'Australia' },
            'Joey': { language: 'en-US', gender: 'male', region: 'US' },
            'Raveena': { language: 'en-IN', gender: 'female', region: 'India' },
            'Aditi': { language: 'en-IN', gender: 'female', region: 'India' },
            
            // European voices
            'Geraint': { language: 'en-GB-WLS', gender: 'male', region: 'Wales' },
            'Conchita': { language: 'es-ES', gender: 'female', region: 'Spain' },
            'Enrique': { language: 'es-ES', gender: 'male', region: 'Spain' },
            'Miguel': { language: 'es-US', gender: 'male', region: 'US' },
            'Penelope': { language: 'es-US', gender: 'female', region: 'US' },
            'Chantal': { language: 'fr-CA', gender: 'female', region: 'Canada' },
            'Celine': { language: 'fr-FR', gender: 'female', region: 'France' },
            'Mathieu': { language: 'fr-FR', gender: 'male', region: 'France' },
            'Dora': { language: 'is-IS', gender: 'female', region: 'Iceland' },
            'Karl': { language: 'is-IS', gender: 'male', region: 'Iceland' },
            'Carla': { language: 'it-IT', gender: 'female', region: 'Italy' },
            'Giorgio': { language: 'it-IT', gender: 'male', region: 'Italy' },
            
            // Asian voices
            'Mizuki': { language: 'ja-JP', gender: 'female', region: 'Japan' },
            'Takumi': { language: 'ja-JP', gender: 'male', region: 'Japan' },
            'Seoyeon': { language: 'ko-KR', gender: 'female', region: 'Korea' },
            
            // Nordic voices
            'Liv': { language: 'nb-NO', gender: 'female', region: 'Norway' },
            'Lotte': { language: 'nl-NL', gender: 'female', region: 'Netherlands' },
            'Ruben': { language: 'nl-NL', gender: 'male', region: 'Netherlands' },
            
            // Eastern European voices
            'Ewa': { language: 'pl-PL', gender: 'female', region: 'Poland' },
            'Jacek': { language: 'pl-PL', gender: 'male', region: 'Poland' },
            'Jan': { language: 'pl-PL', gender: 'male', region: 'Poland' },
            'Maja': { language: 'pl-PL', gender: 'female', region: 'Poland' },
            
            // Portuguese voices
            'Ricardo': { language: 'pt-BR', gender: 'male', region: 'Brazil' },
            'Vitoria': { language: 'pt-BR', gender: 'female', region: 'Brazil' },
            'Cristiano': { language: 'pt-PT', gender: 'male', region: 'Portugal' },
            'Ines': { language: 'pt-PT', gender: 'female', region: 'Portugal' },
            
            // Other voices
            'Carmen': { language: 'ro-RO', gender: 'female', region: 'Romania' },
            'Maxim': { language: 'ru-RU', gender: 'male', region: 'Russia' },
            'Tatyana': { language: 'ru-RU', gender: 'female', region: 'Russia' },
            'Astrid': { language: 'sv-SE', gender: 'female', region: 'Sweden' },
            'Filiz': { language: 'tr-TR', gender: 'female', region: 'Turkey' }
        };

        return voiceCategories[voice] || { language: 'unknown', gender: 'unknown', region: 'unknown' };
    }

    /**
     * Get voices by language
     */
    getVoicesByLanguage(language) {
        return this.availableVoices.filter(voice => {
            const info = this.getVoiceInfo(voice);
            return info.language.startsWith(language);
        });
    }

    /**
     * Get voices by gender
     */
    getVoicesByGender(gender) {
        return this.availableVoices.filter(voice => {
            const info = this.getVoiceInfo(voice);
            return info.gender === gender;
        });
    }

    /**
     * Get random voice
     */
    getRandomVoice(language = null, gender = null) {
        let voices = this.availableVoices;

        if (language) {
            voices = this.getVoicesByLanguage(language);
        }

        if (gender) {
            voices = voices.filter(voice => {
                const info = this.getVoiceInfo(voice);
                return info.gender === gender;
            });
        }

        if (voices.length === 0) {
            return this.defaultVoice;
        }

        return voices[Math.floor(Math.random() * voices.length)];
    }

    /**
     * Validate text for TTS
     */
    validateText(text) {
        const issues = [];

        if (!text || text.trim().length === 0) {
            issues.push('Text cannot be empty');
        }

        if (text.length > this.maxTextLength) {
            issues.push(`Text too long. Maximum length is ${this.maxTextLength} characters`);
        }

        // Check for potentially problematic characters
        const problematicChars = /[<>{}[\]\\]/g;
        if (problematicChars.test(text)) {
            issues.push('Text contains potentially problematic characters');
        }

        return {
            valid: issues.length === 0,
            issues: issues,
            characterCount: text.length,
            wordCount: text.trim().split(/\s+/).length
        };
    }

    /**
     * Clean text for TTS
     */
    cleanTextForTTS(text) {
        return text
            .trim()
            .replace(/[<>{}[\]\\]/g, '') // Remove problematic characters
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/([.!?])\s*([.!?])/g, '$1 $2') // Fix punctuation spacing
            .substring(0, this.maxTextLength); // Ensure length limit
    }

    /**
     * Batch text-to-speech conversion
     */
    async batchTextToSpeech(texts, voice = this.defaultVoice) {
        try {
            const results = [];
            
            for (const text of texts) {
                const result = await this.textToSpeech(text, voice);
                results.push(result);
                
                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            return {
                success: true,
                results: results,
                totalTexts: texts.length,
                successfulConversions: results.filter(r => r.success).length,
                voice: voice,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Batch TTS error:', error);
            return {
                success: false,
                error: error.message,
                totalTexts: texts.length,
                voice: voice
            };
        }
    }

    /**
     * Get TTS service status
     */
    async getServiceStatus() {
        try {
            const testText = 'Hello, this is a test.';
            const startTime = Date.now();
            
            const result = await this.textToSpeech(testText, this.defaultVoice);
            const responseTime = Date.now() - startTime;

            return {
                available: result.success,
                responseTime: responseTime,
                service: 'Text-to-Speech',
                totalVoices: this.availableVoices.length,
                defaultVoice: this.defaultVoice,
                maxTextLength: this.maxTextLength,
                lastChecked: new Date().toISOString(),
                error: result.success ? null : result.error
            };

        } catch (error) {
            return {
                available: false,
                responseTime: null,
                service: 'Text-to-Speech',
                totalVoices: this.availableVoices.length,
                defaultVoice: this.defaultVoice,
                maxTextLength: this.maxTextLength,
                lastChecked: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Format TTS result for display
     */
    formatTTSResultForDisplay(ttsResult) {
        if (!ttsResult.success) {
            return `❌ Text-to-Speech failed: ${ttsResult.error}`;
        }

        const voiceInfo = this.getVoiceInfo(ttsResult.voice);
        
        let response = `🔊 *Text-to-Speech Conversion*\n\n`;
        response += `📝 *Text:* "${ttsResult.text}"\n`;
        response += `🎤 *Voice:* ${ttsResult.voice} (${voiceInfo.language}, ${voiceInfo.gender})\n`;
        response += `🌍 *Region:* ${voiceInfo.region}\n`;
        response += `📊 *Audio Format:* ${ttsResult.contentType}\n`;
        response += `⏰ *Generated at:* ${new Date(ttsResult.timestamp).toLocaleString()}`;
        
        return response;
    }
}

module.exports = new EnhancedTTSService();

