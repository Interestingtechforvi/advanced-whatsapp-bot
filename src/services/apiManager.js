const fetch = require('node-fetch');
const logger = require('../utils/logger');

/**
 * Centralized API Manager for handling all external API integrations
 * Provides consistent error handling, retry logic, and response validation
 */
class APIManager {
    constructor() {
        this.cache = new Map();
        this.rateLimits = new Map();
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000
        };
    }

    /**
     * Make a standardized API request with built-in error handling and retry logic
     * @param {Object} config - Request configuration
     * @param {string} config.url - API endpoint URL
     * @param {string} config.method - HTTP method (GET, POST, etc.)
     * @param {Object} config.headers - Request headers
     * @param {Object|string} config.body - Request body
     * @param {Object} config.params - URL parameters
     * @param {boolean} config.cache - Whether to cache the response
     * @param {number} config.cacheTTL - Cache time-to-live in milliseconds
     * @param {string} config.serviceName - Name of the service for logging
     * @returns {Promise<Object>} Standardized response object
     */
    async makeRequest(config) {
        const {
            url,
            method = 'GET',
            headers = {},
            body = null,
            params = {},
            cache = false,
            cacheTTL = 300000, // 5 minutes default
            serviceName = 'Unknown'
        } = config;

        try {
            // Build URL with parameters
            const requestUrl = this.buildUrl(url, params);
            const cacheKey = this.generateCacheKey(requestUrl, method, body);

            // Check cache first
            if (cache && method === 'GET') {
                const cachedResponse = this.getFromCache(cacheKey);
                if (cachedResponse) {
                    logger.info(`Cache hit for ${serviceName}: ${requestUrl}`);
                    return cachedResponse;
                }
            }

            // Check rate limits
            if (this.isRateLimited(serviceName)) {
                throw new Error(`Rate limit exceeded for ${serviceName}`);
            }

            // Make request with retry logic
            const response = await this.makeRequestWithRetry({
                url: requestUrl,
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'WhatsApp-AI-Bot/2.0',
                    ...headers
                },
                body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null
            }, serviceName);

            // Validate and parse response
            const result = await this.validateAndParseResponse(response, serviceName);

            // Cache successful responses
            if (cache && result.success && method === 'GET') {
                this.setCache(cacheKey, result, cacheTTL);
            }

            return result;

        } catch (error) {
            logger.error(`API request failed for ${serviceName}:`, error);
            return {
                success: false,
                error: error.message,
                service: serviceName,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Make request with exponential backoff retry logic
     */
    async makeRequestWithRetry(requestConfig, serviceName, attempt = 1) {
        try {
            const response = await fetch(requestConfig.url, {
                method: requestConfig.method,
                headers: requestConfig.headers,
                body: requestConfig.body
            });

            return response;

        } catch (error) {
            if (attempt >= this.retryConfig.maxRetries) {
                throw error;
            }

            const delay = Math.min(
                this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
                this.retryConfig.maxDelay
            );

            logger.warn(`Request failed for ${serviceName}, retrying in ${delay}ms (attempt ${attempt}/${this.retryConfig.maxRetries})`);
            
            await this.sleep(delay);
            return this.makeRequestWithRetry(requestConfig, serviceName, attempt + 1);
        }
    }

    /**
     * Validate and parse API response
     */
    async validateAndParseResponse(response, serviceName) {
        try {
            // Check if response is ok
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            // Get content type
            const contentType = response.headers.get('content-type') || '';

            // Handle different content types
            if (contentType.includes('application/json')) {
                const data = await response.json();
                return {
                    success: true,
                    data: data,
                    service: serviceName,
                    timestamp: new Date().toISOString()
                };
            } else if (contentType.includes('text/')) {
                const text = await response.text();
                
                // Try to parse as JSON if it looks like JSON
                if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                    try {
                        const data = JSON.parse(text);
                        return {
                            success: true,
                            data: data,
                            service: serviceName,
                            timestamp: new Date().toISOString()
                        };
                    } catch (parseError) {
                        // If JSON parsing fails, return as text
                        return {
                            success: true,
                            data: { text: text },
                            service: serviceName,
                            timestamp: new Date().toISOString()
                        };
                    }
                }

                return {
                    success: true,
                    data: { text: text },
                    service: serviceName,
                    timestamp: new Date().toISOString()
                };
            } else {
                // Handle binary or other content types
                const buffer = await response.buffer();
                return {
                    success: true,
                    data: { buffer: buffer, contentType: contentType },
                    service: serviceName,
                    timestamp: new Date().toISOString()
                };
            }

        } catch (error) {
            throw new Error(`Response parsing failed: ${error.message}`);
        }
    }

    /**
     * Build URL with query parameters
     */
    buildUrl(baseUrl, params) {
        if (!params || Object.keys(params).length === 0) {
            return baseUrl;
        }

        const url = new URL(baseUrl);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });

        return url.toString();
    }

    /**
     * Generate cache key for request
     */
    generateCacheKey(url, method, body) {
        const bodyStr = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
        return `${method}:${url}:${bodyStr}`;
    }

    /**
     * Get response from cache
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }
        
        if (cached) {
            this.cache.delete(key);
        }
        
        return null;
    }

    /**
     * Set response in cache
     */
    setCache(key, data, ttl) {
        this.cache.set(key, {
            data: data,
            expires: Date.now() + ttl
        });

        // Clean up expired cache entries periodically
        if (this.cache.size > 1000) {
            this.cleanupCache();
        }
    }

    /**
     * Clean up expired cache entries
     */
    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (value.expires <= now) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Check if service is rate limited
     */
    isRateLimited(serviceName) {
        const limit = this.rateLimits.get(serviceName);
        if (!limit) return false;

        return limit.resetTime > Date.now() && limit.requests >= limit.maxRequests;
    }

    /**
     * Set rate limit for service
     */
    setRateLimit(serviceName, maxRequests, windowMs) {
        this.rateLimits.set(serviceName, {
            maxRequests: maxRequests,
            requests: 0,
            resetTime: Date.now() + windowMs
        });
    }

    /**
     * Increment rate limit counter
     */
    incrementRateLimit(serviceName) {
        const limit = this.rateLimits.get(serviceName);
        if (limit) {
            if (limit.resetTime <= Date.now()) {
                limit.requests = 1;
                limit.resetTime = Date.now() + (limit.resetTime - (Date.now() - limit.resetTime));
            } else {
                limit.requests++;
            }
        }
    }

    /**
     * Sleep utility function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;

        for (const [key, value] of this.cache.entries()) {
            if (value.expires > now) {
                validEntries++;
            } else {
                expiredEntries++;
            }
        }

        return {
            totalEntries: this.cache.size,
            validEntries: validEntries,
            expiredEntries: expiredEntries
        };
    }

    /**
     * Clear all cache
     */
    clearCache() {
        this.cache.clear();
        logger.info('API cache cleared');
    }

    /**
     * Get rate limit status for all services
     */
    getRateLimitStatus() {
        const status = {};
        const now = Date.now();

        for (const [serviceName, limit] of this.rateLimits.entries()) {
            status[serviceName] = {
                requests: limit.requests,
                maxRequests: limit.maxRequests,
                resetTime: limit.resetTime,
                isLimited: limit.resetTime > now && limit.requests >= limit.maxRequests,
                timeUntilReset: Math.max(0, limit.resetTime - now)
            };
        }

        return status;
    }
}

module.exports = new APIManager();

