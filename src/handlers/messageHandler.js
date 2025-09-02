const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const aiService = require('../services/aiService');
const CommandHandler = require('./commandHandler');

class MessageHandler {
    constructor(sock) {
        this.sock = sock;
        this.commandHandler = new CommandHandler(sock);
    }

    async handleMessage(msg) {
        try {
            // Skip own messages and group messages
            if (msg.key.fromMe || msg.key.remoteJid.includes('@g.us')) {
                return;
            }

            const remoteJid = msg.key.remoteJid;
            const phoneNumber = remoteJid.replace('@s.whatsapp.net', '');
            
            // Get or create user
            let user = await User.findByPhoneNumber(phoneNumber);
            if (!user) {
                user = await User.create(phoneNumber);
                if (!user) {
                    console.error('Failed to create user');
                    return;
                }
            }

            // Mark message as read
            await this.sock.readMessages([msg.key]);
            await this.sock.sendPresenceUpdate('composing', remoteJid);

            let response;
            let messageText = '';

            // Extract message text
            if (msg.message.conversation) {
                messageText = msg.message.conversation;
            } else if (msg.message.extendedTextMessage) {
                messageText = msg.message.extendedTextMessage.text;
            } else if (msg.message.imageMessage && msg.message.imageMessage.caption) {
                messageText = msg.message.imageMessage.caption;
            } else if (msg.message.documentMessage && msg.message.documentMessage.caption) {
                messageText = msg.message.documentMessage.caption;
            } else if (msg.message.audioMessage) {
                response = await this.handleAudioMessage(msg, user, remoteJid);
            } else if (msg.message.imageMessage) {
                response = await this.handleImageMessage(msg, user, remoteJid);
            } else if (msg.message.documentMessage) {
                response = await this.handleDocumentMessage(msg, user, remoteJid);
            }

            if (messageText) {
                response = await this.handleTextMessage(messageText, user, remoteJid);
            }

            if (response) {
                await this.sock.sendMessage(remoteJid, { text: response });
                
                // Save conversation if it's not a command
                if (!this.commandHandler.isCommand(messageText)) {
                    await Conversation.create(user.id, messageText, response, user.preferred_ai_model);
                }
            }

            await this.sock.sendPresenceUpdate('paused', remoteJid);

        } catch (error) {
            console.error('Message handling error:', error);
            await this.sock.sendMessage(msg.key.remoteJid, { 
                text: "❌ Sorry, I encountered an error processing your message. Please try again." 
            });
            await this.sock.sendPresenceUpdate('paused', msg.key.remoteJid);
        }
    }

    async handleTextMessage(messageText, user, remoteJid) {
        try {
            // Handle first-time username setup
            if (user.is_first_time && messageText.toLowerCase().startsWith('my name is')) {
                const username = messageText.substring(10).trim();
                if (username) {
                    await User.updateUsername(user.id, username);
                    return `✅ Nice to meet you, ${username}! 👋\n\n` +
                           `🤖 Now, please select your preferred AI model:\n\n` +
                           `• */model gemini* - Google Gemini AI (Recommended)\n` +
                           `• */model openai* - OpenAI ChatGPT\n` +
                           `• */model deepseek* - DeepSeek AI\n\n` +
                           `You can change this anytime using the */model* command.`;
                }
            }

            // Handle commands
            if (this.commandHandler.isCommand(messageText)) {
                return await this.commandHandler.handleCommand(messageText, user, remoteJid);
            }

            // Handle regular conversation
            if (user.is_first_time) {
                return `👋 Welcome! I'm your Advanced AI Assistant.\n\n` +
                       `Please start by telling me your name:\n` +
                       `Type: *My name is [Your Name]*\n\n` +
                       `Or type */start* to begin setup.`;
            }

            // Get AI response
            const context = await this.buildContext(user);
            const aiResponse = await aiService.getResponse(messageText, user.preferred_ai_model, context);
            
            return aiResponse;

        } catch (error) {
            console.error('Text message handling error:', error);
            return "❌ Sorry, I couldn't process your message. Please try again.";
        }
    }

