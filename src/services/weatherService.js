const apiManager = require('./apiManager');
const apiConfig = require('../config/apiConfig');
const logger = require('../utils/logger');

/**
 * Weather Service for weather information and city data
 * Provides comprehensive weather and location services
 */
class WeatherService {
    constructor() {
        this.defaultLocale = 'en';
        this.supportedLocales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar'];
    }

    /**
     * Get weather by city name
     * @param {string} cityName - Name of the city
     * @param {string} locale - Language locale
     * @returns {Promise<Object>} Weather information
     */
    async getWeatherByCity(cityName, locale = this.defaultLocale) {
        try {
            // First, search for the city to get coordinates
            const cityResult = await this.searchCity(cityName, locale);
            
            if (!cityResult.success || cityResult.cities.length === 0) {
                throw new Error(`City "${cityName}" not found`);
            }

            const city = cityResult.cities[0];
            
            // Get weather using coordinates
            return await this.getWeatherByCoordinates(city.lat, city.lon, locale);

        } catch (error) {
            logger.error('Weather by city error:', error);
            return {
                success: false,
                error: error.message,
                cityName: cityName,
                service: 'Weather API'
            };
        }
    }

    /**
     * Get weather by coordinates
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {string} locale - Language locale
     * @returns {Promise<Object>} Weather information
     */
    async getWeatherByCoordinates(lat, lon, locale = this.defaultLocale) {
        try {
            // Validate coordinates
            if (!this.isValidCoordinate(lat, -90, 90) || !this.isValidCoordinate(lon, -180, 180)) {
                throw new Error('Invalid coordinates provided');
            }

            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('weather', 'allWeather'),
                method: 'GET',
                params: {
                    lat: lat,
                    lon: lon,
                    locale: locale,
                    key: 'weather' // Some APIs require a key parameter
                },
                serviceName: 'Weather API',
                cache: true,
                cacheTTL: 600000 // 10 minutes cache for weather data
            });

            if (response.success && response.data) {
                return this.formatWeatherResult(response.data, lat, lon, locale);
            }

