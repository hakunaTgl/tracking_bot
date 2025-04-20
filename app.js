// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBONwaRl23VeTJISmiQ3X-t3y6FGK7Ngjc",
  authDomain: "tglsmarthub.firebaseapp.com",
  projectId: "tglsmarthub",
  storageBucket: "tglsmarthub.firebasestorage.app",
  messagingSenderId: "361291241205",
  appId: "1:361291241205:web:854f79a0238e6e4795d7bc",
  measurementId: "G-LQ4BP8GG37"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Utility functions
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function hapticFeedback(duration = 50) {
  if (navigator.vibrate) {
    navigator.vibrate(duration);
  }
}

function narrate(message) {
  if (document.getElementById('narration-toggle').checked) {
    const utterance = new SpeechSynthesisUtterance(`Commander, ${message}`);
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  }
}

// Authentication
document.getElementById('sign-in-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    await auth.signInWithEmailAndPassword(email, password);
    showToast('Signed in successfully', 'success');
    narrate('you are now logged into the Smart Hub.');
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('hub-main').classList.remove('hidden');
  } catch (error) {
    showToast(error.message, 'error');
  }
});

document.getElementById('sign-up-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    await auth.createUserWithEmailAndPassword(email, password);
    showToast('Account created successfully', 'success');
    narrate('your account has been created. Welcome to the galaxy!');
  } catch (error) {
    showToast(error.message, 'error');
  }
});

document.getElementById('forgot-password').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  if (email) {
    auth.sendPasswordResetEmail(email)
      .then(() => showToast('Password reset email sent', 'info'))
      .catch(error => showToast(error.message, 'error'));
  } else {
    showToast('Please enter your email', 'warning');
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  auth.signOut()
    .then(() => {
      showToast('Logged out', 'info');
      narrate('you have logged out. The galaxy awaits your return.');
      document.getElementById('hub-main').classList.add('hidden');
      document.getElementById('login-modal').classList.remove('hidden');
    })
    .catch(error => showToast(error.message, 'error'));
});

document.getElementById('close-hub-btn').addEventListener('click', () => {
  document.getElementById('hub-main').classList.add('hidden');
  document.getElementById('login-modal').classList.remove('hidden');
});

// Unified AI
class UnifiedAI {
  constructor() {
    this.context = {};
    this.avatar = new THREE.Mesh(
      new THREE.SphereGeometry(0.5),
      new THREE.MeshBasicMaterial({ color: 0x33B5FF })
    );
    this.scene = new THREE.Scene();
    this.scene.add(this.avatar);
    this.sentimentModel = null;
    this.loadSentimentModel();
  }

  async loadSentimentModel() {
    // Mock TensorFlow.js model (replace with real model)
    this.sentimentModel = {
      predict: (tensor) => ({ dataSync: () => [Math.random()] })
    };
  }

  async processInput(input, type = 'text') {
    let processedInput = input;
    if (type === 'voice') {
      processedInput = await this.transcribeVoice(input);
    } else if (type === 'file') {
      processedInput = await this.parseFile(input);
    }
    const analysis = await this.analyzeInput(processedInput);
    const response = await this.generateResponse(analysis);
    this.updateAvatar(response.emotion);
    document.getElementById('ai-message').textContent = response.message;
    if (response.action) {
      await this.executeAction(response.action);
    }
    narrate(response.message);
    return response;
  }

  async transcribeVoice(audioBlob) {
    // Mock for Web Speech API
    return audioBlob.toString().substring(0, 50);
  }

