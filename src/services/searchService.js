const apiManager = require('./apiManager');
const apiConfig = require('../config/apiConfig');
const logger = require('../utils/logger');

/**
 * Search Service for web search functionality
 * Provides comprehensive search capabilities with multiple sources
 */
class SearchService {
    constructor() {
        this.defaultResultCount = 10;
        this.maxResultCount = 50;
    }

    /**
     * Perform web search
     * @param {string} query - Search query
     * @param {number} numResults - Number of results to return
     * @returns {Promise<Object>} Search results
     */
    async searchWeb(query, numResults = this.defaultResultCount) {
        try {
            // Validate inputs
            if (!query || query.trim().length === 0) {
                throw new Error('Search query cannot be empty');
            }

            numResults = Math.min(numResults, this.maxResultCount);

            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('googleSearch', 'search'),
                method: 'GET',
                params: {
                    q: query.trim(),
                    num: numResults
                },
                serviceName: 'Google Search API',
                cache: true,
                cacheTTL: 1800000 // 30 minutes cache for search results
            });

            if (response.success && response.data) {
                return this.formatSearchResults(response.data, query, numResults);
            }

            throw new Error('Invalid response from search service');

        } catch (error) {
            logger.error('Web search error:', error);
            return {
                success: false,
                error: error.message,
                query: query,
                results: []
            };
        }
    }

    /**
     * Format search results into standardized format
     */
    formatSearchResults(data, query, requestedCount) {
        try {
            let results = [];

            // Handle different response formats
            if (Array.isArray(data)) {
                results = data;
            } else if (data.results && Array.isArray(data.results)) {
                results = data.results;
            } else if (data.items && Array.isArray(data.items)) {
                results = data.items;
            } else if (data.organic && Array.isArray(data.organic)) {
                results = data.organic;
            }

            // Standardize result format
            const formattedResults = results.slice(0, requestedCount).map((result, index) => ({
                rank: index + 1,
                title: result.title || result.name || `Result ${index + 1}`,
                url: result.url || result.link || result.href || '#',
                snippet: result.snippet || result.description || result.summary || 'No description available',
                displayUrl: this.extractDisplayUrl(result.url || result.link || result.href),
                source: 'Google Search'
            }));

            return {
                success: true,
                query: query,
                totalResults: formattedResults.length,
                requestedCount: requestedCount,
                results: formattedResults,
                timestamp: new Date().toISOString(),
                service: 'Google Search API'
            };

        } catch (error) {
            logger.error('Error formatting search results:', error);
            return {
                success: false,
                error: 'Failed to format search results',
                query: query,
                results: []
            };
        }
    }

    /**
     * Extract display URL from full URL
     */
    extractDisplayUrl(url) {
        try {
            if (!url || url === '#') return 'N/A';
            
            const urlObj = new URL(url);
            return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
        } catch (error) {
            return url || 'N/A';
        }
    }

    /**
     * Perform news search
     * @param {string} query - Search query
     * @param {number} numResults - Number of results to return
     * @returns {Promise<Object>} News search results
     */
    async searchNews(query, numResults = this.defaultResultCount) {
        try {
            // Add news-specific terms to the query
            const newsQuery = `${query} news latest updates`;
            
            const response = await this.searchWeb(newsQuery, numResults);
            
            if (response.success) {
                // Filter and prioritize news-related results
                const newsResults = response.results.filter(result => 
                    this.isNewsResult(result.title, result.snippet, result.url)
                );

                return {
                    ...response,
                    query: query,
                    originalQuery: newsQuery,
                    results: newsResults,
                    totalResults: newsResults.length,
                    type: 'news'
                };
            }

            return response;

        } catch (error) {
            logger.error('News search error:', error);
            return {
                success: false,
                error: error.message,
                query: query,
                results: [],
                type: 'news'
            };
        }
    }

    /**
     * Check if result appears to be news-related
     */
    isNewsResult(title, snippet, url) {
        const newsKeywords = [
            'news', 'breaking', 'latest', 'update', 'report', 'today',
            'yesterday', 'recent', 'current', 'live', 'developing'
        ];
        
        const newsUrls = [
            'cnn.com', 'bbc.com', 'reuters.com', 'ap.org', 'npr.org',
            'news.google.com', 'abcnews.go.com', 'cbsnews.com', 'nbcnews.com',
            'foxnews.com', 'washingtonpost.com', 'nytimes.com', 'wsj.com'
        ];

        const text = `${title} ${snippet}`.toLowerCase();
        const hasNewsKeywords = newsKeywords.some(keyword => text.includes(keyword));
        const isNewsUrl = newsUrls.some(domain => url.includes(domain));

        return hasNewsKeywords || isNewsUrl;
    }

    /**
     * Perform academic/research search
     * @param {string} query - Search query
     * @param {number} numResults - Number of results to return
     * @returns {Promise<Object>} Academic search results
     */
    async searchAcademic(query, numResults = this.defaultResultCount) {
        try {
            // Add academic-specific terms to the query
            const academicQuery = `${query} research paper study academic`;
            
            const response = await this.searchWeb(academicQuery, numResults);
            
            if (response.success) {
                // Filter and prioritize academic results
                const academicResults = response.results.filter(result => 
                    this.isAcademicResult(result.title, result.snippet, result.url)
                );

                return {
                    ...response,
                    query: query,
                    originalQuery: academicQuery,
                    results: academicResults,
                    totalResults: academicResults.length,
                    type: 'academic'
                };
            }

            return response;

        } catch (error) {
            logger.error('Academic search error:', error);
            return {
                success: false,
                error: error.message,
                query: query,
                results: [],
                type: 'academic'
            };
        }
    }

    /**
     * Check if result appears to be academic/research-related
     */
    isAcademicResult(title, snippet, url) {
        const academicKeywords = [
            'research', 'study', 'paper', 'journal', 'academic', 'university',
            'scholar', 'thesis', 'dissertation', 'publication', 'peer-reviewed'
        ];
        
        const academicUrls = [
            'scholar.google.com', 'pubmed.ncbi.nlm.nih.gov', 'arxiv.org',
            'jstor.org', 'researchgate.net', 'academia.edu', 'ieee.org',
            '.edu', 'springer.com', 'sciencedirect.com', 'nature.com'
        ];

        const text = `${title} ${snippet}`.toLowerCase();
        const hasAcademicKeywords = academicKeywords.some(keyword => text.includes(keyword));
        const isAcademicUrl = academicUrls.some(domain => url.includes(domain));

        return hasAcademicKeywords || isAcademicUrl;
    }

    /**
     * Get search suggestions
     * @param {string} query - Partial search query
     * @returns {Promise<Object>} Search suggestions
     */
    async getSearchSuggestions(query) {
        try {
            if (!query || query.trim().length < 2) {
                return {
                    success: true,
                    query: query,
                    suggestions: [],
                    message: 'Query too short for suggestions'
                };
            }

            // For now, generate simple suggestions based on common patterns
            // In a production system, you might want to use a dedicated suggestions API
            const suggestions = this.generateSuggestions(query.trim());

            return {
                success: true,
                query: query,
                suggestions: suggestions,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Search suggestions error:', error);
            return {
                success: false,
                error: error.message,
                query: query,
                suggestions: []
            };
        }
    }

    /**
     * Generate search suggestions
     */
    generateSuggestions(query) {
        const commonSuffixes = [
            'how to', 'what is', 'why does', 'when did', 'where is',
            'tutorial', 'guide', 'tips', 'best practices', 'examples',
            '2024', 'latest', 'news', 'review', 'comparison'
        ];

        const suggestions = [];
        
        // Add query with common suffixes
        commonSuffixes.forEach(suffix => {
            if (!query.toLowerCase().includes(suffix)) {
                suggestions.push(`${query} ${suffix}`);
            }
        });

        // Add query with common prefixes
        const commonPrefixes = ['how to', 'what is', 'best'];
        commonPrefixes.forEach(prefix => {
            if (!query.toLowerCase().startsWith(prefix)) {
                suggestions.push(`${prefix} ${query}`);
            }
        });

        return suggestions.slice(0, 8); // Return top 8 suggestions
    }

    /**
     * Get search service status
     */
    async getServiceStatus() {
        try {
            const testQuery = 'test search';
            const startTime = Date.now();
            
            const result = await this.searchWeb(testQuery, 1);
            const responseTime = Date.now() - startTime;

            return {
                available: result.success,
                responseTime: responseTime,
                service: 'Google Search API',
                lastChecked: new Date().toISOString(),
                error: result.success ? null : result.error
            };

        } catch (error) {
            return {
                available: false,
                responseTime: null,
                service: 'Google Search API',
                lastChecked: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Format search results for display
     */
    formatResultsForDisplay(searchResult, maxResults = 5) {
        if (!searchResult.success || !searchResult.results) {
            return `❌ Search failed: ${searchResult.error || 'Unknown error'}`;
        }

        if (searchResult.results.length === 0) {
            return `🔍 No results found for: "${searchResult.query}"`;
        }

        let response = `🔍 *Search Results for: ${searchResult.query}*\n\n`;
        
        const resultsToShow = searchResult.results.slice(0, maxResults);
        
        resultsToShow.forEach((result, index) => {
            response += `${index + 1}. *${result.title}*\n`;
            response += `   ${result.snippet}\n`;
            if (result.url !== '#') {
                response += `   🔗 ${result.displayUrl}\n`;
            }
            response += '\n';
        });

        if (searchResult.results.length > maxResults) {
            response += `... and ${searchResult.results.length - maxResults} more results\n\n`;
        }

        response += `⏰ *Search completed at:* ${new Date(searchResult.timestamp).toLocaleString()}`;
        
        return response;
    }
}

module.exports = new SearchService();

