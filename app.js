class IDB {
  static async init() {
    for (let i = 0; i < 3; i++) { // Retry DB init
      try {
        return await new Promise((resolve, reject) => {
          const openRequest = indexedDB.open('SmartHubDB', 2);
          openRequest.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('bots')) db.createObjectStore('bots', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('logs')) db.createObjectStore('logs', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'email' });
            if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
          };
          openRequest.onsuccess = e => resolve(e.target.result);
          openRequest.onerror = e => reject(e);
        });
      } catch (error) {
        console.error(`IndexedDB init failed (attempt ${i + 1}):`, error);
        if (i === 2) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  static async set(store, key, value) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([store], 'readwrite');
      tx.objectStore(store).put(value).onsuccess = () => resolve();
      tx.onerror = e => reject(e);
    });
  }

  static async delete(store, key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([store], 'readwrite');
      tx.objectStore(store).delete(key).onsuccess = () => resolve();
      tx.onerror = e => reject(e);
    });
  }

  static async update(store, key, updates) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([store], 'readwrite');
      const storeObj = tx.objectStore(store);
      storeObj.get(key).onsuccess = ev => storeObj.put({ ...ev.target.result, ...updates }).onsuccess = () => resolve();
      tx.onerror = e => reject(e);
    });
  }

  static async get(store, key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([store], 'readonly');
      tx.objectStore(store).get(key).onsuccess = ev => resolve(ev.target.result);
      tx.onerror = e => reject(e);
    });
  }

  static async getAll(store) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([store], 'readonly');
      tx.objectStore(store).getAll().onsuccess = ev => resolve(ev.target.result);
      tx.onerror = e => reject(e);
    });
  }

  // Compress logs to last 100 entries
  static async compressLogs() {
    let logs = await this.getAll('logs');
    if (logs.length > 100) {
      logs.sort((a, b) => b.timestamp - a.timestamp);
      logs = logs.slice(0, 100);
      const db = await this.init();
      const tx = db.transaction(['logs'], 'readwrite');
      const store = tx.objectStore('logs');
      store.clear();
      logs.forEach(log => store.put(log));
    }
  }
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
  hapticFeedback();
}

function showError(message) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('error').classList.remove('hidden');
  document.getElementById('error-message').textContent = message;
  IDB.set('logs', Date.now().toString(), { message: `Error: ${message}`, timestamp: Date.now() });
  updateDebugPanel();
}

function hapticFeedback(duration = 50) {
  if (navigator.vibrate) navigator.vibrate(duration);
}

function narrate(message) {
  if (!document.getElementById('enable-narration')?.checked) return;
  try {
    const utterance = new SpeechSynthesisUtterance(`Commander, ${message}`);
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Narration error:', error);
    IDB.set('logs', Date.now().toString(), { message: `Narration failed: ${error.message}`, timestamp: Date.now() });
  }
}

function showConfirmDialog(message, onConfirm) {
  const dialog = document.getElementById('confirm-dialog');
  document.getElementById('confirm-message').textContent = message;
  dialog.classList.remove('hidden');
  const yesBtn = document.getElementById('confirm-yes');
  const noBtn = document.getElementById('confirm-no');
  const handleYes = () => {
    onConfirm();
    dialog.classList.add('hidden');
    yesBtn.removeEventListener('click', handleYes);
    noBtn.removeEventListener('click', handleNo);
  };
  const handleNo = () => {
    dialog.classList.add('hidden');
    yesBtn.removeEventListener('click', handleYes);
    noBtn.removeEventListener('click', handleNo);
  };
  yesBtn.addEventListener('click', handleYes);
  noBtn.addEventListener('click', handleNo);
}

// Debug panel
async function updateDebugPanel() {
  const logs = await IDB.getAll('logs');
  logs.sort((a, b) => b.timestamp - a.timestamp);
  document.getElementById('debug-logs').innerHTML = logs.slice(0, 5).map(log => `<div>${log.message}</div>`).join('');
  document.getElementById('debug-panel').classList.remove('hidden');
}

document.getElementById('close-debug')?.addEventListener('click', () => {
  document.getElementById('debug-panel').classList.add('hidden');
});

// Authentication
async function signIn(email, password) {
  try {
    if (!email || !password) throw new Error('Email and password are required');
    const user = await IDB.get('users', email);
    if (!user) throw new Error('User not found');
    if (user.password !== password) throw new Error('Incorrect password');
    localStorage.setItem('currentUser', email);
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('hub-main').classList.remove('hidden');
    if (document.getElementById('enable-metaverse').checked) {
      document.getElementById('metaverse-canvas').classList.remove('hidden');
      loadMetaverse();
    }
    showToast('Signed in successfully', 'success');
    narrate('You are now logged into the Smart Hub.');
    await IDB.set('logs', Date.now().toString(), { message: `User ${email} signed in`, timestamp: Date.now() });
    await Bot.updateBotList();
    await Bot.updateAnalytics();
    await loadLogs();
  } catch (error) {
    showToast(`Login failed: ${error.message}`, 'error');
    document.getElementById('auth-error').textContent = error.message;
    document.getElementById('auth-error').classList.remove('hidden');
    IDB.set('logs', Date.now().toString(), { message: `Login failed: ${error.message}`, timestamp: Date.now() });
  }
}

