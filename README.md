# 🤖 Advanced WhatsApp AI Bot

An enhanced WhatsApp AI chatbot with multi-model support, advanced APIs, and smart routing capabilities. Built with Node.js and powered by Google's Gemini AI.

## ✨ Features

### 🤖 Multi-AI Model Support
- **Google Gemini** - Advanced multimodal AI
- **ChatGPT-4** - OpenAI's GPT-4
- **Claude AI** - Anthropic's Claude
- **DeepSeek** - Advanced coding AI
- **Llama** - Meta's Llama model
- **Qwen3** - Specialized coding AI
- **Moonshot AI** - Kimi model

### 🎯 Core Capabilities
- 💬 **Text Conversations** - Intelligent chat with context awareness
- 🖼️ **Image Analysis** - AI-powered image description and analysis
- 📄 **PDF Processing** - Document text extraction and summarization
- 🎵 **Audio Transcription** - Convert speech to text
- 🔊 **Voice Responses** - Text-to-speech with multiple voices
- 🔍 **Web Search** - Google search integration
- 🌤️ **Weather Information** - Real-time weather data
- 🌐 **Translation** - Multi-language text translation
- 📹 **YouTube Processing** - Video transcription and summarization
- 📞 **Phone Lookup** - Truecaller integration
- 📱 **Device Specs** - Phone specifications lookup

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- WhatsApp account for bot
- API keys (configured in `config.json`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/advanced-whatsapp-bot.git
   cd advanced-whatsapp-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API keys**
   Edit `config.json` and add your API keys if needed.

4. **Start the bot**
   ```bash
   npm start
   ```

5. **Scan QR Code**
   Open http://localhost:3000/qr in your browser and scan the QR code with WhatsApp.

## 📱 Usage

### Basic Commands
- `/models` - View all available AI models
- `/model <name>` - Switch AI model (e.g., `/model gemini`)
- `/help` - Show detailed help
- `/transcribe` - Reply to audio messages to transcribe

### Smart Features
The bot automatically detects your intent:
- **"Translate hello to Spanish"** → Translation
- **"Weather in New York"** → Weather info
- **"Search for AI news"** → Web search
- **"+1234567890"** → Phone lookup
- Send **images** → AI analysis
- Send **PDFs** → Text extraction
- Send **audio** → Transcription

### Model Switching
```bash
/model gemini      # Google Gemini (default)
/model chatgpt4    # ChatGPT-4
/model claude      # Claude AI
/model deepseek    # DeepSeek
/model llama       # Llama
```

## 🔧 Configuration

### API Endpoints
All API endpoints are configured in `config.json`. The bot includes working endpoints for:
- Google Gemini AI
- Various AI model APIs
- Translation services
- Weather APIs
- Search engines
- YouTube processing
- Phone lookup services

### User Profiles
The bot maintains user preferences:
- Preferred AI model
- Language settings
- Voice preferences
- Enabled features

## 🧪 Testing

Run the test suite:
```bash
npm test
```

This will validate:
- Configuration loading
- API connectivity
- Core functionality

## 🌐 Web Dashboard

Access the web interface at:
- **Dashboard**: http://localhost:3000/
- **QR Code**: http://localhost:3000/qr
- **Configuration**: http://localhost:3000/config
- **API Status**: http://localhost:3000/api/status

## 📁 Project Structure

```
advanced-whatsapp-bot/
├── index.js                 # Main bot logic
├── gemini-config.js         # Gemini AI integration
├── api-manager.js           # External API management
├── response-handler.js      # Message routing & responses
├── config-manager.js        # Configuration management
├── audio-transcription.js   # Audio processing
├── media-processor.js       # Image/PDF processing
├── config.json              # API configurations
├── user_profiles.json       # User preferences
├── package.json             # Dependencies
├── test.js                  # Test suite
└── README.md               # This file
```

## 🔒 Security

- API keys are stored securely in configuration files
- Rate limiting prevents API abuse
- Input validation and sanitization
- WhatsApp authentication data is gitignored

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Credits

- **Created by**: Shaikh Juned
- **Website**: [shaikhjuned.co.in](https://shaikhjuned.co.in)
- **Powered by**: Google Gemini AI, various external APIs

## 🆘 Support

For issues or questions:
- Create an issue on GitHub
- Contact: shaikhjuned.co.in

---

**🎉 Your Advanced WhatsApp AI Bot is Ready!**

Start chatting with your AI assistant that can handle text, images, audio, PDFs, and much more!