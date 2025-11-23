// Firebase Configuration with fallback
let db = null;
try {
  if (typeof firebase !== 'undefined') {
    const firebaseConfig = {
      apiKey: "AIzaSyC8qPo1m1Na6u20e3b3Qf8eCfk5EBn15o",
      authDomain: "smarthubultra.firebaseapp.com",
      databaseURL: "https://smarthubultra-default-rtdb.firebaseio.com",
      projectId: "smarthubultra",
      storageBucket: "smarthubultra.appspot.com",
      messagingSenderId: "1045339361627",
      appId: "1:1045339361627:web:6d3a5c7e1e1d2f5a4b3c2d",
      measurementId: "G-5X7Y2T8Z9Q"
    };
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    console.log('✅ Firebase initialized successfully');
  } else {
    console.warn('⚠️ Firebase not available, using local storage only');
  }
} catch (error) {
  console.warn('⚠️ Firebase initialization failed, using local storage only:', error.message);
}

// Initialize Smart AI Learning System
(async () => {
  try {
    await SmartAI.initializeLearning();
    console.log('🧠 Smart AI Learning System initialized');
    
    // Start periodic evolution (every 30 minutes)
    setInterval(async () => {
      try {
        const evolution = await SmartAI.evolve();
        if (evolution.evolved) {
          console.log('🚀 AI Evolution:', evolution);
          if (typeof showToast === 'function') {
            showToast(`🧠 AI Evolved! Success rate: ${evolution.successRate}%, Improvements: ${evolution.improvements}`, 'info');
          }
        }
      } catch (error) {
        console.warn('Evolution update failed:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    // Proactive assistance every 10 minutes
    setInterval(async () => {
      try {
        const suggestions = await SmartAI.generateSmartSuggestions();
        if (suggestions.length > 0 && Math.random() > 0.7) { // 30% chance to show proactive suggestion
          if (typeof showToast === 'function') {
            showToast(`💡 Smart Suggestion: ${suggestions[0]}`, 'info');
          }
        }
      } catch (error) {
        console.warn('Proactive assistance failed:', error);
      }
    }, 10 * 60 * 1000); // 10 minutes
    
  } catch (error) {
    console.warn('Smart AI initialization failed:', error);
  }
})();

class IDB {
  static async init() {
    return await new Promise((resolve, reject) => {
      const req = indexedDB.open('SmartHubDB', 12);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('bots')) db.createObjectStore('bots', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'email' });
        if (!db.objectStoreNames.contains('support')) db.createObjectStore('support', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('tracking')) db.createObjectStore('tracking', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('marketplace')) db.createObjectStore('marketplace', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('collab')) db.createObjectStore('collab', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('analytics')) db.createObjectStore('analytics', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('chat')) db.createObjectStore('chat', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('learning')) db.createObjectStore('learning', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache', { keyPath: 'key' });
      };
      req.onsuccess = e => resolve(e.target.result);
      req.onerror = e => reject(new Error(`IndexedDB error: ${e.target.error.message}`));
    });
  }

  static async batchSet(store, operations) {
    const db = await IDB.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([store], 'readwrite');
      const storeObj = tx.objectStore(store);
      operations.forEach(op => storeObj.put(op));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error(`Batch set failed: ${tx.error}`));
    });
  }

  static async get(store, key) {
    const db = await IDB.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([store], 'readonly');
      const storeObj = tx.objectStore(store);
      const req = storeObj.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error(`Get failed: ${req.error}`));
    });
  }

  static async getAll(store) {
    const db = await IDB.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([store], 'readonly');
      const storeObj = tx.objectStore(store);
      const req = storeObj.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error(`Get all failed: ${req.error}`));
    });
  }
}

const updates = [
  { message: "Added vibrant modal-based layout", type: "feature", timestamp: Date.now() },
  { message: "Enhanced colors with multi-gradient themes", type: "feature", timestamp: Date.now() },
  { message: "Introduced live chat in Collab Hub", type: "feature", timestamp: Date.now() }
];

const badges = [
  { name: "First Bot", criteria: "Create your first bot", points: 50, color: "#FF6F61" },
  { name: "Collaborator", criteria: "Invite a user to collab", points: 100, color: "#33B5FF" },
  { name: "Bot Master", criteria: "Create 5 bots", points: 200, color: "#D4A5FF" }
];

// Loading Screen
let progress = 0;
const progressBar = document.getElementById('progress');
const loadingInterval = setInterval(() => {
  progress += 10;
  progressBar.style.width = `${progress}%`;
  if (progress >= 100) {
    clearInterval(loadingInterval);
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('login-modal').classList.remove('hidden');
  }
}, 300);

// Modal Navigation
function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
}

document.querySelectorAll('.sidebar a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    closeAllModals();
    const modalId = link.dataset.modal;
    document.getElementById(modalId).classList.remove('hidden');
  });
});

document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', () => {
    closeAllModals();
  });
});

// Authentication
async function signUp(email, username, password, sixDigit, fourDigit) {
  try {
    document.getElementById('login-spinner').classList.remove('hidden');
    if (!email && !username) throw new Error('Email or username required');
    if (password.length < 8) throw new Error('Password must be at least 8 characters');
    if (!/^\d{6}$/.test(sixDigit)) throw new Error('6-digit code must be exactly 6 digits');
    if (!/^\d{4}$/.test(fourDigit)) throw new Error('4-digit code must be exactly 4 digits');
    const userByEmail = email ? await IDB.get('users', email) : null;
    const userByUsername = username ? await IDB.get('users', username) : null;
    if (userByEmail || userByUsername) throw new Error('Email or username already registered');
    const user = {
      email: email || username,
      username,
      password,
      sixDigit,
      fourDigit,
      createdAt: Date.now(),
      points: 0,
      level: 1,
      xp: 0,
      role: 'user',
      badges: [],
      passwordChanges: []
    };
    await IDB.batchSet('users', [user]);
    localStorage.setItem('currentUser', email || username);
    // Sync to Firebase if available
    if (db) {
      try {
        await db.ref('users/' + (email || username).replace(/[^a-zA-Z0-9]/g, '')).set(user);
      } catch (error) {
        console.warn('Firebase sync failed, continuing with local storage:', error);
      }
    }
    showToast('✅ Successfully signed up!');
    document.getElementById('login-modal').classList.add('hidden');
    showWelcome();
  } catch (error) {
    document.getElementById('auth-error').textContent = error.message;
    document.getElementById('auth-error').classList.remove('hidden');
    showToast(`❌ Sign-up failed: ${error.message}`, 'error');
  } finally {
    document.getElementById('login-spinner').classList.add('hidden');
  }
}