            throw new Error('Invalid response from weather service');

        } catch (error) {
            logger.error('Weather by coordinates error:', error);
            return {
                success: false,
                error: error.message,
                coordinates: { lat, lon },
                service: 'Weather API'
            };
        }
    }

    /**
     * Search for cities
     * @param {string} cityName - Name of the city to search
     * @param {string} locale - Language locale
     * @returns {Promise<Object>} City search results
     */
    async searchCity(cityName, locale = this.defaultLocale) {
        try {
            if (!cityName || cityName.trim().length === 0) {
                throw new Error('City name cannot be empty');
            }

            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('weather', 'searchCity'),
                method: 'GET',
                params: {
                    q: cityName.trim(),
                    locale: locale
                },
                serviceName: 'Weather API - City Search',
                cache: true,
                cacheTTL: 3600000 // 1 hour cache for city searches
            });

            if (response.success && response.data) {
                return this.formatCitySearchResult(response.data, cityName, locale);
            }

            throw new Error('Invalid response from city search service');

        } catch (error) {
            logger.error('City search error:', error);
            return {
                success: false,
                error: error.message,
                cityName: cityName,
                service: 'Weather API - City Search'
            };
        }
    }

    /**
     * Get city by coordinates
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {string} locale - Language locale
     * @returns {Promise<Object>} City information
     */
    async getCityByCoordinates(lat, lon, locale = this.defaultLocale) {
        try {
            // Validate coordinates
            if (!this.isValidCoordinate(lat, -90, 90) || !this.isValidCoordinate(lon, -180, 180)) {
                throw new Error('Invalid coordinates provided');
            }

            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('weather', 'geoCity'),
                method: 'GET',
                params: {
                    lat: lat,
                    lon: lon,
                    locale: locale
                },
                serviceName: 'Weather API - Geo City',
                cache: true,
                cacheTTL: 3600000 // 1 hour cache for geo lookups
            });

            if (response.success && response.data) {
                return this.formatGeoCityResult(response.data, lat, lon, locale);
            }

            throw new Error('Invalid response from geo city service');

        } catch (error) {
            logger.error('Geo city error:', error);
            return {
                success: false,
                error: error.message,
                coordinates: { lat, lon },
                service: 'Weather API - Geo City'
            };
        }
    }

    /**
     * Get trending/hot cities
     * @param {string} locale - Language locale
     * @returns {Promise<Object>} Hot cities list
     */
    async getHotCities(locale = this.defaultLocale) {
        try {
            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('weather', 'hotCities'),
                method: 'GET',
                params: {
                    locale: locale
                },
                serviceName: 'Weather API - Hot Cities',
                cache: true,
                cacheTTL: 1800000 // 30 minutes cache for hot cities
            });

            if (response.success && response.data) {
                return this.formatHotCitiesResult(response.data, locale);
            }

            throw new Error('Invalid response from hot cities service');

        } catch (error) {
            logger.error('Hot cities error:', error);
            return {
                success: false,
                error: error.message,
                locale: locale,
                service: 'Weather API - Hot Cities'
            };
        }
    }

    /**
     * Translate city information
     * @param {string} cityName - Name of the city
     * @param {string} targetLocale - Target language locale
     * @returns {Promise<Object>} Translated city information
     */
    async translateCityInfo(cityName, targetLocale) {
        try {
            if (!this.supportedLocales.includes(targetLocale)) {
                throw new Error(`Unsupported locale: ${targetLocale}`);
            }

            const response = await apiManager.makeRequest({
                url: apiConfig.getEndpointUrl('weather', 'translate'),
                method: 'GET',
                params: {
                    city: cityName,
                    locale: targetLocale
                },
                serviceName: 'Weather API - Translate',
                cache: true,
                cacheTTL: 3600000 // 1 hour cache for translations
            });

            if (response.success && response.data) {
                return {
                    success: true,
                    originalCity: cityName,
                    translatedCity: response.data.translatedCity || response.data.city || cityName,
                    targetLocale: targetLocale,
                    service: 'Weather API - Translate',
                    timestamp: new Date().toISOString()
                };
            }

            throw new Error('Invalid response from translation service');

        } catch (error) {
            logger.error('City translation error:', error);
            return {
                success: false,
                error: error.message,
                originalCity: cityName,
                targetLocale: targetLocale,
                service: 'Weather API - Translate'
            };
        }
    }

    /**
     * Validate coordinate value
     */
    isValidCoordinate(value, min, max) {
        return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
    }

    /**
     * Format weather result
     */
    formatWeatherResult(data, lat, lon, locale) {
        try {
            // Handle different response formats
            let weather = {};
            
            if (data.result) {
                weather = data.result;
            } else if (data.weather) {
                weather = data.weather;
            } else {
                weather = data;
            }

            return {
                success: true,
                location: {
                    lat: lat,
                    lon: lon,
                    city: weather.city || weather.location || 'Unknown',
                    country: weather.country || 'Unknown'
                },
                current: {
                    temperature: weather.temperature || weather.temp || 'N/A',
                    condition: weather.condition || weather.weather || 'N/A',
                    humidity: weather.humidity || 'N/A',
                    windSpeed: weather.windSpeed || weather.wind || 'N/A',
                    pressure: weather.pressure || 'N/A',
                    visibility: weather.visibility || 'N/A'
                },
                forecast: weather.forecast || [],
                locale: locale,
                service: 'Weather API',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Error formatting weather result:', error);
            return {
                success: false,
                error: 'Failed to format weather result',
                coordinates: { lat, lon }
            };
        }
    }

    /**
     * Format city search result
     */
    formatCitySearchResult(data, cityName, locale) {
        try {
            let cities = [];

            if (Array.isArray(data)) {
                cities = data;
            } else if (data.result && Array.isArray(data.result)) {
                cities = data.result;
            } else if (data.cities && Array.isArray(data.cities)) {
                cities = data.cities;
            }

            const formattedCities = cities.map((city, index) => ({
                id: city.id || index,
                name: city.name || city.city || `City ${index + 1}`,
                country: city.country || 'Unknown',
                state: city.state || city.region || null,
                lat: city.lat || city.latitude || null,
                lon: city.lon || city.longitude || null,
                population: city.population || null
            }));

            return {
                success: true,
                query: cityName,
                cities: formattedCities,
                totalResults: formattedCities.length,
                locale: locale,
                service: 'Weather API - City Search',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Error formatting city search result:', error);
            return {
                success: false,
                error: 'Failed to format city search result',
                query: cityName
            };
        }
    }

    /**
     * Format geo city result
     */
    formatGeoCityResult(data, lat, lon, locale) {
        try {
            let cityInfo = {};

            if (data.result) {
                cityInfo = data.result;
            } else {
                cityInfo = data;
            }

            return {
                success: true,
                coordinates: { lat, lon },
                city: {
                    name: cityInfo.name || cityInfo.city || 'Unknown',
                    country: cityInfo.country || 'Unknown',
                    state: cityInfo.state || cityInfo.region || null,
                    timezone: cityInfo.timezone || null,
                    population: cityInfo.population || null
                },
                locale: locale,
                service: 'Weather API - Geo City',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Error formatting geo city result:', error);
            return {
                success: false,
                error: 'Failed to format geo city result',
                coordinates: { lat, lon }
            };
        }
    }

    /**
     * Format hot cities result
     */
    formatHotCitiesResult(data, locale) {
        try {
            let cities = [];

            if (Array.isArray(data)) {
                cities = data;
            } else if (data.result && Array.isArray(data.result)) {
                cities = data.result;
            } else if (data.cities && Array.isArray(data.cities)) {
                cities = data.cities;
            }

            const formattedCities = cities.map((city, index) => ({
                rank: index + 1,
                name: city.name || city.city || `City ${index + 1}`,
                country: city.country || 'Unknown',
                temperature: city.temperature || city.temp || 'N/A',
                condition: city.condition || city.weather || 'N/A'
            }));

            return {
                success: true,
                cities: formattedCities,
                totalCities: formattedCities.length,
                locale: locale,
                service: 'Weather API - Hot Cities',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Error formatting hot cities result:', error);
            return {
                success: false,
                error: 'Failed to format hot cities result',
                locale: locale
            };
        }
    }

    /**
     * Format weather for display
     */
    formatWeatherForDisplay(weatherResult) {
        if (!weatherResult.success) {
            return `❌ Weather lookup failed: ${weatherResult.error}`;
        }

        let response = `🌤️ *Weather Information*\n\n`;
        
        response += `📍 *Location:* ${weatherResult.location.city}, ${weatherResult.location.country}\n`;
        response += `🌡️ *Temperature:* ${weatherResult.current.temperature}\n`;
        response += `☁️ *Condition:* ${weatherResult.current.condition}\n`;
        
        if (weatherResult.current.humidity !== 'N/A') {
            response += `💧 *Humidity:* ${weatherResult.current.humidity}\n`;
        }
        
        if (weatherResult.current.windSpeed !== 'N/A') {
            response += `💨 *Wind Speed:* ${weatherResult.current.windSpeed}\n`;
        }
        
        if (weatherResult.current.pressure !== 'N/A') {
            response += `🔽 *Pressure:* ${weatherResult.current.pressure}\n`;
        }
        
        if (weatherResult.forecast && weatherResult.forecast.length > 0) {
            response += `\n📅 *Forecast:*\n`;
            weatherResult.forecast.slice(0, 3).forEach((day, index) => {
                response += `Day ${index + 1}: ${day.condition || 'N/A'} - ${day.temperature || 'N/A'}\n`;
            });
        }
        
        response += `\n⏰ *Updated:* ${new Date(weatherResult.timestamp).toLocaleString()}`;
        
        return response;
    }

    /**
     * Get service status
     */
    async getServiceStatus() {
        const status = {
            weather: { available: false, responseTime: null },
            citySearch: { available: false, responseTime: null },
            geoCity: { available: false, responseTime: null }
        };

        // Test weather service
        try {
            const startTime = Date.now();
            const result = await this.getWeatherByCoordinates(40.7128, -74.0060); // New York
            status.weather.available = result.success;
            status.weather.responseTime = Date.now() - startTime;
            if (!result.success) {
                status.weather.error = result.error;
            }
        } catch (error) {
            status.weather.error = error.message;
        }

        // Test city search
        try {
            const startTime = Date.now();
            const result = await this.searchCity('London');
            status.citySearch.available = result.success;
            status.citySearch.responseTime = Date.now() - startTime;
            if (!result.success) {
                status.citySearch.error = result.error;
            }
        } catch (error) {
            status.citySearch.error = error.message;
        }

        // Test geo city
        try {
            const startTime = Date.now();
            const result = await this.getCityByCoordinates(51.5074, -0.1278); // London
            status.geoCity.available = result.success;
            status.geoCity.responseTime = Date.now() - startTime;
            if (!result.success) {
                status.geoCity.error = result.error;
            }
        } catch (error) {
            status.geoCity.error = error.message;
        }

        return status;
    }
}

module.exports = new WeatherService();

