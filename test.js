// Simple test script to validate bot functionality
const configManager = require('./config-manager');
const apiManager = require('./api-manager');
const { generateResponse } = require('./gemini-config');

async function runTests() {
    console.log('🧪 Starting WhatsApp Bot Tests...\n');

    // Test 1: Configuration Loading
    console.log('1️⃣ Testing Configuration...');
    try {
        const models = configManager.getAIModels();
        console.log('✅ AI Models loaded:', Object.keys(models).length);

        const apis = configManager.getEnabledAPIs();
        console.log('✅ APIs loaded:', Object.keys(apis).length);
    } catch (error) {
        console.log('❌ Configuration test failed:', error.message);
    }

    // Test 2: Gemini API
    console.log('\n2️⃣ Testing Gemini API...');
    try {
        const response = await generateResponse('Hello, test message');
        console.log('✅ Gemini API working');
    } catch (error) {
        console.log('❌ Gemini API test failed:', error.message);
    }

    // Test 3: External APIs
    console.log('\n3️⃣ Testing External APIs...');
    try {
        const status = await apiManager.getAPIStatus();
        console.log('✅ API status check completed');
        Object.entries(status).forEach(([name, info]) => {
            console.log(`   ${name}: ${info.status}`);
        });
    } catch (error) {
        console.log('❌ API status test failed:', error.message);
    }

    console.log('\n🎉 Test completed!');
}

// Run tests if called directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };