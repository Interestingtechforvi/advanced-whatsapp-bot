// Test script for deployed bot on Render
const fetch = require('node-fetch');

const BASE_URL = 'https://advanced-whatsapp-bot-1.onrender.com';

async function testEndpoint(endpoint, options = {}) {
    try {
        const url = `${BASE_URL}${endpoint}`;
        console.log(`\n🧪 Testing: ${url}`);

        const response = await fetch(url, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
            timeout: 30000
        });

        const data = await response.json();
        console.log(`✅ Status: ${response.status}`);
        console.log(`📄 Response:`, data);

        return { success: response.ok, data, status: response.status };
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function runDeployTests() {
    console.log('🚀 Testing Deployed WhatsApp Bot on Render\n');
    console.log('=' .repeat(50));

    // Test 1: Dashboard
    await testEndpoint('/');

    // Test 2: API Status
    await testEndpoint('/api/status');

    // Test 2.5: Models Command (NEW TEST)
    console.log('\n🎯 Testing /models command...');
    await testEndpoint('/api/chat', {
        method: 'POST',
        body: {
            message: '/models',
            userId: 'test_user'
        }
    });

    // Test 2.6: Model Switch Command (NEW TEST)
    await testEndpoint('/api/chat', {
        method: 'POST',
        body: {
            message: '/model deepseek',
            userId: 'test_user'
        }
    });

    // Test 2.7: Test All AI Models (EXCLUDING GEMINI)
    console.log('\n🤖 Testing All AI Models (excluding Gemini)...');

    const modelsToTest = ['chatgpt4', 'claude', 'deepseek', 'llama', 'qwen3', 'moonshot'];
    const testMessage = 'Hello, this is a test message. Please respond with just "Test successful" to confirm you are working.';

    for (const model of modelsToTest) {
        console.log(`\n🔄 Testing ${model.toUpperCase()} model...`);

        try {
            // Switch to the model
            const switchResult = await testEndpoint('/api/chat', {
                method: 'POST',
                body: {
                    message: `/model ${model}`,
                    userId: `test_${model}`
                }
            });

            if (switchResult.success) {
                console.log(`✅ Successfully switched to ${model}`);

                // Test a message with the model
                const chatResult = await testEndpoint('/api/chat', {
                    method: 'POST',
                    body: {
                        message: testMessage,
                        userId: `test_${model}`
                    }
                });

                if (chatResult.success) {
                    console.log(`✅ ${model.toUpperCase()} responded successfully`);
                } else {
                    console.log(`❌ ${model.toUpperCase()} failed to respond:`, chatResult.error);
                }
            } else {
                console.log(`❌ Failed to switch to ${model}:`, switchResult.error);
            }
        } catch (error) {
            console.log(`❌ Error testing ${model}:`, error.message);
        }

        // Small delay between tests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Test 2.8: Specific Model Tests (from original issue)
    console.log('\n🎯 Testing Specific Models from Original Issue...');

    const criticalModels = ['deepseek', 'llama', 'moonshot', 'qwen3'];
    const criticalTestMessage = 'Respond with exactly: MODEL_TEST_OK';

    for (const model of criticalModels) {
        console.log(`\n🔍 Critical Test: ${model.toUpperCase()}`);

        try {
            // Switch to model
            await testEndpoint('/api/chat', {
                method: 'POST',
                body: {
                    message: `/model ${model}`,
                    userId: `critical_test_${model}`
                }
            });

            // Send test message
            const result = await testEndpoint('/api/chat', {
                method: 'POST',
                body: {
                    message: criticalTestMessage,
                    userId: `critical_test_${model}`
                }
            });

            if (result.success && result.data && result.data.response) {
                const response = result.data.response.toLowerCase();
                if (response.includes('model_test_ok') || response.includes('ok')) {
                    console.log(`✅ ${model.toUpperCase()} PASSED critical test`);
                } else {
                    console.log(`⚠️ ${model.toUpperCase()} responded but not as expected:`, result.data.response);
                }
            } else {
                console.log(`❌ ${model.toUpperCase()} FAILED critical test`);
            }
        } catch (error) {
            console.log(`❌ ${model.toUpperCase()} critical test error:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 3000)); // Longer delay for critical tests
    }

    console.log('\n📊 AI Model Testing Summary:');
    console.log('✅ All models should have responded with test confirmations');
    console.log('✅ Model switching should work for all listed models');
    console.log('✅ Critical models (deepseek, llama, moonshot, qwen3) should pass');
    console.log('✅ If any model failed, check the API endpoint or credentials');
    console.log('🔄 Deploy these fixes to GitHub and test on Render');

    // Test 3: Chat API - Basic message
    await testEndpoint('/api/chat', {
        method: 'POST',
        body: {
            message: 'Hello, test message',
            userId: 'test_user'
        }
    });

    // Test 4: Chat API - Model switch
    await testEndpoint('/api/chat', {
        method: 'POST',
        body: {
            message: '/model deepseek',
            userId: 'test_user'
        }
    });

    // Test 5: Chat API - Translation
    await testEndpoint('/api/chat', {
        method: 'POST',
        body: {
            message: 'Translate "Hello, how are you?" to Spanish',
            userId: 'test_user'
        }
    });

    // Test 5.5: Chat API - Translation (Different text)
    await testEndpoint('/api/chat', {
        method: 'POST',
        body: {
            message: 'Translate "Good morning" to French',
            userId: 'test_user'
        }
    });

    // Test 6: Chat API - Weather
    await testEndpoint('/api/chat', {
        method: 'POST',
        body: {
            message: 'Weather in New York',
            userId: 'test_user'
        }
    });

    // Test 7: Chat API - Phone lookup
    await testEndpoint('/api/chat', {
        method: 'POST',
        body: {
            message: '+1234567890',
            userId: 'test_user'
        }
    });

    // Test 8: Chat API - Search
    await testEndpoint('/api/chat', {
        method: 'POST',
        body: {
            message: 'Search for AI news',
            userId: 'test_user'
        }
    });

    // Test 9: User Profile
    await testEndpoint('/api/user/profile/test_user');

    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Deploy Test Complete!');
}

// Run tests
runDeployTests().catch(console.error);