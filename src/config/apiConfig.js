require('dotenv').config();

/**
 * Centralized API Configuration Management
 * Handles all API endpoints, keys, and service configurations
 */
class APIConfig {
    constructor() {
        this.validateEnvironment();
        this.initializeConfigs();
    }

    /**
     * Validate that required environment variables are present
     */
    validateEnvironment() {
        const requiredVars = [
            'GEMINI_API_KEY',
            'OPENAI_API_KEY'
        ];

        const missing = requiredVars.filter(varName => !process.env[varName]);
        
        if (missing.length > 0) {
            console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
            console.warn('Some API features may not work properly.');
        }
    }

    /**
     * Initialize all API configurations
     */
    initializeConfigs() {
        this.configs = {
            // AI Services
            gemini: {
                name: 'Google Gemini',
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                apiKey: process.env.GEMINI_API_KEY,
                endpoints: {
                    generateContent: '/models/gemini-pro:generateContent',
                    generateContentVision: '/models/gemini-pro-vision:generateContent',
                    generateContent25: '/models/gemini-2.5-pro:generateContent',
                    uploadFile: '/files'
                },
                rateLimit: {
                    requests: 60,
                    window: 60000 // 1 minute
                },
                timeout: 30000,
                retries: 3
            },

            openai: {
                name: 'OpenAI',
                baseUrl: 'https://api.openai.com/v1',
                apiKey: process.env.OPENAI_API_KEY,
                endpoints: {
                    chatCompletions: '/chat/completions',
                    completions: '/completions',
                    embeddings: '/embeddings'
                },
                rateLimit: {
                    requests: 50,
                    window: 60000
                },
                timeout: 30000,
                retries: 3
            },

            // Alternative AI Services
            deepseek: {
                name: 'DeepSeek AI',
                baseUrl: 'https://deepseek.ytansh038.workers.dev',
                endpoints: {
                    chat: '/'
                },
                rateLimit: {
                    requests: 30,
                    window: 60000
                },
                timeout: 15000,
                retries: 2
            },

            claude: {
                name: 'Claude AI',
                baseUrl: 'https://claudeai.anshppt19.workers.dev',
                endpoints: {
                    chat: '/api/chat'
                },
                rateLimit: {
                    requests: 30,
                    window: 60000
                },
                timeout: 15000,
                retries: 2
            },

            qwen: {
                name: 'Qwen Coder',
                baseUrl: 'https://allmodels.revangeapi.workers.dev',
                endpoints: {
                    chat: '/revangeapi/qwen3-coder/chat'
                },
                rateLimit: {
                    requests: 30,
                    window: 60000
                },
                timeout: 15000,
                retries: 2
            },

            kimi: {
                name: 'Moonshot Kimi',
                baseUrl: 'https://allmodels.revangeapi.workers.dev',
                endpoints: {
                    chat: '/revangeapi/moonshotai-Kimi-K2-Instruct/chat'
                },
                rateLimit: {
                    requests: 30,
                    window: 60000
                },
                timeout: 15000,
                retries: 2
            },

            llama: {
                name: 'Llama AI',
                baseUrl: 'https://laama.revangeapi.workers.dev',
                endpoints: {
                    chat: '/chat'
                },
                rateLimit: {
                    requests: 30,
                    window: 60000
                },
                timeout: 15000,
                retries: 2
            },

            // Translation Services
            translator: {
                name: 'AI Translator',
                baseUrl: 'https://sheikhhridoy.nagad.my.id',
                endpoints: {
                    translate: '/api/AI-translator.php'
                },
                rateLimit: {
                    requests: 100,
                    window: 60000
                },
                timeout: 10000,
                retries: 2
            },

            translatorDara: {
                name: 'Master Dara Translator',
                baseUrl: 'https://hs-translate-text.vercel.app',
                endpoints: {
                    translate: '/'
                },
                rateLimit: {
                    requests: 100,
                    window: 60000
                },
                timeout: 10000,
                retries: 2
            },

            // Search Services
            googleSearch: {
                name: 'Google Search API',
                baseUrl: 'https://googlesearchapi.nepcoderapis.workers.dev',
                endpoints: {
                    search: '/'
                },
                rateLimit: {
                    requests: 100,
                    window: 60000
                },
                timeout: 15000,
                retries: 2
            },

            // Weather Services
            weather: {
                name: 'Weather API',
                baseUrl: 'https://weather.itz-ashlynn.workers.dev',
                endpoints: {
                    geoCity: '/geo-city',
                    searchCity: '/search-city',
                    hotCities: '/hot-cities',
                    translate: '/translate',
                    bgWeather: '/bg-weather',
                    allWeather: '/all-weather'
                },
                rateLimit: {
                    requests: 200,
                    window: 60000
                },
                timeout: 10000,
                retries: 2
            },

            // Media Services
            youtubeTranscribe: {
                name: 'YouTube Transcribe',
                baseUrl: 'https://api.hazex.sbs',
                endpoints: {
                    transcribe: '/yt-transcribe'
                },
                rateLimit: {
                    requests: 20,
                    window: 60000
                },
                timeout: 60000, // YouTube processing can take longer
                retries: 2
            },

            youtubeSummarizer: {
                name: 'YouTube Summarizer',
                baseUrl: 'https://api.hazex.sbs',
                endpoints: {
                    summarize: '/yt-summarizer'
                },
                rateLimit: {
                    requests: 20,
                    window: 60000
                },
                timeout: 60000,
                retries: 2
            },

            imageToPdf: {
                name: 'Image to PDF',
                baseUrl: 'https://anshimagetopdfapi.onrender.com',
                endpoints: {
                    convert: '/anshapi/imagetopdf'
                },
                rateLimit: {
                    requests: 50,
                    window: 60000
                },
                timeout: 30000,
                retries: 2
            },

            // Phone Services
            truecaller: {
                name: 'Truecaller',
                baseUrl: 'https://truecaller.privates-bots.workers.dev',
                endpoints: {
                    lookup: '/'
                },
                rateLimit: {
                    requests: 50,
                    window: 60000
                },
                timeout: 10000,
                retries: 2
            },

            phoneInfo: {
                name: 'Phone Info API',
                baseUrl: 'https://api.yabes-desu.workers.dev',
                endpoints: {
                    info: '/tools/phone-info'
                },
                rateLimit: {
                    requests: 100,
                    window: 60000
                },
                timeout: 10000,
                retries: 2
            },

            // Text-to-Speech Services
            tts: {
                name: 'Text-to-Speech',
                baseUrl: 'https://api.streamelements.com',
                endpoints: {
                    speech: '/kappa/v2/speech'
                },
                rateLimit: {
                    requests: 100,
                    window: 60000
                },
                timeout: 15000,
                retries: 2,
                voices: [
                    'Salli', 'Matthew', 'Joanna', 'Ivy', 'Justin', 'Kendra', 'Kimberly',
                    'Amy', 'Brian', 'Emma', 'Russell', 'Nicole', 'Joey', 'Raveena',
                    'Aditi', 'Geraint', 'Conchita', 'Enrique', 'Miguel', 'Penelope',
                    'Chantal', 'Celine', 'Mathieu', 'Dora', 'Karl', 'Carla', 'Giorgio',
                    'Mizuki', 'Takumi', 'Seoyeon', 'Liv', 'Lotte', 'Ruben', 'Ewa',
                    'Jacek', 'Jan', 'Maja', 'Ricardo', 'Vitoria', 'Cristiano', 'Ines',
                    'Carmen', 'Maxim', 'Tatyana', 'Astrid', 'Filiz'
                ]
            },

            // Utility Services
            instagramReset: {
                name: 'Instagram Password Reset',
                baseUrl: 'https://passreset.ziddi.workers.dev',
                endpoints: {
                    reset: '/api/reset'
                },
                rateLimit: {
                    requests: 10,
                    window: 60000
                },
                timeout: 10000,
                retries: 1
            }
        };
    }

