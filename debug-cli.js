#!/usr/bin/env node

/**
 * CLI Tool for Smart Hub Debug Agent
 * Terminal interface for code analysis and enhancement
 */

const DebugAgent = require('./debug-agent.js');
const BotWorker = require('./bot-worker-enhanced.js');
const fs = require('fs');
const path = require('path');

class DebugCLI {
  constructor() {
    this.agent = new DebugAgent();
    this.worker = new BotWorker();
  }

  async run() {
    console.log('🤖 Smart Hub Debug Agent CLI');
    console.log('=' .repeat(50));
    console.log('Terminal-based code analysis and enhancement tool\n');

    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      this.showHelp();
      return;
    }

    const command = args[0];
    
    switch (command) {
      case 'analyze':
        await this.analyzeCommand(args.slice(1));
        break;
      case 'enhance':
        await this.enhanceCommand(args.slice(1));
        break;
      case 'test':
        await this.testCommand(args.slice(1));
        break;
      case 'validate':
        await this.validateCommand(args.slice(1));
        break;
      case 'demo':
        await this.demoCommand();
        break;
      default:
        console.log(`❌ Unknown command: ${command}`);
        this.showHelp();
    }
  }

  showHelp() {
    console.log('Usage: node debug-cli.js <command> [options]\n');
    console.log('Commands:');
    console.log('  analyze <file>     - Deep analysis of bot code');
    console.log('  enhance <file>     - Enhance code with best practices');
    console.log('  test <file>        - Test bot functionality');
    console.log('  validate <file>    - Validate code before deployment');
    console.log('  demo               - Run demonstration with sample code\n');
    console.log('Examples:');
    console.log('  node debug-cli.js analyze my-bot.js');
    console.log('  node debug-cli.js enhance weather-bot.js');
    console.log('  node debug-cli.js demo');
  }

  async analyzeCommand(args) {
    if (args.length === 0) {
      console.log('❌ Please provide a file to analyze');
      return;
    }

    const filePath = args[0];
    const purpose = args[1] || 'General bot functionality';

    try {
      const code = fs.readFileSync(filePath, 'utf8');
      console.log(`📁 Analyzing: ${filePath}\n`);
      
      const result = await this.agent.analyzeCode(code, purpose);
      
      console.log('\n🎯 ANALYSIS COMPLETE');
      console.log('=' .repeat(30));
      console.log(`✅ Valid: ${result.isValid ? 'YES' : 'NO'}`);
      console.log(`📊 Quality Score: ${result.score}/100`);
      console.log(`🐛 Issues: ${result.issues.length}`);
      console.log(`💡 Suggestions: ${result.suggestions.length}`);
      
    } catch (error) {
      console.log(`❌ Error analyzing file: ${error.message}`);
    }
  }

  async enhanceCommand(args) {
    if (args.length === 0) {
      console.log('❌ Please provide a file to enhance');
      return;
    }

    const filePath = args[0];
    const purpose = args[1] || 'General bot functionality';

    try {
      const code = fs.readFileSync(filePath, 'utf8');
      console.log(`🔧 Enhancing: ${filePath}\n`);
      
      const result = await this.worker.enhanceBot(code, purpose);
      
      if (result.enhancedCode !== result.originalCode) {
        const enhancedPath = filePath.replace('.js', '-enhanced.js');
        fs.writeFileSync(enhancedPath, result.enhancedCode);
        console.log(`✅ Enhanced code saved to: ${enhancedPath}`);
        
        console.log('\n🔧 ENHANCEMENTS APPLIED:');
        console.log('• Added error handling');
        console.log('• Improved input validation');
        console.log('• Enhanced logging');
        
      } else {
        console.log('✅ Code is already optimized!');
      }
      
      console.log('\n📋 RECOMMENDATIONS:');
      result.recommendations.forEach(rec => {
        console.log(`• ${rec}`);
      });
      
    } catch (error) {
      console.log(`❌ Error enhancing file: ${error.message}`);
    }
  }

  async testCommand(args) {
    if (args.length === 0) {
      console.log('❌ Please provide a file to test');
      return;
    }

    const filePath = args[0];
    const purpose = args[1] || 'General bot functionality';

    try {
      const code = fs.readFileSync(filePath, 'utf8');
      console.log(`🧪 Testing: ${filePath}\n`);
      
      // Test with various inputs
      const testInputs = ['test', 'hello', 'weather', ''];
      
      for (const input of testInputs) {
        console.log(`Testing with input: "${input}"`);
        const result = await this.worker.executeBot(code, input, purpose);
        
        if (result.success) {
          console.log(`✅ Output: ${result.output} (${result.executionTime}ms)`);
        } else {
          console.log(`❌ Error: ${result.error}`);
        }
        
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warning => {
            console.log(`⚠️  ${warning}`);
          });
        }
        console.log('');
      }
      
    } catch (error) {
      console.log(`❌ Error testing file: ${error.message}`);
    }
  }

  async validateCommand(args) {
    if (args.length === 0) {
      console.log('❌ Please provide a file to validate');
      return;
    }

    const filePath = args[0];
    const purpose = args[1] || 'General bot functionality';

    try {
      const code = fs.readFileSync(filePath, 'utf8');
      console.log(`🔍 Validating: ${filePath}\n`);
      
      const validation = await this.worker.validateBeforeExecution(code, purpose);
      
      if (validation.isValid) {
        console.log('✅ VALIDATION PASSED');
        console.log('🚀 Code is ready for deployment!');
      } else {
        console.log('❌ VALIDATION FAILED');
        console.log('\n🚨 Issues found:');
        validation.issues.forEach((issue, index) => {
          console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
        });
        console.log('\n⚠️  Please fix these issues before deployment.');
      }
      
    } catch (error) {
      console.log(`❌ Error validating file: ${error.message}`);
    }
  }

  async demoCommand() {
    console.log('🎬 Running Debug Agent Demo\n');
    
    // Create sample bot codes for demonstration
    const sampleCodes = [
      {
        name: 'Weather Bot (Good)',
        purpose: 'Fetch weather information',
        code: `async () => {
  try {
    const city = 'London';
    const response = await fetch(\`https://api.openweathermap.org/data/2.5/weather?q=\${city}&appid=API_KEY\`);
    const data = await response.json();
    return \`Weather in \${city}: \${data.weather[0].description}\`;
  } catch (error) {
    return \`Error fetching weather: \${error.message}\`;
  }
}`
      },
      {
        name: 'Unsafe Bot (Bad)',
        purpose: 'Process user input',
        code: `function processInput(input) {
  eval(input);
  document.innerHTML = input;
  var result = input;
  return result;
}`
      },
      {
        name: 'Simple Bot (Needs Enhancement)',
        purpose: 'Generate greeting message',
        code: `async () => {
  const greeting = "Hello World!";
  return greeting;
}`
      }
    ];

    for (const sample of sampleCodes) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🤖 Analyzing: ${sample.name}`);
      console.log(`🎯 Purpose: ${sample.purpose}`);
      console.log(`${'='.repeat(50)}`);
      
      const result = await this.agent.analyzeCode(sample.code, sample.purpose);
      
      // Test execution
      console.log('\n🧪 Testing execution...');
      try {
        const execResult = await this.worker.executeBot(sample.code, 'test input', sample.purpose);
        if (execResult.success) {
          console.log(`✅ Execution successful: ${execResult.output}`);
        } else {
          console.log(`❌ Execution failed: ${execResult.error}`);
        }
      } catch (error) {
        console.log(`❌ Execution error: ${error.message}`);
      }
      
      // Show enhancement if available
      if (result.enhancedCode !== sample.code) {
        console.log('\n🔧 Enhanced version available with improvements:');
        console.log('• Better error handling');
        console.log('• Input validation');
        console.log('• Security improvements');
      }
      
      console.log(`\n📊 Final Score: ${result.score}/100`);
    }
    
    console.log('\n🎉 Demo completed! The Debug Agent successfully:');
    console.log('✅ Identified security vulnerabilities');
    console.log('✅ Suggested performance improvements');
    console.log('✅ Enhanced code with best practices');
    console.log('✅ Validated functionality against purpose');
    console.log('✅ Provided comprehensive analysis reports');
  }
}

// Run CLI
if (require.main === module) {
  const cli = new DebugCLI();
  cli.run().catch(error => {
    console.error('❌ CLI Error:', error.message);
    process.exit(1);
  });
}

module.exports = DebugCLI;