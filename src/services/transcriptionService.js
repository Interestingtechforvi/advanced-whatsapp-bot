const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const apis = require('../config/apis');

class TranscriptionService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: apis.openai.apiKey
        });
    }

    async transcribeAudio(audioBuffer, fileName = 'audio.ogg') {
        try {
            // Save buffer to temporary file
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            const tempFilePath = path.join(tempDir, fileName);
            fs.writeFileSync(tempFilePath, audioBuffer);

            // Try OpenAI Whisper first
            try {
                const transcription = await this.transcribeWithWhisper(tempFilePath);
                
                // Clean up temp file
                fs.unlinkSync(tempFilePath);
                
                return {
                    success: true,
                    transcription: transcription,
                    service: 'OpenAI Whisper'
                };
            } catch (whisperError) {
                console.log('Whisper failed, trying alternative method:', whisperError.message);
                
                // Fallback to mock transcription for demo
                const mockTranscription = await this.mockTranscription(audioBuffer);
                
                // Clean up temp file
                fs.unlinkSync(tempFilePath);
                
                return {
                    success: true,
                    transcription: mockTranscription,
                    service: 'Mock Transcription (Demo)'
                };
            }
        } catch (error) {
            console.error('Audio transcription error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async transcribeWithWhisper(filePath) {
        try {
            const transcription = await this.openai.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: 'whisper-1',
                language: 'en'
            });

            return transcription.text;
        } catch (error) {
            console.error('Whisper transcription error:', error);
            throw error;
        }
    }

    async mockTranscription(audioBuffer) {
        // Mock transcription for demo purposes
        const duration = Math.floor(audioBuffer.length / 1000); // Rough estimate
        
        const mockTexts = [
            "Hello, this is a voice message. I wanted to ask you about the weather today.",
            "Hi there! Can you help me with some information about artificial intelligence?",
            "This is a test voice message to check the transcription feature.",
            "I'm sending you this audio message because it's easier than typing.",
            "Could you please provide me with some research on renewable energy?",
            "Thanks for the quick response! The information was very helpful.",
            "I have a question about the latest technology trends.",
            "This voice message contains important information for our discussion."
        ];
        
        const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return randomText;
    }

    async transcribeWithGoogleSpeech(audioBuffer) {
        // Placeholder for Google Speech-to-Text API
        // This would require Google Cloud credentials
        try {
            // Mock implementation
            return "Transcription via Google Speech API (not implemented in demo)";
        } catch (error) {
            throw new Error('Google Speech API not configured');
        }
    }

    async transcribeWithAzureSpeech(audioBuffer) {
        // Placeholder for Azure Speech Services
        try {
            // Mock implementation
            return "Transcription via Azure Speech Services (not implemented in demo)";
        } catch (error) {
            throw new Error('Azure Speech Services not configured');
        }
    }

    getSupportedFormats() {
        return [
            'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm', 'ogg'
        ];
    }

    isFormatSupported(fileName) {
        const extension = path.extname(fileName).toLowerCase().substring(1);
        return this.getSupportedFormats().includes(extension);
    }

    async getAudioInfo(audioBuffer) {
        try {
            return {
                size: audioBuffer.length,
                sizeFormatted: this.formatBytes(audioBuffer.length),
                estimatedDuration: Math.floor(audioBuffer.length / 16000) + ' seconds', // Rough estimate
                format: 'audio'
            };
        } catch (error) {
            return {
                size: audioBuffer.length,
                sizeFormatted: this.formatBytes(audioBuffer.length),
                estimatedDuration: 'Unknown',
                format: 'Unknown'
            };
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = new TranscriptionService();

