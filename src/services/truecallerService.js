const fetch = require('node-fetch');
const apis = require('../config/apis');

class TruecallerService {
    async lookupNumber(phoneNumber) {
        try {
            // Clean and format phone number
            const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
            
            if (!cleanNumber || cleanNumber.length < 10) {
                return {
                    success: false,
                    error: 'Invalid phone number format'
                };
            }

            const url = `${apis.truecaller.apiUrl}${encodeURIComponent(cleanNumber)}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`Truecaller API error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data && data.data) {
                return {
                    success: true,
                    data: {
                        name: data.data.name || 'Unknown',
                        phoneNumber: cleanNumber,
                        carrier: data.data.carrier || 'Unknown',
                        location: data.data.location || 'Unknown',
                        countryCode: data.data.countryCode || 'Unknown',
                        type: data.data.type || 'Unknown',
                        spamScore: data.data.spamScore || 0,
                        tags: data.data.tags || []
                    }
                };
            } else {
                return {
                    success: false,
                    error: 'No information found for this number'
                };
            }
        } catch (error) {
            console.error('Truecaller lookup error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    formatLookupResult(result) {
        if (!result.success) {
            return `❌ Lookup failed: ${result.error}`;
        }

        const data = result.data;
        let message = `📞 *Phone Number Lookup*\n\n`;
        message += `📱 *Number:* ${data.phoneNumber}\n`;
        message += `👤 *Name:* ${data.name}\n`;
        message += `📡 *Carrier:* ${data.carrier}\n`;
        message += `📍 *Location:* ${data.location}\n`;
        message += `🌍 *Country:* ${data.countryCode}\n`;
        message += `📋 *Type:* ${data.type}\n`;
        
        if (data.spamScore > 0) {
            message += `⚠️ *Spam Score:* ${data.spamScore}/100\n`;
        }
        
        if (data.tags && data.tags.length > 0) {
            message += `🏷️ *Tags:* ${data.tags.join(', ')}\n`;
        }

        return message;
    }

    validatePhoneNumber(phoneNumber) {
        // Remove all non-digit characters except +
        const cleaned = phoneNumber.replace(/[^\d+]/g, '');
        
        // Check if it's a valid format
        const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10,14}$/;
        return phoneRegex.test(cleaned);
    }

    formatPhoneNumber(phoneNumber) {
        // Remove all non-digit characters except +
        let cleaned = phoneNumber.replace(/[^\d+]/g, '');
        
        // Add + if not present and number doesn't start with it
        if (!cleaned.startsWith('+')) {
            cleaned = '+' + cleaned;
        }
        
        return cleaned;
    }
}

module.exports = new TruecallerService();

