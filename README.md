# 🤖 Advanced WhatsApp AI Bot - Node.js Edition

A powerful, feature-rich WhatsApp AI chatbot built with Node.js, featuring multiple AI models, comprehensive API system, and advanced integrations.

## ✨ Features

### 🤖 Multiple AI Models
- **Gemini AI** (Google) - Advanced conversational AI
- **ChatGPT-4** - Industry-leading language model  
- **DeepSeek AI** - Code-focused AI model
- **Claude AI** - Helpful and harmless AI assistant
- **Qwen3 Coder** - Specialized coding assistant
- **Moonshot AI** - Long context AI model
- **Laama Chat** - Open source alternative

### 🌐 Comprehensive API System
- **Translation Services** - Multi-language translation
- **Search & Research** - Web search capabilities
- **Weather Data** - Real-time weather information
- **Text-to-Speech** - Voice synthesis with multiple voices
- **Phone Lookup** - Truecaller integration
- **QR Code Generator** - Dynamic QR code creation
- **Utility Tools** - Password generator, hash generator, base64 encoder

### 📱 WhatsApp Integration
- Multi-device support
- Auto-reconnection
- Command system
- Media message handling
- Real-time status updates
- WebSocket dashboard

### 🛠️ Advanced Features
- RESTful API endpoints
- Real-time web dashboard
- Comprehensive logging
- Rate limiting
- Input validation
- Error handling
- Health monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- WhatsApp account
- Internet connection

### Installation

1. **Clone or extract the project:**
```bash
cd whatsapp-nodejs-api
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment (optional):**
```bash
cp .env.example .env
# Edit .env with your preferences
```

4. **Start the server:**
```bash
npm start
```

5. **Access the dashboard:**
   - Open http://localhost:3000
   - Scan QR code with WhatsApp to connect

## 📋 API Endpoints

### 🤖 AI Endpoints
```
GET/POST /ai/models                    - List available AI models
GET/POST /ai/chat/:model              - Chat with specific AI model
GET/POST /ai/compare                  - Compare multiple AI models
GET/POST /ai/smart                    - Smart model selection
POST     /ai/conversation             - Conversation with context
GET      /ai/health                   - AI models health check
```

### 🌐 General API Endpoints
```
GET      /api/list                    - List all available APIs
GET/POST /api/call/:apiName           - Generic API caller
GET/POST /api/chatgpt4                - ChatGPT-4 endpoint
GET/POST /api/translate               - Translation service
GET/POST /api/truecaller              - Phone lookup
GET/POST /api/search                  - Web search
GET/POST /api/weather/:endpoint       - Weather data
GET/POST /api/youtube/:action         - YouTube processing
GET/POST /api/tts                     - Text-to-speech
GET/POST /api/phone-info              - Phone specifications
GET/POST /api/image-to-pdf            - Image to PDF converter
GET/POST /api/instagram-reset         - Instagram password reset
```

### 📱 WhatsApp Endpoints
```
GET      /whatsapp/status              - Bot connection status
GET      /whatsapp/qr                  - QR code for connection
POST     /whatsapp/send                - Send message
POST     /whatsapp/broadcast           - Broadcast to multiple numbers
GET      /whatsapp/chats/:phoneNumber  - Get chat history
POST     /whatsapp/restart             - Restart bot connection
POST     /whatsapp/logout              - Logout and disconnect
GET      /whatsapp/info                - Bot information
POST     /whatsapp/webhook             - Webhook for integrations
```

### 🛠️ Utility Endpoints
```
GET      /utility/list                 - List available utilities
GET/POST /utility/qr-generator         - QR code generator
GET/POST /utility/url-shortener        - URL shortening service
GET/POST /utility/password-generator   - Password generator
GET/POST /utility/hash-generator       - Hash generator
GET/POST /utility/base64               - Base64 encoder/decoder
GET/POST /utility/json-formatter       - JSON formatter
GET/POST /utility/timestamp            - Timestamp converter
GET      /utility/system-info          - System information
GET      /utility/health               - Utility services health
```

## 💬 WhatsApp Commands

### Basic Commands
- `/start` - Welcome message and setup
- `/help` - Show all available commands
- `/status` - Bot status information

### AI Commands
- `/ai [model] [prompt]` - Chat with specific AI model
  - Example: `/ai gemini What is artificial intelligence?`
  - Models: gemini, chatgpt4, deepseek, claude, qwen3, moonshot, laama

### Utility Commands
- `/translate [text] [language]` - Translate text
- `/search [query]` - Web search
- `/weather [location]` - Weather information
- `/tts [text]` - Text-to-speech
- `/truecaller [number]` - Phone lookup
- `/qr [text]` - Generate QR code

### Usage Examples
```
/ai gemini Explain quantum computing
/translate Hello World es
/search latest AI news
/weather New York
/tts Hello, how are you today?
/truecaller +1234567890
/qr https://example.com
```

## 🔧 Configuration

### Environment Variables
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Admin Configuration (Optional)
ADMIN_NUMBER=+1234567890

# API Keys (Optional)
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key

# Features
ENABLE_GROUP_MESSAGES=false
ENABLE_MEDIA_PROCESSING=true
```

