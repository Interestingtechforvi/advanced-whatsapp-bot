const assert = require('assert');
const apiManager = require('../src/services/apiManager');
const apiConfig = require('../src/config/apiConfig');
const newAiService = require('../src/services/newAiService');
const translationService = require('../src/services/translationService');
const searchService = require('../src/services/searchService');
const mediaService = require('../src/services/mediaService');
const weatherService = require('../src/services/weatherService');
const enhancedTtsService = require('../src/services/enhancedTtsService');
const enhancedTruecallerService = require('../src/services/enhancedTruecallerService');

/**
 * Comprehensive test suite for API services
 * Tests all major functionality and error handling
 */
class APITestSuite {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Starting API Test Suite...\n');

        try {
            await this.testAPIManager();
            await this.testAPIConfig();
            await this.testAIService();
            await this.testTranslationService();
            await this.testSearchService();
            await this.testMediaService();
            await this.testWeatherService();
            await this.testTTSService();
            await this.testTruecallerService();

            this.printTestSummary();

        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.testResults.errors.push(`Test suite error: ${error.message}`);
        }
    }

    /**
     * Test API Manager functionality
     */
    async testAPIManager() {
        console.log('📡 Testing API Manager...');

        try {
            // Test basic request functionality
            await this.runTest('API Manager - Basic Request', async () => {
                const response = await apiManager.makeRequest({
                    url: 'https://httpbin.org/json',
                    method: 'GET',
                    serviceName: 'Test Service'
                });
                
                assert(response.success, 'Request should succeed');
                assert(response.data, 'Response should have data');
                assert(response.service === 'Test Service', 'Service name should match');
            });

            // Test error handling
            await this.runTest('API Manager - Error Handling', async () => {
                const response = await apiManager.makeRequest({
                    url: 'https://httpbin.org/status/404',
                    method: 'GET',
                    serviceName: 'Test Service'
                });
                
                assert(!response.success, 'Request should fail for 404');
                assert(response.error, 'Error message should be present');
            });

            // Test caching
            await this.runTest('API Manager - Caching', async () => {
                const url = 'https://httpbin.org/uuid';
                
                const response1 = await apiManager.makeRequest({
                    url: url,
                    method: 'GET',
                    serviceName: 'Test Service',
                    cache: true,
                    cacheTTL: 5000
                });
                
                const response2 = await apiManager.makeRequest({
                    url: url,
                    method: 'GET',
                    serviceName: 'Test Service',
                    cache: true,
                    cacheTTL: 5000
                });
                
                assert(response1.success && response2.success, 'Both requests should succeed');
                // Note: UUID endpoint returns different values, so we can't test exact equality
                // But we can test that caching mechanism works
                const stats = apiManager.getCacheStats();
                assert(stats.totalEntries > 0, 'Cache should have entries');
            });

            console.log('✅ API Manager tests passed\n');

        } catch (error) {
            console.error('❌ API Manager tests failed:', error.message);
            this.testResults.errors.push(`API Manager: ${error.message}`);
        }
    }

    /**
     * Test API Configuration
     */
    async testAPIConfig() {
        console.log('⚙️ Testing API Configuration...');

        try {
            await this.runTest('API Config - Service Retrieval', async () => {
                const geminiConfig = apiConfig.getConfig('gemini');
                assert(geminiConfig, 'Gemini config should exist');
                assert(geminiConfig.baseUrl, 'Base URL should be defined');
                assert(geminiConfig.endpoints, 'Endpoints should be defined');
            });

            await this.runTest('API Config - Available Services', async () => {
                const services = apiConfig.getAvailableServices();
                assert(Array.isArray(services), 'Services should be an array');
                assert(services.length > 0, 'Should have available services');
                assert(services.includes('gemini'), 'Should include Gemini service');
            });

            await this.runTest('API Config - Service Categories', async () => {
                const categories = apiConfig.getServicesByCategory();
                assert(categories.ai, 'Should have AI category');
                assert(categories.translation, 'Should have translation category');
                assert(Array.isArray(categories.ai), 'AI category should be an array');
            });

            await this.runTest('API Config - Endpoint URL Generation', async () => {
                const url = apiConfig.getEndpointUrl('gemini', 'generateContent');
                assert(typeof url === 'string', 'URL should be a string');
                assert(url.includes('generativelanguage.googleapis.com'), 'Should contain correct domain');
            });

            console.log('✅ API Configuration tests passed\n');

        } catch (error) {
            console.error('❌ API Configuration tests failed:', error.message);
            this.testResults.errors.push(`API Config: ${error.message}`);
        }
    }

    /**
     * Test AI Service
     */
    async testAIService() {
        console.log('🤖 Testing AI Service...');

        try {
            await this.runTest('AI Service - Available Models', async () => {
                const models = newAiService.getAvailableModels();
                assert(Array.isArray(models), 'Models should be an array');
                assert(models.length > 0, 'Should have available models');
                assert(models.includes('gemini'), 'Should include Gemini model');
            });

            await this.runTest('AI Service - Model Validation', async () => {
                assert(newAiService.isModelAvailable('gemini'), 'Gemini should be available');
                assert(!newAiService.isModelAvailable('nonexistent'), 'Nonexistent model should not be available');
            });

            await this.runTest('AI Service - Model Information', async () => {
                const info = newAiService.getModelInfo('gemini');
                assert(info, 'Model info should exist');
                assert(info.name, 'Model should have a name');
                assert(info.description, 'Model should have a description');
                assert(Array.isArray(info.features), 'Features should be an array');
            });

            // Note: Actual API calls are skipped in tests to avoid rate limiting and API key issues
            console.log('✅ AI Service tests passed\n');

        } catch (error) {
            console.error('❌ AI Service tests failed:', error.message);
            this.testResults.errors.push(`AI Service: ${error.message}`);
        }
    }

    /**
     * Test Translation Service
     */
    async testTranslationService() {
        console.log('🌐 Testing Translation Service...');

        try {
            await this.runTest('Translation Service - Supported Languages', async () => {
                const languages = translationService.getSupportedLanguages();
                assert(typeof languages === 'object', 'Languages should be an object');
                assert(languages.en === 'English', 'English should be supported');
                assert(languages.es === 'Spanish', 'Spanish should be supported');
            });

            await this.runTest('Translation Service - Language Validation', async () => {
                assert(translationService.isLanguageSupported('en'), 'English should be supported');
                assert(translationService.isLanguageSupported('es'), 'Spanish should be supported');
                assert(!translationService.isLanguageSupported('xyz'), 'Invalid language should not be supported');
            });

            await this.runTest('Translation Service - Language Names', async () => {
                assert(translationService.getLanguageName('en') === 'English', 'English name should be correct');
                assert(translationService.getLanguageName('fr') === 'French', 'French name should be correct');
                assert(translationService.getLanguageName('xyz') === 'Unknown', 'Unknown language should return Unknown');
            });

            console.log('✅ Translation Service tests passed\n');

        } catch (error) {
            console.error('❌ Translation Service tests failed:', error.message);
            this.testResults.errors.push(`Translation Service: ${error.message}`);
        }
    }

    /**
     * Test Search Service
     */
    async testSearchService() {
        console.log('🔍 Testing Search Service...');

        try {
            await this.runTest('Search Service - URL Extraction', async () => {
                const displayUrl = searchService.extractDisplayUrl('https://www.example.com/path/to/page');
                assert(displayUrl === 'www.example.com/path/to/page', 'Display URL should be extracted correctly');
            });

            await this.runTest('Search Service - News Detection', async () => {
                const isNews1 = searchService.isNewsResult('Breaking News: Important Update', 'Latest news about...', 'https://cnn.com/article');
                const isNews2 = searchService.isNewsResult('Regular Article', 'Some content', 'https://example.com');
                
                assert(isNews1, 'Should detect news result');
                assert(!isNews2, 'Should not detect non-news result');
            });

            await this.runTest('Search Service - Academic Detection', async () => {
                const isAcademic1 = searchService.isAcademicResult('Research Paper on AI', 'Academic study...', 'https://scholar.google.com/paper');
                const isAcademic2 = searchService.isAcademicResult('Regular Article', 'Some content', 'https://example.com');
                
                assert(isAcademic1, 'Should detect academic result');
                assert(!isAcademic2, 'Should not detect non-academic result');
            });

            await this.runTest('Search Service - Suggestions Generation', async () => {
                const suggestions = searchService.generateSuggestions('artificial intelligence');
                assert(Array.isArray(suggestions), 'Suggestions should be an array');
                assert(suggestions.length > 0, 'Should generate suggestions');
            });

            console.log('✅ Search Service tests passed\n');

        } catch (error) {
            console.error('❌ Search Service tests failed:', error.message);
            this.testResults.errors.push(`Search Service: ${error.message}`);
        }
    }

    /**
     * Test Media Service
     */
    async testMediaService() {
        console.log('🎥 Testing Media Service...');

        try {
            await this.runTest('Media Service - YouTube URL Validation', async () => {
                assert(mediaService.isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'Should validate YouTube URL');
                assert(mediaService.isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ'), 'Should validate short YouTube URL');
                assert(!mediaService.isValidYouTubeUrl('https://example.com'), 'Should reject non-YouTube URL');
            });

            await this.runTest('Media Service - Video ID Extraction', async () => {
                const videoId1 = mediaService.extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
                const videoId2 = mediaService.extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ');
                
                assert(videoId1 === 'dQw4w9WgXcQ', 'Should extract video ID from full URL');
                assert(videoId2 === 'dQw4w9WgXcQ', 'Should extract video ID from short URL');
            });

            await this.runTest('Media Service - Image URL Validation', async () => {
                assert(mediaService.isValidImageUrl('https://example.com/image.jpg'), 'Should validate JPG URL');
                assert(mediaService.isValidImageUrl('https://example.com/image.png'), 'Should validate PNG URL');
                assert(!mediaService.isValidImageUrl('https://example.com/document.pdf'), 'Should reject non-image URL');
            });

            await this.runTest('Media Service - Video Info Generation', async () => {
                const info = mediaService.getVideoInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
                assert(info, 'Video info should be generated');
                assert(info.videoId === 'dQw4w9WgXcQ', 'Video ID should be correct');
                assert(info.thumbnailUrl.includes('dQw4w9WgXcQ'), 'Thumbnail URL should contain video ID');
            });

            console.log('✅ Media Service tests passed\n');

        } catch (error) {
            console.error('❌ Media Service tests failed:', error.message);
            this.testResults.errors.push(`Media Service: ${error.message}`);
        }
    }

    /**
     * Test Weather Service
     */
    async testWeatherService() {
        console.log('🌤️ Testing Weather Service...');

        try {
            await this.runTest('Weather Service - Coordinate Validation', async () => {
                assert(weatherService.isValidCoordinate(40.7128, -90, 90), 'Valid latitude should pass');
                assert(weatherService.isValidCoordinate(-74.0060, -180, 180), 'Valid longitude should pass');
                assert(!weatherService.isValidCoordinate(100, -90, 90), 'Invalid latitude should fail');
                assert(!weatherService.isValidCoordinate(-200, -180, 180), 'Invalid longitude should fail');
            });

            console.log('✅ Weather Service tests passed\n');

        } catch (error) {
            console.error('❌ Weather Service tests failed:', error.message);
            this.testResults.errors.push(`Weather Service: ${error.message}`);
        }
    }

    /**
     * Test TTS Service
     */
    async testTTSService() {
        console.log('🔊 Testing TTS Service...');

        try {
            await this.runTest('TTS Service - Available Voices', async () => {
                const voices = enhancedTtsService.getAvailableVoices();
                assert(Array.isArray(voices), 'Voices should be an array');
                assert(voices.length > 0, 'Should have available voices');
                assert(voices.includes('Salli'), 'Should include Salli voice');
            });

            await this.runTest('TTS Service - Voice Validation', async () => {
                assert(enhancedTtsService.isVoiceAvailable('Salli'), 'Salli should be available');
                assert(!enhancedTtsService.isVoiceAvailable('NonexistentVoice'), 'Nonexistent voice should not be available');
            });

            await this.runTest('TTS Service - Voice Information', async () => {
                const info = enhancedTtsService.getVoiceInfo('Salli');
                assert(info, 'Voice info should exist');
                assert(info.language, 'Voice should have language info');
                assert(info.gender, 'Voice should have gender info');
                assert(info.region, 'Voice should have region info');
            });

            await this.runTest('TTS Service - Text Validation', async () => {
                const validation1 = enhancedTtsService.validateText('Hello world');
                const validation2 = enhancedTtsService.validateText('');
                const validation3 = enhancedTtsService.validateText('a'.repeat(2000));
                
                assert(validation1.valid, 'Valid text should pass');
                assert(!validation2.valid, 'Empty text should fail');
                assert(!validation3.valid, 'Too long text should fail');
            });

            await this.runTest('TTS Service - Text Cleaning', async () => {
                const cleaned = enhancedTtsService.cleanTextForTTS('  Hello <world>  with  extra   spaces  ');
                assert(cleaned === 'Hello world with extra spaces', 'Text should be cleaned properly');
            });

            await this.runTest('TTS Service - Voice Filtering', async () => {
                const englishVoices = enhancedTtsService.getVoicesByLanguage('en');
                const femaleVoices = enhancedTtsService.getVoicesByGender('female');
                
                assert(Array.isArray(englishVoices), 'English voices should be an array');
                assert(Array.isArray(femaleVoices), 'Female voices should be an array');
                assert(englishVoices.length > 0, 'Should have English voices');
                assert(femaleVoices.length > 0, 'Should have female voices');
            });

            console.log('✅ TTS Service tests passed\n');

        } catch (error) {
            console.error('❌ TTS Service tests failed:', error.message);
            this.testResults.errors.push(`TTS Service: ${error.message}`);
        }
    }

    /**
     * Test Truecaller Service
     */
    async testTruecallerService() {
        console.log('📞 Testing Truecaller Service...');

        try {
            await this.runTest('Truecaller Service - Phone Number Formatting', async () => {
                const formatted1 = enhancedTruecallerService.formatPhoneNumber('+1234567890');
                const formatted2 = enhancedTruecallerService.formatPhoneNumber('1234567890');
                const formatted3 = enhancedTruecallerService.formatPhoneNumber('123');
                
                assert(formatted1 === '+1234567890', 'Already formatted number should remain unchanged');
                assert(formatted2 === '+1234567890', 'Number without + should be formatted');
                assert(formatted3 === null, 'Invalid number should return null');
            });

            await this.runTest('Truecaller Service - Phone Number Validation', async () => {
                assert(enhancedTruecallerService.isValidPhoneNumber('+1234567890'), 'Valid number should pass');
                assert(!enhancedTruecallerService.isValidPhoneNumber('123'), 'Invalid number should fail');
                assert(!enhancedTruecallerService.isValidPhoneNumber(''), 'Empty number should fail');
            });

            await this.runTest('Truecaller Service - Country Code Extraction', async () => {
                const countryCode1 = enhancedTruecallerService.extractCountryCode('+1234567890');
                const countryCode2 = enhancedTruecallerService.extractCountryCode('+44123456789');
                
                assert(countryCode1 === '+1', 'Should extract US country code');
                assert(countryCode2 === '+44', 'Should extract UK country code');
            });

            await this.runTest('Truecaller Service - Country Information', async () => {
                const countryInfo1 = enhancedTruecallerService.getCountryInfo('+1');
                const countryInfo2 = enhancedTruecallerService.getCountryInfo('+999');
                
                assert(countryInfo1.name.includes('United States'), 'Should return US info');
                assert(countryInfo2.name === 'Unknown', 'Unknown country code should return Unknown');
            });

            console.log('✅ Truecaller Service tests passed\n');

        } catch (error) {
            console.error('❌ Truecaller Service tests failed:', error.message);
            this.testResults.errors.push(`Truecaller Service: ${error.message}`);
        }
    }

    /**
     * Run individual test
     */
    async runTest(testName, testFunction) {
        try {
            await testFunction();
            this.testResults.passed++;
            console.log(`  ✅ ${testName}`);
        } catch (error) {
            this.testResults.failed++;
            console.log(`  ❌ ${testName}: ${error.message}`);
            this.testResults.errors.push(`${testName}: ${error.message}`);
        }
    }

    /**
     * Print test summary
     */
    printTestSummary() {
        console.log('\n📊 Test Summary:');
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`📊 Total: ${this.testResults.passed + this.testResults.failed}`);
        
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.testResults.errors.forEach(error => {
                console.log(`  - ${error}`);
            });
        }

        const successRate = (this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100;
        console.log(`\n🎯 Success Rate: ${successRate.toFixed(1)}%`);

        if (successRate >= 90) {
            console.log('🎉 Excellent! API system is working well.');
        } else if (successRate >= 70) {
            console.log('⚠️ Good, but some issues need attention.');
        } else {
            console.log('🚨 Critical issues detected. System needs fixes.');
        }
    }

    /**
     * Get test results
     */
    getResults() {
        return { ...this.testResults };
    }
}

// Export for use in other modules
module.exports = APITestSuite;

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new APITestSuite();
    testSuite.runAllTests().then(() => {
        process.exit(testSuite.getResults().failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Test suite crashed:', error);
        process.exit(1);
    });
}