  async parseFile(file) {
    const type = file.type;
    try {
      if (type === 'application/json') {
        const text = await file.text();
        return JSON.parse(text);
      } else if (type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ');
        }
        return { content: text };
      } else if (type.startsWith('audio/') || type.startsWith('video/') || type.startsWith('image/')) {
        return { content: `Mock ${type.split('/')[0]} analysis` };
      }
      throw new Error('Unsupported file type');
    } catch (error) {
      showToast(`File parsing failed: ${error.message}`, 'error');
      return null;
    }
  }

  async analyzeInput(input) {
    const sentiment = await this.analyzeSentiment(typeof input === 'string' ? input : JSON.stringify(input));
    return {
      intent: typeof input === 'object' ? 'create_bot' : 'query',
      sentiment,
      botConfig: typeof input === 'object' ? input : null
    };
  }

  async analyzeSentiment(text) {
    const tensor = tf.tensor([text]);
    const prediction = this.sentimentModel.predict(tensor);
    return prediction.dataSync()[0] > 0.5 ? 'positive' : 'negative';
  }

  async generateResponse(analysis) {
    if (analysis.intent === 'create_bot' && analysis.botConfig) {
      return {
        message: `Creating ${analysis.botConfig.name || 'new'} bot...`,
        action: { type: 'create_bot', params: analysis.botConfig },
        emotion: 'happy'
      };
    }
    return {
      message: 'Processing query...',
      action: null,
      emotion: 'neutral'
    };
  }

  updateAvatar(emotion) {
    this.avatar.material.color.set(emotion === 'happy' ? 0x33B5FF : 0xFF3333);
  }

  async executeAction(action) {
    if (action.type === 'create_bot') {
      await Bot.create(action.params);
    }
  }
}

const ai = new UnifiedAI();

// Bot Management
class Bot {
  static async create(params) {
    try {
      const botId = Date.now().toString();
      const bot = {
        id: botId,
        name: params.name || 'Unnamed Bot',
        status: 'stopped',
        code: params.code || '// Bot code',
        createdAt: new Date().toISOString(),
        neural: params.neural || false
      };
      await idb.set('bots', botId, bot);
      const botList = document.getElementById('bot-list');
      botList.innerHTML += `
        <div class="bot-item" data-id="${botId}">
          ${bot.name} (${bot.neural ? 'Neural' : 'Standard'})
          <button onclick="Bot.start('${botId}')">Start</button>
          <button onclick="Bot.edit('${botId}')">Edit</button>
          <button onclick="Bot.delete('${botId}')">Delete</button>
        </div>`;
      addWidget('status', { x: Math.random() * 5, y: 1, z: Math.random() * 5 });
      narrate(`bot ${bot.name} has been forged in the galactic foundry.`);
      hapticFeedback();
      return bot;
    } catch (error) {
      showToast(`Bot creation failed: ${error.message}`, 'error');
      throw error;
    }
  }

  static async start(botId) {
    await idb.update('bots', botId, { status: 'running' });
    showToast(`Bot ${botId} started`, 'success');
    narrate(`bot ${botId} is now active, patrolling the digital cosmos.`);
  }

  static async edit(botId) {
    const bot = await idb.get('bots', botId);
    const editor = document.getElementById('code-editor');
    editor.classList.remove('hidden');
    monaco.editor.create(document.getElementById('monaco-editor'), {
      value: bot.code,
      language: 'javascript'
    });
    document.getElementById('save-code-btn').onclick = async () => {
      const newCode = monaco.editor.getModels()[0].getValue();
      await idb.update('bots', botId, { code: newCode });
      editor.classList.add('hidden');
      showToast('Bot code updated', 'success');
    };
  }

  static async delete(botId) {
    await idb.delete('bots', botId);
    document.querySelector(`.bot-item[data-id="${botId}"]`).remove();
    showToast('Bot deleted', 'success');
    narrate(`bot ${botId} has been decommissioned.`);
  }
}

// IndexedDB wrapper
const idb = {
  async set(store, key, value) {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open('SmartHubDB', 1);
      openRequest.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore('bots', { keyPath: 'id' });
      };
      openRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([store], 'readwrite');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.put(value);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('IndexedDB set failed'));
      };
      openRequest.onerror = () => reject(new Error('IndexedDB open failed'));
    });
  },
  async get(store, key) {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open('SmartHubDB', 1);
      openRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([store], 'readonly');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('IndexedDB get failed'));
      };
    });
  },
  async update(store, key, updates) {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open('SmartHubDB', 1);
      openRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([store], 'readwrite');
        const objectStore = transaction.objectStore(store);
        const getRequest = objectStore.get(key);
        getRequest.onsuccess = () => {
          const data = getRequest.result;
          const updatedData = { ...data, ...updates };
          const putRequest = objectStore.put(updatedData);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('IndexedDB update failed'));
        };
      };
    });
  },
  async delete(store, key) {
    return new Promise((resolve, reject) => {
      const openRequest = indexedDB.open('SmartHubDB', 1);
      openRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction([store], 'readwrite');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('IndexedDB delete failed'));
      };
    });
  }
};

