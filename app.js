// Firebase Initialization
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

// DOM Elements
const loginModal = document.getElementById('login-modal');
const hubMain = document.getElementById('hub-main');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signInBtn = document.getElementById('sign-in-btn');
const signUpBtn = document.getElementById('sign-up-btn');
const forgotPassword = document.getElementById('forgot-password');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');
const fileInput = document.getElementById('file-input');
const botWizardBtn = document.getElementById('bot-wizard-btn');
const voiceInputBtn = document.getElementById('voice-input-btn');
const botList = document.getElementById('bot-list');
const codeEditor = document.getElementById('code-editor');
const monacoEditorDiv = document.getElementById('monaco-editor');
const saveCodeBtn = document.getElementById('save-code-btn');
const sandboxBtn = document.getElementById('sandbox-btn');
const cancelCodeBtn = document.getElementById('cancel-code-btn');
const logSearch = document.getElementById('log-search');
const logList = document.getElementById('log-list');
const exportCsvBtn = document.getElementById('export-csv-btn');
const botAnalytics = document.getElementById('bot-analytics');
const globalAnalytics = document.getElementById('global-analytics');
const marketplaceList = document.getElementById('marketplace-list');
const darkThemeToggle = document.getElementById('dark-theme-toggle');
const themeIntensity = document.getElementById('theme-intensity');
const gestureCalibrateBtn = document.getElementById('gesture-calibrate-btn');
const aiAvatarPanel = document.getElementById('ai-avatar-panel');
const aiMessage = document.getElementById('ai-message');
const toast = document.getElementById('toast');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Global State
let user = null;
let monacoEditor = null;
let currentBot = null;
let recognition = null;
let ipfsNode = null;
let tfModel = null;
let threeScene = null;

// Utility Functions
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function vibrate(duration = 100) {
  if (navigator.vibrate) navigator.vibrate(duration);
}

// Authentication
auth.onAuthStateChanged(firebaseUser => {
  user = firebaseUser;
  if (user) {
    loginModal.classList.add('hidden');
    hubMain.classList.remove('hidden');
    initMetaverse();
    initBots();
    initLogs();
    initDashboard();
    initMarketplace();
  } else {
    loginModal.classList.remove('hidden');
    hubMain.classList.add('hidden');
  }
});

signInBtn.addEventListener('click', async () => {
  try {
    await auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);
    showToast('Signed in successfully');
  } catch (error) {
    authError.textContent = error.message;
    authError.classList.remove('hidden');
  }
});

signUpBtn.addEventListener('click', async () => {
  try {
    await auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
    showToast('Signed up successfully');
  } catch (error) {
    authError.textContent = error.message;
    authError.classList.remove('hidden');
  }
});

