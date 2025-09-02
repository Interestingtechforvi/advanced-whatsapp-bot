const fetch = require('node-fetch');
const { OpenAI } = require('openai');
const apis = require('../config/apis');

class AIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: apis.openai.apiKey
        });
    }

    async getResponse(message, model = 'gemini', context = null) {
        try {
            switch (model.toLowerCase()) {
                case 'gemini':
                    return await this.getGeminiResponse(message, context);
                case 'openai':
                    return await this.getOpenAIResponse(message, context);
                case 'deepseek':
                    return await this.getDeepSeekResponse(message);
                default:
                    return await this.getGeminiResponse(message, context);
            }
        } catch (error) {
            console.error(`Error getting ${model} response:`, error);
            return "Sorry, I'm experiencing technical difficulties. Please try again.";
        }
    }

    async getGeminiResponse(message, context = null) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apis.gemini.apiKey}`;
            
            let prompt = message;
            if (context) {
                prompt = `Context: ${context}\n\nUser: ${message}`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid Gemini API response');
            }
        } catch (error) {
            console.error('Gemini API error:', error);
            throw error;
        }
    }

    async getOpenAIResponse(message, context = null) {
        try {
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

            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw error;
        }
    }

    async getDeepSeekResponse(message) {
        try {
            const url = `${apis.deepseek.apiUrl}${encodeURIComponent(message)}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.result) {
                return data.result;
            } else if (data && data.response) {
                return data.response;
            } else {
                throw new Error('Invalid DeepSeek API response');
            }
        } catch (error) {
            console.error('DeepSeek API error:', error);
            throw error;
        }
    }

    async summarizeFile(fileContent, fileName) {
        try {
            const prompt = `Please summarize the following file content from "${fileName}":\n\n${fileContent}`;
            return await this.getGeminiResponse(prompt);
        } catch (error) {
            console.error('File summarization error:', error);
            return "Sorry, I couldn't summarize the file. Please try again.";
        }
    }

    async analyzeImage(imageUrl, prompt = "Describe this image") {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apis.gemini.apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: "image/jpeg",
                                    data: Buffer.from(await (await fetch(imageUrl)).arrayBuffer()).toString("base64")
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
                throw new Error('Invalid Gemini Vision API response');
            }
        } catch (error) {
            console.error('Image analysis error:', error);
            return "Sorry, I couldn't analyze the image. Please try again.";
        }
    }
}

module.exports = new AIService();