// Logs
async function loadLogs() {
  const logs = await db.collection('logs').orderBy('timestamp', 'desc').limit(10).get();
  const logList = document.getElementById('log-list');
  logList.innerHTML = '';
  logs.forEach(log => {
    logList.innerHTML += `
      <div class="log-item">
        ${log.data().message} (${new Date(log.data().timestamp).toLocaleString()})
        <button onclick="deleteLog('${log.id}')">Delete</button>
      </div>`;
  });
}

async function deleteLog(logId) {
  await db.collection('logs').doc(logId).delete();
  showToast('Log deleted', 'success');
  loadLogs();
}

document.getElementById('log-search').addEventListener('input', async (e) => {
  const query = e.target.value;
  const logs = await db.collection('logs')
    .where('message', '>=', query)
    .where('message', '<=', query + '\uf8ff')
    .get();
  const logList = document.getElementById('log-list');
  logList.innerHTML = '';
  logs.forEach(log => {
    logList.innerHTML += `
      <div class="log-item">
        ${log.data().message} (${new Date(log.data().timestamp).toLocaleString()})
        <button onclick="deleteLog('${log.id}')">Delete</button>
      </div>`;
  });
});

document.getElementById('export-csv-btn').addEventListener('click', async () => {
  const logs = await db.collection('logs').get();
  const csv = ['Timestamp,Message'];
  logs.forEach(log => {
    csv.push(`${log.data().timestamp},${log.data().message.replace(/,/g, '')}`);
  });
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'logs.csv';
  a.click();
});

// Interactivity
document.getElementById('voice-input-btn').addEventListener('click', () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.start();
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    ai.processInput(transcript, 'voice');
    showToast('Voice command processed', 'info');
  };
  recognition.onerror = (event) => {
    showToast(`Voice recognition error: ${event.error}`, 'error');
  };
});

const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({ maxNumHands: 1, modelComplexity: 1 });
hands.onResults((results) => {
  if (results.multiHandLandmarks) {
    const x = results.multiHandLandmarks[0][0].x;
    if (x > 0.8) {
      document.querySelector('.tab-btn.active').nextElementSibling?.click();
    } else if (x < 0.2) {
      document.querySelector('.tab-btn.active').previousElementSibling?.click();
    }
  }
});

webgazer.setGazeListener((data) => {
  if (data) {
    const x = data.x / window.innerWidth;
    if (x > 0.9) {
      document.getElementById('bot-wizard-btn').click();
    }
  }
}).begin();

// Tool Integration
async function analyzeXProfile(username) {
  // Mock X API
  return { followers: 1000, posts: 500, sentiment: 'positive' };
}

// Artifact Generation
function generateArtifact(type, content) {
  const uuid = crypto.randomUUID();
  const title = type === 'code' ? 'Generated Code' : 'Generated Document';
  return `<xaiArtifact artifactType="${type}" contentType="application/${type}" uuid="${uuid}" title="${title}">${content}</xaiArtifact>`;
}

// Storage
function saveAIContext(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getAIContext(key) {
  return JSON.parse(localStorage.getItem(key)) || {};
}

// Advanced Features
async function parseFile(file) {
  const type = file.type;
  try {
    if (type === 'application/json') {
      const text = await file.text();
      return JSON.parse(text);
    } else if (type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ');
      }
      return { content: text, name: file.name.replace('.pdf', '') };
    } else if (type.startsWith('audio/') || type.startsWith('video/') || type.startsWith('image/')) {
      return { content: `Mock ${type.split('/')[0]} analysis`, name: file.name };
    }
    throw new Error('Unsupported file type');
  } catch (error) {
    showToast(`File parsing failed: ${error.message}`, 'error');
    return null;
  }
}

document.getElementById('file-upload').addEventListener('dragover', (e) => e.preventDefault());
document.getElementById('file-upload').addEventListener('drop', async (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  for (const file of files) {
    const content = await ai.processInput(file, 'file');
    if (content) {
      showToast('File processed successfully', 'info');
    }
  }
});
document.getElementById('file-input').addEventListener('change', async (e) => {
  const files = e.target.files;
  for (const file of files) {
    const content = await ai.processInput(file, 'file');
    if (content) {
      showToast('File processed successfully', 'info');
    }
  }
});

