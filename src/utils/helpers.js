const crypto = require('crypto');

class Helpers {
    static generateId() {
        return crypto.randomBytes(16).toString('hex');
    }

    static formatPhoneNumber(phoneNumber) {
        // Remove all non-digit characters except +
        let cleaned = phoneNumber.replace(/[^\d+]/g, '');
        
        // Add + if not present and number doesn't start with it
        if (!cleaned.startsWith('+')) {
            cleaned = '+' + cleaned;
        }
        
        return cleaned;
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + '...';
    }

    static formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    static extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }

    static sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }
        
        // Remove potentially harmful characters
        return input
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    }

    static formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    static generateRandomString(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    static parseCommand(message) {
        const parts = message.trim().split(' ');
        return {
            command: parts[0].toLowerCase(),
            args: parts.slice(1).join(' '),
            argArray: parts.slice(1)
        };
    }

    static escapeMarkdown(text) {
        return text.replace(/[*_`~]/g, '\\$&');
    }

    static unescapeMarkdown(text) {
        return text.replace(/\\([*_`~])/g, '$1');
    }

    static isNumeric(str) {
        return !isNaN(str) && !isNaN(parseFloat(str));
    }

    static capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    static retry(fn, maxRetries = 3, delay = 1000) {
        return new Promise((resolve, reject) => {
            let retries = 0;
            
            const attempt = () => {
                fn()
                    .then(resolve)
                    .catch(error => {
                        retries++;
                        if (retries >= maxRetries) {
                            reject(error);
                        } else {
                            setTimeout(attempt, delay * retries);
                        }
                    });
            };
            
            attempt();
        });
    }
}

module.exports = Helpers;

