const User = require("../models/User");
const aiService = require("../services/aiService");
const ttsService = require("../services/ttsService");
const truecallerService = require("../services/truecallerService");
const researchService = require("../services/researchService");
const transcriptionService = require("../services/transcriptionService");
const apis = require("../config/apis");

class CommandHandler {
    constructor(sock) {
        this.sock = sock;
        this.commands = {
            "/start": this.handleStart.bind(this),
            "/help": this.handleHelp.bind(this),
            "/model": this.handleModelSelection.bind(this),
            "/voice": this.handleVoiceSelection.bind(this),
            "/tts": this.handleTextToSpeech.bind(this),
            "/research": this.handleResearch.bind(this),
            "/search": this.handleQuickSearch.bind(this),
            "/news": this.handleNews.bind(this),
            "/truecaller": this.handleTruecaller.bind(this),
            "/transcribe": this.handleTranscribe.bind(this),
            "/summary": this.handleSummary.bind(this),
            "/settings": this.handleSettings.bind(this),
            "/status": this.handleStatus.bind(this),
            "/generate_image": this.handleGenerateImage.bind(this)
        };
    }

    async handleCommand(message, user, remoteJid) {
        const parts = message.trim().split(" ");
        const command = parts[0].toLowerCase();
        const args = parts.slice(1).join(" ");

        if (this.commands[command]) {
            return await this.commands[command](args, user, remoteJid);
        }

        return null; // Not a command
    }

    async handleStart(args, user, remoteJid) {
        if (user.is_first_time) {
            return `🎉 *Welcome to Advanced AI ChatBot!*\n\n` +
                   `I'm your intelligent assistant with multiple AI models and advanced features.\n\n` +
                   `👤 *First, let's set up your profile:*\n` +
                   `Please tell me your name by typing: *My name is [Your Name]*\n\n` +
                   `🤖 *Available AI Models:*\n` +
                   `1. Gemini AI (Google)\n` +
                   `2. DeepSeek AI\n` +
                   `3. Claude AI\n` +
                   `4. Laama AI\n` +
                   `5. Moonshot AI\n` +
                   `6. Qwen3-Coder AI\n\n` +
                   `Type */model* to select your preferred AI model.\n\n` +
                   `Type */help* to see all available commands.`;
        } else {
            return `👋 Welcome back, ${user.username || "there"}!\n\n` +
                   `🤖 Current AI Model: *${user.preferred_ai_model}*\n\n` +
                   `Type */help* to see all available commands.`;
        }
    }

    async handleHelp(args, user, remoteJid) {
        return `🤖 *Advanced AI ChatBot - Commands*\n\n` +
               `*🎯 Basic Commands:*\n` +
               `• */start* - Initialize/restart bot\n` +
               `• */help* - Show this help menu\n` +
               `• */model* - Select AI model\n` +
               `• */settings* - View your settings\n` +
               `• */status* - Bot status\n\n` +
               `*🔊 Audio Commands:*\n` +
               `• */tts [text]* - Text to speech\n` +
               `• */voice* - Select TTS voice\n` +
               `• */transcribe* - Transcribe audio (reply to voice message)\n\n` +
               `*🔍 Research Commands:*\n` +
               `• */research [topic]* - Deep research\n` +
               `• */search [query]* - Quick web search\n` +
               `• */news [topic]* - Latest news\n\n` +
               `*🖼️ Image Commands:*\n` +
               `• */generate_image [prompt]* - Generate an image from text\n\n` +
               `*📱 Utility Commands:*\n` +
               `• */truecaller [number]* - Phone lookup\n` +
               `• */summary* - Summarize files (reply to document)\n\n` +
               `*💬 Chat:*\n` +
               `Just send any message for AI conversation!`;
    }

    async handleModelSelection(args, user, remoteJid) {
        if (!args) {
            return `🤖 *Select AI Model:*\n\n` +
                   `Current: *${user.preferred_ai_model}*\n\n` +
                   `Available models:\n` +
                   `• */model gemini* - Google Gemini AI\n` +
                   `• */model deepseek* - DeepSeek AI\n` +
                   `• */model claudeai* - Claude AI\n` +
                   `• */model laama* - Laama AI\n` +
                   `• */model moonshotai* - Moonshot AI\n` +
                   `• */model qwen3coder* - Qwen3-Coder AI`;
        }

        const model = args.toLowerCase();
        const validModels = ["gemini", "deepseek", "claudeai", "laama", "moonshotai", "qwen3coder"];

        if (!validModels.includes(model)) {
            return `❌ Invalid model. Choose from: ${validModels.join(", ")}`;
        }

        await User.updateAIModel(user.id, model);
        return `✅ AI model updated to: *${model}*`;
    }

    async handleVoiceSelection(args, user, remoteJid) {
        if (!args) {
            const voices = ttsService.getAvailableVoices().slice(0, 20); // Show first 20
            return `🔊 *Select TTS Voice:*\n\n` +
                   `Usage: */voice [voice_name]*\n\n` +
                   `Popular voices:\n` +
                   voices.map(voice => `• ${voice}`).join("\n") +
                   `\n\nType */voice [name]* to select.`;
        }

        const voice = args;
        const preferences = await User.getPreferences(user.id);
        
        if (preferences) {
            await User.updatePreferences(user.id, {
                ...preferences,
                tts_voice: voice
            });
            return `✅ TTS voice updated to: *${voice}*`;
        }

        return `❌ Failed to update voice preference.`;
    }