forgotPassword.addEventListener('click', async e => {
  e.preventDefault();
  const email = prompt('Enter your email for password reset:');
  if (email) {
    try {
      await auth.sendPasswordResetEmail(email);
      showToast('Password reset email sent');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
});

logoutBtn.addEventListener('click', async () => {
  await auth.signOut();
  showToast('Logged out');
});

// Metaverse UI (Three.js)
function initMetaverse() {
  const canvas = document.getElementById('metaverse-canvas');
  threeScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Add holographic room
  const geometry = new THREE.BoxGeometry(10, 10, 10);
  const material = new THREE.MeshBasicMaterial({ color: 0x1E90FF, wireframe: true });
  const room = new THREE.Mesh(geometry, material);
  threeScene.add(room);

  // Add AI avatar
  const avatarGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const avatarMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
  const avatar = new THREE.Mesh(avatarGeometry, avatarMaterial);
  avatar.position.set(0, 0, -5);
  threeScene.add(avatar);

  camera.position.z = 5;
  function animate() {
    requestAnimationFrame(animate);
    room.rotation.y += 0.01;
    renderer.render(threeScene, camera);
  }
  animate();
}

// File Handling
async function parseFile(file) {
  const fileType = file.type;
  let content = '';
  if (fileType.includes('json') || fileType.includes('yaml') || fileType.includes('xml')) {
    content = await file.text();
  } else if (fileType.includes('pdf')) {
    // Mock Google Cloud Vision (replace with actual API)
    content = 'Extracted PDF text';
  } else if (fileType.includes('audio')) {
    // Mock OpenAI Whisper (replace with actual API)
    content = 'Transcribed audio text';
  } else if (fileType.includes('video')) {
    // Mock video analysis
    content = 'Transcribed video audio';
  } else if (fileType.includes('image')) {
    // Mock Google Cloud Vision
    content = 'Extracted image text';
  }
  // Semantic analysis (mock Hugging Face)
  const intent = `Bot intent: ${file.name}`; // Replace with Hugging Face NLP
  return { content, intent };
}

fileInput.addEventListener('change', async () => {
  const files = fileInput.files;
  for (const file of files) {
    const { content, intent } = await parseFile(file);
    const questions = [`Clarify purpose for ${intent}?`]; // Mock clarifying questions
    aiMessage.textContent = questions[0];
    const bot = await createBotFromFile(content, intent);
    showToast(`Bot created from ${file.name}`);
  }
});

// Bot Creation & Management
async function createBotFromFile(content, intent) {
  const bot = {
    id: Date.now().toString(),
    name: intent,
    code: `// Bot from ${intent}\n${content}`,
    status: 'Stopped',
    neural: false
  };
  await saveBot(bot);
  return bot;
}

async function saveBot(bot) {
  const db = indexedDB.open('SmartHub', 1);
  db.onupgradeneeded = () => {
    db.result.createObjectStore('bots', { keyPath: 'id' });
  };
  return new Promise(resolve => {
    db.onsuccess = () => {
      const tx = db.result.transaction('bots', 'readwrite');
      tx.objectStore('bots').put(bot);
      tx.oncomplete = () => resolve();
    };
  });
}

async function loadBots() {
  const db = indexedDB.open('SmartHub', 1);
  return new Promise(resolve => {
    db.onsuccess = () => {
      const tx = db.result.transaction('bots', 'readonly');
      const store = tx.objectStore('bots');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
    };
  });
}

async function initBots() {
  const bots = await loadBots();
  botList.innerHTML = '';
  bots.forEach(bot => {
    const div = document.createElement('div');
    div.className = 'bot-item glassmorphic';
    div.innerHTML = `
      <p>${bot.name} (${bot.status})</p>
      <button onclick="startBot('${bot.id}')">Start</button>
      <button onclick="stopBot('${bot.id}')">Stop</button>
      <button onclick="editBot('${bot.id}')">Edit</button>
      <button onclick="deleteBot('${bot.id}')">Delete</button>
    `;
    botList.appendChild(div);
  });
}

async function startBot(id) {
  // Mock bot execution with neural network
  if (tfModel) {
    // Example: Predict bot action
    const input = tf.tensor2d([[1, 0]]); // Mock input
    const prediction = tfModel.predict(input);
    console.log('Neural bot prediction:', prediction.dataSync());
  }
  showToast(`Bot ${id} started`);
}

async function stopBot(id) {
  showToast(`Bot ${id} stopped`);
}

async function editBot(id) {
  const bots = await loadBots();
  currentBot = bots.find(bot => bot.id === id);
  codeEditor.classList.remove('hidden');
  monacoEditor.setValue(currentBot.code);
}

async function deleteBot(id) {
  const db = indexedDB.open('SmartHub', 1);
  return new Promise(resolve => {
    db.onsuccess = () => {
      const tx = db.result.transaction('bots', 'readwrite');
      tx.objectStore('bots').delete(id);
      tx.oncomplete = () => {
        initBots();
        resolve();
      };
    };
  });
}

saveCodeBtn.addEventListener('click', async () => {
  currentBot.code = monacoEditor.getValue();
  await saveBot(currentBot);
  codeEditor.classList.add('hidden');
  initBots();
  showToast('Bot code saved');
});

sandboxBtn.addEventListener('click', () => {
  // Mock Pyodide sandbox
  showToast('Running code in sandbox');
});

cancelCodeBtn.addEventListener('click', () => {
  codeEditor.classList.add('hidden');
});

// Logs
async function saveLog(input, response) {
  await db.collection('logs').add({
    userId: user.uid,
    email: user.email,
    input,
    response,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function loadLogs() {
  const snapshot = await db.collection('logs').where('userId', '==', user.uid).get();
  logList.innerHTML = '';
  snapshot.forEach(doc => {
    const log = doc.data();
    const div = document.createElement('div');
    div.className = 'log-item glassmorphic';
    div.innerHTML = `<p>${log.input} -> ${log.response} (${log.timestamp.toDate()})</p>`;
    logList.appendChild(div);
  });
}

logSearch.addEventListener('input', () => {
  const term = logSearch.value.toLowerCase();
  const logs = document.querySelectorAll('.log-item');
  logs.forEach(log => {
    log.style.display = log.textContent.toLowerCase().includes(term) ? '' : 'none';
  });
});

exportCsvBtn.addEventListener('click', async () => {
  const snapshot = await db.collection('logs').where('userId', '==', user.uid).get();
  let csv = 'Input,Response,Timestamp\n';
  snapshot.forEach(doc => {
    const log = doc.data();
    csv += `"${log.input}","${log.response}","${log.timestamp.toDate()}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'logs.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// Dashboard
function initDashboard() {
  const ctx = botAnalytics.getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: [{
        label: 'Bot Activity',
        data: [10, 20, 30],
        borderColor: '#FF0000',
        backgroundColor: '#1E90FF'
      }]
    }
  });

  // Mock D3.js global analytics (3D globe)
  const globe = document.createElement('div');
  globe.textContent = '3D Globe Heatmap (D3.js)';
  globalAnalytics.appendChild(globe);
}

// Marketplace
async function initMarketplace() {
  // Mock marketplace
  marketplaceList.innerHTML = '<div class="market-item glassmorphic">Sample Bot</div>';
}

// Interactivity
darkThemeToggle.addEventListener('change', () => {
  document.body.classList.toggle('dark-theme', darkThemeToggle.checked);
});

themeIntensity.addEventListener('input', () => {
  const intensity = themeIntensity.value / 100;
  document.documentElement.style.setProperty('--red-primary', `rgba(255, 0, 0, ${intensity})`);
  document.documentElement.style.setProperty('--blue-primary', `rgba(30, 144, 255, ${intensity})`);
});

gestureCalibrateBtn.addEventListener('click', () => {
  // Mock MediaPipe calibration
  showToast('Calibrating gestures...');
});

// Voice Input
function initVoiceInput() {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.onresult = async event => {
    const transcript = event.results[0][0].transcript;
    aiMessage.textContent = `Heard: ${transcript}`;
    // Mock OpenAI Whisper fallback
    const bot = await createBotFromFile(transcript, `Voice bot: ${transcript}`);
    showToast(`Bot created from voice: ${transcript}`);
  };
  recognition.onerror = () => {
    showToast('Voice input error, try again', 'error');
  };
}

voiceInputBtn.addEventListener('click', () => {
  recognition.start();
  showToast('Listening...');
});

// Monaco Editor
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs' } });
require(['vs/editor/editor.main'], () => {
  monacoEditor = monaco.editor.create(monacoEditorDiv, {
    value: '// Write bot code here',
    language: 'javascript',
    theme: 'vs-dark'
  });
});

// IPFS for Bot Federation
async function initIPFS() {
  ipfsNode = await Ipfs.create();
  console.log('IPFS node initialized');
}

// Neural Bot Brains (TensorFlow.js)
async function initNeuralModel() {
  tfModel = tf.sequential();
  tfModel.add(tf.layers.dense({ units: 10, inputShape: [2], activation: 'relu' }));
  tfModel.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  tfModel.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });
  console.log('Neural model initialized');
}

// Quantum Optimization (Mock Qiskit.js)
function optimizeBot(bot) {
  // Mock quantum-inspired optimization
  console.log(`Optimizing bot ${bot.id} with Qiskit.js`);
  return bot;
}

// Emotion-Aware AI
function detectMood(input) {
  // Mock Hugging Face sentiment analysis
  return input.includes('happy') ? 'positive' : 'neutral';
}

// Self-Evolving AI (Mock Pinecone)
function storeFeedback(feedback) {
  // Mock Pinecone vector DB
  console.log('Storing feedback:', feedback);
}

// Tab Navigation
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(`${btn.dataset.tab}-tab`).classList.remove('hidden');
  });
});

// Initialize
async function init() {
  await initIPFS();
  await initNeuralModel();
  initVoiceInput();
  // Mock particle.js
  particlesJS('metaverse-canvas', { particles: { number: { value: 50 }, color: { value: '#FF0000' } } });
}
init();