async function signIn(loginId, password) {
  try {
    document.getElementById('login-spinner').classList.remove('hidden');
    if (!loginId || !password) throw new Error('Login ID and password required');
    let user = await IDB.get('users', loginId);
    if (!user) {
      const users = await IDB.getAll('users');
      user = users.find(u => u.username === loginId || u.email === loginId);
    }
    if (!user) throw new Error('User not found');
    if (user.password !== password) throw new Error('Wrong password');
    localStorage.setItem('currentUser', user.email);
    showToast('Signed in!');
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('sidebar').classList.remove('hidden');
    document.getElementById('notification-bell').classList.remove('hidden');
    showWelcome();
    if (user.email === 'boss@smarthub.com') {
      document.getElementById('boss-link').classList.remove('hidden');
    }
  } catch (error) {
    document.getElementById('auth-error').textContent = error.message;
    document.getElementById('auth-error').classList.remove('hidden');
    showToast(`Sign-in failed: ${error.message}`);
  } finally {
    document.getElementById('login-spinner').classList.add('hidden');
  }
}

async function recoverPassword() {
  const sixDigit = document.getElementById('recovery-six-digit').value;
  const fourDigit = document.getElementById('recovery-four-digit').value;
  const email = localStorage.getItem('currentUser');
  const user = await IDB.get('users', email);
  if (user.sixDigit === sixDigit && user.fourDigit === fourDigit) {
    const newPassword = prompt('Enter new password (min 8 chars):');
    if (newPassword.length < 8) {
      document.getElementById('recovery-error').textContent = 'Password must be at least 8 characters';
      document.getElementById('recovery-error').classList.remove('hidden');
      return;
    }
    user.passwordChanges.push({ oldPassword: user.password, newPassword, timestamp: Date.now() });
    user.password = newPassword;
    await IDB.batchSet('users', [user]);
    db.ref('users/' + email.replace(/[^a-zA-Z0-9]/g, '')).update(user);
    showToast('Password updated!');
    document.getElementById('recovery-modal').classList.add('hidden');
  } else {
    document.getElementById('recovery-error').textContent = 'Codes do not match';
    document.getElementById('recovery-error').classList.remove('hidden');
  }
}

async function submitSupportTicket() {
  const ticket = {
    id: Date.now().toString(),
    username: document.getElementById('support-username').value,
    name: document.getElementById('support-name').value,
    email: document.getElementById('support-email').value,
    number: document.getElementById('support-number').value,
    message: document.getElementById('support-message').value,
    timestamp: Date.now()
  };
  await IDB.batchSet('support', [ticket]);
  db.ref('support/' + ticket.id).set(ticket);
  showToast('Support ticket submitted!');
  document.getElementById('support-modal').classList.add('hidden');
}

function showWelcome() {
  const welcomeModal = document.getElementById('welcome-modal');
  welcomeModal.classList.remove('hidden');
  const updatesDiv = document.getElementById('welcome-updates');
  updates.forEach(update => {
    const p = document.createElement('p');
    p.innerHTML = `<b>${update.type.charAt(0).toUpperCase() + update.type.slice(1)}:</b> ${update.message}`;
    updatesDiv.appendChild(p);
  });
  document.getElementById('dismiss-welcome').addEventListener('click', () => {
    welcomeModal.classList.add('hidden');
    document.getElementById('dashboard-modal').classList.remove('hidden');
    loadDashboard();
  });
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = message;
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => toast.classList.add('toast-visible'), 10);
  
  // Remove after delay
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Dashboard
async function loadDashboard() {
  const bots = await IDB.getAll('bots');
  document.getElementById('bot-status').textContent = `${bots.length} active`;
  
  try {
    const res = await fetch('https://api.openweathermap.org/data/2.5/weather?q=London&appid=4fc179285e1139b621267e810bb9ddcd');
    const data = await res.json();
    const weather = `${data.weather[0].description}, ${Math.round(data.main.temp - 273.15)}°C`;
    document.getElementById('weather').textContent = weather;
  } catch {
    document.getElementById('weather').textContent = 'Weather unavailable';
  }
  
  // Enhanced AI Insights with Smart AI metrics
  try {
    await SmartAI.initializeLearning();
    const evolution = await SmartAI.evolve();
    const aiInsights = [];
    
    if (evolution.successRate > 85) {
      aiInsights.push('🧠 AI Performance: Excellent');
    } else if (evolution.successRate > 70) {
      aiInsights.push('🧠 AI Performance: Good, evolving');
    } else {
      aiInsights.push('🧠 AI Performance: Learning from interactions');
    }
    
    if (evolution.improvements > 0) {
      aiInsights.push(`✨ Recent Improvements: ${evolution.improvements}`);
    }
    
    const aiGeneratedBots = bots.filter(bot => bot.aiGenerated).length;
    if (aiGeneratedBots > 0) {
      aiInsights.push(`🤖 AI-Generated Bots: ${aiGeneratedBots}/${bots.length}`);
    }
    
    // Smart suggestions based on time and context
    const suggestions = await SmartAI.generateSmartSuggestions();
    if (suggestions.length > 0) {
      aiInsights.push(`💡 Smart Tip: ${suggestions[0]}`);
    }
    
    document.getElementById('ai-insights').innerHTML = aiInsights.join('<br>') || '🧠 Smart AI is learning your patterns...';
    
  } catch (error) {
    console.warn('AI insights update failed:', error);
    document.getElementById('ai-insights').textContent = '🧠 Smart AI is initializing...';
  }
  
  document.querySelectorAll('.dashboard-widget').forEach(widget => {
    widget.addEventListener('click', () => {
      const action = widget.dataset.action;
      closeAllModals();
      if (action === 'view-bots') {
        document.getElementById('bots-modal').classList.remove('hidden');
        loadBotsPage();
      } else if (action === 'view-insights') {
        showToast('Insights: Cache API calls for speed');
      } else if (action === 'create-bot') {
        document.getElementById('bots-modal').classList.remove('hidden');
        loadBotsPage();
      }
    });
  });

  const user = await IDB.get('users', localStorage.getItem('currentUser'));
  if (!user.hasTakenTour) {
    document.getElementById('dashboard-tour').classList.remove('hidden');
    document.getElementById('next-tour-step').addEventListener('click', () => {
      document.getElementById('dashboard-tour').classList.add('hidden');
      user.hasTakenTour = true;
      IDB.batchSet('users', [user]);
      db.ref('users/' + user.email.replace(/[^a-zA-Z0-9]/g, '')).update(user);
    });
  }
}

// Bots
async function loadBotsPage() {
  const botList = document.getElementById('bot-list');
  const bots = await IDB.getAll('bots');
  botList.innerHTML = '';
  bots.forEach(bot => {
    const item = document.createElement('div');
    item.className = 'bot-item';
    const intelligenceIcon = bot.aiGenerated ? '🧠' : '🤖';
    const intelligenceLevel = bot.intelligence || 'basic';
    const intelligenceColor = {
      'basic': '#888888',
      'adaptive': '#33B5FF',
      'contextual': '#D4A5FF',
      'predictive': '#00FFAA',
      'self-aware': '#FF6F61'
    }[intelligenceLevel] || '#888888';
    
    item.innerHTML = `
      <h3>${intelligenceIcon} ${bot.name}</h3>
      <p><b>Purpose:</b> ${bot.purpose}</p>
      <p><b>Creator:</b> ${bot.creator}</p>
      <p><b>Intelligence:</b> <span style="color: ${intelligenceColor}">${intelligenceLevel}</span></p>
      <p><b>Predicted Success:</b> <span style="color: ${(bot.predictedSuccess || bot.success || 99) > 75 ? '#00FFAA' : '#FF3333'}">${bot.predictedSuccess || bot.success || 99}%</span></p>
      ${bot.aiGenerated ? '<p><b>🧠 AI-Generated:</b> <span style="color: #00FFAA">Smart Bot</span></p>' : ''}
      <button class="btn blue-glow run-bot">Run</button>
      <button class="btn green-glow edit-bot">Edit</button>
      <button class="btn orange-glow publish-bot">Publish to Marketplace</button>
    `;
    botList.appendChild(item);
    item.querySelector('.run-bot').addEventListener('click', async () => {
      try {
        const func = new Function('return ' + bot.code)();
        const result = await func();
        showToast(`✅ Success: ${result}`);
        
        // Provide success feedback to Smart AI if it was AI-generated
        if (bot.aiGenerated && bot.input) {
          setTimeout(async () => {
            await SmartAI.learnFromInteraction(bot.input, { result, success: true }, true);
          }, 500);
        }
        
        localStorage.setItem('editingBot', JSON.stringify(bot));
        closeAllModals();
        document.getElementById('playground-modal').classList.remove('hidden');
        loadPlayground();
      } catch (error) {
        showToast(`❌ Execution Error: ${error.message}`, 'warning');
        
        // Provide failure feedback to Smart AI if it was AI-generated
        if (bot.aiGenerated && bot.input) {
          setTimeout(async () => {
            await SmartAI.learnFromInteraction(bot.input, { error: error.message, success: false }, false);
          }, 500);
        }
        
        console.error('Bot execution failed:', error);
      }
    });
    item.querySelector('.edit-bot').addEventListener('click', () => {
      localStorage.setItem('editingBot', JSON.stringify(bot));
      closeAllModals();
      document.getElementById('editor-modal').classList.remove('hidden');
      loadEditor();
    });
    item.querySelector('.publish-bot').addEventListener('click', async () => {
      const marketplaceBot = { id: bot.id, name: bot.name, purpose: bot.purpose, code: bot.code, creator: bot.creator, reviews: [], rating: 0 };
      await IDB.batchSet('marketplace', [marketplaceBot]);
      db.ref('marketplace/' + bot.id).set(marketplaceBot);
      showToast(`Published ${bot.name} to Marketplace`);
      loadMarketplace();
    });
  });
  loadMarketplace();

  document.getElementById('use-wizard').addEventListener('change', e => {
    document.getElementById('creation-wizard').classList.toggle('hidden', !e.target.checked);
  });

  document.getElementById('submit-wizard').addEventListener('click', async () => {
    const desc = document.getElementById('bot-description').value;
    const bot = {
      id: Date.now().toString(),
      name: `Bot-${Date.now()}`,
      purpose: desc,
      functionality: 'Wizard-created bot',
      success: 99,
      input: desc,
      code: `async () => { return "Bot executed: ${desc}"; }`,
      creator: localStorage.getItem('currentUser')
    };
    await IDB.batchSet('bots', [bot]);
    db.ref('bots/' + bot.id).set(bot);
    showToast(`Created ${bot.name}`);
    updateUserPoints(20);
    checkBadges();
    loadBotsPage();
  });

  document.getElementById('voice-input-btn').addEventListener('click', () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast('Speech recognition not supported in this browser', 'warning');
      return;
    }
    
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    showToast('🎤 Listening... Speak your bot idea!', 'info');
    
    recognition.onresult = async e => {
      const idea = e.results[0][0].transcript;
      showToast(`🎤 Heard: "${idea}" - Processing with Smart AI...`, 'info');
      
      try {
        const aiResult = await SmartAI.processInput(idea, 'voice');
        
        const bot = {
          ...aiResult.params,
          creator: localStorage.getItem('currentUser'),
          createdAt: Date.now(),
          aiGenerated: true,
          voiceInput: true
        };
        
        await IDB.batchSet('bots', [bot]);
        db.ref('bots/' + bot.id).set(bot);
        showToast(`🗣️ Voice-Generated Smart Bot: ${bot.name} (Intelligence: ${bot.intelligence || 'adaptive'})`);
        
        // Provide feedback to learning system
        setTimeout(async () => {
          await SmartAI.learnFromInteraction(idea, aiResult, true);
        }, 1000);
        
        updateUserPoints(35); // Extra points for voice + AI
        checkBadges();
        loadBotsPage();
        
      } catch (error) {
        console.error('Smart AI voice processing failed:', error);
        showToast('Smart AI processing failed, creating basic voice bot...', 'warning');
        
        // Fallback to basic voice bot
        const bot = {
          id: Date.now().toString(),
          name: `VoiceBot-${Date.now()}`,
          purpose: idea,
          functionality: 'Voice-created bot',
          success: 80,
          input: idea,
          code: `async () => { return "Voice bot executed: ${idea}"; }`,
          creator: localStorage.getItem('currentUser')
        };
        await IDB.batchSet('bots', [bot]);
        db.ref('bots/' + bot.id).set(bot);
        showToast(`Created ${bot.name}`);
        updateUserPoints(25);
        checkBadges();
        loadBotsPage();
      }
    };
    
    recognition.onerror = e => {
      showToast(`Speech recognition error: ${e.error}`, 'warning');
    };
    
    recognition.onend = () => {
      console.log('Speech recognition ended');
    };
    
    recognition.start();
  });

  document.getElementById('text-input-btn').addEventListener('click', async () => {
    const idea = document.getElementById('text-input').value;
    if (!idea.trim()) {
      showToast('Please enter a bot idea first!', 'warning');
      return;
    }
    
    try {
      showToast('🧠 Smart AI processing your idea...', 'info');
      const aiResult = await SmartAI.processInput(idea, 'text');
      
      const bot = {
        ...aiResult.params,
        creator: localStorage.getItem('currentUser'),
        createdAt: Date.now(),
        aiGenerated: true
      };
      
      await IDB.batchSet('bots', [bot]);
      db.ref('bots/' + bot.id).set(bot);
      showToast(`✨ Smart Bot Created: ${bot.name} (Intelligence: ${bot.intelligence || 'adaptive'})`);
      
      // Provide feedback to learning system
      setTimeout(async () => {
        await SmartAI.learnFromInteraction(idea, aiResult, true);
      }, 1000);
      
      updateUserPoints(30); // Extra points for AI-generated bots
      checkBadges();
      loadBotsPage();
      
      // Clear input
      document.getElementById('text-input').value = '';
      
    } catch (error) {
      console.error('Smart AI processing failed:', error);
      showToast('Smart AI processing failed, creating basic bot...', 'warning');
      
      // Fallback to basic bot creation
      const bot = {
        id: Date.now().toString(),
        name: `TextBot-${Date.now()}`,
        purpose: idea,
        functionality: 'Text-created bot',
        success: 75,
        input: idea,
        code: `async () => { return "Text bot executed: ${idea}"; }`,
        creator: localStorage.getItem('currentUser')
      };
      await IDB.batchSet('bots', [bot]);
      db.ref('bots/' + bot.id).set(bot);
      showToast(`Created ${bot.name}`);
      updateUserPoints(20);
      checkBadges();
      loadBotsPage();
    }
  });

  document.getElementById('fusion-btn').addEventListener('click', async () => {
    const bots = await IDB.getAll('bots');
    if (bots.length < 2) {
      showToast('Need at least 2 bots to fuse');
      return;
    }
    const bot1 = bots[0];
    const bot2 = bots[1];
    const fusedBot = {
      id: Date.now().toString(),
      name: `FusedBot-${Date.now()}`,
      purpose: `Fusion of ${bot1.name} and ${bot2.name}`,
      functionality: 'Fused bot',
      success: 99,
      input: `${bot1.purpose} + ${bot2.purpose}`,
      code: `async () => { return "Fused bot executed: ${bot1.purpose} and ${bot2.purpose}"; }`,
      creator: localStorage.getItem('currentUser')
    };
    await IDB.batchSet('bots', [fusedBot]);
    db.ref('bots/' + fusedBot.id).set(fusedBot);
    showToast(`Created ${fusedBot.name}`);
    updateUserPoints(30);
    checkBadges();
    loadBotsPage();
  });
}

