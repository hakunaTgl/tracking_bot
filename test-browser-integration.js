// Test script to verify browser integration
const fs = require('fs');

// Simulate browser environment
global.window = {};
global.document = {
  getElementById: () => ({ value: '', innerHTML: '' }),
  createElement: () => ({ innerHTML: '', appendChild: () => {} })
};
global.fetch = () => Promise.reject(new Error('fetch failed'));
global.console = console;
global.module = { exports: {} };

// Load the BotWorker
const BotWorker = require('./bot-worker-enhanced.js');

async function testBrowserIntegration() {
  console.log('🌐 Testing Browser Integration');
  console.log('=' .repeat(40));
  
  const worker = new BotWorker();
  
  // Test 1: Basic validation
  console.log('\n1. Testing basic validation...');
  const testCode = 'async () => { return "Hello World"; }';
  const validation = await worker.validateBeforeExecution(testCode, 'Greeting bot');
  console.log(`✅ Validation result: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
  
  // Test 2: Bot execution
  console.log('\n2. Testing bot execution...');
  try {
    const result = await worker.executeBot(testCode, 'test', 'Greeting bot');
    console.log(`✅ Execution result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    if (result.success) {
      console.log(`   Output: ${result.output}`);
      console.log(`   Time: ${result.executionTime}ms`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.log(`❌ Execution error: ${error.message}`);
  }
  
  // Test 3: Code enhancement
  console.log('\n3. Testing code enhancement...');
  try {
    const enhancement = await worker.enhanceBot(testCode, 'Greeting bot');
    console.log(`✅ Enhancement result: ${enhancement.enhancedCode !== enhancement.originalCode ? 'ENHANCED' : 'NO_CHANGES_NEEDED'}`);
    console.log(`   Recommendations: ${enhancement.recommendations.length}`);
  } catch (error) {
    console.log(`❌ Enhancement error: ${error.message}`);
  }
  
  console.log('\n🎉 Browser integration test completed!');
}

testBrowserIntegration().catch(console.error);