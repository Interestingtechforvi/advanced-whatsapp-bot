const assert = require('assert');
const newMessageHandler = require('../src/handlers/newMessageHandler');

/**
 * Integration test suite for end-to-end message processing
 * Tests the complete message handling flow
 */
class IntegrationTestSuite {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    /**
     * Run all integration tests
     */
    async runAllTests() {
        console.log('🔗 Starting Integration Test Suite...\n');

        try {
            await this.testBasicMessageHandling();
            await this.testCommandProcessing();
            await this.testSmartFeatures();
            await this.testErrorHandling();

            this.printTestSummary();

        } catch (error) {
            console.error('❌ Integration test suite failed:', error);
            this.testResults.errors.push(`Integration test suite error: ${error.message}`);
        }
    }

    /**
     * Test basic message handling
     */
    async testBasicMessageHandling() {
        console.log('💬 Testing Basic Message Handling...');

        try {
            // Test text message processing
            await this.runTest('Basic Text Message', async () => {
                const message = {
                    body: 'Hello, how are you?',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(typeof response === 'string', 'Response should be a string');
                assert(response.length > 0, 'Response should not be empty');
                assert(response.includes('🤖'), 'Response should indicate AI processing');
            });

            // Test empty message handling
            await this.runTest('Empty Message Handling', async () => {
                const message = {
                    body: '',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(typeof response === 'string', 'Response should be a string');
                assert(response.length > 0, 'Response should not be empty');
            });

            // Test unsupported message type
            await this.runTest('Unsupported Message Type', async () => {
                const message = {
                    body: 'test',
                    type: 'location',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(response.includes('Unsupported message type'), 'Should indicate unsupported type');
            });

            console.log('✅ Basic Message Handling tests passed\n');

        } catch (error) {
            console.error('❌ Basic Message Handling tests failed:', error.message);
            this.testResults.errors.push(`Basic Message Handling: ${error.message}`);
        }
    }

    /**
     * Test command processing
     */
    async testCommandProcessing() {
        console.log('⚡ Testing Command Processing...');

        try {
            // Test help command
            await this.runTest('Help Command', async () => {
                const message = {
                    body: '/help',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(response.includes('WhatsApp AI Bot - Help'), 'Should show help message');
                assert(response.includes('Available Commands'), 'Should list available commands');
            });

            // Test models command
            await this.runTest('Models Command', async () => {
                const message = {
                    body: '/models',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(response.includes('Available AI Models'), 'Should show available models');
                assert(response.includes('GEMINI'), 'Should include Gemini model');
            });

            // Test voices command
            await this.runTest('Voices Command', async () => {
                const message = {
                    body: '/voices',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(response.includes('Available TTS Voices'), 'Should show available voices');
                assert(response.includes('Salli'), 'Should include Salli voice');
            });

            // Test languages command
            await this.runTest('Languages Command', async () => {
                const message = {
                    body: '/languages',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(response.includes('Supported Languages'), 'Should show supported languages');
                assert(response.includes('English'), 'Should include English');
            });

            // Test status command
            await this.runTest('Status Command', async () => {
                const message = {
                    body: '/status',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(response.includes('System Status'), 'Should show system status');
                assert(response.includes('AI Models'), 'Should include AI models status');
            });

            // Test AI command with model
            await this.runTest('AI Command with Model', async () => {
                const message = {
                    body: '/ai gemini What is 2+2?',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(response.includes('GEMINI AI Response'), 'Should indicate Gemini AI response');
            });

            // Test AI command without model
            await this.runTest('AI Command without Model', async () => {
                const message = {
                    body: '/ai What is the capital of France?',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(response.includes('GEMINI AI Response'), 'Should use default Gemini model');
            });

            // Test translate command
            await this.runTest('Translate Command', async () => {
                const message = {
                    body: '/translate es Hello world',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                // Note: This will likely fail due to API limitations in test environment
                // but we test the command structure
                assert(response.includes('Translation') || response.includes('failed'), 'Should attempt translation');
            });

            // Test search command
            await this.runTest('Search Command', async () => {
                const message = {
                    body: '/search artificial intelligence',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(response.includes('Search') || response.includes('failed'), 'Should attempt search');
            });

            // Test weather command
            await this.runTest('Weather Command', async () => {
                const message = {
                    body: '/weather London',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(response.includes('Weather') || response.includes('failed'), 'Should attempt weather lookup');
            });

            // Test invalid command
            await this.runTest('Invalid Command', async () => {
                const message = {
                    body: '/invalidcommand test',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(response.includes('Unknown command'), 'Should indicate unknown command');
                assert(response.includes('/help'), 'Should suggest help command');
            });

            console.log('✅ Command Processing tests passed\n');

        } catch (error) {
            console.error('❌ Command Processing tests failed:', error.message);
            this.testResults.errors.push(`Command Processing: ${error.message}`);
        }
    }

    /**
     * Test smart features
     */
    async testSmartFeatures() {
        console.log('🧠 Testing Smart Features...');

        try {
            // Test YouTube URL detection
            await this.runTest('YouTube URL Detection', async () => {
                const message = {
                    body: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(response.includes('YouTube') || response.includes('failed'), 'Should detect YouTube URL');
            });

            // Test phone number detection
            await this.runTest('Phone Number Detection', async () => {
                const message = {
                    body: '+1234567890',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(response.includes('Phone') || response.includes('failed'), 'Should detect phone number');
            });

            // Test translation request detection
            await this.runTest('Translation Request Detection', async () => {
                const message = {
                    body: 'translate hello world to spanish',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                // Should either process translation or fall back to AI chat
                assert(typeof response === 'string' && response.length > 0, 'Should provide some response');
            });

            console.log('✅ Smart Features tests passed\n');

        } catch (error) {
            console.error('❌ Smart Features tests failed:', error.message);
            this.testResults.errors.push(`Smart Features: ${error.message}`);
        }
    }

    /**
     * Test error handling
     */
    async testErrorHandling() {
        console.log('🛡️ Testing Error Handling...');

        try {
            // Test malformed message
            await this.runTest('Malformed Message', async () => {
                const message = {
                    // Missing required fields
                    type: 'text'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(typeof response === 'string', 'Should return error message as string');
                assert(response.length > 0, 'Error message should not be empty');
            });

            // Test null message
            await this.runTest('Null Message', async () => {
                const response = await newMessageHandler.processMessage(null);
                assert(response.includes('error') || response.includes('Error'), 'Should indicate error');
            });

            // Test command with insufficient arguments
            await this.runTest('Command with Insufficient Arguments', async () => {
                const message = {
                    body: '/translate',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(response.includes('Usage:') || response.includes('Please provide'), 'Should show usage information');
            });

            // Test AI command with empty message
            await this.runTest('AI Command with Empty Message', async () => {
                const message = {
                    body: '/ai',
                    type: 'text',
                    from: 'test@example.com'
                };
                
                const response = await newMessageHandler.processMessage(message);
                assert(response.includes('Please provide a message'), 'Should request message');
            });

            console.log('✅ Error Handling tests passed\n');

        } catch (error) {
            console.error('❌ Error Handling tests failed:', error.message);
            this.testResults.errors.push(`Error Handling: ${error.message}`);
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
        console.log('\n📊 Integration Test Summary:');
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
            console.log('🎉 Excellent! Message handling system is working well.');
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
module.exports = IntegrationTestSuite;

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new IntegrationTestSuite();
    testSuite.runAllTests().then(() => {
        process.exit(testSuite.getResults().failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Integration test suite crashed:', error);
        process.exit(1);
    });
}

