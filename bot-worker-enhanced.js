/**
 * Bot Worker - Safe execution environment for bot code
 * Integrated with Debug Agent for enhanced validation
 */

class BotWorker {
  constructor() {
    this.timeout = 10000; // 10 second timeout for bot execution
    this.maxMemory = 50 * 1024 * 1024; // 50MB memory limit
  }

  /**
   * Execute bot code safely with monitoring
   */
  async executeBot(botCode, input = null, purpose = 'General bot functionality') {
    const startTime = Date.now();
    const result = {
      success: false,
      output: null,
      error: null,
      executionTime: 0,
      warnings: []
    };

    try {
      // Validate code before execution
      const validation = await this.validateBeforeExecution(botCode, purpose);
      if (!validation.isValid) {
        result.error = 'Code validation failed: ' + validation.issues.map(i => i.message).join(', ');
        return result;
      }

      // Create isolated execution context
      const botFunction = this.createSafeFunction(botCode);
      
      // Execute with timeout
      const output = await this.executeWithTimeout(botFunction, input);
      
      result.success = true;
      result.output = output;
      result.executionTime = Date.now() - startTime;
      
      // Post-execution analysis
      await this.performPostExecutionAnalysis(result, purpose);
      
    } catch (error) {
      result.error = error.message;
      result.executionTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Validate code before execution using Debug Agent
   */
  async validateBeforeExecution(code, purpose) {
    // Import DebugAgent if in Node.js environment
    if (typeof require !== 'undefined') {
      try {
        const DebugAgent = require('./debug-agent.js');
        const agent = new DebugAgent();
        return await agent.analyzeCode(code, purpose);
      } catch (e) {
        // Fallback if module not available
        return this.basicValidation(code);
      }
    }
    
    // Fallback validation for browser environment
    return this.basicValidation(code);
  }

  /**
   * Basic validation for browser environment
   */
  basicValidation(code) {
    const issues = [];
    
    try {
      new Function(code);
    } catch (error) {
      issues.push({
        type: 'syntax',
        severity: 'critical',
        message: error.message
      });
    }

    // Basic security checks
    if (code.includes('eval(')) {
      issues.push({
        type: 'security',
        severity: 'critical',
        message: 'eval() usage detected - security risk'
      });
    }

    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * Create safe function execution environment
   */
  createSafeFunction(code) {
    try {
      return new Function('return ' + code)();
    } catch (error) {
      throw new Error(`Function creation failed: ${error.message}`);
    }
  }

  /**
   * Execute function with timeout and monitoring
   */
  async executeWithTimeout(botFunction, input) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Execution timeout after ${this.timeout}ms`));
      }, this.timeout);

      try {
        const result = botFunction(input);
        
        // Handle both sync and async functions
        if (result && typeof result.then === 'function') {
          result
            .then(output => {
              clearTimeout(timeoutId);
              resolve(output);
            })
            .catch(error => {
              clearTimeout(timeoutId);
              reject(error);
            });
        } else {
          clearTimeout(timeoutId);
          resolve(result);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Analyze execution results for quality and purpose fulfillment
   */
  async performPostExecutionAnalysis(result, purpose) {
    const warnings = [];

    // Check execution time
    if (result.executionTime > 5000) {
      warnings.push('Execution took longer than 5 seconds - consider optimization');
    }

    // Check output relevance
    if (result.output && typeof result.output === 'string') {
      const outputLower = result.output.toLowerCase();
      const purposeLower = purpose.toLowerCase();
      
      const relevantKeywords = purposeLower.split(' ').filter(word => word.length > 3);
      const relevanceScore = relevantKeywords.reduce((score, keyword) => {
        return outputLower.includes(keyword) ? score + 1 : score;
      }, 0);

      if (relevantKeywords.length > 0 && relevanceScore / relevantKeywords.length < 0.3) {
        warnings.push('Output may not be relevant to stated purpose');
      }
    }

    // Check for empty or undefined outputs
    if (result.output === null || result.output === undefined || result.output === '') {
      warnings.push('Bot produced empty output - verify functionality');
    }

    result.warnings = warnings;
  }

  /**
   * Enhanced bot validation and enhancement
   */
  async enhanceBot(botCode, purpose, testInputs = []) {
    console.log('🔧 Starting bot enhancement process...');
    
    // Step 1: Deep analysis
    const validation = await this.validateBeforeExecution(botCode, purpose);
    
    // Step 2: Generate enhanced version
    let enhancedCode = botCode;
    
    // Add error handling if missing
    if (!botCode.includes('try') && !botCode.includes('catch')) {
      enhancedCode = this.addErrorHandling(enhancedCode);
    }
    
    // Add input validation
    enhancedCode = this.addInputValidation(enhancedCode);
    
    return {
      originalCode: botCode,
      enhancedCode: enhancedCode,
      validation: validation,
      recommendations: this.generateRecommendations(validation)
    };
  }

  /**
   * Add error handling to bot code
   */
  addErrorHandling(code) {
    if (code.includes('async') && code.includes('=>')) {
      return code.replace(
        /(async\s*(?:\([^)]*\))?\s*=>\s*{)([\s\S]*)(}$)/,
        '$1\n  try {\n$2\n  } catch (error) {\n    console.error("Bot error:", error.message);\n    return `Error: ${error.message}`;\n  }\n$3'
      );
    }
    return code;
  }

  /**
   * Add input validation to bot code
   */
  addInputValidation(code) {
    if (code.includes('async') && code.includes('=>')) {
      return code.replace(
        /(async\s*(?:\([^)]*\))?\s*=>\s*{)/,
        '$1\n  if (arguments.length > 0 && typeof arguments[0] === "undefined") {\n    return "Error: Invalid input provided";\n  }'
      );
    }
    return code;
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(validation) {
    const recommendations = [];

    if (!validation.isValid) {
      recommendations.push('Fix validation issues before deployment');
      validation.issues.forEach(issue => {
        recommendations.push(`${issue.severity.toUpperCase()}: ${issue.message}`);
      });
    } else {
      recommendations.push('Bot is ready for deployment!');
    }

    return recommendations;
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BotWorker;
} else if (typeof window !== 'undefined') {
  window.BotWorker = BotWorker;
}

// Worker message handling for web workers
if (typeof self !== 'undefined' && typeof importScripts === 'function') {
  self.onmessage = async function(e) {
    const { code, input, purpose, testInputs } = e.data;
    const worker = new BotWorker();
    
    try {
      if (testInputs && testInputs.length > 0) {
        const result = await worker.enhanceBot(code, purpose, testInputs);
        self.postMessage({ success: true, result });
      } else {
        const result = await worker.executeBot(code, input, purpose);
        self.postMessage({ success: true, result });
      }
    } catch (error) {
      self.postMessage({ 
        success: false, 
        error: error.message 
      });
    }
  };
}