async function loadMarketplace() {
  const marketplace = document.getElementById('marketplace');
  const featuredBots = document.getElementById('featured-bots');
  if (!marketplace || !featuredBots) return;
  marketplace.innerHTML = '';
  featuredBots.innerHTML = '';
  const bots = await IDB.getAll('marketplace');
  const topBots = bots.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
  topBots.forEach(bot => {
    const item = document.createElement('div');
    item.className = 'bot-item featured-bot';
    item.innerHTML = `
      <h3>${bot.name}</h3>
      <p><b>Creator:</b> ${bot.creator}</p>
      <p><b>Purpose:</b> ${bot.purpose}</p>
      <p><b>Rating:</b> ${bot.rating || 0}/5</p>
      <button class="btn blue-glow import-bot">Import</button>
    `;
    featuredBots.appendChild(item);
    item.querySelector('.import-bot').addEventListener('click', async () => {
      const newBot = { ...bot, id: Date.now().toString(), creator: localStorage.getItem('currentUser') };
      await IDB.batchSet('bots', [newBot]);
      db.ref('bots/' + newBot.id).set(newBot);
      showToast(`Imported ${bot.name}`);
      loadBotsPage();
      checkBadges();
    });
  });
  bots.forEach(bot => {
    const item = document.createElement('div');
    item.className = 'bot-item';
    item.innerHTML = `
      <h3>${bot.name}</h3>
      <p><b>Creator:</b> ${bot.creator}</p>
      <p><b>Purpose:</b> ${bot.purpose}</p>
      <p><b>Rating:</b> ${bot.rating || 0}/5</p>
      <button class="btn blue-glow import-bot">Import</button>
      <input type="number" class="rating-input" min="1" max="5" placeholder="Rate 1-5">
      <button class="btn green-glow rate-bot">Rate</button>
      <textarea class="review-input" placeholder="Leave a review..."></textarea>
      <button class="btn orange-glow review-bot">Review</button>
      <div class="reviews"></div>
    `;
    marketplace.appendChild(item);
    item.querySelector('.import-bot').addEventListener('click', async () => {
      const newBot = { ...bot, id: Date.now().toString(), creator: localStorage.getItem('currentUser') };
      await IDB.batchSet('bots', [newBot]);
      db.ref('bots/' + newBot.id).set(newBot);
      showToast(`Imported ${bot.name}`);
      loadBotsPage();
      checkBadges();
    });
    item.querySelector('.rate-bot').addEventListener('click', async () => {
      const rating = parseInt(item.querySelector('.rating-input').value);
      if (rating < 1 || rating > 5) {
        showToast('Rating must be between 1 and 5');
        return;
      }
      bot.rating = ((bot.rating || 0) + rating) / (bot.reviews?.length + 1 || 1);
      await IDB.batchSet('marketplace', [bot]);
      db.ref('marketplace/' + bot.id).update({ rating: bot.rating });
      showToast(`Rated ${bot.name} ${rating}/5`);
      loadMarketplace();
    });
    item.querySelector('.review-bot').addEventListener('click', async () => {
      const review = item.querySelector('.review-input').value;
      if (!review) return;
      bot.reviews = bot.reviews || [];
      bot.reviews.push({ user: localStorage.getItem('currentUser'), text: review, timestamp: Date.now() });
      await IDB.batchSet('marketplace', [bot]);
      db.ref('marketplace/' + bot.id).update({ reviews: bot.reviews });
      showToast(`Reviewed ${bot.name}`);
      loadMarketplace();
    });
    const reviewsDiv = item.querySelector('.reviews');
    bot.reviews?.forEach(review => {
      const p = document.createElement('p');
      p.textContent = `${review.user}: ${review.text}`;
      reviewsDiv.appendChild(p);
    });
  });
}