### API Configuration
The bot uses public APIs by default, but you can configure your own API keys for enhanced features:

- **Gemini AI**: Get API key from Google AI Studio
- **OpenAI**: Get API key from OpenAI Platform
- **Custom APIs**: Configure in `routes/api.js`

## 🏗️ Architecture

```
whatsapp-nodejs-api/
├── routes/
│   ├── api.js              # General API endpoints
│   ├── ai.js               # AI model endpoints
│   ├── whatsapp.js         # WhatsApp bot endpoints
│   └── utility.js          # Utility endpoints
├── services/
│   └── whatsappBot.js      # WhatsApp bot service
├── public/
│   └── index.html          # Web dashboard
├── auth_info_multi/        # WhatsApp session data
├── server.js               # Main server file
├── package.json            # Dependencies
└── .env                    # Environment variables
```

## 🌐 Web Dashboard

Access the comprehensive web dashboard at `http://localhost:3000`:

### Features:
- **Real-time Bot Status** - Connection status and uptime
- **QR Code Display** - For WhatsApp connection
- **API Testing** - Test any API endpoint
- **System Monitoring** - Memory, CPU, and performance metrics
- **Live Logs** - Real-time system logs
- **WebSocket Integration** - Live updates

### Dashboard Sections:
1. **Bot Status** - WhatsApp connection status
2. **QR Code** - Scan to connect WhatsApp
3. **API Services** - Available API services
4. **System Info** - Server performance metrics
5. **API Testing** - Interactive API testing tool
6. **System Logs** - Real-time logging

## 🔒 Security Features

- **Input Validation** - All inputs are validated
- **Rate Limiting** - Prevents API abuse
- **CORS Protection** - Cross-origin request security
- **Helmet Security** - Security headers
- **Error Handling** - Comprehensive error management
- **Group Message Filtering** - Security against spam

## 📊 Monitoring & Logging

### Health Checks
- **Bot Status** - WhatsApp connection health
- **API Status** - External API availability
- **System Health** - Server performance metrics

### Logging
- **Structured Logging** - JSON formatted logs
- **Real-time Logs** - Live log streaming
- **Error Tracking** - Comprehensive error logging

## 🚀 Deployment

### Local Development
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Production
```bash
npm start
```

### Render Deployment
1. Connect your GitHub repository to Render
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables in Render dashboard
5. Deploy!

### Environment Variables for Render:
```
NODE_ENV=production
PORT=3000
```

## 🔧 Troubleshooting

### Common Issues

1. **QR Code not showing**
   - Check if port 3000 is accessible
   - Restart the server: `npm start`
   - Check dashboard at http://localhost:3000

2. **Bot not responding**
   - Verify WhatsApp connection in dashboard
   - Check system logs for errors
   - Restart bot using dashboard or `/whatsapp/restart`

3. **API errors**
   - Check internet connection
   - Verify API endpoints are accessible
   - Check rate limiting status

4. **Memory issues**
   - Monitor system info in dashboard
   - Restart server if memory usage is high
   - Check for memory leaks in logs

### Debug Mode
```bash
LOG_LEVEL=debug npm start
```

## 📝 API Usage Examples

### Using cURL

#### Chat with AI:
```bash
curl "http://localhost:3000/ai/chat/gemini?prompt=Hello"
```

#### Translate text:
```bash
curl "http://localhost:3000/api/translate?text=Hello&target_language=es"
```

#### Search web:
```bash
curl "http://localhost:3000/api/search?query=AI+news"
```

#### Generate QR code:
```bash
curl "http://localhost:3000/utility/qr-generator?text=Hello+World"
```

### Using JavaScript (Fetch):
```javascript
// Chat with AI
const response = await fetch('/ai/chat/gemini?prompt=Hello');
const data = await response.json();
console.log(data.formatted_response);

// Send WhatsApp message
const sendResponse = await fetch('/whatsapp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        to: '+1234567890',
        message: 'Hello from bot!'
    })
});
```

## 🔄 Updates & Maintenance

### Version 2.0.0 Features:
- Complete Node.js rewrite
- Multiple AI model support
- Comprehensive API system
- Real-time web dashboard
- Enhanced security features
- WebSocket integration
- Improved error handling
- Better logging system

### Upcoming Features:
- Voice message transcription
- Image analysis capabilities
- Document processing
- Database integration
- User management system
- Analytics dashboard

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review dashboard logs for errors
- Ensure all dependencies are installed
- Verify internet connectivity

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 🙏 Acknowledgments

- **Baileys** - WhatsApp Web API
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **Various AI APIs** - AI model providers

---

**Made with ❤️ for the WhatsApp AI community**

🚀 **Ready to deploy on Render!** 🚀

