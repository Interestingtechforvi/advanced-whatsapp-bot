const fetch = require("node-fetch");
const apis = require("../config/apis");

class AIService {
    constructor() {
        // No OpenAI API key needed if not using OpenAI
    }

    async getResponse(message, model = "gemini", context = null) {
        try {
            switch (model.toLowerCase()) {
                case "gemini":
                    return await this.getGeminiResponse(message, context);
                case "deepseek":
                    return await this.getDeepSeekResponse(message);
                case "claudeai":
                    return await this.getPublicApiResponse(apis.claudeai.apiUrl, "prompt", message);
                case "laama":
                    return await this.getPublicApiResponse(apis.laama.apiUrl, "prompt", message);
                case "moonshotai":
                    return await this.getPublicApiResponse(apis.moonshotai.apiUrl, "prompt", message);
                case "qwen3coder":
                    return await this.getPublicApiResponse(apis.qwen3coder.apiUrl, "prompt", message);
                default:
                    return await this.getGeminiResponse(message, context);
            }
        } catch (error) {
            console.error(`Error getting ${model} response:`, error);
            return "Sorry, I\'m experiencing technical difficulties. Please try again.";
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
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
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
                throw new Error("Invalid Gemini API response");
            }
        } catch (error) {
            console.error("Gemini API error:", error);
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
                throw new Error("Invalid DeepSeek API response");
            }
        } catch (error) {
            console.error("DeepSeek API error:", error);
            throw error;
        }
    }

    async getPublicApiResponse(apiUrl, paramName, message) {
        try {
            const url = `${apiUrl}?${paramName}=${encodeURIComponent(message)}`;
            const response = await fetch(url);
            const data = await response.json();

            // Assuming a common structure for public API responses, adjust as needed
            if (data && data.response) {
                return data.response;
            } else if (data && data.result) {
                return data.result;
            } else if (data && data.output) {
                return data.output;
            } else if (data && data.answer) {
                return data.answer;
            } else if (data && data.text) {
                return data.text;
            } else if (data && data.image) { // For image generation APIs
                return data.image;
            } else {
                throw new Error(`Invalid API response from ${apiUrl}`);
            }
        } catch (error) {
            console.error(`Public API error (${apiUrl}):`, error);
            throw error;
        }
    }

    async generateImage(prompt) {
        try {
            const url = `${apis.imageGen.apiUrl}?prompt=${encodeURIComponent(prompt)}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data.image) {
                return data.image; // Assuming the API returns a direct image URL
            } else {
                throw new Error("Invalid image generation API response");
            }
        } catch (error) {
            console.error("Image generation error:", error);
            return "Sorry, I couldn\'t generate the image. Please try again.";
        }
    }

    async summarizeFile(fileContent, fileName) {
        try {
            const prompt = `Please summarize the following file content from "${fileName}":\n\n${fileContent}`;
            return await this.getGeminiResponse(prompt);
        } catch (error) {
            console.error("File summarization error:", error);
            return "Sorry, I couldn\'t summarize the file. Please try again.";
        }
    }

    async analyzeImage(imageUrl, prompt = "Describe this image") {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apis.gemini.apiKey}`;
            
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: "image/jpeg",
                                    data: imageUrl
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
                throw new Error("Invalid Gemini Vision API response");
            }
        } catch (error) {
            console.error("Image analysis error:", error);
            return "Sorry, I couldn\'t analyze the image. Please try again.";
        }
    }
}

module.exports = new AIService();


