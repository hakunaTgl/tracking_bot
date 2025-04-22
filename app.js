import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, where } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.141.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.141.0/examples/jsm/controls/OrbitControls.js';
import { Chart } from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.esm.js';

const firebaseConfig = {
  apiKey: "AIzaSyBONwaRl23VeTJISmiQ3X-t3y6FGK7Ngjc",
  authDomain: "tglsmarthub.firebaseapp.com",
  projectId: "tglsmarthub",
  storageBucket: "tglsmarthub.firebasestorage.app",
  messagingSenderId: "361291241205",
  appId: "1:361291241205:web:854f79a0238e6e4795d7bc",
  measurementId: "G-LQ4BP8GG37"
};

try {
  initializeApp(firebaseConfig);
  console.log('Firebase initialized');
  document.getElementById('loading')?.classList.add('hidden');
} catch (error) {
  console.error('Firebase init error:', error);
  showError(`Failed to initialize Firebase: ${error.message}`);
}
const auth = getAuth();
const db = getFirestore();
const messaging = getMessaging();

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
}

function hapticFeedback(duration = 50) {
  if (navigator.vibrate) navigator.vibrate(duration);
}

function narrate(message) {
  try {
    const utterance = new SpeechSynthesisUtterance(`Commander, ${message}`);
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Narration error:', error);
    logError('Narration failed', error.message);
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

async function logError(message, details) {
  try {
    await addDoc(collection(db, 'errors'), { message, details, timestamp: Date.now(), user: auth.currentUser?.uid });
  } catch (error) {
    console.error('Error logging failed:', error);
  }
}

function setupPushNotifications() {
  try {
    getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' }).then(token => {
      if (token) {
        addDoc(collection(db, 'users'), { uid: auth.currentUser.uid, pushToken: token });
      }
    }).catch(err => console.error('Push token error:', err));
    onMessage(messaging, payload => {
      showToast(payload.notification.body, 'info');
      narrate(payload.notification.body);
    });
  } catch (error) {
    console.error('Push setup error:', error);
    logError('Push setup failed', error.message);
  }
}

class IDB {
  static async init() {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open('SmartHubDB', 2);
      openRequest.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('bots')) {
          db.createObjectStore('bots', { keyPath: 'id' });
        }
      };
      openRequest.onsuccess = e => resolve(e.target.result);
      openRequest.onerror = e => reject(e);
    });
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
}

class ConversationManager {
  constructor() {
    this.history = JSON.parse(localStorage.getItem('convoHistory')) || [];
    this.currentIntent = null;
    this.botConfig = {};
    this.userMood = 'neutral';
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
    return { history: this.history, intent: this.currentIntent, config: this.botConfig, mood: this.userMood };
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
    this.userMood = input.includes('awesome') || input.includes('bitchh') ? 'excited' : input.includes('help') || input.includes('fix') ? 'concerned' : 'neutral';
  }
}

const convoManager = new ConversationManager();

