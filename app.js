const firebaseConfig = {
  apiKey: "AIzaSyBONwaRl23VeTJISmiQ3X-t3y6FGK7Ngjc",
  authDomain: "tglsmarthub.firebaseapp.com",
  projectId: "tglsmarthub",
  storageBucket: "tglsmarthub.firebasestorage.app",
  messagingSenderId: "361291241205",
  appId: "1:361291241205:web:854f79a0238e6e4795d7bc",
  measurementId: "G-LQ4BP8GG37"
};

firebase.initializeApp(firebaseConfig);
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
  const utterance = new SpeechSynthesisUtterance(`Commander, ${message}`);
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
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

// Push Notifications
function setupPushNotifications() {
  messaging.getToken({ vapidKey: 'YOUR_VAPID_KEY' }).then(token => {
    if (token) {
      db.collection('users').doc(auth.currentUser.uid).update({ pushToken: token });
    }
  }).catch(err => console.error('Push token error:', err));
  messaging.onMessage(payload => {
    showToast(payload.notification.body, 'info');
    narrate(payload.notification.body);
  });
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
    if (Notification.permission === 'granted') setupPushNotifications();
  } catch (error) {
    showToast(`Login failed: ${error.message}`, 'error');
    console.error('Auth error:', error);
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
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await auth.signOut();
  showToast('Logged out', 'info');
  narrate('you have logged out. The galaxy awaits your return.');
  document.getElementById('hub-main').classList.add('hidden');
  document.getElementById('login-modal').classList.remove('hidden');
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
    this.avatar = new THREE.Mesh(
      new THREE.SphereGeometry(0.5),
      new THREE.MeshBasicMaterial({ color: 0x33B5FF })
    );
    this.scene = new THREE.Scene();
    this.scene.add(this.avatar);
    this.feedbackScores = { positive: 0, negative: 0 };
  }

  async processInput(input, type = 'text') {
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
  }

  async transcribeVoice(audioBlob) {
    const transcript = audioBlob.toString().toLowerCase();
    return this.extractConfigFromText(transcript);
  }

  async parseFile(file) {
    const type = file.type;
    if (type === 'application/json') {
      const text = await file.text();
      const config = JSON.parse(text);
      return { name: config.name || file.name.replace('.json', ''), code: config.code || '// Bot code', type: config.type || 'generic', neural: config.neural || false, apiKey: config.apiKey };
    } else if (type === 'application/x-yaml' || type === 'text/yaml') {
      const text = await file.text();
      return { name: text.match(/name: (.+)/)?.[1] || file.name.replace('.yaml', ''), code: text.match(/code: (.+)/)?.[1] || '// Bot code', type: text.match(/type: (.+)/)?.[1] || 'generic', neural: text.includes('neural: true'), apiKey: text.match(/apiKey: (.+)/)?.[1] };
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

  extractConfigFromText(text) {
    text = text.toLowerCase();
    let type = 'generic';
    let apiKey = null;
    if (text.includes('weather')) type = 'weather';
    else if (text.includes('twitter') || text.includes('tweet')) type = 'twitter';
    else if (text.includes('scrape') || text.includes('scraper')) type = 'scraper';
    else if (text.includes('custom')) type = 'custom';
    let name = text.match(/build (.+?) bot/i)?.[1] || 'Generic Bot';
    let neural = text.includes('neural') || text.includes('ai');
    if (type === 'custom') apiKey = text.match(/api key (.+?)(?:\s|$)/)?.[1] || null;
    let code = this.generateCode(type, apiKey);
    if (this.feedbackScores.positive > this.feedbackScores.negative) {
      code = this.optimizeCode(code);
    }
    return { name, type, neural, code, apiKey };
  }

  optimizeCode(code) {
    if (code.includes('fetch')) {
      return `
try {
  ${code.replace('fetch', 'fetch').replace('}', '}} catch (error) { console.error('Bot error:', error); return { error: error.message }; }')}
`;
    }
    return code;
  }

  async analyzeInput(input, type) {
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
  }

  parseClarifyAnswer(answer, context) {
    const config = {};
    if (!context.config.name) config.name = answer || 'Generic Bot';
    if (!context.config.type) config.type = answer.match(/weather/i) ? 'weather' : answer.match(/twitter|tweet/i) ? 'twitter' : answer.match(/scrape/i) ? 'scraper' : answer.match(/custom/i) ? 'custom' : 'generic';
    if (!context.config.code) config.code = this.generateCode(config.type || context.config.type, context.config.apiKey);
    config.neural = answer.includes('neural');
    config.apiKey = answer.match(/api key (.+?)(?:\s|$)/)?.[1] || context.config.apiKey;
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
    if (analysis.intent === 'create_bot' && analysis.botConfig.name && analysis.botConfig.type) {
      let suggestion = '';
      if (this.feedbackScores.negative > 0) suggestion = ' Tip: Try specifying an API key for custom bots.';
      return { message: `Forging ${analysis.botConfig.name} bot...${suggestion}`, action: { type: 'create_bot', params: analysis.botConfig }, emotion: 'happy' };
    }
    let clarify = !analysis.botConfig.name && !convoManager.hasAsked('What should the bot be named?') ? 'What should the bot be named?' :
                  !analysis.botConfig.type && !convoManager.hasAsked('What type of bot do you want (e.g., weather, twitter, scraper, custom)?') ? 'What type of bot do you want (e.g., weather, twitter, scraper, custom)?' : '';
    return { message: clarify || 'I need more details to create the bot.', clarify, emotion: 'neutral' };
  }

  showClarifyQuestion(question) {
    const clarifyDiv = document.getElementById('clarify-input');
    document.getElementById('clarify-question').textContent = question;
    clarifyDiv.classList.remove('hidden');
  }

  updateAvatar(emotion) {
    this.avatar.material.color.set(emotion === 'happy' ? 0x33B5FF : 0xFF3333);
  }

  async executeAction(action) {
    if (action.type === 'create_bot') {
      await Bot.create(action.params);
      await db.collection('logs').add({ message: `Bot ${action.params.name} created`, timestamp: Date.now() });
      if (action.params.type !== 'generic') Bot.run(action.params.id);
    }
  }

  updateFeedback(rating) {
    this.feedbackScores[rating === 'yes' ? 'positive' : 'negative']++;
  }
}

const ai = new UnifiedAI();

class Bot {
  static async create(params) {
    const botId = Date.now().toString();
    const bot = { id: botId, name: params.name, status: 'stopped', code: params.code, type: params.type, neural: params.neural, apiKey: params.apiKey, createdAt: new Date().toISOString(), version: 1, versions: [{ version: 1, code: params.code, timestamp: new Date().toISOString() }] };
    await idb.set('bots', botId, bot);
    await this.updateBotList();
    addWidget('status', { x: Math.random() * 5, y: 1, z: Math.random() * 5 });
    narrate(`Bot ${bot.name} forged in the galactic foundry.`);
    hapticFeedback();
    showToast(`Bot ${bot.name} created`, 'success');
    return bot;
  }

  static async start(botId) {
    await idb.update('bots', botId, { status: 'running' });
    await this.updateBotList();
    showToast(`Bot ${botId} started`, 'success');
    narrate(`Bot ${botId} is now active.`);
    await db.collection('logs').add({ message: `Bot ${botId} started`, timestamp: Date.now() });
    this.run(botId);
  }

  static async delete(botId) {
    await idb.delete('bots', botId);
    await this.updateBotList();
    showToast('Bot deleted', 'success');
    narrate(`Bot ${botId} decommissioned.`);
    await db.collection('logs').add({ message: `Bot ${botId} deleted`, timestamp: Date.now() });
  }

  static async edit(botId, newCode) {
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
  }

  static async run(botId) {
    const bot = await idb.get('bots', botId);
    try {
      const func = new Function('return ' + bot.code)();
      const result = await func();
      showToast(`Bot ${bot.name} ran successfully: ${JSON.stringify(result).slice(0, 50)}`, 'success');
      await db.collection('logs').add({ message: `Bot ${bot.name} executed: ${JSON.stringify(result)}`, timestamp: Date.now() });
      if (Notification.permission === 'granted') {
        new Notification(`Bot ${bot.name} Result`, { body: JSON.stringify(result).slice(0, 100) });
      }
    } catch (error) {
      showToast(`Bot ${bot.name} failed: ${error.message}`, 'error');
      await db.collection('logs').add({ message: `Bot ${bot.name} failed: ${error.message}`, timestamp: Date.now() });
      if (Notification.permission === 'granted') {
        new Notification(`Bot ${bot.name} Failed`, { body: error.message });
      }
    }
  }

  static async updateBotList() {
    const bots = await idb.getAll('bots');
    document.getElementById('bot-list').innerHTML = bots.map(bot => `
      <div class="bot-item" data-id="${bot.id}">
        ${bot.name} (${bot.type}${bot.neural ? ', Neural' : ''}) - ${bot.status} (v${bot.version})
        <button onclick="Bot.start('${bot.id}')">Start</button>
        <button onclick="Bot.editView('${bot.id}')">Edit</button>
        <button onclick="Bot.delete('${bot.id}')">Delete</button>
      </div>
    `).join('');
  }

  static editView(botId) {
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
  }
}

const idb = {
  async set(store, key, value) {
    return new Promise((resolve) => {
      const openRequest = indexedDB.open('SmartHubDB', 1);
      openRequest.onupgradeneeded = e => e.target.result.createObjectStore('bots', { keyPath: 'id' });
      openRequest.onsuccess = e => {
        const db = e.target.result;
        const tx = db.transaction([store], 'readwrite');
        tx.objectStore(store).put(value).onsuccess = () => resolve();
      };
    });
  },
  async delete(store, key) {
    return new Promise((resolve) => {
      const openRequest = indexedDB.open('SmartHubDB', 1);
      openRequest.onsuccess = e => {
        const db = e.target.result;
        const tx = db.transaction([store], 'readwrite');
        tx.objectStore(store).delete(key).onsuccess = () => resolve();
      };
    });
  },
  async update(store, key, updates) {
    return new Promise((resolve) => {
      const openRequest = indexedDB.open('SmartHubDB', 1);
      openRequest.onsuccess = e => {
        const db = e.target.result;
        const tx = db.transaction([store], 'readwrite');
        const storeObj = tx.objectStore(store);
        storeObj.get(key).onsuccess = ev => storeObj.put({ ...ev.target.result, ...updates }).onsuccess = () => resolve();
      };
    });
  },
  async get(store, key) {
    return new Promise((resolve) => {
      const openRequest = indexedDB.open('SmartHubDB', 1);
      openRequest.onsuccess = e => {
        const db = e.target.result;
        const tx = db.transaction([store], 'readonly');
        tx.objectStore(store).get(key).onsuccess = ev => resolve(ev.target.result);
      };
    });
  },
  async getAll(store) {
    return new Promise((resolve) => {
      const openRequest = indexedDB.open('SmartHubDB', 1);
      openRequest.onsuccess = e => {
        const db = e.target.result;
        const tx = db.transaction([store], 'readonly');
        tx.objectStore(store).getAll().onsuccess = ev => resolve(ev.target.result);
      };
    });
  }
};

async function loadLogs(search = '') {
  let query = db.collection('logs').orderBy('timestamp', 'desc').limit(10);
  if (search) {
    query = query.where('message', '>=', search).where('message', '<=', search + '\uf8ff');
  }
  const logs = await query.get();
  document.getElementById('log-list').innerHTML = logs.docs.map(doc => `<div class="bot-item">${doc.data().message}</div>`).join('');
}

// Event Listeners
document.getElementById('voice-input-btn').addEventListener('click', () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.start();
  recognition.onresult = e => ai.processInput(e.results[0][0].transcript, 'voice');
});

