# 🚀 Installation Guide - Advanced WhatsApp AI Bot

## Prerequisites

Before installing the bot, ensure you have:

- **Node.js 18+** installed on your system
- **PostgreSQL database** (provided credentials or your own)
- **WhatsApp account** for bot connection
- **API Keys** for AI services (provided in .env file)

## Quick Installation

### 1. Extract and Navigate
```bash
# Extract the bot files to your desired directory
cd advanced-whatsapp-bot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
The `.env` file is already configured with your API keys and database credentials:
- Gemini AI API Key
- Database connection details
- Service endpoints

**Important:** Keep your `.env` file secure and never share it publicly.

### 4. Start the Bot
```bash
npm start
```

### 5. Connect WhatsApp
1. Open your browser and go to `http://localhost:3000`
2. Click "QR Code" to view the QR code
3. Open WhatsApp on your phone
4. Go to Settings → Linked Devices → Link a Device
5. Scan the QR code displayed in your browser

## Configuration Options

### Environment Variables (.env)
```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# AI API Keys
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key

# Service URLs
TTS_API_URL=https://api.streamelements.com/kappa/v2/speech
TRUECALLER_API_URL=https://truecaller.privates-bots.workers.dev/?q=

# Server Settings
PORT=3000
NODE_ENV=production
```

### Custom Port
To run on a different port:
```bash
PORT=8080 npm start
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify your DATABASE_URL in .env
   - Check if PostgreSQL server is accessible
   - Ensure firewall allows connections

2. **QR Code Not Showing**
   - Check if port 3000 is available
   - Try restarting the bot
   - Clear browser cache

3. **AI Responses Not Working**
   - Verify API keys in .env file
   - Check internet connection
   - Monitor console logs for errors

4. **Dependencies Installation Failed**
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

### Debug Mode
Run with detailed logging:
```bash
LOG_LEVEL=debug npm start
```

## Production Deployment

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start the bot with PM2
pm2 start index.js --name "whatsapp-bot"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t whatsapp-bot .
docker run -p 3000:3000 --env-file .env whatsapp-bot
```

### Environment Setup
For production, ensure:
- Set `NODE_ENV=production` in .env
- Use a process manager (PM2, Docker, etc.)
- Set up proper logging and monitoring
- Configure reverse proxy (nginx) if needed

## Security Considerations

1. **API Keys Protection**
   - Never commit .env file to version control
   - Use environment variables in production
   - Rotate API keys regularly

2. **Database Security**
   - Use SSL connections for database
   - Implement proper access controls
   - Regular backups

3. **Network Security**
   - Use HTTPS in production
   - Configure firewall rules
   - Monitor for suspicious activity

## Monitoring and Maintenance

### Health Checks
- Dashboard: `http://localhost:3000`
- Status API: `http://localhost:3000/status`
- Health endpoint: `http://localhost:3000/health`

### Log Monitoring
```bash
# View real-time logs with PM2
pm2 logs whatsapp-bot

# View specific log files
tail -f logs/app.log
```

### Database Maintenance
```sql
-- Check user count
SELECT COUNT(*) FROM users;

-- Check recent conversations
SELECT COUNT(*) FROM conversations WHERE created_at > NOW() - INTERVAL '24 hours';

-- Clean old conversations (optional)
DELETE FROM conversations WHERE created_at < NOW() - INTERVAL '30 days';
```

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review console logs for error details
3. Ensure all API keys are correctly configured
4. Verify database connectivity

For additional support, refer to the README.md file for detailed documentation.

---

**🎉 Congratulations! Your Advanced WhatsApp AI Bot is ready to use!**

