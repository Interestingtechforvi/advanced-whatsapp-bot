const fetch = require('node-fetch');
const apis = require('../config/apis');

class TTSService {
    async generateSpeech(text, voice = 'Salli') {
        try {
            // Validate voice
            if (!apis.tts.voices.includes(voice)) {
                voice = 'Salli'; // Default voice
            }

            // Limit text length for TTS
            if (text.length > 500) {
                text = text.substring(0, 500) + '...';
            }

            const url = `${apis.tts.apiUrl}?voice=${voice}&text=${encodeURIComponent(text)}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`TTS API error: ${response.status}`);
            }

            // Return the audio URL or buffer
            return {
                success: true,
                audioUrl: url,
                voice: voice,
                text: text
            };
        } catch (error) {
            console.error('TTS generation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getAvailableVoices() {
        return apis.tts.voices;
    }

    getVoicesByLanguage() {
        return {
            'en-US': ['Salli', 'Matthew', 'Joanna', 'Ivy', 'Justin', 'Kendra', 'Kimberly', 'Amy', 'Brian', 'Emma', 'Russell', 'Nicole', 'Joey'],
            'en-GB': ['Amy', 'Brian', 'Emma', 'Russell'],
            'en-AU': ['Nicole', 'Russell'],
            'es-ES': ['Conchita', 'Enrique'],
            'es-MX': ['Mia'],
            'fr-FR': ['Celine', 'Mathieu'],
            'fr-CA': ['Chantal'],
            'de-DE': ['Marlene', 'Hans'],
            'it-IT': ['Carla', 'Giorgio'],
            'pt-BR': ['Vitoria', 'Ricardo'],
            'ja-JP': ['Mizuki', 'Takumi'],
            'ko-KR': ['Seoyeon'],
            'zh-CN': ['Zhiyu'],
            'ar-XA': ['Zeina'],
            'hi-IN': ['Aditi', 'Raveena'],
            'tr-TR': ['Filiz'],
            'ru-RU': ['Tatyana', 'Maxim'],
            'pl-PL': ['Ewa', 'Jacek', 'Jan'],
            'nl-NL': ['Lotte', 'Ruben'],
            'sv-SE': ['Astrid'],
            'da-DK': ['Naja', 'Mads'],
            'no-NO': ['Liv'],
            'fi-FI': ['Suvi']
        };
    }

    async getVoiceInfo(voice) {
        const voicesByLang = this.getVoicesByLanguage();
        
        for (const [lang, voices] of Object.entries(voicesByLang)) {
            if (voices.includes(voice)) {
                return {
                    voice: voice,
                    language: lang,
                    available: true
                };
            }
        }
        
        return {
            voice: voice,
            language: 'unknown',
            available: false
        };
    }
}

module.exports = new TTSService();