document.getElementById('text-input-btn').addEventListener('click', () => {
  document.getElementById('text-input').classList.remove('hidden');
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
  await db.collection('feedback').add({ rating: 'yes', timestamp: Date.now() });
  ai.updateFeedback('yes');
  showToast('Thanks for your feedback!', 'success');
  document.getElementById('feedback').classList.add('hidden');
});

document.getElementById('feedback-no').addEventListener('click', async () => {
  await db.collection('feedback').add({ rating: 'no', timestamp: Date.now() });
  ai.updateFeedback('no');
  showToast('Thanks for your feedback!', 'success');
  document.getElementById('feedback').classList.add('hidden');
});

document.getElementById('log-search').addEventListener('input', e => {
  loadLogs(e.target.value);
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
});

// Metaverse Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('metaverse-canvas'), alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
scene.background = new THREE.Color(0x0D1B2A);

const room = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ color: 0x33B5FF, opacity: 0.3, transparent: true, side: THREE.DoubleSide }));
room.rotation.x = Math.PI / 2;
scene.add(room);

function addWidget(type, position) {
  const widget = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshBasicMaterial({ color: type === 'status' ? 0xFF3333 : 0x33B5FF }));
  widget.position.set(position.x, position.y, position.z);
  scene.add(widget);
}

camera.position.set(0, 3, 5);
camera.lookAt(0, 0, 0);

function animate() {
  requestAnimationFrame(animate);
  room.material.color.setHSL(Math.sin(Date.now() * 0.001) * 0.5 + 0.5, 1, 0.5);
  scene.children.forEach(child => {
    if (child.geometry.type === 'SphereGeometry') child.position.y = Math.sin(Date.now() * 0.002 + child.position.x) * 0.3 + 1;
  });
  renderer.render(scene, camera);
}
if (renderer.getContext()) animate();

auth.onAuthStateChanged(async user => {
  if (user) {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('hub-main').classList.remove('hidden');
    await loadLogs();
    await Bot.updateBotList();
    if (Notification.permission !== 'granted') Notification.requestPermission();
  } else {
    document.getElementById('hub-main').classList.add('hidden');
    document.getElementById('login-modal').classList.remove('hidden');
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
