#!/usr/bin/env node

/**
 * Terminal-based Debug Agent for Smart Hub Ultra
 * Deep code analysis, bug detection, and enhancement suggestions
 */

class DebugAgent {
  constructor() {
    this.issues = [];
    this.suggestions = [];
    this.securityChecks = [];
    this.performanceChecks = [];
    this.functionalityTests = [];
  }

  /**
   * Main entry point for code analysis
   */
  async analyzeCode(code, purpose = 'General bot functionality') {
    console.log('🔍 Starting deep code analysis...\n');
    
    this.issues = [];
    this.suggestions = [];
    this.securityChecks = [];
    this.performanceChecks = [];
    this.functionalityTests = [];

    // Parse and validate syntax
    await this.validateSyntax(code);
    
    // Security analysis
    await this.performSecurityAnalysis(code);
    
    // Performance analysis
    await this.performPerformanceAnalysis(code);
    
    // Logic and functionality validation
    await this.validateFunctionality(code, purpose);
    
    // Best practices check
    await this.checkBestPractices(code);
    
    // Generate report
    await this.generateReport(code, purpose);
    
    return {
      isValid: this.issues.length === 0,
      issues: this.issues,
      suggestions: this.suggestions,
      enhancedCode: this.enhanceCode(code),
      score: this.calculateQualityScore()
    };
  }

  /**
   * Validate JavaScript syntax and basic structure
   */
  async validateSyntax(code) {
    console.log('📝 Validating syntax...');
    
    try {
      // Try to parse as function
      new Function(code);
      console.log('✅ Syntax is valid\n');
    } catch (error) {
      this.issues.push({
        type: 'syntax',
        severity: 'critical',
        message: `Syntax Error: ${error.message}`,
        suggestion: 'Fix syntax errors before proceeding'
      });
      console.log(`❌ Syntax Error: ${error.message}\n`);
    }

    // Check for common syntax issues
    if (code.includes('function') && !code.includes('{')) {
      this.issues.push({
        type: 'syntax',
        severity: 'high',
        message: 'Function declaration missing opening brace',
        suggestion: 'Add opening brace after function declaration'
      });
    }

    // Check for arrow function syntax
    if (code.includes('=>') && !code.match(/\(\s*\)\s*=>/)) {
      const arrowFunctions = code.match(/\w+\s*=>\s*/g);
      if (arrowFunctions) {
        this.suggestions.push({
          type: 'syntax',
          message: 'Consider using proper arrow function syntax with parentheses',
          example: '() => { /* code */ }'
        });
      }
    }
  }

