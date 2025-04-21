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
  firebase.initializeApp(firebaseConfig);
  console.log('Firebase initialized');
} catch (error) {
  console.error('Firebase init error:', error);
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('error').classList.remove('hidden');
  document.getElementById('error-message').textContent = 'Failed to initialize Firebase. Check your connection.';
}
const auth = firebase.auth();
const db = firebase.firestore();
const messaging = firebase.messaging();

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
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
    await db.collection('errors').add({ message, details, timestamp: Date.now(), user: auth.currentUser?.uid });
  } catch (error) {
    console.error('Error logging failed:', error);
  }
}

// Push Notifications
function setupPushNotifications() {
  try {
    messaging.getToken({ vapidKey: 'YOUR_VAPID_KEY' }).then(token => {
      if (token) {
        db.collection('users').doc(auth.currentUser.uid).update({ pushToken: token });
      }
    }).catch(err => console.error('Push token error:', err));
    messaging.onMessage(payload => {
      showToast(payload.notification.body, 'info');
      narrate(payload.notification.body);
    });
  } catch (error) {
    console.error('Push setup error:', error);
    logError('Push notification setup failed', error.message);
  }
}

// Authentication
document.getElementById('sign-in-btn').addEventListener('click', async () => {
  try {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await auth.signInWithEmailAndPassword(email, password);
    showToast('Signed in successfully', 'success');
    narrate('you are now logged into the Smart Hub.');
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('hub-main').classList.remove('hidden');
    document.getElementById('metaverse-canvas').classList.remove('hidden');
    if (Notification.permission === 'granted') setupPushNotifications();
  } catch (error) {
    showToast(`Login failed: ${error.message}`, 'error');
    console.error('Auth error:', error);
    logError('Login failed', error.message);
  }
});

document.getElementById('sign-up-btn').addEventListener('click', async () => {
  try {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await auth.createUserWithEmailAndPassword(email, password);
    showToast('Account created successfully', 'success');
    narrate('your account has been created. Welcome to the galaxy!');
  } catch (error) {
    showToast(`Signup failed: ${error.message}`, 'error');
    console.error('Auth error:', error);
    logError('Signup failed', error.message);
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await auth.signOut();
    showToast('Logged out', 'info');
    narrate('you have logged out. The galaxy awaits your return.');
    document.getElementById('hub-main').classList.add('hidden');
    document.getElementById('login-modal').classList.remove('hidden');
    document.getElementById('metaverse-canvas').classList.add('hidden');
  } catch (error) {
    console.error('Logout error:', error);
    logError('Logout failed', error.message);
  }
});

// Conversation Manager
class ConversationManager {
  constructor() {
    this.history = JSON.parse(localStorage.getItem('convoHistory')) || [];
    this.currentIntent = null;
    this.botConfig = {};
  }

  addInput(input, type, response) {
    this.history.push({ input, type, response, timestamp: Date.now() });
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
    return { history: this.history, intent: this.currentIntent, config: this.botConfig };
  }

  getLastBotConfig(type) {
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].response?.action?.type === 'create_bot' && this.history[i].response.action.params.type === type) {
        return this.history[i].response.action.params;
      }
    }
    return null;
  }
}

const convoManager = new ConversationManager();

class UnifiedAI {
  constructor() {
    try {
      this.avatar = new THREE.Mesh(
        new THREE.SphereGeometry(0.5),
        new THREE.MeshBasicMaterial({ color: 0x33B5FF })
      );
      this.scene = new THREE.Scene();
      this.scene.add(this.avatar);
      this.feedbackScores = { positive: 0, negative: 0 };
    } catch (error) {
      console.error('AI initialization error:', error);
      logError('AI initialization failed', error.message);
    }
  }

