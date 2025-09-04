const fetch = require('node-fetch');
const configManager = require('./config-manager');

class APIManager {
    constructor() {
        this.rateLimits = new Map(); // Simple rate limiting
    }

    /**
     * Check rate limit for API calls
     */
    checkRateLimit(apiName, maxRequests = 30, windowMs = 60000) {
        const now = Date.now();
        const key = apiName;
        
        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, { count: 1, resetTime: now + windowMs });
            return true;
        }
        
        const limit = this.rateLimits.get(key);
        if (now > limit.resetTime) {
            this.rateLimits.set(key, { count: 1, resetTime: now + windowMs });
            return true;
        }
        
        if (limit.count >= maxRequests) {
            return false;
        }
        
        limit.count++;
        return true;
    }

    /**
     * Make HTTP request with error handling
     */
    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'WhatsApp-Bot/1.0',
                    'Accept': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error(`API Request failed for ${url}:`, error.message);
            throw error;
        }
    }

    /**
     * Google Search API
     */
    async googleSearch(query, numResults = 5) {
        if (!this.checkRateLimit('google_search')) {
            throw new Error('Rate limit exceeded for Google Search');
        }

        const api = configManager.get('apis.google_search');
        if (!api || !api.enabled) {
            throw new Error('Google Search API is not enabled');
        }

        try {
            const response = await this.makeRequest(api.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    limit: numResults
                })
            });

            return {
                success: true,
                results: response.results || response.data || [],
                summary: `Found ${response.results?.length || 0} search results for "${query}"`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                summary: `❌ Search failed: ${error.message}`
            };
        }
    }

    /**
     * Weather API
     */
    async getWeather(location) {
        if (!this.checkRateLimit('weather')) {
            throw new Error('Rate limit exceeded for Weather API');
        }

        const api = configManager.get('apis.weather');
        if (!api || !api.enabled) {
            throw new Error('Weather API is not enabled');
        }

        try {
            const response = await this.makeRequest(api.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: location
                })
            });

            return {
                success: true,
                data: response.data || response,
                summary: `🌤️ Weather for ${location}: ${response.data?.current?.condition || 'N/A'}, ${response.data?.current?.temperature || 'N/A'}°C`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                summary: `❌ Weather lookup failed: ${error.message}`
            };
        }
    }

    /**
     * Translation API
     */
    async translateText(text, targetLanguage = 'en') {
        if (!this.checkRateLimit('translator')) {
            throw new Error('Rate limit exceeded for Translation API');
        }

        const api = configManager.get('apis.translator');
        if (!api || !api.enabled) {
            throw new Error('Translation API is not enabled');
        }

        try {
            const response = await this.makeRequest(api.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    target: targetLanguage,
                    source: 'auto'
                })
            });

            return {
                success: true,
                translatedText: response.translated || response.result || response.data,
                summary: `🌐 Translated to ${targetLanguage}: ${response.translated || response.result || response.data}`
            };
        } catch (error) {
            // Try alternative Google Translate
            try {
                const altApi = configManager.get('apis.translator_alt');
                if (altApi && altApi.enabled) {
                    const altUrl = `${altApi.endpoint}?client=gtx&sl=auto&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
                    const altResponse = await this.makeRequest(altUrl);
                    
                    // Parse Google Translate response
                    const translatedText = altResponse[0][0][0];
                    return {
                        success: true,
                        translatedText: translatedText,
                        summary: `🌐 Translated to ${targetLanguage}: ${translatedText}`
                    };
                }
            } catch (altError) {
                console.error('Alternative translation also failed:', altError.message);
            }
            
            return {
                success: false,
                error: error.message,
                summary: `❌ Translation failed: ${error.message}`
            };
        }
    }

    /**
     * YouTube Transcription API
     */
    async transcribeYouTube(videoUrl) {
        if (!this.checkRateLimit('youtube_transcribe')) {
            throw new Error('Rate limit exceeded for YouTube Transcribe API');
        }

        const api = configManager.get('apis.youtube_transcribe');
        if (!api || !api.enabled) {
            throw new Error('YouTube Transcribe API is not enabled');
        }

        try {
            const response = await this.makeRequest(api.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: videoUrl
                })
            });

            return {
                success: true,
                transcript: response.transcript || response.data || response.result,
                summary: `📹 YouTube video transcribed successfully`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                summary: `❌ YouTube transcription failed: ${error.message}`
            };
        }
    }

    /**
     * YouTube Summarizer API
     */
    async summarizeYouTube(videoUrl, wordCount = 200) {
        if (!this.checkRateLimit('youtube_summarizer')) {
            throw new Error('Rate limit exceeded for YouTube Summarizer API');
        }

        const api = configManager.get('apis.youtube_summarizer');
        if (!api || !api.enabled) {
            throw new Error('YouTube Summarizer API is not enabled');
        }

        try {
            const response = await this.makeRequest(api.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: videoUrl,
                    length: wordCount
                })
            });

            return {
                success: true,
                summary: response.summary || response.data || response.result,
                wordCount: wordCount
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                summary: `❌ YouTube summarization failed: ${error.message}`
            };
        }
    }

    /**
     * Truecaller API
     */
    async lookupPhone(phoneNumber) {
        if (!this.checkRateLimit('truecaller')) {
            throw new Error('Rate limit exceeded for Truecaller API');
        }

        const api = configManager.get('apis.truecaller');
        if (!api || !api.enabled) {
            throw new Error('Truecaller API is not enabled');
        }

        try {
            const response = await this.makeRequest(api.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: phoneNumber
                })
            });

            return {
                success: true,
                data: response.data || response,
                summary: `📞 Phone lookup completed for ${phoneNumber}`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                summary: `❌ Phone lookup failed: ${error.message}`
            };
        }
    }

    /**
     * Phone Info API
     */
    async getPhoneInfo(phoneModel) {
        if (!this.checkRateLimit('phone_info')) {
            throw new Error('Rate limit exceeded for Phone Info API');
        }

        const api = configManager.get('apis.phone_info');
        if (!api || !api.enabled) {
            throw new Error('Phone Info API is not enabled');
        }

        try {
            const response = await this.makeRequest(api.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: phoneModel
                })
            });

            return {
                success: true,
                data: response.data || response,
                summary: `📱 Phone specifications found for ${phoneModel}`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                summary: `❌ Phone info lookup failed: ${error.message}`
            };
        }
    }

    /**
     * Text-to-Speech API
     */
    async textToSpeech(text, voice = 'Salli') {
        if (!this.checkRateLimit('tts')) {
            throw new Error('Rate limit exceeded for TTS API');
        }

        const api = configManager.get('apis.tts');
        if (!api || !api.enabled) {
            throw new Error('TTS API is not enabled');
        }

        const url = `${api.endpoint}?voice=${voice}&text=${encodeURIComponent(text)}`;
        
        try {
            const response = await fetch(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'WhatsApp-Bot/1.0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const audioBuffer = await response.buffer();
            return {
                success: true,
                audioBuffer: audioBuffer,
                summary: `🔊 Text converted to speech using ${voice} voice`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                summary: `❌ Text-to-speech failed: ${error.message}`
            };
        }
    }

    /**
     * Get API status for all enabled APIs
     */
    async getAPIStatus() {
        const enabledAPIs = configManager.getEnabledAPIs();
        const status = {};
        
        for (const [name, api] of Object.entries(enabledAPIs)) {
            try {
                // Simple health check - just try to reach the endpoint
                const response = await fetch(api.endpoint, { 
                    method: 'HEAD', 
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'WhatsApp-Bot/1.0'
                    }
                });
                status[name] = {
                    status: response.ok ? '✅ Online' : '⚠️ Issues',
                    endpoint: api.endpoint,
                    description: api.description
                };
            } catch (error) {
                status[name] = {
                    status: '❌ Offline',
                    endpoint: api.endpoint,
                    description: api.description,
                    error: error.message
                };
            }
        }
        
        return status;
    }

    /**
     * Detect command intent from user message
     */
    detectIntent(message) {
        const lowerMessage = message.toLowerCase();
        
        // Search intent
        if (lowerMessage.includes('search') || lowerMessage.includes('google') || lowerMessage.includes('find')) {
            return { intent: 'search', confidence: 0.8 };
        }
        
        // Weather intent
        if (lowerMessage.includes('weather') || lowerMessage.includes('temperature') || lowerMessage.includes('forecast')) {
            return { intent: 'weather', confidence: 0.9 };
        }
        
        // Translation intent
        if (lowerMessage.includes('translate') || lowerMessage.includes('translation')) {
            return { intent: 'translate', confidence: 0.9 };
        }
        
        // YouTube intent
        if (lowerMessage.includes('youtube.com') || lowerMessage.includes('youtu.be')) {
            if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
                return { intent: 'youtube_summarize', confidence: 0.9 };
            } else {
                return { intent: 'youtube_transcribe', confidence: 0.8 };
            }
        }
        
        // Phone lookup intent
        if (lowerMessage.includes('phone number') || lowerMessage.includes('truecaller')) {
            return { intent: 'phone_lookup', confidence: 0.8 };
        }
        
        // Phone specs intent
        if (lowerMessage.includes('phone specs') || lowerMessage.includes('phone info')) {
            return { intent: 'phone_info', confidence: 0.8 };
        }
        
        return { intent: 'chat', confidence: 0.5 };
    }
}

module.exports = new APIManager();