    async handleTextToSpeech(args, user, remoteJid) {
        if (!args) {
            return `🔊 *Text to Speech*\n\nUsage: */tts [your text]*\n\nExample: */tts Hello, how are you today?*`;
        }

        const preferences = await User.getPreferences(user.id);
        const voice = preferences?.tts_voice || "Salli";

        const result = await ttsService.generateSpeech(args, voice);

        if (result.success) {
            // Send the audio URL as a message
            return `🔊 *Text to Speech Generated*\n\n` +
                   `Voice: ${result.voice}\n` +
                   `Text: "${result.text}"\n\n` +
                   `🎵 Audio: ${result.audioUrl}`;
        } else {
            return `❌ TTS generation failed: ${result.error}`;
        }
    }

    async handleResearch(args, user, remoteJid) {
        if (!args) {
            return `🔍 *Deep Research*\n\nUsage: */research [topic]*\n\nExample: */research artificial intelligence trends 2024*`;
        }

        await this.sock.sendPresenceUpdate("composing", remoteJid);
        
        const result = await researchService.deepResearch(args, "medium");

        if (result.success) {
            return result.synthesis;
        } else {
            return `❌ Research failed: ${result.error}`;
        }
    }

    async handleQuickSearch(args, user, remoteJid) {
        if (!args) {
            return `🔍 *Quick Search*\n\nUsage: */search [query]*\n\nExample: */search latest technology news*`;
        }

        const result = await researchService.quickSearch(args);
        return result;
    }

    async handleNews(args, user, remoteJid) {
        const topic = args || "latest news";
        
        await this.sock.sendPresenceUpdate("composing", remoteJid);
        
        const result = await researchService.getNewsUpdates(topic);
        return result;
    }

    async handleTruecaller(args, user, remoteJid) {
        if (!args) {
            return `📞 *Truecaller Lookup*\n\nUsage: */truecaller [phone_number]*\n\nExample: */truecaller +1234567890*`;
        }

        if (!truecallerService.validatePhoneNumber(args)) {
            return `❌ Invalid phone number format. Please include country code.\n\nExample: +1234567890`;
        }

        await this.sock.sendPresenceUpdate("composing", remoteJid);
        
        const result = await truecallerService.lookupNumber(args);
        return truecallerService.formatLookupResult(result);
    }

    async handleTranscribe(args, user, remoteJid) {
        return `🎤 *Audio Transcription*\n\n` +
               `To transcribe audio:\n` +
               `1. Reply to a voice message with */transcribe*\n` +
               `2. Or send an audio file with the caption */transcribe*\n\n` +
               `Supported formats: MP3, WAV, OGG, M4A`;
    }

    async handleSummary(args, user, remoteJid) {
        return `📄 *File Summary*\n\n` +
               `To summarize a document:\n` +
               `1. Reply to a document with */summary*\n` +
               `2. Or send a file with the caption */summary*\n\n` +
               `Supported formats: PDF, DOC, TXT`;
    }

    async handleGenerateImage(args, user, remoteJid) {
        if (!args) {
            return `🖼️ *Image Generation*\n\nUsage: */generate_image [prompt]*\n\nExample: */generate_image a cat in space*`;
        }

        await this.sock.sendPresenceUpdate("composing", remoteJid);

        try {
            const imageUrl = await aiService.generateImage(args);
            if (imageUrl) {
                await this.sock.sendMessage(remoteJid, { image: { url: imageUrl }, caption: `🖼️ Here's your image for: "${args}"` });
                return ""; // Return empty string as message is sent via sendMessage
            } else {
                return "❌ Failed to generate image. Please try again.";
            }
        } catch (error) {
            console.error("Image generation command error:", error);
            return "❌ An error occurred during image generation. Please try again.";
        }
    }

    async handleSettings(args, user, remoteJid) {
        const preferences = await User.getPreferences(user.id);
        
        return `⚙️ *Your Settings*\n\n` +
               `👤 *Username:* ${user.username || "Not set"}\n` +
               `🤖 *AI Model:* ${user.preferred_ai_model}\n` +
               `🔊 *TTS Voice:* ${preferences?.tts_voice || "Salli"}\n` +
               `🌍 *Language:* ${preferences?.language || "en"}\n` +
               `🔍 *Research Depth:* ${preferences?.research_depth || "medium"}\n` +
               `📅 *Member Since:* ${new Date(user.created_at).toLocaleDateString()}\n\n` +
               `Use commands to update your preferences.`;
    }

    async handleStatus(args, user, remoteJid) {
        return `📊 *Bot Status*\n\n` +
               `✅ *Status:* Online\n` +
               `🤖 *AI Models:* Gemini, DeepSeek, Claude AI, Laama, Moonshot AI, Qwen3-Coder\n` +
               `🔊 *TTS:* Available\n` +
               `📞 *Truecaller:* Available\n` +
               `🔍 *Research:* Available\n` +
               `🎤 *Transcription:* Available\n` +
               `💾 *Database:* Connected\n` +
               `🖼️ *Image Generation:* Available\n\n` +
               `⏰ *Server Time:* ${new Date().toLocaleString()}`;
    }

    isCommand(message) {
        return message.trim().startsWith("/");
    }
}

module.exports = CommandHandler;