// Inspiration Lab
async function loadInspirationLab() {
  const ideas = [
    { title: 'Meme Bot', desc: 'Fetches memes from Giphy based on keywords.', code: `async () => {
      const res = await fetch('https://api.giphy.com/v1/gifs/search?api_key=kOrIThLFfVdinZ3ORGBDmmX6cnnVWTzK&q=funny');
      const data = await res.json();
      return data.data[0].images.fixed_height.url;
    }` },
    { title: 'Weather Bot', desc: 'Fetches real-time weather data.', code: `async () => {
      const res = await fetch('https://api.openweathermap.org/data/2.5/weather?q=London&appid=4fc179285e1139b621267e810bb9ddcd');
      const data = await res.json();
      return \`Weather in London: \${data.weather[0].description}, \${Math.round(data.main.temp - 273.15)}°C\`;
    }` }
  ];

  const ideaList = document.getElementById('inspiration-ideas');
  ideaList.innerHTML = '';
  ideas.forEach(idea => {
    const item = document.createElement('div');
    item.className = 'bot-item';
    item.innerHTML = `
      <h3>${idea.title}</h3>
      <p>${idea.desc}</p>
      <button class="btn blue-glow use-idea">Use Idea</button>
    `;
    ideaList.appendChild(item);
    item.querySelector('.use-idea').addEventListener('click', async () => {
      const bot = {
        id: Date.now().toString(),
        name: idea.title,
        purpose: idea.desc,
        functionality: 'Inspired bot',
        success: 99,
        input: idea.desc,
        code: idea.code,
        creator: localStorage.getItem('currentUser')
      };
      await IDB.batchSet('bots', [bot]);
      db.ref('bots/' + bot.id).set(bot);
      showToast(`Created ${bot.name}`);
      updateUserPoints(20);
      checkBadges();
      closeAllModals();
      document.getElementById('bots-modal').classList.remove('hidden');
      loadBotsPage();
    });
  });

  document.getElementById('meme-search').addEventListener('input', async e => {
    const query = e.target.value;
    if (!query) return;
    const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=kOrIThLFfVdinZ3ORGBDmmX6cnnVWTzK&q=${query}`);
    const data = await res.json();
    const url = data.data[0]?.images.fixed_height.url || 'No meme found';
    const item = document.createElement('div');
    item.className = 'bot-item';
    item.innerHTML = `
      <h3>${query} Meme</h3>
      <p>Fetched from Giphy</p>
      <img src="${url}" class="meme-preview">
      <button class="btn blue-glow use-idea">Use Idea</button>
    `;
    ideaList.prepend(item);
  });

  document.getElementById('generate-idea').addEventListener('click', async () => {
    const res = await fetch('https://api.giphy.com/v1/gifs/trending?api_key=kOrIThLFfVdinZ3ORGBDmmX6cnnVWTzK');
    const data = await res.json();
    const url = data.data[0].images.fixed_height.url;
    const item = document.createElement('div');
    item.className = 'bot-item';
    item.innerHTML = `
      <h3>Trending Meme Bot</h3>
      <p>Fetched from Giphy Trends</p>
      <img src="${url}" class="meme-preview">
      <button class="btn blue-glow use-idea">Use Idea</button>
    `;
    ideaList.prepend(item);
  });
}

// Bot Builder
async function setupBotBuilder() {
  const components = document.querySelectorAll('.component');
  const workspace = document.getElementById('builder-workspace');
  let nodes = [];

  components.forEach(comp => {
    comp.addEventListener('dragstart', e => {
      e.dataTransfer.setData('type', comp.dataset.type);
    });
  });

  workspace.addEventListener('dragover', e => e.preventDefault());
  workspace.addEventListener('drop', e => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const node = document.createElement('div');
    node.className = 'node';
    node.textContent = type;
    node.dataset.type = type;
    workspace.appendChild(node);
    nodes.push({ type, id: Date.now() });
  });

  document.getElementById('build-bot').addEventListener('click', async () => {
    let code = 'async () => {';
    nodes.forEach(node => {
      if (node.type === 'action') code += ` console.log('Action executed');`;
      else if (node.type === 'condition') code += ` if (true) { console.log('Condition met'); }`;
      else if (node.type === 'api') code += ` const res = await fetch('https://api.example.com');`;
      else if (node.type === 'meme') code += ` const res = await fetch('https://api.giphy.com/v1/gifs/search?api_key=kOrIThLFfVdinZ3ORGBDmmX6cnnVWTzK&q=funny'); const data = await res.json(); return data.data[0].images.fixed_height.url;`;
      else if (node.type === 'image') code += ` const res = await fetch('https://api.unsplash.com/photos/random?query=nature&client_id=tL5Z9kXzJ6p8iN7vQ2mW3rY4uT8xL9oP0qR1sE2wK3j'); const data = await res.json(); return data.urls.small;`;
    });
    code += ' return "Bot executed"; }';
    const bot = {
      id: Date.now().toString(),
      name: `BuilderBot-${Date.now()}`,
      purpose: 'Visually built bot',
      functionality: 'Custom logic',
      success: 99,
      input: 'Drag-and-drop',
      code,
      creator: localStorage.getItem('currentUser')
    };
    await IDB.batchSet('bots', [bot]);
    db.ref('bots/' + bot.id).set(bot);
    showToast(`Created ${bot.name}`);
    updateUserPoints(30);
    checkBadges();
    closeAllModals();
    document.getElementById('bots-modal').classList.remove('hidden');
    loadBotsPage();
  });
}

// AI Workshop
async function loadAIWorkshop() {
  const suggestions = document.getElementById('workshop-suggestions');
  suggestions.innerHTML = '';

  document.getElementById('debug-code').addEventListener('click', async () => {
    const code = document.getElementById('workshop-code').value;
    const purpose = document.getElementById('workshop-purpose')?.value || 'General bot functionality';
    
    suggestions.innerHTML = '<div style="color: #33B5FF;">🔍 Running deep code analysis...</div>';
    
    try {
      // Enhanced debugging with BotWorker
      const worker = new BotWorker();
      const analysis = await worker.enhanceBot(code, purpose);
      
      let output = '<div style="margin-bottom: 15px;">';
      
      if (analysis.validation.isValid) {
        output += '<div style="color: #00FFAA;">✅ <strong>Code Analysis: PASSED</strong></div>';
        output += '<div style="color: #D4A5FF;">🎯 Code is ready for deployment!</div>';
      } else {
        output += '<div style="color: #FF3333;">❌ <strong>Code Analysis: ISSUES FOUND</strong></div>';
        analysis.validation.issues.forEach(issue => {
          const color = issue.severity === 'critical' ? '#FF3333' : 
                       issue.severity === 'high' ? '#FF6F61' : 
                       issue.severity === 'medium' ? '#FFA500' : '#FFFF99';
          output += `<div style="color: ${color}; margin: 5px 0;">
            🚨 [${issue.severity.toUpperCase()}] ${issue.message}
          </div>`;
        });
      }
      
      output += '</div>';
      
      // Show recommendations
      if (analysis.recommendations.length > 0) {
        output += '<div style="color: #33B5FF; margin-top: 10px;"><strong>💡 Recommendations:</strong></div>';
        analysis.recommendations.forEach(rec => {
          output += `<div style="color: #D4A5FF; margin: 3px 0;">• ${rec}</div>`;
        });
      }
      
      // Show enhanced code if different
      if (analysis.enhancedCode !== analysis.originalCode) {
        output += `
          <div style="margin-top: 15px;">
            <div style="color: #00FFAA;"><strong>🔧 Enhanced Code Available:</strong></div>
            <button onclick="document.getElementById('workshop-code').value = \`${analysis.enhancedCode.replace(/`/g, '\\`')}\`; showToast('Enhanced code applied!')" 
                    style="background: #33B5FF; color: white; border: none; padding: 5px 10px; border-radius: 5px; margin: 5px 0; cursor: pointer;">
              Apply Enhanced Code
            </button>
          </div>
        `;
      }
      
      suggestions.innerHTML = output;
      
    } catch (error) {
      suggestions.innerHTML = `
        <div style="color: #FF3333;">❌ Analysis Error: ${error.message}</div>
        <div style="color: #D4A5FF;">💡 Suggestion: Check syntax or verify code structure.</div>
      `;
    }
  });
  
  // Add deep analysis button if not exists
  const debugBtn = document.getElementById('debug-code');
  if (debugBtn && !document.getElementById('deep-analysis-btn')) {
    const deepAnalysisBtn = document.createElement('button');
    deepAnalysisBtn.id = 'deep-analysis-btn';
    deepAnalysisBtn.className = 'btn purple-glow';
    deepAnalysisBtn.textContent = 'Deep Security Analysis';
    deepAnalysisBtn.style.marginLeft = '10px';
    
    deepAnalysisBtn.addEventListener('click', async () => {
      const code = document.getElementById('workshop-code').value;
      const purpose = document.getElementById('workshop-purpose')?.value || 'General bot functionality';
      
      suggestions.innerHTML = '<div style="color: #33B5FF;">🔒 Running security analysis...</div>';
      
      // Run terminal debug agent for comprehensive analysis
      try {
        const response = await fetch('/api/debug-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, purpose })
        }).catch(() => {
          // Fallback to client-side analysis
          return runClientSideAnalysis(code, purpose);
        });
        
        const result = response.json ? await response.json() : response;
        displaySecurityAnalysis(result);
        
      } catch (error) {
        const fallbackResult = await runClientSideAnalysis(code, purpose);
        displaySecurityAnalysis(fallbackResult);
      }
    });
    
    debugBtn.parentNode.insertBefore(deepAnalysisBtn, debugBtn.nextSibling);
  }
}

// Client-side security analysis fallback
async function runClientSideAnalysis(code, purpose) {
  const issues = [];
  const suggestions = [];
  
  // Security checks
  const securityPatterns = [
    { pattern: /eval\s*\(/g, severity: 'critical', msg: 'eval() usage detected - security risk' },
    { pattern: /innerHTML\s*=/g, severity: 'medium', msg: 'Direct innerHTML assignment detected' },
    { pattern: /api[_\-]?key\s*[:=]\s*['"]\w+['"]/gi, severity: 'critical', msg: 'Hardcoded API key detected' },
    { pattern: /document\.write\s*\(/g, severity: 'high', msg: 'document.write() usage detected' }
  ];
  
  securityPatterns.forEach(check => {
    if (code.match(check.pattern)) {
      issues.push({ severity: check.severity, message: check.msg });
    }
  });
  
  // Performance suggestions
  if (code.includes('fetch(') && !code.includes('catch')) {
    suggestions.push({ message: 'Add error handling for fetch requests' });
  }
  
  return {
    isValid: issues.length === 0,
    issues: issues,
    suggestions: suggestions,
    score: Math.max(0, 100 - (issues.length * 20))
  };
}

// Display security analysis results
function displaySecurityAnalysis(result) {
  const suggestions = document.getElementById('workshop-suggestions');
  let output = '<div style="border: 1px solid #33B5FF; padding: 15px; border-radius: 10px;">';
  
  output += `<div style="color: #33B5FF; font-size: 18px; margin-bottom: 10px;">🔒 Security Analysis Report</div>`;
  output += `<div style="color: #D4A5FF;">Security Score: ${result.score}/100</div>`;
  
  if (result.isValid) {
    output += '<div style="color: #00FFAA; margin-top: 10px;">✅ No security issues detected!</div>';
  } else {
    output += '<div style="color: #FF3333; margin-top: 10px;">⚠️ Security issues found:</div>';
    result.issues.forEach(issue => {
      const color = issue.severity === 'critical' ? '#FF3333' : '#FFA500';
      output += `<div style="color: ${color}; margin: 5px 0;">• ${issue.message}</div>`;
    });
  }
  
  if (result.suggestions && result.suggestions.length > 0) {
    output += '<div style="color: #33B5FF; margin-top: 10px;">💡 Suggestions:</div>';
    result.suggestions.forEach(suggestion => {
      output += `<div style="color: #D4A5FF; margin: 3px 0;">• ${suggestion.message}</div>`;
    });
  }
  
  output += '</div>';
  suggestions.innerHTML = output;
}

// Editor
async function loadEditor() {
  const bot = JSON.parse(localStorage.getItem('editingBot') || '{}');
  const editor = document.getElementById('code-editor');
  editor.value = bot.code || '// Start coding';
  const suggestions = document.getElementById('code-suggestions');
  
  // Enhanced real-time code analysis
  let analysisTimeout;
  editor.addEventListener('input', () => {
    const code = editor.value;
    
    // Clear previous timeout
    clearTimeout(analysisTimeout);
    
    // Debounced analysis
    analysisTimeout = setTimeout(async () => {
      if (code.trim().length > 10) {
        await performRealtimeAnalysis(code, suggestions);
      } else {
        suggestions.innerHTML = '';
      }
    }, 1000);
  });

  document.getElementById('run-code').addEventListener('click', async () => {
    const code = editor.value;
    const purpose = bot.purpose || 'Custom bot functionality';
    const output = document.getElementById('code-output');
    
    output.innerHTML = '<div style="color: #33B5FF;">🔍 Validating and running code...</div>';
    
    try {
      // Enhanced execution with validation
      const worker = new BotWorker();
      const result = await worker.executeBot(code, null, purpose);
      
      if (result.success) {
        let outputHtml = `<div style="color: #00FFAA;">✅ <strong>Execution Successful</strong></div>`;
        outputHtml += `<div style="color: #D4A5FF;">Result: ${result.output}</div>`;
        outputHtml += `<div style="color: #FFFF99;">Execution time: ${result.executionTime}ms</div>`;
        
        if (result.warnings && result.warnings.length > 0) {
          outputHtml += '<div style="color: #FFA500; margin-top: 10px;"><strong>⚠️ Warnings:</strong></div>';
          result.warnings.forEach(warning => {
            outputHtml += `<div style="color: #FFA500;">• ${warning}</div>`;
          });
        }
        
        output.innerHTML = outputHtml;
        
        // Track successful execution
        await TrackingBot.log(bot.id || 'editor-test', 'execute', 'success', 
          `Bot executed successfully in ${result.executionTime}ms`);
        
      } else {
        output.innerHTML = `
          <div style="color: #FF3333;">❌ <strong>Execution Failed</strong></div>
          <div style="color: #FF6F61;">Error: ${result.error}</div>
          <div style="color: #D4A5FF;">💡 Fix the issues and try again</div>
        `;
        
        // Track failed execution
        await TrackingBot.log(bot.id || 'editor-test', 'execute', 'failed', result.error);
      }
      
    } catch (error) {
      output.innerHTML = `
        <div style="color: #FF3333;">❌ Critical Error: ${error.message}</div>
        <div style="color: #D4A5FF;">💡 Check your code syntax and try again</div>
      `;
    }
  });

  // Add enhanced save functionality
  const saveBtn = document.getElementById('save-bot') || createSaveButton();
  saveBtn.addEventListener('click', async () => {
    const code = editor.value;
    const purpose = bot.purpose || 'Custom bot functionality';
    
    if (!code.trim()) {
      showToast('Please enter some code before saving', 'error');
      return;
    }
    
    // Validate before saving
    const worker = new BotWorker();
    const analysis = await worker.enhanceBot(code, purpose);
    
    if (analysis.validation.isValid) {
      // Save enhanced version
      const enhancedBot = {
        ...bot,
        code: analysis.enhancedCode,
        lastModified: Date.now(),
        validated: true,
        qualityScore: 95
      };
      
      localStorage.setItem('editingBot', JSON.stringify(enhancedBot));
      await IDB.batchSet('bots', [enhancedBot]);
      
      showToast('Bot saved with enhancements!', 'success');
      
      // Show what was enhanced
      if (analysis.enhancedCode !== code) {
        const confirmEnhanced = confirm('Code was enhanced with better error handling. Apply enhancements to editor?');
        if (confirmEnhanced) {
          editor.value = analysis.enhancedCode;
        }
      }
      
    } else {
      const forceSave = confirm(`Code has ${analysis.validation.issues.length} issues. Save anyway?`);
      if (forceSave) {
        const unvalidatedBot = {
          ...bot,
          code: code,
          lastModified: Date.now(),
          validated: false,
          issues: analysis.validation.issues
        };
        
        localStorage.setItem('editingBot', JSON.stringify(unvalidatedBot));
        await IDB.batchSet('bots', [unvalidatedBot]);
        showToast('Bot saved with validation warnings', 'warning');
      }
    }
  });

  document.getElementById('share-btn').addEventListener('click', async () => {
    const code = editor.value;
    const token = document.getElementById('telegram-token')?.value;
    const chatId = document.getElementById('telegram-chat-id')?.value;
    if (token && chatId) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Shared code from Smart Hub:\n\`\`\`javascript\n${code}\n\`\`\``
        })
      });
      showToast('Code shared on Telegram');
    } else {
      showToast('Set Telegram token and chat ID in Account');
    }
  });

  document.getElementById('generate-qr').addEventListener('click', () => {
    const code = editor.value;
    const qrDiv = document.getElementById('qr-code');
    qrDiv.innerHTML = '';
    QRCode.toCanvas(code, { width: 200 }, (err, canvas) => {
      if (err) throw err;
      qrDiv.appendChild(canvas);
    });
  });
}