    /**
     * Get configuration for a specific service
     */
    getConfig(serviceName) {
        const config = this.configs[serviceName];
        if (!config) {
            throw new Error(`Unknown service: ${serviceName}`);
        }
        return { ...config }; // Return a copy to prevent modification
    }

    /**
     * Get all available services
     */
    getAvailableServices() {
        return Object.keys(this.configs);
    }

    /**
     * Get services by category
     */
    getServicesByCategory() {
        return {
            ai: ['gemini', 'openai', 'deepseek', 'claude', 'qwen', 'kimi', 'llama'],
            translation: ['translator', 'translatorDara'],
            search: ['googleSearch'],
            weather: ['weather'],
            media: ['youtubeTranscribe', 'youtubeSummarizer', 'imageToPdf'],
            phone: ['truecaller', 'phoneInfo'],
            audio: ['tts'],
            utility: ['instagramReset']
        };
    }

    /**
     * Validate service configuration
     */
    validateServiceConfig(serviceName) {
        const config = this.getConfig(serviceName);
        const issues = [];

        if (!config.baseUrl) {
            issues.push('Missing baseUrl');
        }

        if (!config.endpoints || Object.keys(config.endpoints).length === 0) {
            issues.push('Missing endpoints');
        }

        if (config.apiKey === undefined && ['gemini', 'openai'].includes(serviceName)) {
            issues.push('Missing API key for authenticated service');
        }

        return {
            valid: issues.length === 0,
            issues: issues
        };
    }

    /**
     * Get full endpoint URL
     */
    getEndpointUrl(serviceName, endpointName) {
        const config = this.getConfig(serviceName);
        const endpoint = config.endpoints[endpointName];
        
        if (!endpoint) {
            throw new Error(`Unknown endpoint '${endpointName}' for service '${serviceName}'`);
        }

        return config.baseUrl + endpoint;
    }

    /**
     * Update API key for a service
     */
    updateApiKey(serviceName, apiKey) {
        if (this.configs[serviceName]) {
            this.configs[serviceName].apiKey = apiKey;
            return true;
        }
        return false;
    }

    /**
     * Get service health status
     */
    getServiceHealth() {
        const health = {};
        
        for (const serviceName of this.getAvailableServices()) {
            const validation = this.validateServiceConfig(serviceName);
            health[serviceName] = {
                name: this.configs[serviceName].name,
                status: validation.valid ? 'healthy' : 'warning',
                issues: validation.issues
            };
        }

        return health;
    }
}

module.exports = new APIConfig();

