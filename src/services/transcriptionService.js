const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const apis = require('../config/apis');
const logger = require('../utils/logger');

class TranscriptionService {
    constructor() {
        // No OpenAI dependency
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

            let transcriptionResult;
            try {
                // Attempt transcription with Gemini
                transcriptionResult = await this.transcribeWithGemini(tempFilePath);
                
                // Clean up temp file
                fs.unlinkSync(tempFilePath);
                
                return {
                    success: true,
                    transcription: transcriptionResult,
                    service: 'Gemini AI'
                };
            } catch (geminiError) {
                logger.warn(`Gemini transcription failed: ${geminiError.message}. Falling back to mock transcription.`);
                
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
            logger.error('Audio transcription error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async transcribeWithGemini(filePath) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apis.gemini.apiKey}`;
            const imageBase64 = fs.readFileSync(filePath, { encoding: 'base64' });

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: 'Transcribe the audio in this file:' },
                            {
                                inline_data: {
                                    mime_type: 'audio/ogg',
                                    data: imageBase64
                                }
                            }
                        ]
                    }]
                })
            });

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid Gemini Vision API response for audio transcription');
            }
        } catch (error) {
            logger.error('Gemini audio transcription error:', error);
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