// Real-time code analysis helper
async function performRealtimeAnalysis(code, suggestionsElement) {
  try {
    const worker = new BotWorker();
    const basicAnalysis = await worker.basicValidation(code);
    
    let output = '';
    
    if (basicAnalysis.isValid) {
      // Quick suggestions based on code patterns
      if (code.includes('fetch')) {
        output += '<div style="color: #00FFAA;">💡 Consider adding error handling with try-catch</div>';
      }
      if (code.includes('async') && !code.includes('await')) {
        output += '<div style="color: #D4A5FF;">💡 Async function without await - consider removing async</div>';
      }
      if (code.includes('console.log')) {
        output += '<div style="color: #FFFF99;">💡 Remember to remove debug logs before production</div>';
      }
      if (!code.includes('return')) {
        output += '<div style="color: #FFA500;">💡 Consider adding a return statement</div>';
      }
      
      if (!output) {
        output = '<div style="color: #00FFAA;">✅ Code looks good!</div>';
      }
    } else {
      output = '<div style="color: #FF3333;">❌ Syntax errors detected</div>';
      basicAnalysis.issues.forEach(issue => {
        output += `<div style="color: #FF6F61;">• ${issue.message}</div>`;
      });
    }
    
    suggestionsElement.innerHTML = output;
    
  } catch (error) {
    suggestionsElement.innerHTML = '<div style="color: #FFA500;">Analysis temporarily unavailable</div>';
  }
}