class UnifiedAI {
  constructor() {
    this.avatar = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({ color: 0x33B5FF }));
    this.scene = new THREE.Scene();
    this.scene.add(this.avatar);
    this.feedbackScores = { positive: 0, negative: 0 };
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
        document.getElementById('feedback').classList.remove('hidden');
        this.checkBadges();
      }
      narrate(response.message);
      return response;
    } catch (error) {
      console.error('AI process error:', error);
      showToast(`AI error: ${error.message}`, 'error');
      logError('AI processing failed', error.message);
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
      return { name: config.name || file.name.replace('.json', ''), code: config.code || '// Bot code', type: config.type || 'generic', neural: config.neural || false, apiKey: config.apiKey, schedule: config.schedule, chain: config.chain };
    } else if (type === 'application/x-yaml' || type === 'text/yaml') {
      const text = await file.text();
      return { name: text.match(/name: (.+)/)?.[1] || file.name.replace('.yaml', ''), code: text.match(/code: (.+)/)?.[1] || '// Bot code', type: text.match(/type: (.+)/)?.[1] || 'generic', neural: text.includes('neural: true'), apiKey: text.match(/apiKey: (.+)/)?.[1], schedule: text.match(/schedule: (.+)/)?.[1], chain: text.match(/chain: (.+)/)?.[1] };
    } else if (type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        text += (await page.getTextContent()).items.map(item => item.str).join(' ');
      }
      return this.extractConfigFromText(text);
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
    let type = 'generic';
    let apiKey = null;
    let schedule = null;
    let chain = null;
    if (text.includes('weather')) type = 'weather';
    else if (text.includes('twitter') || text.includes('tweet')) type = 'twitter';
    else if (text.includes('scrape') || text.includes('scraper')) type = 'scraper';
    else if (text.includes('custom')) type = 'custom';
    let name = text.match(/build (.+?) bot/i)?.[1] || 'Generic Bot';
    let neural = text.includes('neural') || text.includes('ai');
    if (type === 'custom') apiKey = text.match(/api key (.+?)(?:\s|$)/)?.[1] || null;
    if (text.includes('every')) schedule = text.match(/every (\d+) minutes/i)?.[1] || null;
    if (text.includes('chain') || text.includes('then')) chain = text.match(/chain (.+?)(?:\s|$)/)?.[1] || text.match(/then (.+?)(?:\s|$)/)?.[1] || null;
    let code = this.generateCode(type, apiKey);
    if (this.feedbackScores.positive > this.feedbackScores.negative) {
      code = this.optimizeCode(code);
    }
    return { name, type, neural, code, apiKey, schedule, chain };
  }

  optimizeCode(code) {
    if (code.includes('fetch')) {
      return `
try {
  ${code.replace('fetch', 'fetch').replace('}', '}} catch (error) { console.error("Bot error:", error); return { error: error.message }; }')}
`;
    }
    return code;
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
    convoManager.setIntent(intent, botConfig);
    return { intent, botConfig };
  }

  parseClarifyAnswer(answer, context) {
    const config = {};
    if (!context.config.name) config.name = answer || 'Generic Bot';
    if (!context.config.type) config.type = answer.match(/weather/i) ? 'weather' : answer.match(/twitter|tweet/i) ? 'twitter' : answer.match(/scrape/i) ? 'scraper' : answer.match(/custom/i) ? 'custom' : 'generic';
    if (!context.config.code) config.code = this.generateCode(config.type || context.config.type, context.config.apiKey);
    config.neural = answer.includes('neural');
    config.apiKey = answer.match(/api key (.+?)(?:\s|$)/)?.[1] || context.config.apiKey;
    config.schedule = answer.match(/every (\d+) minutes/i)?.[1] || context.config.schedule;
    config.chain = answer.match(/chain (.+?)(?:\s|$)/)?.[1] || context.config.chain;
    return config;
  }

  generateCode(type, apiKey) {
    const templates = {
      weather: `async function run() { return await (await fetch("https://api.openweathermap.org/data/2.5/weather?q=London&appid=${apiKey || 'YOUR_API_KEY'}")).json(); }`,
      twitter: `async function run() { return { status: "Tweet posted" }; }`,
      scraper: `async function run() { return await (await fetch("https://example.com")).text(); }`,
      custom: `async function run() { return await (await fetch("YOUR_API_URL?key=${apiKey || 'YOUR_API_KEY'}")).json(); }`,
      generic: '// Generic bot code'
    };
    return templates[type] || '// Generic bot code';
  }

  async generateResponse(analysis) {
    const mood = convoManager.getContext().mood;
    if (analysis.intent === 'create_bot' && analysis.botConfig.name && analysis.botConfig.type) {
      let suggestion = mood === 'excited' ? ' Hell yeah, this bot’s gonna dominate!' : mood === 'concerned' ? ' Let’s make this bot bulletproof.' : '';
      if (this.feedbackScores.negative > 0) suggestion += ' Tip: Try specifying an API key or chain for advanced bots.';
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
      await addDoc(collection(db, 'logs'), { message: `Bot ${action.params.name} created`, timestamp: Date.now() });
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

  updateFeedback(rating) {
    this.feedbackScores[rating === 'yes' ? 'positive' : 'negative']++;
  }

  handleWorkerMessage({ botId, result, error }) {
    if (error) {
      showToast(`Bot ${botId} failed: ${error}`, 'error');
      IDB.update('bots', botId, { errors: (bot => bot.errors + 1)(IDB.get('bots', botId)) });
      addDoc(collection(db, 'logs'), { message: `Bot ${botId} failed: ${error}`, timestamp: Date.now() });
    } else {
      showToast(`Bot ${botId} ran successfully: ${JSON.stringify(result).slice(0, 50)}`, 'success');
      IDB.update('bots', botId, { runs: (bot => bot.runs + 1)(IDB.get('bots', botId)), totalRuntime: (bot => bot.totalRuntime + result.runtime)(IDB.get('bots', botId)) });
      addDoc(collection(db, 'logs'), { message: `Bot ${botId} executed: ${JSON.stringify(result)}`, timestamp: Date.now() });
    }
    Bot.updateAnalytics();
  }
}

const ai = new UnifiedAI();

class Bot {
  static async create(params) {
    const botId = Date.now().toString();
    const bot = { id: botId, name: params.name, status: 'stopped', code: params.code, type: params.type, neural: params.neural, apiKey: params.apiKey, schedule: params.schedule, chain: params.chain, createdAt: new Date().toISOString(), version: 1, versions: [{ version: 1, code: params.code, timestamp: new Date().toISOString() }], runs: 0, errors: 0, totalRuntime: 0 };
    await IDB.set('bots', botId, bot);
    await this.updateBotList();
    addWidget('status', { x: Math.random() * 5, y: 1, z: Math.random() * 5 }, botId);
    narrate(`Bot ${bot.name} forged in the galactic foundry.`);
    showToast(`Bot ${bot.name} created`, 'success');
    if (bot.schedule) this.scheduleBot(botId, parseInt(bot.schedule));
    return bot;
  }

  static async start(botId) {
    await IDB.update('bots', botId, { status: 'running' });
    await this.updateBotList();
    showToast(`Bot ${botId} started`, 'success');
    narrate(`Bot ${botId} is now active.`);
    await addDoc(collection(db, 'logs'), { message: `Bot ${botId} started`, timestamp: Date.now() });
    this.run(botId);
  }

  static async stop(botId) {
    await IDB.update('bots', botId, { status: 'stopped' });
    await this.updateBotList();
    showToast(`Bot ${botId} stopped`, 'success');
    narrate(`Bot ${botId} halted.`);
    await addDoc(collection(db, 'logs'), { message: `Bot ${botId} stopped`, timestamp: Date.now() });
  }

  static async delete(botId) {
    await IDB.delete('bots', botId);
    await this.updateBotList();
    showToast('Bot deleted', 'success');
    narrate(`Bot ${botId} decommissioned.`);
    await addDoc(collection(db, 'logs'), { message: `Bot ${botId} deleted`, timestamp: Date.now() });
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
        await addDoc(collection(db, 'logs'), { message: `Bot ${botId} code updated`, timestamp: Date.now() });
      });
    } else {
      const newVersion = bot.version + 1;
      bot.versions.push({ version: newVersion, code: newCode, timestamp: new Date().toISOString() });
      await IDB.update('bots', botId, { code: newCode, version: newVersion, versions: bot.versions });
      await this.updateBotList();
      showToast('Bot code updated', 'success');
      narrate(`Bot ${bot.name} code updated to version ${newVersion}.`);
      await addDoc(collection(db, 'logs'), { message: `Bot ${botId} code updated`, timestamp: Date.now() });
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
    await addDoc(collection(db, 'shared_bots'), { bots, recipient: email, sender: auth.currentUser.email, timestamp: Date.now() });
    showToast(`Bots shared with ${email}`, 'success');
    narrate(`Bots sent to ${email}.`);
  }

  static async updateBotList() {
    const bots = await IDB.getAll('bots');
    document.getElementById('bot-list').innerHTML = bots.map(bot => `
      <div class="bot-item" data-id="${bot.id}">
        <input type="checkbox" class="bot-select">
        ${bot.name} (${bot.type}${bot.neural ? ', Neural' : ''}) - ${bot.status} (v${bot.version})${bot.schedule ? ' [Every ${bot.schedule} min]' : ''}${bot.chain ? ' [Chain: ${bot.chain}]' : ''}
        <button onclick="Bot.start('${bot.id}')">Start</button>
        <button onclick="Bot.stop('${bot.id}')">Stop</button>
        <button onclick="Bot.editView('${bot.id}')">Edit</button>
        <button onclick="Bot.delete('${bot.id}')">Delete</button>
      </div>
    `).join('');
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
    const ctx = document.getElementById('analytics-chart').getContext('2d');
    if (window.analyticsChart) window.analyticsChart.destroy();
    window.analyticsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: bots.map(b => b.name),
        datasets: [
          { label: 'Runs', data: bots.map(b => b.runs), backgroundColor: '#33B5FF' },
          { label: 'Errors', data: bots.map(b => b.errors), backgroundColor: '#FF3333' },
          { label: 'Avg Runtime (ms)', data: bots.map(b => b.runs ? b.totalRuntime / b.runs : 0), backgroundColor: '#33FF33' }
        ]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });
  }

  static editView(botId) {
    IDB.get('bots', botId).then(bot => {
      document.getElementById('edit-bot-name').textContent = `Editing ${bot.name}`;
      document.getElementById('bots-tab').classList.add('hidden');
      document.getElementById('edit-bot-tab').classList.remove('hidden');
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs/loader.min.js';
      script.onload = () => {
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs' } });
        require(['vs/editor/editor.main'], () => {
          const editor = monaco.editor.create(document.getElementById('code-editor'), {
            value: bot.code,
            language: 'javascript',
            theme: 'vs-dark'
          });
          document.getElementById('save-edit-btn').onclick = () => {
            Bot.edit(botId, editor.getValue());
            editor.dispose();
            document.getElementById('edit-bot-tab').classList.add('hidden');
            document.getElementById('bots-tab').classList.remove('hidden');
          };
        });
      };
      document.body.appendChild(script);
    });
  }
}

