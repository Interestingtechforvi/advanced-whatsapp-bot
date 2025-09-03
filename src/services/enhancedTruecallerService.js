const apiManager = require('./apiManager');
const apiConfig = require('../config/apiConfig');
const logger = require('../utils/logger');

/**
 * Enhanced Truecaller Service using the new API Manager
 * Provides phone number lookup with proper error handling and validation
 */
class EnhancedTruecallerService {
    constructor() {
        this.phoneNumberPattern = /^\+?[1-9]\d{1,14}$/; // E.164 format
        this.countryCodePattern = /^\+\d{1,3}/;
    }

    /**
     * Lookup phone number information
     * @param {string} phoneNumber - Phone number to lookup (with country code)
     * @returns {Promise<Object>} Phone number information
     */
    async lookupPhoneNumber(phoneNumber) {
        try {
            // Validate and format phone number
            const formattedNumber = this.formatPhoneNumber(phoneNumber);
            if (!formattedNumber) {
                throw new Error('Invalid phone number format. Please include country code (e.g., +1234567890)');
            }

            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('truecaller', 'lookup'),
                method: 'GET',
                params: {
                    q: formattedNumber
                },
                serviceName: 'Truecaller',
                cache: true,
                cacheTTL: 1800000 // 30 minutes cache for phone lookups
            });

            if (response.success && response.data) {
                return this.formatTruecallerResult(response.data, formattedNumber);
            }