// Create save button if it doesn't exist
function createSaveButton() {
  const saveBtn = document.createElement('button');
  saveBtn.id = 'save-bot';
  saveBtn.className = 'btn green-glow';
  saveBtn.textContent = 'Save Bot';
  saveBtn.style.margin = '10px';
  
  const runBtn = document.getElementById('run-code');
  if (runBtn && runBtn.parentNode) {
    runBtn.parentNode.insertBefore(saveBtn, runBtn.nextSibling);
  }
  
  return saveBtn;
}

// Playground
async function loadPlayground() {
  const bot = JSON.parse(localStorage.getItem('editingBot') || '{}');
  const playground = document.getElementById('bot-playground');
  playground.innerHTML = `<p>Running ${bot.name}...</p>`;
  try {
    const func = new Function('return ' + bot.code)();
    const result = await func();
    playground.innerHTML += `<p style="color: #00FFAA;">Result: ${result}</p>`;
    const sentiment = result.toLowerCase().includes('error') ? 'negative' : 'positive';
    const sentimentDiv = document.getElementById('sentiment-analysis');
    sentimentDiv.classList.remove('hidden');
    sentimentDiv.innerHTML = `<p>Sentiment: <span class="sentiment-${sentiment}">${sentiment}</span></p>`;
  } catch (error) {
    playground.innerHTML += `<p style="color: #FF3333;">Error: ${error.message}</p>`;
    const sentimentDiv = document.getElementById('sentiment-analysis');
    sentimentDiv.classList.remove('hidden');
    sentimentDiv.innerHTML = `<p>Sentiment: <span class="sentiment-negative">negative</span></p>`;
  }
}

// Creator’s Hub
async function loadCreators
