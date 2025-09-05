// Quick manual test for AI models
const fetch = require('node-fetch');

const BASE_URL = 'https://advanced-whatsapp-bot-1.onrender.com';

async function testModel(modelName, userId) {
    console.log(`\n🤖 Testing ${modelName.toUpperCase()}...`);

    try {
        // Switch to model
        const switchResponse = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `/model ${modelName}`,
                userId: userId
            })
        });

        const switchData = await switchResponse.json();
        console.log(`🔄 Switch Result:`, switchData.response);

        // Test message
        const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Hello from ${modelName} test`,
                userId: userId
            })
        });

        const chatData = await chatResponse.json();
        console.log(`💬 Chat Result:`, chatData.response ? chatData.response.substring(0, 100) + '...' : 'No response');

        return { switch: switchData, chat: chatData };
    } catch (error) {
        console.log(`❌ Error testing ${modelName}:`, error.message);
        return { error: error.message };
    }
}

async function testAllModels() {
    console.log('🚀 Testing All AI Models on Deployed Bot\n');

    const models = ['chatgpt4', 'claude', 'deepseek', 'llama', 'qwen3', 'moonshot'];

    for (const model of models) {
        await testModel(model, `test_${model}_${Date.now()}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit delay
    }

    console.log('\n✅ Model testing complete!');
}

// Test specific model if provided as argument
const specificModel = process.argv[2];
if (specificModel) {
    testModel(specificModel, `manual_test_${Date.now()}`);
} else {
    testAllModels();
}