async function signUp(email, password) {
  try {
    if (!email || !password) throw new Error('Email and password are required');
    const existingUser = await IDB.get('users', email);
    if (existingUser) throw new Error('User already exists');
    await IDB.set('users', email, { email, password });
    localStorage.setItem('currentUser', email);
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('hub-main').classList.remove('hidden');
    if (document.getElementById('enable-metaverse').checked) {
      document.getElementById('metaverse-canvas').classList.remove('hidden');
      loadMetaverse();
    }
    showToast('Account created successfully', 'success');
    narrate('Your account has been created. Welcome to the galaxy!');
    await IDB.set('logs', Date.now().toString(), { message: `User ${email} signed up`, timestamp: Date.now() });
    await Bot.updateBotList();
    await Bot.updateAnalytics();
    await loadLogs();
  } catch (error) {
    showToast(`Signup failed: ${error.message}`, 'error');
    document.getElementById('auth-error').textContent = error.message;
    document.getElementById('auth-error').classList.remove('hidden');
    IDB.set('logs', Date.now().toString(), { message: `Signup failed: ${error.message}`, timestamp: Date.now() });
  }
}

async function logout() {
  localStorage.removeItem('currentUser');
  document.getElementById('hub-main').classList.add('hidden');
  document.getElementById('metaverse-canvas').classList.add('hidden');
  document.getElementById('login-modal').classList.remove('hidden');
  showToast('Logged out', 'info');
  narrate('You have logged out. The galaxy awaits your return.');
  await IDB.set('logs', Date.now().toString(), { message: 'User logged out', timestamp: Date.now() });
}

// Check auth state
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = await IDB.get('users', currentUser);
      if (user) {
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('hub-main').classList.remove('hidden');
        if (document.getElementById('enable-metaverse').checked) {
          document.getElementById('metaverse-canvas').classList.remove('hidden');
          loadMetaverse();
        }
        await Bot.updateBotList();
        await Bot.updateAnalytics();
        await loadLogs();
      }
    }
    // Initialize settings
    await IDB.set('settings', 'metaverse', { key: 'metaverse', enabled: false });
    await IDB.set('settings', 'narration', { key: 'narration', enabled: true });
    await IDB.set('settings', 'learning', { key: 'learning', enabled: false });
  } catch (error) {
    console.error('DOM load error:', error);
    showError(`Initialization failed: ${error.message}`);
  }
});

// Login event listeners
document.getElementById('sign-in-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  await signIn(email, password);
});

document.getElementById('sign-up-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  await signUp(email, password);
});

document.getElementById('logout-btn').addEventListener('click', logout);

// Settings event listeners
document.getElementById('enable-metaverse').addEventListener('change', async e => {
  await IDB.set('settings', 'metaverse', { key: 'metaverse', enabled: e.target.checked });
  if (e.target.checked && !document.getElementById('metaverse-canvas').classList.contains('hidden')) {
    loadMetaverse();
  } else {
    document.getElementById('metaverse-canvas').classList.add('hidden');
  }
});

document.getElementById('enable-narration').addEventListener('change', async e => {
  await IDB.set('settings', 'narration', { key: 'narration', enabled: e.target.checked });
});

document.getElementById('learning-mode').addEventListener('change', async e => {
  await IDB.set('settings', 'learning', { key: 'learning', enabled: e.target.checked });
});

document.getElementById('clear-cache').addEventListener('click', () => {
  showConfirmDialog('Clear all cache and data?', async () => {
    await caches.delete('smart-hub-cache-v8');
    indexedDB.deleteDatabase('SmartHubDB');
    localStorage.clear();
    location.reload();
  });
});

class ConversationManager {
  constructor() {
    this.history = JSON.parse(localStorage.getItem('convoHistory')) || [];
    this.currentIntent = null;
    this.botConfig = {};
    this.userMood = 'neutral';
    this.preferences = JSON.parse(localStorage.getItem('userPrefs')) || { preferredType: 'generic', neural: false };
  }

  addInput(input, type, response) {
    this.history.push({ input, type, response, timestamp: Date.now(), mood: this.userMood });
    if (this.history.length > 10) this.history.shift();
    localStorage.setItem('convoHistory', JSON.stringify(this.history));
  }