  /**
   * Perform security analysis
   */
  async performSecurityAnalysis(code) {
    console.log('🔒 Performing security analysis...');
    
    const securityPatterns = [
      {
        pattern: /eval\s*\(/g,
        severity: 'critical',
        message: 'Use of eval() detected - security risk',
        suggestion: 'Replace eval() with safer alternatives like JSON.parse() or Function constructor'
      },
      {
        pattern: /innerHTML\s*=/g,
        severity: 'medium',
        message: 'Direct innerHTML assignment detected',
        suggestion: 'Use textContent or createElement for safer DOM manipulation'
      },
      {
        pattern: /document\.write\s*\(/g,
        severity: 'high',
        message: 'Use of document.write() detected',
        suggestion: 'Use modern DOM methods instead of document.write()'
      },
      {
        pattern: /api[_\-]?key\s*[:=]\s*['"]\w+['"]/gi,
        severity: 'critical',
        message: 'Hardcoded API key detected',
        suggestion: 'Move API keys to environment variables or secure configuration'
      },
      {
        pattern: /password\s*[:=]\s*['"]\w+['"]/gi,
        severity: 'critical',
        message: 'Hardcoded password detected',
        suggestion: 'Never hardcode passwords - use secure authentication methods'
      }
    ];

    securityPatterns.forEach(check => {
      const matches = code.match(check.pattern);
      if (matches) {
        this.securityChecks.push({
          type: 'security',
          severity: check.severity,
          message: check.message,
          suggestion: check.suggestion,
          occurrences: matches.length
        });
      }
    });

    if (this.securityChecks.length === 0) {
      console.log('✅ No security issues found\n');
    } else {
      console.log(`⚠️  Found ${this.securityChecks.length} security issues\n`);
      this.issues.push(...this.securityChecks);
    }
  }

  /**
   * Performance analysis
   */
  async performPerformanceAnalysis(code) {
    console.log('⚡ Analyzing performance...');
    
    const performanceChecks = [
      {
        pattern: /for\s*\(\s*var\s+\w+\s*=\s*0/g,
        severity: 'low',
        message: 'Traditional for loop detected',
        suggestion: 'Consider using forEach, map, or for...of for better readability'
      },
      {
        pattern: /setInterval\s*\(/g,
        severity: 'medium',
        message: 'setInterval usage detected',
        suggestion: 'Ensure proper cleanup with clearInterval to prevent memory leaks'
      },
      {
        pattern: /setTimeout\s*\(/g,
        severity: 'low',
        message: 'setTimeout usage detected',
        suggestion: 'Consider using async/await or Promises for better flow control'
      },
      {
        pattern: /\.getElementById\(/g,
        severity: 'low',
        message: 'Multiple DOM queries detected',
        suggestion: 'Cache DOM elements in variables to improve performance'
      }
    ];

    performanceChecks.forEach(check => {
      const matches = code.match(check.pattern);
      if (matches && matches.length > 2) {
        this.performanceChecks.push({
          type: 'performance',
          severity: check.severity,
          message: check.message,
          suggestion: check.suggestion,
          occurrences: matches.length
        });
      }
    });

    // Check for fetch without error handling
    if (code.includes('fetch(') && !code.includes('catch')) {
      this.performanceChecks.push({
        type: 'performance',
        severity: 'high',
        message: 'Fetch request without proper error handling',
        suggestion: 'Add .catch() or try-catch blocks for robust error handling'
      });
    }

    if (this.performanceChecks.length === 0) {
      console.log('✅ No performance issues found\n');
    } else {
      console.log(`⚡ Found ${this.performanceChecks.length} performance suggestions\n`);
      this.suggestions.push(...this.performanceChecks);
    }
  }

  /**
   * Validate functionality against intended purpose
   */
  async validateFunctionality(code, purpose) {
    console.log('🎯 Validating functionality...');
    
    // Check if code matches intended purpose
    const purposeKeywords = purpose.toLowerCase().split(' ');
    const codeContent = code.toLowerCase();
    
    let relevanceScore = 0;
    purposeKeywords.forEach(keyword => {
      if (codeContent.includes(keyword)) {
        relevanceScore++;
      }
    });
    
    const relevancePercentage = (relevanceScore / purposeKeywords.length) * 100;
    
    if (relevancePercentage < 30) {
      this.functionalityTests.push({
        type: 'functionality',
        severity: 'medium',
        message: 'Code may not align with stated purpose',
        suggestion: `Code relevance: ${relevancePercentage.toFixed(1)}%. Consider adding functionality related to: ${purpose}`
      });
    }

    // Check for async/await best practices
    if (code.includes('async') && !code.includes('await')) {
      this.functionalityTests.push({
        type: 'functionality',
        severity: 'medium',
        message: 'Async function without await usage',
        suggestion: 'Remove async keyword if not using await, or add proper await statements'
      });
    }

    // Check for return statements
    if (code.includes('function') && !code.includes('return')) {
      this.functionalityTests.push({
        type: 'functionality',
        severity: 'low',
        message: 'Function without return statement',
        suggestion: 'Consider adding return statement for function output'
      });
    }

    if (this.functionalityTests.length === 0) {
      console.log('✅ Functionality validation passed\n');
    } else {
      console.log(`🎯 Found ${this.functionalityTests.length} functionality suggestions\n`);
      this.suggestions.push(...this.functionalityTests);
    }
  }

  /**
   * Check coding best practices
   */
  async checkBestPractices(code) {
    console.log('📚 Checking best practices...');
    
    const bestPractices = [];

    // Check for proper variable declarations
    if (code.includes('var ')) {
      bestPractices.push({
        type: 'best-practice',
        severity: 'low',
        message: 'Usage of var detected',
        suggestion: 'Use let or const instead of var for better scoping'
      });
    }

    // Check for proper error handling
    if (code.includes('fetch(') || code.includes('await ')) {
      if (!code.includes('try') && !code.includes('catch')) {
        bestPractices.push({
          type: 'best-practice',
          severity: 'medium',
          message: 'Async operations without error handling',
          suggestion: 'Wrap async operations in try-catch blocks'
        });
      }
    }

    // Check for magic numbers
    const numbers = code.match(/\b\d{2,}\b/g);
    if (numbers && numbers.length > 0) {
      bestPractices.push({
        type: 'best-practice',
        severity: 'low',
        message: 'Magic numbers detected',
        suggestion: 'Consider using named constants for better readability'
      });
    }

    this.suggestions.push(...bestPractices);
    
    if (bestPractices.length === 0) {
      console.log('✅ Best practices check passed\n');
    } else {
      console.log(`📚 Found ${bestPractices.length} best practice suggestions\n`);
    }
  }

  /**
   * Generate enhanced version of the code
   */
  enhanceCode(originalCode) {
    let enhancedCode = originalCode;
    
    // Add basic error handling if missing
    if (enhancedCode.includes('fetch(') && !enhancedCode.includes('catch')) {
      enhancedCode = enhancedCode.replace(
        /fetch\([^)]+\)/g,
        (match) => `${match}.catch(error => console.error('Fetch error:', error))`
      );
    }

    // Wrap in try-catch if async without error handling
    if (enhancedCode.includes('async') && enhancedCode.includes('await') && !enhancedCode.includes('try')) {
      enhancedCode = enhancedCode.replace(
        /(async\s*(?:\(\s*\))?\s*=>\s*{)([\s\S]*)(})/,
        '$1\n  try {\n$2\n  } catch (error) {\n    console.error("Error:", error);\n    throw error;\n  }\n$3'
      );
    }

    return enhancedCode;
  }

  /**
   * Calculate overall quality score
   */
  calculateQualityScore() {
    let score = 100;
    
    this.issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    return Math.max(0, score);
  }

  /**
   * Generate comprehensive report
   */
  async generateReport(code, purpose) {
    console.log('📊 Generating Analysis Report');
    console.log('=' .repeat(50));
    
    const score = this.calculateQualityScore();
    console.log(`\n🎯 Overall Quality Score: ${score}/100`);
    
    if (score >= 90) {
      console.log('🏆 Excellent! Code quality is outstanding.');
    } else if (score >= 75) {
      console.log('✅ Good! Code quality is acceptable with minor improvements needed.');
    } else if (score >= 50) {
      console.log('⚠️  Fair. Code needs significant improvements.');
    } else {
      console.log('❌ Poor. Code requires major fixes before deployment.');
    }

    console.log(`\n📝 Purpose: ${purpose}`);
    console.log(`📏 Code Length: ${code.length} characters`);
    console.log(`🐛 Issues Found: ${this.issues.length}`);
    console.log(`💡 Suggestions: ${this.suggestions.length}`);

    if (this.issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
        console.log(`   💡 ${issue.suggestion}\n`);
      });
    }

    if (this.suggestions.length > 0) {
      console.log('\n💡 SUGGESTIONS FOR IMPROVEMENT:');
      this.suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion.message}`);
        console.log(`   💡 ${suggestion.suggestion}\n`);
      });
    }

    console.log('\n🎯 FUNCTIONALITY ASSESSMENT:');
    if (this.issues.length === 0) {
      console.log('✅ Code is ready for deployment');
      console.log('✅ All syntax checks passed');
      console.log('✅ Security analysis completed');
      console.log('✅ Purpose alignment verified');
    } else {
      console.log('❌ Code requires fixes before deployment');
      console.log('⚠️  Please address all critical and high severity issues');
    }

    console.log('\n' + '=' .repeat(50));
  }

  /**
   * Test the bot functionality
   */
  async testBotFunctionality(code, testInputs = []) {
    console.log('\n🧪 Testing bot functionality...');
    
    try {
      const botFunction = new Function('return ' + code)();
      
      if (typeof botFunction === 'function') {
        console.log('✅ Bot function structure is valid');
        
        // Test with sample inputs
        for (const input of testInputs) {
          try {
            const result = await botFunction(input);
            console.log(`✅ Test input "${input}": ${result}`);
          } catch (error) {
            console.log(`❌ Test input "${input}" failed: ${error.message}`);
            this.issues.push({
              type: 'runtime',
              severity: 'high',
              message: `Runtime error with input "${input}": ${error.message}`,
              suggestion: 'Add proper input validation and error handling'
            });
          }
        }
      } else {
        console.log('❌ Bot function is not properly structured');
        this.issues.push({
          type: 'structure',
          severity: 'critical',
          message: 'Code does not return a valid function',
          suggestion: 'Ensure code returns a proper function that can be executed'
        });
      }
    } catch (error) {
      console.log(`❌ Bot creation failed: ${error.message}`);
      this.issues.push({
        type: 'creation',
        severity: 'critical',
        message: `Bot creation failed: ${error.message}`,
        suggestion: 'Fix syntax and structural issues'
      });
    }
  }
}

// CLI Interface
if (require.main === module) {
  const readline = require('readline');
  const fs = require('fs');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🤖 Smart Hub Debug Agent');
  console.log('Terminal-based code analysis and enhancement tool\n');

  rl.question('Enter bot code file path (or press Enter to input directly): ', async (filePath) => {
    let code = '';
    let purpose = 'General bot functionality';

    if (filePath && fs.existsSync(filePath)) {
      code = fs.readFileSync(filePath, 'utf8');
      console.log(`📁 Loaded code from: ${filePath}\n`);
    } else {
      console.log('📝 Enter your bot code (press Ctrl+D when finished):');
      
      rl.question('', (inputCode) => {
        code = inputCode;
      });
    }

    rl.question('Enter bot purpose/description: ', async (inputPurpose) => {
      if (inputPurpose.trim()) purpose = inputPurpose;

      const agent = new DebugAgent();
      const result = await agent.analyzeCode(code, purpose);

      if (result.isValid) {
        console.log('\n🎉 SUCCESS: Code passed all checks and is ready for deployment!');
      } else {
        console.log('\n⚠️  WARNING: Code has issues that need to be addressed.');
        
        rl.question('\nWould you like to see the enhanced code? (y/n): ', (answer) => {
          if (answer.toLowerCase() === 'y') {
            console.log('\n🔧 ENHANCED CODE:');
            console.log('-'.repeat(50));
            console.log(result.enhancedCode);
            console.log('-'.repeat(50));
          }
          rl.close();
        });
      }
    });
  });
}

module.exports = DebugAgent;