            throw new Error('Invalid response from Truecaller service');

        } catch (error) {
            logger.error('Truecaller lookup error:', error);
            return {
                success: false,
                error: error.message,
                phoneNumber: phoneNumber,
                service: 'Truecaller'
            };
        }
    }

    /**
     * Get phone information (device specs)
     * @param {string} phoneModel - Phone model to search
     * @returns {Promise<Object>} Phone specifications
     */
    async getPhoneInfo(phoneModel) {
        try {
            if (!phoneModel || phoneModel.trim().length === 0) {
                throw new Error('Phone model cannot be empty');
            }

            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('phoneInfo', 'info'),
                method: 'GET',
                params: {
                    query: phoneModel.trim(),
                    random: Date.now().toString() // Prevent caching issues
                },
                serviceName: 'Phone Info API',
                cache: true,
                cacheTTL: 86400000 // 24 hours cache for phone specs
            });

            if (response.success && response.data) {
                return this.formatPhoneInfoResult(response.data, phoneModel);
            }

            throw new Error('Invalid response from Phone Info service');

        } catch (error) {
            logger.error('Phone info lookup error:', error);
            return {
                success: false,
                error: error.message,
                phoneModel: phoneModel,
                service: 'Phone Info API'
            };
        }
    }

    /**
     * Format and validate phone number
     */
    formatPhoneNumber(phoneNumber) {
        try {
            if (!phoneNumber || typeof phoneNumber !== 'string') {
                return null;
            }

            // Remove all non-digit characters except +
            let cleaned = phoneNumber.replace(/[^\d+]/g, '');

            // Ensure it starts with +
            if (!cleaned.startsWith('+')) {
                // Try to add + if it looks like an international number
                if (cleaned.length >= 10) {
                    cleaned = '+' + cleaned;
                } else {
                    return null;
                }
            }

            // Validate format
            if (this.phoneNumberPattern.test(cleaned)) {
                return cleaned;
            }

            return null;

        } catch (error) {
            logger.error('Phone number formatting error:', error);
            return null;
        }
    }

    /**
     * Validate phone number format
     */
    isValidPhoneNumber(phoneNumber) {
        const formatted = this.formatPhoneNumber(phoneNumber);
        return formatted !== null;
    }

    /**
     * Extract country code from phone number
     */
    extractCountryCode(phoneNumber) {
        try {
            const formatted = this.formatPhoneNumber(phoneNumber);
            if (!formatted) return null;

            const match = formatted.match(this.countryCodePattern);
            return match ? match[0] : null;

        } catch (error) {
            logger.error('Country code extraction error:', error);
            return null;
        }
    }

    /**
     * Format Truecaller result
     */
    formatTruecallerResult(data, phoneNumber) {
        try {
            let result = {
                success: true,
                phoneNumber: phoneNumber,
                service: 'Truecaller',
                timestamp: new Date().toISOString()
            };

            // Handle different response formats
            if (data.data) {
                data = data.data;
            }

            // Extract basic information
            result.name = data.name || data.displayName || data.title || 'Unknown';
            result.carrier = data.carrier || data.operator || data.network || 'Unknown';
            result.location = data.location || data.address || data.city || 'Unknown';
            result.country = data.country || data.countryCode || 'Unknown';
            
            // Extract spam information
            result.spamScore = data.spamScore || data.spam_score || 0;
            result.isSpam = data.isSpam || data.spam || (result.spamScore > 50);
            result.spamType = data.spamType || data.spam_type || null;
            
            // Extract additional information
            result.phoneType = data.phoneType || data.type || 'Unknown';
            result.verified = data.verified || false;
            result.tags = data.tags || [];
            
            // Extract social media links if available
            result.socialMedia = {
                facebook: data.facebook || null,
                twitter: data.twitter || null,
                linkedin: data.linkedin || null
            };

            // Extract business information if available
            if (data.business || data.company) {
                result.business = {
                    name: data.business?.name || data.company?.name || null,
                    category: data.business?.category || data.company?.category || null,
                    website: data.business?.website || data.company?.website || null
                };
            }

            return result;

        } catch (error) {
            logger.error('Error formatting Truecaller result:', error);
            return {
                success: false,
                error: 'Failed to format Truecaller result',
                phoneNumber: phoneNumber,
                service: 'Truecaller'
            };
        }
    }

    /**
     * Format phone info result
     */
    formatPhoneInfoResult(data, phoneModel) {
        try {
            let result = {
                success: true,
                query: phoneModel,
                service: 'Phone Info API',
                timestamp: new Date().toISOString()
            };

            // Handle different response formats
            if (data.data) {
                data = data.data;
            }

            // Extract basic information
            result.name = data.name || data.model || data.title || 'Unknown';
            result.brand = data.brand || data.manufacturer || 'Unknown';
            result.price = data.price || data.cost || 'Unknown';
            result.releaseDate = data.releaseDate || data.release_date || data.launched || 'Unknown';
            
            // Extract specifications
            result.specifications = {};
            
            if (data.specs || data.specifications) {
                const specs = data.specs || data.specifications;
                
                result.specifications.display = specs.display || specs.screen || null;
                result.specifications.processor = specs.processor || specs.cpu || specs.chipset || null;
                result.specifications.memory = specs.memory || specs.ram || null;
                result.specifications.storage = specs.storage || specs.internal_storage || null;
                result.specifications.camera = specs.camera || specs.main_camera || null;
                result.specifications.battery = specs.battery || null;
                result.specifications.os = specs.os || specs.operating_system || null;
                result.specifications.network = specs.network || specs.connectivity || null;
            }

            // Extract images
            result.images = data.images || data.photos || [];
            
            // Extract ratings
            result.rating = data.rating || data.score || null;
            result.reviews = data.reviews || data.review_count || null;

            return result;

        } catch (error) {
            logger.error('Error formatting phone info result:', error);
            return {
                success: false,
                error: 'Failed to format phone info result',
                query: phoneModel,
                service: 'Phone Info API'
            };
        }
    }

    /**
     * Get country information from country code
     */
    getCountryInfo(countryCode) {
        const countries = {
            '+1': { name: 'United States/Canada', region: 'North America' },
            '+7': { name: 'Russia/Kazakhstan', region: 'Europe/Asia' },
            '+20': { name: 'Egypt', region: 'Africa' },
            '+27': { name: 'South Africa', region: 'Africa' },
            '+30': { name: 'Greece', region: 'Europe' },
            '+31': { name: 'Netherlands', region: 'Europe' },
            '+32': { name: 'Belgium', region: 'Europe' },
            '+33': { name: 'France', region: 'Europe' },
            '+34': { name: 'Spain', region: 'Europe' },
            '+36': { name: 'Hungary', region: 'Europe' },
            '+39': { name: 'Italy', region: 'Europe' },
            '+40': { name: 'Romania', region: 'Europe' },
            '+41': { name: 'Switzerland', region: 'Europe' },
            '+43': { name: 'Austria', region: 'Europe' },
            '+44': { name: 'United Kingdom', region: 'Europe' },
            '+45': { name: 'Denmark', region: 'Europe' },
            '+46': { name: 'Sweden', region: 'Europe' },
            '+47': { name: 'Norway', region: 'Europe' },
            '+48': { name: 'Poland', region: 'Europe' },
            '+49': { name: 'Germany', region: 'Europe' },
            '+51': { name: 'Peru', region: 'South America' },
            '+52': { name: 'Mexico', region: 'North America' },
            '+53': { name: 'Cuba', region: 'North America' },
            '+54': { name: 'Argentina', region: 'South America' },
            '+55': { name: 'Brazil', region: 'South America' },
            '+56': { name: 'Chile', region: 'South America' },
            '+57': { name: 'Colombia', region: 'South America' },
            '+58': { name: 'Venezuela', region: 'South America' },
            '+60': { name: 'Malaysia', region: 'Asia' },
            '+61': { name: 'Australia', region: 'Oceania' },
            '+62': { name: 'Indonesia', region: 'Asia' },
            '+63': { name: 'Philippines', region: 'Asia' },
            '+64': { name: 'New Zealand', region: 'Oceania' },
            '+65': { name: 'Singapore', region: 'Asia' },
            '+66': { name: 'Thailand', region: 'Asia' },
            '+81': { name: 'Japan', region: 'Asia' },
            '+82': { name: 'South Korea', region: 'Asia' },
            '+84': { name: 'Vietnam', region: 'Asia' },
            '+86': { name: 'China', region: 'Asia' },
            '+90': { name: 'Turkey', region: 'Europe/Asia' },
            '+91': { name: 'India', region: 'Asia' },
            '+92': { name: 'Pakistan', region: 'Asia' },
            '+93': { name: 'Afghanistan', region: 'Asia' },
            '+94': { name: 'Sri Lanka', region: 'Asia' },
            '+95': { name: 'Myanmar', region: 'Asia' },
            '+98': { name: 'Iran', region: 'Asia' }
        };

        return countries[countryCode] || { name: 'Unknown', region: 'Unknown' };
    }

    /**
     * Format Truecaller result for display
     */
    formatTruecallerForDisplay(truecallerResult) {
        if (!truecallerResult.success) {
            return `❌ Phone lookup failed: ${truecallerResult.error}`;
        }

        let response = `📞 *Phone Number Lookup*\n\n`;
        
        response += `📱 *Number:* ${truecallerResult.phoneNumber}\n`;
        response += `👤 *Name:* ${truecallerResult.name}\n`;
        response += `📡 *Carrier:* ${truecallerResult.carrier}\n`;
        response += `📍 *Location:* ${truecallerResult.location}\n`;
        response += `🌍 *Country:* ${truecallerResult.country}\n`;
        response += `📞 *Type:* ${truecallerResult.phoneType}\n`;
        
        if (truecallerResult.isSpam) {
            response += `⚠️ *Spam Warning:* Yes (Score: ${truecallerResult.spamScore}%)\n`;
            if (truecallerResult.spamType) {
                response += `🚫 *Spam Type:* ${truecallerResult.spamType}\n`;
            }
        } else {
            response += `✅ *Spam Status:* Clean\n`;
        }
        
        if (truecallerResult.verified) {
            response += `✅ *Verified:* Yes\n`;
        }
        
        if (truecallerResult.tags && truecallerResult.tags.length > 0) {
            response += `🏷️ *Tags:* ${truecallerResult.tags.join(', ')}\n`;
        }
        
        if (truecallerResult.business && truecallerResult.business.name) {
            response += `\n🏢 *Business Information:*\n`;
            response += `   Name: ${truecallerResult.business.name}\n`;
            if (truecallerResult.business.category) {
                response += `   Category: ${truecallerResult.business.category}\n`;
            }
            if (truecallerResult.business.website) {
                response += `   Website: ${truecallerResult.business.website}\n`;
            }
        }
        
        response += `\n⏰ *Lookup completed at:* ${new Date(truecallerResult.timestamp).toLocaleString()}`;
        
        return response;
    }

    /**
     * Format phone info for display
     */
    formatPhoneInfoForDisplay(phoneInfoResult) {
        if (!phoneInfoResult.success) {
            return `❌ Phone info lookup failed: ${phoneInfoResult.error}`;
        }

        let response = `📱 *Phone Information*\n\n`;
        
        response += `📱 *Model:* ${phoneInfoResult.name}\n`;
        response += `🏭 *Brand:* ${phoneInfoResult.brand}\n`;
        response += `💰 *Price:* ${phoneInfoResult.price}\n`;
        response += `📅 *Release Date:* ${phoneInfoResult.releaseDate}\n`;
        
        if (phoneInfoResult.rating) {
            response += `⭐ *Rating:* ${phoneInfoResult.rating}`;
            if (phoneInfoResult.reviews) {
                response += ` (${phoneInfoResult.reviews} reviews)`;
            }
            response += '\n';
        }
        
        if (phoneInfoResult.specifications && Object.keys(phoneInfoResult.specifications).length > 0) {
            response += `\n📋 *Specifications:*\n`;
            
            const specs = phoneInfoResult.specifications;
            if (specs.display) response += `   📺 Display: ${specs.display}\n`;
            if (specs.processor) response += `   🔧 Processor: ${specs.processor}\n`;
            if (specs.memory) response += `   💾 Memory: ${specs.memory}\n`;
            if (specs.storage) response += `   💿 Storage: ${specs.storage}\n`;
            if (specs.camera) response += `   📷 Camera: ${specs.camera}\n`;
            if (specs.battery) response += `   🔋 Battery: ${specs.battery}\n`;
            if (specs.os) response += `   💻 OS: ${specs.os}\n`;
            if (specs.network) response += `   📡 Network: ${specs.network}\n`;
        }
        
        response += `\n⏰ *Information retrieved at:* ${new Date(phoneInfoResult.timestamp).toLocaleString()}`;
        
        return response;
    }

    /**
     * Get service status
     */
    async getServiceStatus() {
        const status = {
            truecaller: { available: false, responseTime: null },
            phoneInfo: { available: false, responseTime: null }
        };

        // Test Truecaller service
        try {
            const startTime = Date.now();
            const testNumber = '+1234567890'; // Test number
            const result = await this.lookupPhoneNumber(testNumber);
            status.truecaller.available = result.success;
            status.truecaller.responseTime = Date.now() - startTime;
            if (!result.success) {
                status.truecaller.error = result.error;
            }
        } catch (error) {
            status.truecaller.error = error.message;
        }

        // Test Phone Info service
        try {
            const startTime = Date.now();
            const testModel = 'iPhone 15';
            const result = await this.getPhoneInfo(testModel);
            status.phoneInfo.available = result.success;
            status.phoneInfo.responseTime = Date.now() - startTime;
            if (!result.success) {
                status.phoneInfo.error = result.error;
            }
        } catch (error) {
            status.phoneInfo.error = error.message;
        }

        return status;
    }
}

module.exports = new EnhancedTruecallerService();