  hasAsked(question) {
    return this.history.some(h => h.response?.clarify === question);
  }

  setIntent(intent, config) {
    this.currentIntent = intent;
    this.botConfig = { ...this.botConfig, ...config };
  }

  clearSession() {
    this.currentIntent = null;
    this.botConfig = {};
  }

  getContext() {
    return { history: this.history, intent: this.currentIntent, config: this.botConfig, mood: this.userMood, preferences: this.preferences };
  }

  getLastBotConfig(type) {
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].response?.action?.type === 'create_bot' && this.history[i].response.action.params.type === type) {
        return this.history[i].response.action.params;
      }
    }
    return null;
  }

  updateMood(input) {
    this.userMood = input.includes('awesome') ? 'excited' : input.includes('help') || input.includes('fix') ? 'concerned' : 'neutral';
  }

  updatePreferences(config) {
    this.preferences = { preferredType: config.type || this.preferences.preferredType, neural: config.neural || this.preferences.neural };
    localStorage.setItem('userPrefs', JSON.stringify(this.preferences));
  }
}

const convoManager = new ConversationManager();

class UnifiedAI {
  constructor() {
    this.scene = new THREE.Scene();
    this.avatar = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({ color: 0x33B5FF }));
    this.scene.add(this.avatar);
    this.badges = [];
    this.worker = new Worker('bot-worker.js');
    this.worker.onmessage = e => this.handleWorkerMessage(e.data);
  }

  async processInput(input, type = 'text') {
    try {
      convoManager.updateMood(input);
      let processedInput = input;
      if (type === 'voice') processedInput = await this.transcribeVoice(input);
      else if (type === 'file') processedInput = await this.parseFile(input);
      else if (type === 'clarify') processedInput = { answer: input, context: convoManager.getContext() };
      else if (type === 'text') processedInput = this.extractConfigFromText(input);
      else if (type === 'command') processedInput = this.parseVoiceCommand(input);
      const analysis = await this.analyzeInput(processedInput, type);
      const response = await this.generateResponse(analysis);
      convoManager.addInput(input, type, response);
      this.updateAvatar(response.emotion || convoManager.getContext().mood);
      document.getElementById('ai-message').textContent = response.message;
      if (response.clarify) this.showClarifyQuestion(response.clarify);
      else if (response.action) {
        await this.executeAction(response.action);
        convoManager.clearSession();
        document.getElementById('clarify-input').classList.add('hidden');
        this.checkBadges();
      }
      narrate(response.message);
      return response;
    } catch (error) {
      console.error('AI process error:', error);
      showToast(`AI error: ${error.message}`, 'error');
      IDB.set('logs', Date.now().toString(), { message: `AI processing failed: ${error.message}`, timestamp: Date.now() });
    }
  }

  async transcribeVoice(audioBlob) {
    return audioBlob.toString().toLowerCase();
  }

  async parseFile(file) {
    const type = file.type;
    if (type === 'application/json') {
      const text = await file.text();
      const config = JSON.parse(text);
      return { name: config.name || file.name.replace('.json', ''), code: config.code || '// Bot code', type: config.type || 'generic', neural: config.neural || false, schedule: config.schedule, chain: config.chain };
    } else if (type === 'application/x-yaml' || type === 'text/yaml') {
      const text = await file.text();
      const lines = text.split('\n');
      const config = {};
      lines.forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        if (key === 'name') config.name = value;
        if (key === 'code') config.code = value || '// Bot code';
        if (key === 'type') config.type = value || 'generic';
        if (key === 'neural') config.neural = value === 'true';
        if (key === 'schedule') config.schedule = value;
        if (key === 'chain') config.chain = value;
      });
      return { name: config.name || file.name.replace('.yaml', ''), code: config.code || '// Bot code', type: config.type || 'generic', neural: config.neural || false, schedule: config.schedule, chain: config.chain };
    }
    throw new Error('Unsupported file type');
  }

  parseVoiceCommand(command) {
    command = command.toLowerCase();
    if (command.includes('start all')) return { action: 'batch_start' };
    if (command.includes('stop all')) return { action: 'batch_stop' };
    if (command.includes('delete all')) return { action: 'batch_delete' };
    return this.extractConfigFromText(command);
  }

  extractConfigFromText(text) {
    text = text.toLowerCase();
    let type = convoManager.preferences.preferredType;
    let schedule = null;
    let chain = null;
    if (text.includes('weather')) type = 'weather';
    else if (text.includes('twitter') || text.includes('tweet')) type = 'twitter';
    else if (text.includes('scrape') || text.includes('scraper')) type = 'scraper';
    else if (text.includes('custom')) type = 'custom';
    let name = text.match(/build (.+?) bot/i)?.[1] || 'Generic Bot';
    let neural = text.includes('neural') || text.includes('ai') || convoManager.preferences.neural;
    if (text.includes('every')) schedule = text.match(/every (\d+) minutes/i)?.[1] || null;
    if (text.includes('chain') || text.includes('then')) chain = text.match(/chain (.+?)(?:\s|$)/)?.[1] || text.match(/then (.+?)(?:\s|$)/)?.[1] || null;
    let code = this.generateCode(type);
    return { name, type, neural, code, schedule, chain };
  }

  generateCode(type) {
    const templates = {
      weather: '// Weather bot code (configure locally)',
      twitter: '// Twitter bot code (configure locally)',
      scraper: '// Scraper bot code (configure target URL)',
      custom: '// Custom bot code (configure as needed)',
      generic: '// Generic bot code'
    };
    return templates[type] || '// Generic bot code';
  }

  async analyzeInput(input, type) {
    const context = convoManager.getContext();
    let intent = context.intent || 'create_bot';
    let botConfig = { ...context.config };
    if (type === 'clarify') botConfig = { ...botConfig, ...this.parseClarifyAnswer(input.answer, input.context) };
    else if (type === 'command') intent = input.action;
    else botConfig = input;

    if ((type === 'text' || type === 'voice') && (input.name?.toLowerCase().includes('another') || input.name?.toLowerCase().includes('similar'))) {
      const lastConfig = convoManager.getLastBotConfig(botConfig.type);
      if (lastConfig) botConfig = { ...lastConfig, name: `${lastConfig.name} Copy` };
    }

    if (!botConfig.type || !botConfig.name) intent = 'clarify';
    if (document.getElementById('learning-mode').checked && type !== 'command') {
      const logs = await IDB.getAll('logs');
      const recentErrors = logs.filter(log => log.message.includes('failed') && log.timestamp > Date.now() - 24 * 60 * 60 * 1000);
      if (recentErrors.length > 0) {
        botConfig.suggestion = `Noticed recent errors in ${botConfig.type} bots. Want to add error handling?`;
      }
    }
    convoManager.setIntent(intent, botConfig);
    convoManager.updatePreferences(botConfig);
    return { intent, botConfig };
  }

  parseClarifyAnswer(answer, context) {
    const config = {};
    if (!context.config.name) config.name = answer || 'Generic Bot';
    if (!context.config.type) config.type = answer.match(/weather/i) ? 'weather' : answer.match(/twitter|tweet/i) ? 'twitter' : answer.match(/scrape/i) ? 'scraper' : answer.match(/custom/i) ? 'custom' : 'generic';
    if (!context.config.code) config.code = this.generateCode(config.type || context.config.type);
    config.neural = answer.includes('neural');
    config.schedule = answer.match(/every (\d+) minutes/i)?.[1] || context.config.schedule;
    config.chain = answer.match(/chain (.+?)(?:\s|$)/)?.[1] || context.config.chain;
    return config;
  }

  async generateResponse(analysis) {
    const mood = convoManager.getContext().mood;
    if (analysis.intent === 'create_bot' && analysis.botConfig.name && analysis.botConfig.type) {
      let suggestion = mood === 'excited' ? ' Hell yeah, this bot’s gonna rock!' : mood === 'concerned' ? ' Let’s make this bot solid.' : '';
      if (analysis.botConfig.suggestion) suggestion += ` ${analysis.botConfig.suggestion}`;
      return { message: `Forging ${analysis.botConfig.name} bot...${suggestion}`, action: { type: 'create_bot', params: analysis.botConfig }, emotion: mood };
    } else if (analysis.intent.startsWith('batch_')) {
      return { message: `Executing ${analysis.intent.replace('batch_', '')} on selected bots...`, action: { type: analysis.intent }, emotion: mood };
    }
    let clarify = !analysis.botConfig.name && !convoManager.hasAsked('What should the bot be named?') ? 'What should the bot be named?' :
                  !analysis.botConfig.type && !convoManager.hasAsked('What type of bot do you want (e.g., weather, twitter, scraper, custom)?') ? 'What type of bot do you want (e.g., weather, twitter, scraper, custom)?' : '';
    return { message: clarify || 'I need more details to create the bot.', clarify, emotion: mood };
  }

  showClarifyQuestion(question) {
    const clarifyDiv = document.getElementById('clarify-input');
    document.getElementById('clarify-question').textContent = question;
    clarifyDiv.classList.remove('hidden');
  }

  updateAvatar(emotion) {
    this.avatar.material.color.set(emotion === 'excited' ? 0xFF33FF : emotion === 'concerned' ? 0xFFFF33 : 0x33B5FF);
  }

  async executeAction(action) {
    if (action.type === 'create_bot') {
      const bot = await Bot.create(action.params);
      await IDB.set('logs', Date.now().toString(), { message: `Bot ${action.params.name} created`, timestamp: Date.now() });
      if (action.params.type !== 'generic') Bot.run(bot.id);
      if (action.params.chain) Bot.chain(bot.id, action.params.chain);
    } else if (action.type === 'batch_start') {
      const selected = Array.from(document.querySelectorAll('.bot-item input:checked')).map(cb => cb.closest('.bot-item').dataset.id);
      for (const id of selected) await Bot.start(id);
    } else if (action.type === 'batch_stop') {
      const selected = Array.from(document.querySelectorAll('.bot-item input:checked')).map(cb => cb.closest('.bot-item').dataset.id);
      for (const id of selected) await Bot.stop(id);
    } else if (action.type === 'batch_delete') {
      showConfirmDialog('Delete all selected bots?', async () => {
        const selected = Array.from(document.querySelectorAll('.bot-item input:checked')).map(cb => cb.closest('.bot-item').dataset.id);
        for (const id of selected) await Bot.delete(id);
      });
    }
  }

  async checkBadges() {
    const bots = await IDB.getAll('bots');
    if (bots.length >= 10 && !this.badges.includes('bot_master')) {
      this.badges.push('bot_master');
      showToast('Badge Unlocked: Bot Master! Created 10+ bots.', 'success');
      narrate('You’ve earned the Bot Master badge, Commander!');
    }
  }

  handleWorkerMessage({ botId, result, error }) {
    if (error) {
      showToast(`Bot ${botId} failed: ${error}`, 'error');
      IDB.update('bots', botId, { errors: (bot => (bot.errors || 0) + 1)(IDB.get('bots', botId)) });
      IDB.set('logs', Date.now().toString(), { message: `Bot ${botId} failed: ${error}`, timestamp: Date.now() });
    } else {
      showToast(`Bot ${botId} ran successfully`, 'success');
      IDB.update('bots', botId, { 
        runs: (bot => (bot.runs || 0) + 1)(IDB.get('bots', botId)), 
        totalRuntime: (bot => (bot.totalRuntime || 0) + (result.runtime || 0))(IDB.get('bots', botId)) 
      });
      IDB.set('logs', Date.now().toString(), { message: `Bot ${botId} executed`, timestamp: Date.now() });
    }
    Bot.updateAnalytics();
  }
}