async function loadLogs(search = '') {
  let q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(10));
  if (search) {
    q = query(collection(db, 'logs'), where('message', '>=', search), where('message', '<=', search + '\uf8ff'), orderBy('timestamp', 'desc'), limit(10));
  }
  const logs = await getDocs(q);
  document.getElementById('log-list').innerHTML = logs.docs.map(doc => `<div class="bot-item">${doc.data().message}</div>`).join('');
}

// Authentication
document.getElementById('sign-in-btn').addEventListener('click', async () => {
  try {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await signInWithEmailAndPassword(auth, email, password);
    showToast('Signed in successfully', 'success');
    narrate('You are now logged into the Smart Hub.');
  } catch (error) {
    showToast(`Login failed: ${error.message}`, 'error');
    document.getElementById('auth-error').textContent = error.message;
    document.getElementById('auth-error').classList.remove('hidden');
    logError('Login failed', error.message);
  }
});

document.getElementById('sign-up-btn').addEventListener('click', async () => {
  try {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await createUserWithEmailAndPassword(auth, email, password);
    showToast('Account created successfully', 'success');
    narrate('Your account has been created. Welcome to the galaxy!');
  } catch (error) {
    showToast(`Signup failed: ${error.message}`, 'error');
    document.getElementById('auth-error').textContent = error.message;
    document.getElementById('auth-error').classList.remove('hidden');
    logError('Signup failed', error.message);
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await signOut(auth);
  showToast('Logged out', 'info');
  narrate('You have logged out. The galaxy awaits your return.');
});

onAuthStateChanged(auth, async user => {
  try {
    if (user) {
      document.getElementById('login-modal').classList.add('hidden');
      document.getElementById('hub-main').classList.remove('hidden');
      document.getElementById('metaverse-canvas').classList.remove('hidden');
      await loadLogs();
      await Bot.updateBotList();
      await Bot.updateAnalytics();
      if (Notification.permission !== 'granted') Notification.requestPermission();
      setupPushNotifications();
    } else {
      document.getElementById('hub-main').classList.add('hidden');
      document.getElementById('metaverse-canvas').classList.add('hidden');
      document.getElementById('login-modal').classList.remove('hidden');
    }
    document.getElementById('loading').classList.add('hidden');
  } catch (error) {
    showError(`Auth error: ${error.message}`);
    logError('Auth state change failed', error.message);
  }
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

document.getElementById('feedback-yes').addEventListener('click', async () => {
  await addDoc(collection(db, 'feedback'), { rating: 'yes', timestamp: Date.now() });
  ai.updateFeedback('yes');
  showToast('Thanks for your feedback!', 'success');
  document.getElementById('feedback').classList.add('hidden');
});

document.getElementById('feedback-no').addEventListener('click', async () => {
  await addDoc(collection(db, 'feedback'), { rating: 'no', timestamp: Date.now() });
  ai.updateFeedback('no');
  showToast('Thanks for your feedback!', 'success');
  document.getElementById('feedback').classList.add('hidden');
});

document.getElementById('log-search').addEventListener('input', e => loadLogs(e.target.value));

document.getElementById('bots-back-btn').addEventListener('click', () => {
  document.getElementById('bots-tab').classList.add('hidden');
  document.getElementById('hub-main').classList.remove('hidden');
});

document.getElementById('logs-back-btn').addEventListener('click', () => {
  document.getElementById('logs-tab').classList.add('hidden');
  document.getElementById('hub-main').classList.remove('hidden');
});

document.getElementById('analytics-back-btn').addEventListener('click', () => {
  document.getElementById('analytics-tab').classList.add('hidden');
  document.getElementById('hub-main').classList.remove('hidden');
});

document.getElementById('edit-back-btn').addEventListener('click', () => {
  document.getElementById('edit-bot-tab').classList.add('hidden');
  document.getElementById('bots-tab').classList.remove('hidden');
});

document.getElementById('template-btn').addEventListener('click', () => {
  document.getElementById('template-panel').classList.toggle('hidden');
});

document.querySelectorAll('.template-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    const config = {
      weather: { name: 'Weather Bot', type: 'weather', code: ai.generateCode('weather'), neural: false },
      twitter: { name: 'Twitter Bot', type: 'twitter', code: ai.generateCode('twitter'), neural: false },
      scraper: { name: 'Scraper Bot', type: 'scraper', code: ai.generateCode('scraper'), neural: false },
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
  const panels = ['template-panel', 'share-panel', 'clarify-input', 'text-input'];
  if (!e.target.closest('.panel, .modal, .btn, .avatar-panel')) {
    panels.forEach(id => document.getElementById(id).classList.add('hidden'));
  }
});

let touchstartX = 0, touchstartY = 0, touchendX = 0, touchendY = 0;
document.addEventListener('touchstart', e => {
  touchstartX = e.changedTouches[0].screenX;
  touchstartY = e.changedTouches[0].screenY;
});
document.addEventListener('touchend', e => {
  touchendX = e.changedTouches[0].screenX;
  touchendY = e.changedTouches[0].screenY;
  if (touchendX < touchstartX - 50) {
    const tabs = ['bots', 'logs', 'analytics'];
    const active = document.querySelector('.tab-btn.active').dataset.tab;
    const next = tabs[(tabs.indexOf(active) + 1) % tabs.length];
    document.querySelector(`[data-tab="${next}"]`).click();
  } else if (touchendX > touchstartX + 50) {
    const tabs = ['bots', 'logs', 'analytics'];
    const active = document.querySelector('.tab-btn.active').dataset.tab;
    const prev = tabs[(tabs.indexOf(active) - 1 + tabs.length) % tabs.length];
    document.querySelector(`[data-tab="${prev}"]`).click();
  }
});

// Metaverse Setup
let scene, camera, renderer, controls, raycaster, mouse;
try {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('metaverse-canvas'), alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  scene.background = new THREE.Color(0x0D1B2A);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  const room = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ color: 0x33B5FF, opacity: 0.3, transparent: true, side: THREE.DoubleSide }));
  room.rotation.x = Math.PI / 2;
  scene.add(room);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  camera.position.set(0, 3, 5);
  camera.lookAt(0, 0, 0);
} catch (error) {
  console.error('Metaverse setup error:', error);
  logError('Metaverse setup failed', error.message);
}

function addWidget(type, position, botId) {
  const widget = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshBasicMaterial({ color: type === 'status' ? 0xFF3333 : 0x33B5FF }));
  widget.position.set(position.x, position.y, position.z);
  widget.userData = { botId };
  scene.add(widget);
}

function animate() {
  requestAnimationFrame(animate);
  scene.children.forEach(child => {
    if (child.geometry.type === 'SphereGeometry') child.position.y = Math.sin(Date.now() * 0.002 + child.position.x) * 0.3 + 1;
  });
  controls.update();
  renderer.render(scene, camera);
}
if (renderer?.getContext()) animate();

document.getElementById('metaverse-canvas').addEventListener('click', e => {
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
  });
});