document.getElementById('bot-wizard-btn').addEventListener('click', () => {
  const name = prompt('Enter bot name:');
  const type = prompt('Enter bot type (weather, scraper, twitter):');
  if (name && type) {
    const config = {
      name,
      code: `// ${type} bot code`,
      neural: confirm('Enable neural capabilities?')
    };
    ai.processInput(config, 'file');
    narrate(`initiating ${name} bot creation. Type: ${type}.`);
  }
});

async function optimizeBotResources(bot) {
  // Mock quantum-inspired optimization
  return { cpu: 50, memory: 100 };
}

async function deployBot(bot, target) {
  // Mock deployment
  showToast(`Bot ${bot.name} deployed to ${target}`, 'success');
  narrate(`bot ${bot.name} launched to ${target} sector.`);
}

// Metaverse Interface
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('metaverse-canvas'), alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
scene.background = new THREE.Color(0x0D1B2A);

const roomGeometry = new THREE.PlaneGeometry(20, 20);
const roomMaterial = new THREE.MeshBasicMaterial({
  color: 0x33B5FF,
  opacity: 0.3,
  transparent: true,
  side: THREE.DoubleSide
});
const room = new THREE.Mesh(roomGeometry, roomMaterial);
room.rotation.x = Math.PI / 2;
scene.add(room);

function addWidget(type, position) {
  const widgetGeometry = new THREE.SphereGeometry(0.5);
  const widgetMaterial = new THREE.MeshBasicMaterial({
    color: type === 'status' ? 0xFF3333 : 0x33B5FF
  });
  const widget = new THREE.Mesh(widgetGeometry, widgetMaterial);
  widget.position.set(position.x, position.y, position.z);
  scene.add(widget);
}

camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

function animate() {
  requestAnimationFrame(animate);
  room.material.color.setHSL(Math.sin(Date.now() * 0.001) * 0.5 + 0.5, 1, 0.5);
  scene.children.forEach(child => {
    if (child.geometry.type === 'SphereGeometry') {
      child.position.y = Math.sin(Date.now() * 0.002 + child.position.x) * 0.5 + 1;
    }
  });
  renderer.render(scene, camera);
}
animate();

// Dashboard
function renderDashboard() {
  const ctx = document.getElementById('bot-analytics').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr'],
      datasets: [{
        label: 'Bot Activity',
        data: [10, 20, 15, 25],
        borderColor: '#FF3333',
        backgroundColor: 'rgba(51, 181, 255, 0.2)'
      }]
    }
  });
}

function renderGlobe() {
  // Mock D3.js globe
  document.getElementById('global-analytics').innerHTML = '3D Globe Placeholder';
}

// Marketplace
async function loadMarketplace() {
  const marketplaceList = document.getElementById('marketplace-list');
  marketplaceList.innerHTML = `
    <div class="marketplace-item">Weather Bot - 0.01 ETH <button onclick="buyBot('weather')">Buy</button></div>
    <div class="marketplace-item">Twitter Bot - 0.02 ETH <button onclick="buyBot('twitter')">Buy</button></div>
  `;
}

async function buyBot(type) {
  // Mock Chainlink purchase
  showToast(`Purchased ${type} bot`, 'success');
  narrate(`new ${type} bot acquired. Ready for deployment.`);
}

// Initialization
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('hub-main').classList.remove('hidden');
    loadLogs();
    renderDashboard();
    loadMarketplace();
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
    narrate(`navigating to ${btn.dataset.tab} sector.`);
  });
});

document.getElementById('dark-theme-toggle').addEventListener('change', (e) => {
  document.body.classList.toggle('dark-theme', e.target.checked);
});

document.getElementById('theme-intensity').addEventListener('input', (e) => {
  const intensity = e.target.value / 100;
  document.documentElement.style.setProperty('--red-primary', `hsl(0, 100%, ${50 + intensity * 25}%)`);
  document.documentElement.style.setProperty('--blue-primary', `hsl(210, 100%, ${50 + intensity * 25}%)`);
});