const ai = new UnifiedAI();

class Bot {
  static async create(params) {
    const botId = Date.now().toString();
    const bot = { 
      id: botId, 
      name: params.name, 
      status: 'stopped', 
      code: params.code, 
      type: params.type, 
      neural: params.neural, 
      schedule: params.schedule, 
      chain: params.chain, 
      createdAt: new Date().toISOString(), 
      version: 1, 
      versions: [{ version: 1, code: params.code, timestamp: new Date().toISOString() }], 
      runs: 0, 
      errors: 0, 
      totalRuntime: 0 
    };
    await IDB.set('bots', botId, bot);
    await this.updateBotList();
    addWidget('status', { x: Math.random() * 5, y: 1, z: Math.random() * 5 }, botId);
    narrate(`Bot ${bot.name} forged.`);
    showToast(`Bot ${bot.name} created`, 'success');
    if (bot.schedule) this.scheduleBot(botId, parseInt(bot.schedule));
    return bot;
  }

  static async start(botId) {
    await IDB.update('bots', botId, { status: 'running' });
    await this.updateBotList();
    showToast(`Bot ${botId} started`, 'success');
    narrate(`Bot ${botId} is now active.`);
    await IDB.set('logs', Date.now().toString(), { message: `Bot ${botId} started`, timestamp: Date.now() });
    this.run(botId);
  }

