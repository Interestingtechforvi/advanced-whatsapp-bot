const apiManager = require('./apiManager');
const apiConfig = require('../config/apiConfig');
const logger = require('../utils/logger');

/**
 * Translation Service using multiple translation APIs
 * Provides text translation with fallback mechanisms
 */
class TranslationService {
    constructor() {
        this.primaryService = 'translator';
        this.fallbackService = 'translatorDara';
        this.supportedLanguages = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'bn': 'Bengali',
            'ur': 'Urdu',
            'ne': 'Nepali',
            'th': 'Thai',
            'vi': 'Vietnamese',
            'tr': 'Turkish',
            'pl': 'Polish',
            'nl': 'Dutch',
            'sv': 'Swedish',
            'da': 'Danish',
            'no': 'Norwegian',
            'fi': 'Finnish'
        };
    }

    /**
     * Translate text to target language
     * @param {string} text - Text to translate
     * @param {string} targetLanguage - Target language code
     * @param {string} sourceLanguage - Source language code (optional)
     * @returns {Promise<Object>} Translation result
     */
    async translateText(text, targetLanguage, sourceLanguage = 'auto') {
        try {
            // Validate target language
            if (!this.isLanguageSupported(targetLanguage)) {
                throw new Error(`Unsupported target language: ${targetLanguage}`);
            }

            // Try primary service first
            try {
                const result = await this.translateWithPrimaryService(text, targetLanguage, sourceLanguage);
                if (result.success) {
                    return result;
                }
            } catch (error) {
                logger.warn('Primary translation service failed, trying fallback:', error.message);
            }

            // Try fallback service
            try {
                const result = await this.translateWithFallbackService(text, targetLanguage, sourceLanguage);
                if (result.success) {
                    return result;
                }
            } catch (error) {
                logger.error('Fallback translation service also failed:', error.message);
            }

            // If both services fail, return error
            return {
                success: false,
                error: 'All translation services are currently unavailable',
                originalText: text,
                targetLanguage: targetLanguage
            };

        } catch (error) {
            logger.error('Translation error:', error);
            return {
                success: false,
                error: error.message,
                originalText: text,
                targetLanguage: targetLanguage
            };
        }
    }

    /**
     * Translate using primary service (AI Translator)
     */
    async translateWithPrimaryService(text, targetLanguage, sourceLanguage) {
        try {
            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('translator', 'translate'),
                method: 'GET',
                params: {
                    text: text,
                    target_language: targetLanguage,
                    source_language: sourceLanguage !== 'auto' ? sourceLanguage : undefined
                },
                serviceName: 'AI Translator',
                cache: true,
                cacheTTL: 3600000 // 1 hour cache for translations
            });

            if (response.success && response.data) {
                // Handle different response formats
                let translatedText = null;
                
                if (response.data.translated_text) {
                    translatedText = response.data.translated_text;
                } else if (response.data.translation) {
                    translatedText = response.data.translation;
                } else if (response.data.result) {
                    translatedText = response.data.result;
                } else if (typeof response.data === 'string') {
                    translatedText = response.data;
                }

                if (translatedText) {
                    return {
                        success: true,
                        translatedText: translatedText,
                        originalText: text,
                        sourceLanguage: sourceLanguage,
                        targetLanguage: targetLanguage,
                        service: 'AI Translator',
                        timestamp: new Date().toISOString()
                    };
                }
            }

            throw new Error('Invalid response from primary translation service');

        } catch (error) {
            logger.error('Primary translation service error:', error);
            throw error;
        }
    }

    /**
     * Translate using fallback service (Master Dara Translator)
     */
    async translateWithFallbackService(text, targetLanguage, sourceLanguage) {
        try {
            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('translatorDara', 'translate'),
                method: 'GET',
                params: {
                    text: text,
                    targetLang: targetLanguage
                },
                serviceName: 'Master Dara Translator',
                cache: true,
                cacheTTL: 3600000 // 1 hour cache for translations
            });

            if (response.success && response.data) {
                let translatedText = null;

                if (response.data.translatedText) {
                    translatedText = response.data.translatedText;
                } else if (response.data.translation) {
                    translatedText = response.data.translation;
                } else if (response.data.result) {
                    translatedText = response.data.result;
                } else if (typeof response.data === 'string') {
                    translatedText = response.data;
                }

                if (translatedText) {
                    return {
                        success: true,
                        translatedText: translatedText,
                        originalText: text,
                        sourceLanguage: sourceLanguage,
                        targetLanguage: targetLanguage,
                        service: 'Master Dara Translator',
                        timestamp: new Date().toISOString()
                    };
                }
            }

            throw new Error('Invalid response from fallback translation service');

        } catch (error) {
            logger.error('Fallback translation service error:', error);
            throw error;
        }
    }

    /**
     * Detect language of text
     * @param {string} text - Text to analyze
     * @returns {Promise<Object>} Language detection result
     */
    async detectLanguage(text) {
        try {
            // For now, we'll use a simple heuristic approach
            // In a production system, you might want to use a dedicated language detection API
            
            const result = {
                success: true,
                detectedLanguage: 'auto',
                confidence: 0.5,
                text: text,
                timestamp: new Date().toISOString()
            };

            // Simple language detection based on character patterns
            if (/[\u4e00-\u9fff]/.test(text)) {
                result.detectedLanguage = 'zh';
                result.confidence = 0.8;
            } else if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
                result.detectedLanguage = 'ja';
                result.confidence = 0.8;
            } else if (/[\u0600-\u06ff]/.test(text)) {
                result.detectedLanguage = 'ar';
                result.confidence = 0.8;
            } else if (/[\u0900-\u097f]/.test(text)) {
                result.detectedLanguage = 'hi';
                result.confidence = 0.8;
            } else if (/[\u0980-\u09ff]/.test(text)) {
                result.detectedLanguage = 'bn';
                result.confidence = 0.8;
            } else if (/[\u0400-\u04ff]/.test(text)) {
                result.detectedLanguage = 'ru';
                result.confidence = 0.7;
            } else {
                // Default to English for Latin script
                result.detectedLanguage = 'en';
                result.confidence = 0.6;
            }

            return result;

        } catch (error) {
            logger.error('Language detection error:', error);
            return {
                success: false,
                error: error.message,
                text: text
            };
        }
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return { ...this.supportedLanguages };
    }

    /**
     * Check if language is supported
     */
    isLanguageSupported(languageCode) {
        return languageCode in this.supportedLanguages;
    }

    /**
     * Get language name from code
     */
    getLanguageName(languageCode) {
        return this.supportedLanguages[languageCode] || 'Unknown';
    }

    /**
     * Batch translate multiple texts
     */
    async batchTranslate(texts, targetLanguage, sourceLanguage = 'auto') {
        try {
            const results = [];
            
            for (const text of texts) {
                const result = await this.translateText(text, targetLanguage, sourceLanguage);
                results.push(result);
                
                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            return {
                success: true,
                results: results,
                totalTexts: texts.length,
                successfulTranslations: results.filter(r => r.success).length,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Batch translation error:', error);
            return {
                success: false,
                error: error.message,
                totalTexts: texts.length
            };
        }
    }

    /**
     * Get translation service status
     */
    async getServiceStatus() {
        const status = {
            primary: { name: 'AI Translator', available: false, responseTime: null },
            fallback: { name: 'Master Dara Translator', available: false, responseTime: null }
        };

        // Test primary service
        try {
            const startTime = Date.now();
            const result = await this.translateWithPrimaryService('Hello', 'es');
            status.primary.available = result.success;
            status.primary.responseTime = Date.now() - startTime;
        } catch (error) {
            status.primary.error = error.message;
        }

        // Test fallback service
        try {
            const startTime = Date.now();
            const result = await this.translateWithFallbackService('Hello', 'es');
            status.fallback.available = result.success;
            status.fallback.responseTime = Date.now() - startTime;
        } catch (error) {
            status.fallback.error = error.message;
        }

        return status;
    }
}

module.exports = new TranslationService();