  async processInput(input, type = 'text') {
    try {
      let processedInput = input;
      if (type === 'voice') processedInput = await this.transcribeVoice(input);
      else if (type === 'file') processedInput = await this.parseFile(input);
      else if (type === 'clarify') processedInput = { answer: input, context: convoManager.getContext() };
      else if (type === 'text') processedInput = this.extractConfigFromText(input);
      if (!processedInput) throw new Error('Input processing failed');
      const analysis = await this.analyzeInput(processedInput, type);
      const response = await this.generateResponse(analysis);
      convoManager.addInput(input, type, response);
      this.updateAvatar(response.emotion);
      document.getElementById('ai-message').textContent = response.message;
      if (response.clarify) this.showClarifyQuestion(response.clarify);
      else if (response.action) {
        await this.executeAction(response.action);
        convoManager.clearSession();
        document.getElementById('clarify-input').classList.add('hidden');
        document.getElementById('feedback').classList.remove('hidden');
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
    try {
      const transcript = audioBlob.toString().toLowerCase();
      return this.extractConfigFromText(transcript);
    } catch (error) {
      console.error('Voice transcription error:', error);
      logError('Voice transcription failed', error.message);
      throw error;
    }
  }

  async parseFile(file) {
    try {
      const type = file.type;
      if (type === 'application/json') {
        const text = await file.text();
        const config = JSON.parse(text);
        return { name: config.name || file.name.replace('.json', ''), code: config.code || '// Bot code', type: config.type || 'generic', neural: config.neural || false, apiKey: config.apiKey, schedule: config.schedule };
      } else if (type === 'application/x-yaml' || type === 'text/yaml') {
        const text = await file.text();
        return { name: text.match(/name: (.+)/)?.[1] || file.name.replace('.yaml', ''), code: text.match(/code: (.+)/)?.[1] || '// Bot code', type: text.match(/type: (.+)/)?.[1] || 'generic', neural: text.includes('neural: true'), apiKey: text.match(/apiKey: (.+)/)?.[1], schedule: text.match(/schedule: (.+)/)?.[1] };
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
    } catch (error) {
      console.error('File parsing error:', error);
      logError('File parsing failed', error.message);
      throw error;
    }
  }

  extractConfigFromText(text) {
    try {
      text = text.toLowerCase();
      let type = 'generic';
      let apiKey = null;
      let schedule = null;
      if (text.includes('weather')) type = 'weather';
      else if (text.includes('twitter') || text.includes('tweet')) type = 'twitter';
      else if (text.includes('scrape') || text.includes('scraper')) type = 'scraper';
      else if (text.includes('custom')) type = 'custom';
      let name = text.match(/build (.+?) bot/i)?.[1] || 'Generic Bot';
      let neural = text.includes('neural') || text.includes('ai');
      if (type === 'custom') apiKey = text.match(/api key (.+?)(?:\s|$)/)?.[1] || null;
      if (text.includes('every')) schedule = text.match(/every (\d+) minutes/i)?.[1] || null;
      let code = this.generateCode(type, apiKey);
      if (this.feedbackScores.positive > this.feedbackScores.negative) {
        code = this.optimizeCode(code);
      }
      return { name, type, neural, code, apiKey, schedule };
    } catch (error) {
      console.error('Text extraction error:', error);
      logError('Text extraction failed', error.message);
      throw error;
    }
  }

  optimizeCode(code) {
    try {
      if (code.includes('fetch')) {
        return `
try {
  ${code.replace('fetch', 'fetch').replace('}', '}} catch (error) { console.error('Bot error:', error); return { error: error.message }; }')}
`;
      }
      return code;
    } catch (error) {
      console.error('Code optimization error:', error);
      logError('Code optimization failed', error.message);
      return code;
    }
  }

  async analyzeInput(input, type) {
    try {
      const context = convoManager.getContext();
      let intent = context.intent || 'create_bot';
      let botConfig = { ...context.config };
      if (type === 'clarify') botConfig = { ...botConfig, ...this.parseClarifyAnswer(input.answer, input.context) };
      else botConfig = input;

      if ((type === 'text' || type === 'voice') && (input.name.toLowerCase().includes('another') || input.name.toLowerCase().includes('similar'))) {
        const lastConfig = convoManager.getLastBotConfig(botConfig.type);
        if (lastConfig) botConfig = { ...lastConfig, name: `${lastConfig.name} Copy` };
      }

      if (!botConfig.type || !botConfig.name) intent = 'clarify';
      convoManager.setIntent(intent, botConfig);
      return { intent, botConfig };
    } catch (error) {
      console.error('Input analysis error:', error);
      logError('Input analysis failed', error.message);
      throw error;
    }
  }

  parseClarifyAnswer(answer, context) {
    try {
      const config = {};
      if (!context.config.name) config.name = answer || 'Generic Bot';
      if (!context.config.type) config.type = answer.match(/weather/i) ? 'weather' : answer.match(/twitter|tweet/i) ? 'twitter' : answer.match(/scrape/i) ? 'scraper' : answer.match(/custom/i) ? 'custom' : 'generic';
      if (!context.config.code) config.code = this.generateCode(config.type || context.config.type, context.config.apiKey);
      config.neural = answer.includes('neural');
      config.apiKey = answer.match(/api key (.+?)(?:\s|$)/)?.[1] || context.config.apiKey;
      config.schedule = answer.match(/every (\d+) minutes/i)?.[1] || context.config.schedule;
      return config;
    } catch (error) {
      console.error('Clarify answer parsing error:', error);
      logError('Clarify answer parsing failed', error.message);
      throw error;
    }
  }

  generateCode(type, apiKey) {
    try {
      const templates = {
        weather: `async function run() { return await (await fetch("https://api.openweathermap.org/data/2.5/weather?q=London&appid=${apiKey || 'YOUR_API_KEY'}")).json(); }`,
        twitter: `async function run() { return { status: "Tweet posted" }; }`,
        scraper: `async function run() { return await (await fetch("https://example.com")).text(); }`,
        custom: `async function run() { return await (await fetch("YOUR_API_URL?key=${apiKey || 'YOUR_API_KEY'}")).json(); }`,
        generic: '// Generic bot code'
      };
      return templates[type] || '// Generic bot code';
    } catch (error) {
      console.error('Code generation error:', error);
      logError('Code generation failed', error.message);
      throw error;
    }
  }

  async generateResponse(analysis) {
    try {
      if (analysis.intent === 'create_bot' && analysis.botConfig.name && analysis.botConfig.type) {
        let suggestion = '';
        if (this.feedbackScores.negative > 0) suggestion = ' Tip: Try specifying an API key or schedule for custom bots.';
        return { message: `Forging ${analysis.botConfig.name} bot...${suggestion}`, action: { type: 'create_bot', params: analysis.botConfig }, emotion: 'happy' };
      }
      let clarify = !analysis.botConfig.name && !convoManager.hasAsked('What should the bot be named?') ? 'What should the bot be named?' :
                    !analysis.botConfig.type && !convoManager.hasAsked('What type of bot do you want (e.g., weather, twitter, scraper, custom)?') ? 'What type of bot do you want (e.g., weather, twitter, scraper, custom)?' : '';
      return { message: clarify || 'I need more details to create the bot.', clarify, emotion: 'neutral' };
    } catch (error) {
      console.error('Response generation error:', error);
      logError('Response generation failed', error.message);
      throw error;
    }
  }

  showClarifyQuestion(question) {
    try {
      const clarifyDiv = document.getElementById('clarify-input');
      document.getElementById('clarify-question').textContent = question;
      clarifyDiv.classList.remove('hidden');
    } catch (error) {
      console.error('Clarify question error:', error);
      logError('Clarify question display failed', error.message);
    }
  }

  updateAvatar(emotion) {
    try {
      this.avatar.material.color.set(emotion === 'happy' ? 0x33B5FF : 0xFF3333);
    } catch (error) {
      console.error('Avatar update error:', error);
      logError('Avatar update failed', error.message);
    }
  }

  async executeAction(action) {
    try {
      if (action.type === 'create_bot') {
        const bot = await Bot.create(action.params);
        await db.collection('logs').add({ message: `Bot ${action.params.name} created`, timestamp: Date.now() });
        if (action.params.type !== 'generic') Bot.run(bot.id);
      }
    } catch (error) {
      console.error('Action execution error:', error);
      logError('Action execution failed', error.message);
      throw error;
    }
  }

  updateFeedback(rating) {
    try {
      this.feedbackScores[rating === 'yes' ? 'positive' : 'negative']++;
    } catch (error) {
      console.error('Feedback update error:', error);
      logError('Feedback update failed', error.message);
    }
  }
}

const ai = new UnifiedAI();

class Bot {
  static async create(params) {
    try {
      const botId = Date.now().toString();
      const bot = { id: botId, name: params.name, status: 'stopped', code: params.code, type: params.type, neural: params.neural, apiKey: params.apiKey, schedule: params.schedule, createdAt: new Date().toISOString(), version: 1, versions: [{ version: 1, code: params.code, timestamp: new Date().toISOString() }] };
      await idb.set('bots', botId, bot);
      await this.updateBotList();
      addWidget('status', { x: Math.random() * 5, y: 1, z: Math.random() * 5 });
      narrate(`Bot ${bot.name} forged in the galactic foundry.`);
      hapticFeedback();
      showToast(`Bot ${bot.name} created`, 'success');
      if (bot.schedule) this.scheduleBot(botId, parseInt(bot.schedule));
      return bot;
    } catch (error) {
      console.error('Bot creation error:', error);
      logError('Bot creation failed', error.message);
      throw error;
    }
  }

  static async start(botId) {
    try {
      await idb.update('bots', botId, { status: 'running' });
      await this.updateBotList();
      showToast(`Bot ${botId} started`, 'success');
      narrate(`Bot ${botId} is now active.`);
      await db.collection('logs').add({ message: `Bot ${botId} started`, timestamp: Date.now() });
      this.run(botId);
    } catch (error) {
      console.error('Bot start error:', error);
      logError('Bot start failed', error.message);
      throw error;
    }
  }

  static async delete(botId) {
    try {
      await idb.delete('bots', botId);
      await this.updateBotList();
      showToast('Bot deleted', 'success');
      narrate(`Bot ${botId} decommissioned.`);
      await db.collection('logs').add({ message: `Bot ${botId} deleted`, timestamp: Date.now() });
    } catch (error) {
      console.error('Bot deletion error:', error);
      logError('Bot deletion failed', error.message);
      throw error;
    }
  }

  static async edit(botId, newCode) {
    try {
      const bot = await idb.get('bots', botId);
      const isHighRisk = newCode.includes('delete') || newCode.includes('drop');
      if (isHighRisk) {
        showConfirmDialog('This code contains high-risk operations. Approve?', async () => {
          const newVersion = bot.version + 1;
          bot.versions.push({ version: newVersion, code: newCode, timestamp: new Date().toISOString() });
          await idb.update('bots', botId, { code: newCode, version: newVersion, versions: bot.versions });
          await this.updateBotList();
          showToast('Bot code updated', 'success');
          narrate(`Bot ${bot.name} code updated to version ${newVersion}.`);
          await db.collection('logs').add({ message: `Bot ${botId} code updated`, timestamp: Date.now() });
        });
      } else {
        const newVersion = bot.version + 1;
        bot.versions.push({ version: newVersion, code: newCode, timestamp: new Date().toISOString() });
        await idb.update('bots', botId, { code: newCode, version: newVersion, versions: bot.versions });
        await this.updateBotList();
        showToast('Bot code updated', 'success');
        narrate(`Bot ${bot.name} code updated to version ${newVersion}.`);
        await db.collection('logs').add({ message: `Bot ${botId} code updated`, timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Bot edit error:', error);
      logError('Bot edit failed', error.message);
      throw error;
    }
  }

  static async run(botId) {
    try {
      const bot = await idb.get('bots', botId);
      const func = new Function('return ' + bot.code)();
      const result = await func();
      showToast(`Bot ${bot.name} ran successfully: ${JSON.stringify(result).slice(0, 50)}`, 'success');
      await db.collection('logs').add({ message: `Bot ${bot.name} executed: ${JSON.stringify(result)}`, timestamp: Date.now() });
      if (Notification.permission === 'granted') {
        new Notification(`Bot ${bot.name} Result`, { body: JSON.stringify(result).slice(0, 100) });
      }
    } catch (error) {
      console.error('Bot run error:', error);
      showToast(`Bot ${bot.name} failed: ${error.message}`, 'error');
      await db.collection('logs').add({ message: `Bot ${bot.name} failed: ${error.message}`, timestamp: Date.now() });
      if (Notification.permission === 'granted') {
        new Notification(`Bot ${bot.name} Failed`, { body: error.message });
      }
      logError('Bot execution failed', error.message);
    }
  }

  static scheduleBot(botId, minutes) {
    try {
      setInterval(async () => {
        const bot = await idb.get('bots', botId);
        if (bot.status === 'running') {
          await this.run(botId);
        }
      }, minutes * 60 * 1000);
      showToast(`Bot ${botId} scheduled to run every ${minutes} minutes`, 'info');
      narrate(`Bot ${botId} scheduled for action.`);
    } catch (error) {
      console.error('Bot scheduling error:', error);
      logError('Bot scheduling failed', error.message);
    }
  }

  static async updateBotList() {
    try {
      const bots = await idb.getAll('bots');
      document.getElementById('bot-list').innerHTML = bots.map(bot => `
        <div class="bot-item" data-id="${bot.id}">
          ${bot.name} (${bot.type}${bot.neural ? ', Neural' : ''}) - ${bot.status} (v${bot.version})${bot.schedule ? ' [Every ${bot.schedule} min]' : ''}
          <button onclick="Bot.start('${bot.id}')">Start</button>
          <button onclick="Bot.editView('${bot.id}')">Edit</button>
          <button onclick="Bot.delete('${bot.id}')">Delete</button>
        </div>
      `).join('');
    } catch (error) {
      console.error('Bot list update error:', error);
      logError('Bot list update failed', error.message);
    }
  }

  static editView(botId) {
    try {
      idb.get('bots', botId).then(bot => {
        document.getElementById('edit-bot-name').textContent = `Editing ${bot.name}`;
        document.getElementById('bots-tab').classList.add('hidden');
        document.getElementById('edit-bot-tab').classList.remove('hidden');
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
      });
    } catch (error) {
      console.error('Bot edit view error:', error);
      logError('Bot edit view failed', error.message);
    }
  }
}

const idb = {
  async set(store, key, value) {
    return new Promise((resolve, reject) => {
      try {
        const openRequest = indexedDB.open('SmartHubDB', 1);
        openRequest.onupgradeneeded = e => e.target.result.createObjectStore('bots', { keyPath: 'id' });
        openRequest.onsuccess = e => {
          const db = e.target.result;
          const tx = db.transaction([store], 'readwrite');
          tx.objectStore(store).put(value).onsuccess = () => resolve();
        };
        openRequest.onerror = e => reject(e);
      } catch (error) {
        console.error('IDB set error:', error);
        logError('IDB set failed', error.message);
        reject(error);
      }
    });
  },
  async delete(store, key) {
    return new Promise((resolve, reject) => {
      try {
        const openRequest = indexedDB.open('SmartHubDB', 1);
        openRequest.onsuccess = e => {
          const db = e.target.result;
          const tx = db.transaction([store], 'readwrite');
          tx.objectStore(store).delete(key).onsuccess = () => resolve();
        };
        openRequest.onerror = e => reject(e);
      } catch (error) {
        console.error('IDB delete error:', error);
        logError('IDB delete failed', error.message);
        reject(error);
      }
    });
  },
  async update(store, key, updates) {
    return new Promise((resolve, reject) => {
      try {
        const openRequest = indexedDB.open('SmartHubDB', 1);
        openRequest.onsuccess = e => {
          const db = e.target.result;
          const tx = db.transaction([store], 'readwrite');
          const storeObj = tx.objectStore(store);
          storeObj.get(key).onsuccess = ev => storeObj.put({ ...ev.target.result, ...updates }).onsuccess = () => resolve();
        };
        openRequest.onerror = e => reject(e);
      } catch (error) {
        console.error('IDB update error:', error);
        logError('IDB update failed', error.message);
        reject(error);
      }
    });
  },
  async get(store, key) {
    return new Promise((resolve, reject) => {
      try {
        const openRequest = indexedDB.open('SmartHubDB', 1);
        openRequest.onsuccess = e => {
          const db = e.target.result;
          const tx = db.transaction([store], 'readonly');
          tx.objectStore(store).get(key).onsuccess = ev => resolve(ev.target.result);
        };
        openRequest.onerror = e => reject(e);
      } catch (error) {
        console.error('IDB get error:', error);
        logError('IDB get failed', error.message);
        reject(error);
      }
    });
  },
  async getAll(store) {
    return new Promise((resolve, reject) => {
      try {
        const openRequest = indexedDB.open('SmartHubDB', 1);
        openRequest.onsuccess = e => {
          const db = e.target.result;
          const tx = db.transaction([store], 'readonly');
          tx.objectStore(store).getAll().onsuccess = ev => resolve(ev.target.result);
        };
        openRequest.onerror = e => reject(e);
      } catch (error) {
        console.error('IDB getAll error:', error);
        logError('IDB getAll failed', error.message);
        reject(error);
      }
    });
  }
};

async function loadLogs(search = '') {
  try {
    let query = db.collection('logs').orderBy('timestamp', 'desc').limit(10);
    if (search) {
      query = query.where('message', '>=', search).where('message', '<=', search + '\uf8ff');
    }
    const logs = await query.get();
    document.getElementById('log-list').innerHTML = logs.docs.map(doc => `<div class="bot-item">${doc.data().message}</div>`).join('');
  } catch (error) {
    console.error('Log loading error:', error);
    logError('Log loading failed', error.message);
  }
}

// Event Listeners
document.getElementById('voice-input-btn').addEventListener('click', () => {
  try {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.start();
    recognition.onresult = e => ai.processInput(e.results[0][0].transcript, 'voice');
  } catch (error) {
    console.error('Voice input error:', error);
    logError('Voice input failed', error.message);
    showToast('Voice recognition failed', 'error');
  }
});

document.getElementById('text-input-btn').addEventListener('click', () => {
  document.getElementById('text-input').classList.remove('hidden');
});

document.getElementById('submit-text').addEventListener('click', () => {
  try {
    const description = document.getElementById('text-answer').value;
    if (description) {
      ai.processInput(description, 'text');
      document.getElementById('text-input').classList.add('hidden');
    }
  } catch (error) {
    console.error('Text submit error:', error);
    logError('Text submit failed', error.message);
  }
});

document.getElementById('submit-clarify').addEventListener('click', () => {
  try {
    const answer = document.getElementById('clarify-answer').value;
    if (answer) ai.processInput(answer, 'clarify');
  } catch (error) {
    console.error('Clarify submit error:', error);
    logError('Clarify submit failed', error.message);
  }
});

document.getElementById('file-upload').addEventListener('drop', async e => {
  try {
    e.preventDefault();
    for (const file of e.dataTransfer.files) await ai.processInput(file, 'file');
  } catch (error) {
    console.error('File drop error:', error);
    logError('File drop failed', error.message);
  }
});

document.getElementById('file-input').addEventListener('change', async e => {
  try {
    for (const file of e.target.files) await ai.processInput(file, 'file');
  } catch (error) {
    console.error('File input error:', error);
    logError('File input failed', error.message);
  }
});

document.getElementById('feedback-yes').addEventListener('click', async () => {
  try {
    await db.collection('feedback').add({ rating: 'yes', timestamp: Date.now() });
    ai.updateFeedback('yes');
    showToast('Thanks for your feedback!', 'success');
    document.getElementById('feedback').classList.add('hidden');
  } catch (error) {
    console.error('Feedback yes error:', error);
    logError('Feedback yes failed', error.message);
  }
});

document.getElementById('feedback-no').addEventListener('click', async () => {
  try {
    await db.collection('feedback').add({ rating: 'no', timestamp: Date.now() });
    ai.updateFeedback('no');
    showToast('Thanks for your feedback!', 'success');
    document.getElementById('feedback').classList.add('hidden');
  } catch (error) {
    console.error('Feedback no error:', error);
    logError('Feedback no failed', error.message);
  }
});

document.getElementById('log-search').addEventListener('input', e => {
  try {
    loadLogs(e.target.value);
  } catch (error) {
    console.error('Log search error:', error);
    logError('Log search failed', error.message);
  }
});

document.getElementById('bots-back-btn').addEventListener('click', () => {
  document.getElementById('bots-tab').classList.add('hidden');
  document.getElementById('hub-main').classList.remove('hidden');
});

document.getElementById('logs-back-btn').addEventListener('click', () => {
  document.getElementById('logs-tab').classList.add('hidden');
  document.getElementById('hub-main').classList.remove('hidden');
});

document.getElementById('edit-back-btn').addEventListener('click', () => {
  document.getElementById('edit-bot-tab').classList.add('hidden');
  document.getElementById('bots-tab').classList.remove('hidden');
});

// Swipe Gestures
let touchstartX = 0;
let touchendX = 0;
document.addEventListener('touchstart', e => touchstartX = e.changedTouches[0].screenX);
document.addEventListener('touchend', e => {
  try {
    touchendX = e.changedTouches[0].screenX;
    if (touchendX < touchstartX - 50) {
      if (document.getElementById('bots-tab').classList.contains('active')) {
        document.querySelector('[data-tab="logs"]').click();
      }
    } else if (touchendX > touchstartX + 50) {
      if (document.getElementById('logs-tab').classList.contains('active')) {
        document.querySelector('[data-tab="bots"]').click();
      }
    }
  } catch (error) {
    console.error('Swipe gesture error:', error);
    logError('Swipe gesture failed', error.message);
  }
});

// Metaverse Setup
let scene, camera, renderer;
try {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('metaverse-canvas'), alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  scene.background = new THREE.Color(0x0D1B2A);

  const room = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ color: 0x33B5FF, opacity: 0.3, transparent: true, side: THREE.DoubleSide }));
  room.rotation.x = Math.PI / 2;
  scene.add(room);

  camera.position.set(0, 3, 5);
  camera.lookAt(0, 0, 0);
} catch (error) {
  console.error('Metaverse setup error:', error);
  logError('Metaverse setup failed', error.message);
}

function addWidget(type, position) {
  try {
    const widget = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshBasicMaterial({ color: type === 'status' ? 0xFF3333 : 0x33B5FF }));
    widget.position.set(position.x, position.y, position.z);
    scene.add(widget);
  } catch (error) {
    console.error('Widget add error:', error);
    logError('Widget add failed', error.message);
  }
}

function animate() {
  try {
    requestAnimationFrame(animate);
    room.material.color.setHSL(Math.sin(Date.now() * 0.001) * 0.5 + 0.5, 1, 0.5);
    scene.children.forEach(child => {
      if (child.geometry.type === 'SphereGeometry') child.position.y = Math.sin(Date.now() * 0.002 + child.position.x) * 0.3 + 1;
    });
    renderer.render(scene, camera);
  } catch (error) {
    console.error('Animation error:', error);
    logError('Animation failed', error.message);
  }
}
if (renderer?.getContext()) animate();

auth.onAuthStateChanged(async user => {
  try {
    if (user) {
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('login-modal').classList.add('hidden');
      document.getElementById('hub-main').classList.remove('hidden');
      document.getElementById('metaverse-canvas').classList.remove('hidden');
      await loadLogs();
      await Bot.updateBotList();
      if (Notification.permission !== 'granted') Notification.requestPermission();
    } else {
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('hub-main').classList.add('hidden');
      document.getElementById('login-modal').classList.remove('hidden');
      document.getElementById('metaverse-canvas').classList.add('hidden');
    }
  } catch (error) {
    console.error('Auth state error:', error);
    logError('Auth state change failed', error.message);
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error').classList.remove('hidden');
    document.getElementById('error-message').textContent = 'Authentication error. Please retry.';
  }
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    try {
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
      document.getElementById(`${btn.dataset.tab}-tab`).classList.remove('hidden');
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      narrate(`Navigating to ${btn.dataset.tab} sector.`);
    } catch (error) {
      console.error('Tab switch error:', error);
      logError('Tab switch failed', error.message);
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loading').classList.add('hidden');
  if (auth.currentUser) {
    document.getElementById('hub-main').classList.remove('hidden');
    document.getElementById('metaverse-canvas').classList.remove('hidden');
  } else {
    document.getElementById('login-modal').classList.remove('hidden');
  }
});