  static async stop(botId) {
    await IDB.update('bots', botId, { status: 'stopped' });
    await this.updateBotList();
    showToast(`Bot ${botId} stopped`, 'success');
    narrate(`Bot ${botId} halted.`);
    await IDB.set('logs', Date.now().toString(), { message: `Bot ${botId} stopped`, timestamp: Date.now() });
  }

  static async delete(botId) {
    await IDB.delete('bots', botId);
    await this.updateBotList();
    showToast('Bot deleted', 'success');
    narrate(`Bot ${botId} decommissioned.`);
    await IDB.set('logs', Date.now().toString(), { message: `Bot ${botId} deleted`, timestamp: Date.now() });
  }

  static async edit(botId, newCode) {
    const bot = await IDB.get('bots', botId);
    const isHighRisk = newCode.includes('delete') || newCode.includes('drop');
    if (isHighRisk) {
      showConfirmDialog('This code contains high-risk operations. Approve?', async () => {
        const newVersion = bot.version + 1;
        bot.versions.push({ version: newVersion, code: newCode, timestamp: new Date().toISOString() });
        await IDB.update('bots', botId, { code: newCode, version: newVersion, versions: bot.versions });
        await this.updateBotList();
        showToast('Bot code updated', 'success');
        narrate(`Bot ${bot.name} code updated to version ${newVersion}.`);
        await IDB.set('logs', Date.now().toString(), { message: `Bot ${botId} code updated`, timestamp: Date.now() });
      });
    } else {
      const newVersion = bot.version + 1;
      bot.versions.push({ version: newVersion, code: newCode, timestamp: new Date().toISOString() });
      await IDB.update('bots', botId, { code: newCode, version: newVersion, versions: bot.versions });
      await this.updateBotList();
      showToast('Bot code updated', 'success');
      narrate(`Bot ${bot.name} code updated to version ${newVersion}.`);
      await IDB.set('logs', Date.now().toString(), { message: `Bot ${botId} code updated`, timestamp: Date.now() });
    }
  }