    async handleAudioMessage(msg, user, remoteJid) {
        try {
            // Check if it's a transcription request
            const caption = msg.message.audioMessage.caption || '';
            if (caption.toLowerCase().includes('/transcribe')) {
                // Download and transcribe audio
                const audioBuffer = await this.downloadMedia(msg);
                if (audioBuffer) {
                    const transcriptionService = require('../services/transcriptionService');
                    const result = await transcriptionService.transcribeAudio(audioBuffer);
                    
                    if (result.success) {
                        return `🎤 *Audio Transcription*\n\n` +
                               `📝 *Text:* "${result.transcription}"\n` +
                               `🔧 *Service:* ${result.service}\n\n` +
                               `Would you like me to respond to this transcribed message?`;
                    } else {
                        return `❌ Transcription failed: ${result.error}`;
                    }
                }
            }

            return `🎤 *Audio Message Received*\n\n` +
                   `I can transcribe your audio message!\n` +
                   `Reply with */transcribe* to convert speech to text.`;

        } catch (error) {
            console.error('Audio message handling error:', error);
            return "❌ Sorry, I couldn't process the audio message.";
        }
    }

    async handleImageMessage(msg, user, remoteJid) {
        try {
            const caption = msg.message.imageMessage.caption || '';
            
            if (caption) {
                // If there's a caption, treat it as a text message with image context
                return await this.handleTextMessage(caption, user, remoteJid);
            }

            return `🖼️ *Image Received*\n\n` +
                   `I can analyze images! Send the image with a caption describing what you'd like me to do:\n\n` +
                   `• "Describe this image"\n` +
                   `• "What do you see in this picture?"\n` +
                   `• "Analyze this image"\n` +
                   `• Or ask any specific question about the image`;

        } catch (error) {
            console.error('Image message handling error:', error);
            return "❌ Sorry, I couldn't process the image.";
        }
    }

    async handleDocumentMessage(msg, user, remoteJid) {
        try {
            const caption = msg.message.documentMessage.caption || '';
            
            if (caption.toLowerCase().includes('/summary')) {
                // Download and summarize document
                const docBuffer = await this.downloadMedia(msg);
                if (docBuffer) {
                    const fileName = msg.message.documentMessage.fileName || 'document';
                    const fileContent = docBuffer.toString('utf-8'); // Simple text extraction
                    
                    const summary = await aiService.summarizeFile(fileContent, fileName);
                    return `📄 *Document Summary*\n\n` +
                           `📁 *File:* ${fileName}\n` +
                           `📝 *Summary:*\n${summary}`;
                }
            }

            return `📄 *Document Received*\n\n` +
                   `I can summarize documents!\n` +
                   `Reply with */summary* to get a summary of the document.`;

        } catch (error) {
            console.error('Document message handling error:', error);
            return "❌ Sorry, I couldn't process the document.";
        }
    }

    async downloadMedia(msg) {
        try {
            const buffer = await downloadMediaMessage(
                msg,
                'buffer',
                { 
                    logger: require('pino')({ level: 'silent' })
                }
            );
            return buffer;
        } catch (error) {
            console.error('Media download error:', error);
            return null;
        }
    }

    async buildContext(user) {
        try {
            // Get recent conversations for context
            const recentConversations = await Conversation.getRecentConversations(user.id, 3);
            
            if (recentConversations.length === 0) {
                return `User: ${user.username || 'User'}, AI Model: ${user.preferred_ai_model}`;
            }

            let context = `User: ${user.username || 'User'}, AI Model: ${user.preferred_ai_model}\n\nRecent conversation:\n`;
            
            recentConversations.reverse().forEach(conv => {
                context += `User: ${conv.message}\nAssistant: ${conv.response}\n\n`;
            });

            return context;
        } catch (error) {
            console.error('Context building error:', error);
            return `User: ${user.username || 'User'}, AI Model: ${user.preferred_ai_model}`;
        }
    }
}

module.exports = MessageHandler;