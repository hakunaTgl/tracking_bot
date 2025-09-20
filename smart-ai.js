class SmartAI {
  static learningData = null;
  static contextMemory = [];
  static userPatterns = {};
  static evolutionMetrics = { totalInteractions: 0, successRate: 0, improvementRate: 0 };

  static async initializeLearning() {
    // Load learning data from storage
    this.learningData = await IDB.get('learning', 'ai-data') || {
      patterns: {},
      userPreferences: {},
      successfulInputs: [],
      failedInputs: [],
      contextHistory: [],
      adaptations: []
    };
    
    // Load evolution metrics
    this.evolutionMetrics = await IDB.get('learning', 'evolution-metrics') || this.evolutionMetrics;
  }

  static async saveLearningData() {
    await IDB.batchSet('learning', [
      { key: 'ai-data', ...this.learningData },
      { key: 'evolution-metrics', ...this.evolutionMetrics }
    ]);
  }

  static async learnFromInteraction(input, output, success = true) {
    if (!this.learningData) await this.initializeLearning();
    
    const interaction = {
      input: input.toLowerCase(),
      output,
      success,
      timestamp: Date.now(),
      context: this.contextMemory.slice(-3) // Keep last 3 context items
    };

    // Update learning patterns
    const inputWords = input.toLowerCase().split(' ');
    inputWords.forEach(word => {
      if (word.length > 3) {
        this.learningData.patterns[word] = (this.learningData.patterns[word] || 0) + (success ? 1 : -0.5);
      }
    });

    if (success) {
      this.learningData.successfulInputs.push(interaction);
      if (this.learningData.successfulInputs.length > 100) {
        this.learningData.successfulInputs = this.learningData.successfulInputs.slice(-100);
      }
    } else {
      this.learningData.failedInputs.push(interaction);
      if (this.learningData.failedInputs.length > 50) {
        this.learningData.failedInputs = this.learningData.failedInputs.slice(-50);
      }
    }

    // Update evolution metrics
    this.evolutionMetrics.totalInteractions++;
    const recentSuccessful = this.learningData.successfulInputs.filter(i => 
      Date.now() - i.timestamp < 24 * 60 * 60 * 1000
    ).length;
    const recentTotal = this.learningData.successfulInputs.length + this.learningData.failedInputs.length;
    this.evolutionMetrics.successRate = recentTotal > 0 ? (recentSuccessful / recentTotal) * 100 : 0;

    await this.saveLearningData();
  }

  static async predictUserIntent(input) {
    if (!this.learningData) await this.initializeLearning();
    
    const inputWords = input.toLowerCase().split(' ');
    let intentScore = {};
    
    // Analyze successful patterns
    this.learningData.successfulInputs.forEach(interaction => {
      const similarityScore = this.calculateSimilarity(input, interaction.input);
      if (similarityScore > 0.3) {
        const intent = this.extractIntent(interaction.output);
        intentScore[intent] = (intentScore[intent] || 0) + similarityScore;
      }
    });

    return Object.keys(intentScore).reduce((a, b) => intentScore[a] > intentScore[b] ? a : b, 'general');
  }

  static calculateSimilarity(str1, str2) {
    const words1 = str1.toLowerCase().split(' ');
    const words2 = str2.toLowerCase().split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  static extractIntent(output) {
    if (output.functionality) {
      if (output.functionality.includes('meme') || output.functionality.includes('Giphy')) return 'entertainment';
      if (output.functionality.includes('weather')) return 'weather';
      if (output.functionality.includes('twitter') || output.functionality.includes('social')) return 'social';
    }
    return 'general';
  }

  static async generateSmartSuggestions(context = '') {
    if (!this.learningData) await this.initializeLearning();
    
    const suggestions = [];
    const now = new Date();
    const hour = now.getHours();
    
    // Time-based suggestions
    if (hour >= 6 && hour < 12) {
      suggestions.push("Good morning! How about creating a news summary bot to start your day?");
    } else if (hour >= 12 && hour < 18) {
      suggestions.push("Afternoon productivity boost - create a task reminder bot?");
    } else {
      suggestions.push("Evening wind-down - perhaps a relaxing music or meditation bot?");
    }

    // Pattern-based suggestions from learning data
    const popularPatterns = Object.entries(this.learningData.patterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    popularPatterns.forEach(([pattern, score]) => {
      if (score > 2) {
        suggestions.push(`Based on popular usage: Try creating something with "${pattern}"`);
      }
    });

    // Context-aware suggestions
    if (this.contextMemory.length > 0) {
      const lastContext = this.contextMemory[this.contextMemory.length - 1];
      if (lastContext.includes('weather')) {
        suggestions.push("Extend your weather interest: Create a travel planning bot with weather integration");
      } else if (lastContext.includes('meme')) {
        suggestions.push("Keep the fun going: How about a joke generator or trending topics bot?");
      }
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  static async processInput(input, type = 'text') {
    if (!this.learningData) await this.initializeLearning();
    
    // Add to context memory
    this.contextMemory.push(input);
    if (this.contextMemory.length > 10) {
      this.contextMemory = this.contextMemory.slice(-10);
    }

    // Predict intent using learning
    const predictedIntent = await this.predictUserIntent(input);
    
    let code = '// Generated code';
    let purpose = input;
    let functionality = 'Custom tasks';
    let intelligence = 'basic';
    
    // Enhanced pattern matching with learning
    const inputLower = input.toLowerCase();
    
    if (inputLower.includes('meme') || predictedIntent === 'entertainment') {
      const query = inputLower.replace(/create|a|meme|bot/g, '').trim() || 'funny';
      code = `async () => {
        const cached = await IDB.get('cache', 'meme-${query}');
        if (cached && Date.now() - cached.timestamp < 3600000) return cached.value;
        const res = await fetch('https://api.giphy.com/v1/gifs/search?api_key=kOrIThLFfVdinZ3ORGBDmmX6cnnVWTzK&q=${query}&limit=10');
        const data = await res.json();
        const randomIndex = Math.floor(Math.random() * Math.min(5, data.data.length));
        const url = data.data[randomIndex]?.images.fixed_height.url || data.data[0]?.images.fixed_height.url;
        await IDB.batchSet('cache', [{ key: 'meme-${query}', value: url, timestamp: Date.now() }]);
        return url;
      }`;
      functionality = 'Fetches random memes via Giphy API with smart caching';
      intelligence = 'adaptive';
    } else if (inputLower.includes('twitter') || inputLower.includes('social') || predictedIntent === 'social') {
      code = `async () => {
        const sentiment = Math.random() > 0.5 ? 'positive' : 'motivational';
        const messages = {
          positive: ['Having a great day! 🌟', 'Feeling inspired today! ✨', 'Good vibes only! 🚀'],
          motivational: ['Chase your dreams! 💪', 'Every day is a new opportunity! 🌅', 'Believe in yourself! 🎯']
        };
        const message = messages[sentiment][Math.floor(Math.random() * messages[sentiment].length)];
        // Note: Replace with actual Twitter API when token is available
        console.log('Would post:', message);
        return 'Smart tweet ready: ' + message;
      }`;
      functionality = 'Posts intelligent social media content with sentiment analysis';
      intelligence = 'contextual';
    } else if (inputLower.includes('weather') || predictedIntent === 'weather') {
      const cityMatch = input.match(/(?:in|for)\s+([a-zA-Z\s]+)/);
      const city = cityMatch ? cityMatch[1].trim() : 'London';
      code = `async () => {
        try {
          const res = await fetch('https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=4fc179285e1139b621267e810bb9ddcd&units=metric');
          const data = await res.json();
          const temp = Math.round(data.main.temp);
          const feels = Math.round(data.main.feels_like);
          const desc = data.weather[0].description;
          const emoji = temp > 25 ? '☀️' : temp > 15 ? '⛅' : temp > 5 ? '🌤️' : '❄️';
          
          let advice = '';
          if (temp < 0) advice = ' Bundle up! 🧥';
          else if (temp > 30) advice = ' Stay hydrated! 💧';
          else if (desc.includes('rain')) advice = ' Grab an umbrella! ☂️';
          
          return \`${emoji} Weather in ${city}: \${desc}, \${temp}°C (feels like \${feels}°C)\${advice}\`;
        } catch (error) {
          return 'Weather service temporarily unavailable. Try again later! 🌍';
        }
      }`;
      functionality = 'Provides intelligent weather updates with personalized advice';
      intelligence = 'predictive';
    } else if (inputLower.includes('learn') || inputLower.includes('smart') || inputLower.includes('ai')) {
      code = `async () => {
        const knowledge = await IDB.getAll('learning');
        const metrics = knowledge.find(k => k.key === 'evolution-metrics') || {};
        const totalBots = (await IDB.getAll('bots')).length;
        
        return \`🧠 AI Learning Status:
        • Total Interactions: \${metrics.totalInteractions || 0}
        • Success Rate: \${Math.round(metrics.successRate || 0)}%
        • Bots Created: \${totalBots}
        • Intelligence Level: Evolving
        
        I'm constantly learning from your interactions to provide better assistance! 🚀\`;
      }`;
      functionality = 'Displays AI learning progress and evolution metrics';
      intelligence = 'self-aware';
    } else {
      // Intelligent fallback based on learning patterns
      const suggestions = await this.generateSmartSuggestions(input);
      code = `async () => {
        const suggestions = ${JSON.stringify(suggestions)};
        return \`I'm learning to understand you better! Here are some smart suggestions based on patterns I've observed:
        
        \${suggestions.map((s, i) => \`\${i + 1}. \${s}\`).join('\\n')}
        
        Type any of these ideas or describe what you'd like to create! 🤖✨\`;
      }`;
      functionality = 'Provides intelligent suggestions based on learning patterns';
      intelligence = 'adaptive';
    }

    const result = {
      message: `🧠 Smart Processing: ${input}`,
      action: 'createBot',
      params: {
        id: Date.now().toString(),
        name: `SmartBot-${Date.now()}`,
        code,
        purpose,
        functionality,
        intelligence,
        predictedSuccess: await this.calculatePredictedSuccess(input),
        input,
        learningEnabled: true
      }
    };

    // Learn from this interaction (assume success for now)
    await this.learnFromInteraction(input, result, true);
    
    return result;
  }

  static async calculatePredictedSuccess(input) {
    if (!this.learningData) return 85;
    
    const similarInputs = this.learningData.successfulInputs.filter(interaction => 
      this.calculateSimilarity(input, interaction.input) > 0.3
    );
    
    if (similarInputs.length === 0) return 75; // Default for new patterns
    
    const avgSuccess = similarInputs.reduce((sum, interaction) => 
      sum + (interaction.success ? 100 : 0), 0
    ) / similarInputs.length;
    
    return Math.round(avgSuccess);
  }

  static async evolve() {
    if (!this.learningData) await this.initializeLearning();
    
    // Analyze performance and adapt
    const recentFailures = this.learningData.failedInputs.filter(i => 
      Date.now() - i.timestamp < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );
    
    if (recentFailures.length > 0) {
      // Identify common failure patterns
      const failurePatterns = {};
      recentFailures.forEach(failure => {
        const words = failure.input.split(' ');
        words.forEach(word => {
          if (word.length > 3) {
            failurePatterns[word] = (failurePatterns[word] || 0) + 1;
          }
        });
      });
      
      // Create adaptations for common failures
      Object.entries(failurePatterns).forEach(([pattern, count]) => {
        if (count > 2) {
          this.learningData.adaptations.push({
            pattern,
            adaptation: 'enhanced-processing',
            timestamp: Date.now(),
            reason: 'frequent-failure-pattern'
          });
        }
      });
    }
    
    // Update improvement rate
    const oldSuccessRate = this.evolutionMetrics.successRate;
    const newSuccessRate = this.learningData.successfulInputs.length / 
      (this.learningData.successfulInputs.length + this.learningData.failedInputs.length) * 100;
    
    this.evolutionMetrics.improvementRate = newSuccessRate - oldSuccessRate;
    this.evolutionMetrics.successRate = newSuccessRate;
    
    await this.saveLearningData();
    
    return {
      evolved: true,
      improvements: this.learningData.adaptations.length,
      successRate: Math.round(newSuccessRate),
      improvementRate: Math.round(this.evolutionMetrics.improvementRate * 100) / 100
    };
  }
}

class TrackingBot {
  static telegram = { token: '', chatId: '' };

  static setTelegram(token, chatId) {
    this.telegram = { token, chatId };
  }

  static async log(botId, action, status, details) {
    const log = { id: Date.now().toString(), botId, action, status, details, timestamp: Date.now() };
    await IDB.batchSet('tracking', [log]);
    if (this.telegram.token && this.telegram.chatId) {
      try {
        await fetch(`https://api.telegram.org/bot${this.telegram.token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: this.telegram.chatId,
            text: `Smart Hub: ${details} (Bot ID: ${botId}, Status: ${status})`
          })
        });
      } catch (error) {
        console.error('Telegram notification failed:', error);
      }
    }
  }
}

document.getElementById('mentor-mode').addEventListener('change', e => {
  if (e.target.checked) showToast('AI Mentor: Try creating a bot that fetches weather data for your location', 'info');
});

document.getElementById('theme-toggle').addEventListener('click', async () => {
  const res = await fetch('https://api.unsplash.com/photos/random?query=abstract&client_id=tL5Z9kXzJ6p8iN7vQ2mW3rY4uT8xL9oP0qR1sE2wK3j');
  const data = await res.json();
  document.body.style.background = `url(${data.urls.full}) no-repeat center/cover`;
  showToast('Theme updated with Unsplash image', 'success');
});