  static async run(botId) {
    const bot = await IDB.get('bots', botId);
    ai.worker.postMessage({ botId, code: bot.code });
  }

  static scheduleBot(botId, minutes) {
    setInterval(async () => {
      const bot = await IDB.get('bots', botId);
      if (bot.status === 'running') {
        await this.run(botId);
      }
    }, minutes * 60 * 1000);
    showToast(`Bot ${botId} scheduled to run every ${minutes} minutes`, 'info');
    narrate(`Bot ${botId} scheduled for action.`);
  }

  static async chain(botId, nextBotName) {
    const bots = await IDB.getAll('bots');
    const nextBot = bots.find(b => b.name.toLowerCase() === nextBotName.toLowerCase());
    if (!nextBot) {
      showToast(`Chained bot ${nextBotName} not found`, 'error');
      return;
    }
    await this.run(botId);
    await this.run(nextBot.id);
    showToast(`Chained ${botId} to ${nextBot.name}`, 'success');
    narrate(`Bots ${botId} and ${nextBot.name} chained for action.`);
  }

  static async share(botIds, email) {
    const bots = await Promise.all(botIds.map(id => IDB.get('bots', id)));
    const mailto = `mailto:${email}?subject=Shared Bots&body=${encodeURIComponent(JSON.stringify(bots, null, 2))}`;
    window.location.href = mailto;
    showToast(`Bots shared with ${email}`, 'success');
    narrate(`Bots sent to ${email}.`);
  }

  static async updateBotList() {
    const bots = await IDB.getAll('bots');
    document.getElementById('bot-list').innerHTML = bots.map(bot => {
      const health = bot.errors > bot.runs * 0.1 ? 'error' : 'healthy';
      return `
        <div class="bot-item" data-id="${bot.id}">
          <input type="checkbox" class="bot-select">
          ${bot.name} (${bot.type}${bot.neural ? ', Neural' : ''}) - ${bot.status} (v${bot.version})
          <span class="bot-health ${health}">${health === 'error' ? 'Unstable' : 'Stable'}</span>
          ${bot.schedule ? '[Every ${bot.schedule} min]' : ''}${bot.chain ? '[Chain: ${bot.chain}]' : ''}
          <button onclick="Bot.start('${bot.id}')">Start</button>
          <button onclick="Bot.stop('${bot.id}')">Stop</button>
          <button onclick="Bot.editView('${bot.id}')">Edit</button>
          <button onclick="Bot.delete('${bot.id}')">Delete</button>
        </div>
      `;
    }).join('');
    document.getElementById('batch-actions').classList.toggle('hidden', bots.length === 0);
    document.querySelectorAll('.bot-select').forEach(cb => {
      cb.addEventListener('change', () => {
        const anyChecked = Array.from(document.querySelectorAll('.bot-select')).some(cb => cb.checked);
        document.getElementById('batch-actions').classList.toggle('hidden', !anyChecked);
      });
    });
  }

  static async updateAnalytics() {
    const bots = await IDB.getAll('bots');
    const canvas = document.getElementById('analytics-chart');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / bots.length / 3 - 10;
    const maxRuns = Math.max(...bots.map(b => b.runs || 0), 1);
    const maxErrors = Math.max(...bots.map(b => b.errors || 0), 1);
    const maxRuntime = Math.max(...bots.map(b => b.runs ? (b.totalRuntime || 0) / b.runs : 0), 1);

    bots.forEach((bot, i) => {
      const x = i * (barWidth * 3 + 30);
      ctx.fillStyle = '#33B5FF';
      ctx.fillRect(x, canvas.height - (bot.runs / maxRuns) * canvas.height * 0.8, barWidth, (bot.runs / maxRuns) * canvas.height * 0.8);
      ctx.fillStyle = '#FF3333';
      ctx.fillRect(x + barWidth + 5, canvas.height - (bot.errors / maxErrors) * canvas.height * 0.8, barWidth, (bot.errors / maxErrors) * canvas.height * 0.8);
      ctx.fillStyle = '#33FF33';
      const avgRuntime = bot.runs ? (bot.totalRuntime || 0) / bot.runs : 0;
      ctx.fillRect(x + (barWidth + 5) * 2, canvas.height - (avgRuntime / maxRuntime) * canvas.height * 0.8, barWidth, (avgRuntime / maxRuntime) * canvas.height * 0.8);
      ctx.fillStyle = '#FFF';
      ctx.font = '12px Orbitron';
      ctx.fillText(bot.name, x, canvas.height - 10);
    });
  }

  static editView(botId) {
    IDB.get('bots', botId).then(bot => {
      document.getElementById('edit-bot-name').textContent = `Editing ${bot.name}`;
      document.getElementById('code-editor').value = bot.code;
      document.getElementById('bots-tab').classList.add('hidden');
      document.getElementById('edit-bot-tab').classList.remove('hidden');
      document.getElementById('save-edit-btn').onclick = () => {
        Bot.edit(botId, document.getElementById('code-editor').value);
        document.getElementById('edit-bot-tab').classList.add('hidden');
        document.getElementById('bots-tab').classList.remove('hidden');
      };
    });
  }
}

async function loadLogs(search = '') {
  let logs = await IDB.getAll('logs');
  if (search) logs = logs.filter(log => log.message.toLowerCase().includes(search.toLowerCase()));
  logs.sort((a, b) => b.timestamp - a.timestamp);
  document.getElementById('log-list').innerHTML = logs.slice(0, 10).map(log => `<div class="bot-item">${log.message}</div>`).join('');
}

// Download logs
document.getElementById('download-logs')?.addEventListener('click', async () => {
  const logs = await IDB.getAll('logs');
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'smart-hub-logs.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Logs downloaded', 'success');
});

// Event Listeners
document.getElementById('voice-input-btn').addEventListener('click', () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.start();
  recognition.onresult = e => ai.processInput(e.results[0][0].transcript, e.results[0][0].transcript.includes('all') ? 'command' : 'voice');
});

document.getElementById('text-input-btn').addEventListener('click', () => {
  document.getElementById('text-input').classList.toggle('hidden');
});

document.getElementById('submit-text').addEventListener('click', () => {
  const description = document.getElementById('text-answer').value;
  if (description) {
    ai.processInput(description, 'text');
    document.getElementById('text-input').classList.add('hidden');
  }
});

document.getElementById('submit-clarify').addEventListener('click', () => {
  const answer = document.getElementById('clarify-answer').value;
  if (answer) ai.processInput(answer, 'clarify');
});

document.getElementById('file-upload').addEventListener('drop', async e => {
  e.preventDefault();
  for (const file of e.dataTransfer.files) await ai.processInput(file, 'file');
});

document.getElementById('file-input').addEventListener('change', async e => {
  for (const file of e.target.files) await ai.processInput(file, 'file');
});

document.getElementById('log-search').addEventListener('input', e => loadLogs(e.target.value));

document.getElementById('template-btn').addEventListener('click', () => {
  document.getElementById('template-panel').classList.toggle('hidden');
});

document.querySelectorAll('.template-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    const config = {
      weather: { name: 'Weather Bot', type: 'weather', code: ai.generateCode('weather'), neural: convoManager.preferences.neural },
      twitter: { name: 'Twitter Bot', type: 'twitter', code: ai.generateCode('twitter'), neural: convoManager.preferences.neural },
      scraper: { name: 'Scraper Bot', type: 'scraper', code: ai.generateCode('scraper'), neural: convoManager.preferences.neural },
      custom: { name: 'Custom Bot', type: 'custom', code: ai.generateCode('custom'), neural: true }
    }[type];
    ai.processInput(config, 'text');
    document.getElementById('template-panel').classList.add('hidden');
  });
});

document.getElementById('batch-start').addEventListener('click', () => ai.processInput('start all', 'command'));
document.getElementById('batch-stop').addEventListener('click', () => ai.processInput('stop all', 'command'));
document.getElementById('batch-delete').addEventListener('click', () => ai.processInput('delete all', 'command'));
document.getElementById('batch-share').addEventListener('click', () => {
  document.getElementById('share-panel').classList.toggle('hidden');
});

document.getElementById('share-submit').addEventListener('click', async () => {
  const email = document.getElementById('share-email').value;
  const selected = Array.from(document.querySelectorAll('.bot-item input:checked')).map(cb => cb.closest('.bot-item').dataset.id);
  if (email && selected.length) {
    await Bot.share(selected, email);
    document.getElementById('share-panel').classList.add('hidden');
  } else {
    showToast('Enter an email and select bots', 'error');
  }
});

document.getElementById('ai-toggle').addEventListener('click', () => {
  const panel = document.getElementById('ai-avatar-panel');
  const isOpen = panel.dataset.state === 'open';
  panel.dataset.state = isOpen ? 'closed' : 'open';
  panel.classList.toggle('hidden', isOpen);
});

document.getElementById('theme-toggle').addEventListener('click', () => {
  const themes = ['cyberpunk', 'dark', 'light'];
  const current = document.body.className || 'cyberpunk';
  const next = themes[(themes.indexOf(current) + 1) % themes.length];
  document.body.className = next;
  showToast(`Switched to ${next} theme`, 'info');
  narrate(`Theme switched to ${next}.`);
});

document.addEventListener('click', e => {
  const panels = ['template-panel', 'share-panel', 'clarify-input', 'text-input', 'debug-panel'];
  if (!e.target.closest('.panel, .modal, .btn, .avatar-panel')) {
    panels.forEach(id => document.getElementById(id).classList.add('hidden'));
  }
});

// Improved swipe detection
let touchstartX = 0, touchstartY = 0, touchendX = 0, touchendY = 0;
document.addEventListener('touchstart', e => {
  touchstartX = e.changedTouches[0].screenX;
  touchstartY = e.changedTouches[0].screenY;
});
document.addEventListener('touchend', e => {
  touchendX = e.changedTouches[0].screenX;
  touchendY = e.changedTouches[0].screenY;
  if (Math.abs(touchendY - touchstartY) > 50) return; // Ignore vertical swipes
  if (touchendX < touchstartX - 100) {
    const tabs = ['bots', 'logs', 'analytics', 'settings'];
    const active = document.querySelector('.tab-btn.active').dataset.tab;
    const next = tabs[(tabs.indexOf(active) + 1) % tabs.length];
    document.querySelector(`[data-tab="${next}"]`).click();
    showToast(`Swiped to ${next}`, 'info');
  } else if (touchendX > touchstartX + 100) {
    const tabs = ['bots', 'logs', 'analytics', 'settings'];
    const active = document.querySelector('.tab-btn.active').dataset.tab;
    const prev = tabs[(tabs.indexOf(active) - 1 + tabs.length) % tabs.length];
    document.querySelector(`[data-tab="${prev}"]`).click();
    showToast(`Swiped to ${prev}`, 'info');
  }
});

// Lazy-load Metaverse
let scene, camera, renderer, controls, raycaster, mouse;
async function loadMetaverse() {
  try {
    // Load Three.js dynamically
    await Promise.all([
      import('https://cdn.jsdelivr.net/npm/three@0.141.0/build/three.min.js'),
      import('https://cdn.jsdelivr.net/npm/three@0.141.0/examples/js/controls/OrbitControls.js')
    ]);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('metaverse-canvas'), alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    scene.background = new THREE.Color(0x0D1B2A);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const room = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ color: 0x33B5FF, opacity: 0.3, transparent: true, side: THREE.DoubleSide }));
    room.rotation.x = Math.PI / 2;
    scene.add(room);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    camera.position.set(0, 3, 5);
    camera.lookAt(0, 0, 0);
    animate();
  } catch (error) {
    console.error('Metaverse setup error:', error);
    showToast('Failed to load metaverse', 'error');
    IDB.set('logs', Date.now().toString(), { message: `Metaverse setup failed: ${error.message}`, timestamp: Date.now() });
  }
}

function addWidget(type, position, botId) {
  if (!scene) return;
  const widget = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshBasicMaterial({ color: type === 'status' ? 0xFF3333 : 0x33B5FF }));
  widget.position.set(position.x, position.y, position.z);
  widget.userData = { botId };
  scene.add(widget);
}

function animate() {
  if (!renderer?.getContext()) return;
  requestAnimationFrame(animate);
  scene.children.forEach(child => {
    if (child.geometry.type === 'SphereGeometry') child.position.y = Math.sin(Date.now() * 0.002 + child.position.x) * 0.3 + 1;
  });
  controls.update();
  renderer.render(scene, camera);
}

document.getElementById('metaverse-canvas').addEventListener('click', e => {
  if (!raycaster) return;
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);
  if (intersects.length > 0) {
    const botId = intersects[0].object.userData.botId;
    if (botId) {
      IDB.get('bots', botId).then(bot => {
        showToast(`Bot: ${bot.name} (${bot.status})`, 'info');
        narrate(`Selected bot ${bot.name}.`);
        Bot.editView(botId);
      });
    }
  }
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(`${btn.dataset.tab}-tab`).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    narrate(`Navigating to ${btn.dataset.tab} sector.`);
    if (btn.dataset.tab === 'logs') loadLogs();
    if (btn.dataset.tab === 'analytics') Bot.updateAnalytics();
  });
});
