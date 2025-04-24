class IDB {
  static async init() {
    for (let i = 0; i < 5; i++) {
      try {
        return await new Promise((resolve, reject) => {
          const req = indexedDB.open('SmartHubDB', 4);
          req.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('bots')) db.createObjectStore('bots', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'email' });
            if (!db.objectStoreNames.contains('logs')) db.createObjectStore('logs', { keyPath: 'id' });
          };
          req.onsuccess = e => resolve(e.target.result);
          req.onerror = e => reject(new Error(`IndexedDB error: ${e.target.error.message}`));
        });
      } catch (error) {
        console.error(`IDB init attempt ${i + 1} failed:`, error);
        if (i === 4) throw new Error(`IDB failed: ${error.message}`);
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }

  static async set(store, key, value) {
    const db = await IDB.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([store], 'readwrite');
      const storeObj = tx.objectStore(store);
      const req = storeObj.put({ [storeObj.keyPath]: key, ...value });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new Error(`Set failed: ${req.error}`));
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

async function signUp(email, password, username = '') {
  try {
    document.getElementById('login-spinner').classList.remove('hidden');
    if (!email.includes('@') || email.length < 3) throw new Error('Invalid email');
    if (password.length < 6) throw new Error('Password too short');
    const user = await IDB.get('users', email);
    if (user) throw new Error('Email already registered');
    await IDB.set('users', email, { email, password, username, createdAt: Date.now() });
    localStorage.setItem('currentUser', email);
    showToast('Signed up successfully', 'success');
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('hub-main').classList.remove('hidden');
    showWelcome();
  } catch (error) {
    document.getElementById('auth-error').textContent = error.message;
    document.getElementById('auth-error').classList.remove('hidden');
    showToast(`Sign-up failed: ${error.message}`, 'error');
  } finally {
    document.getElementById('login-spinner').classList.add('hidden');
  }
}

async function signIn(email, password) {
  try {
    document.getElementById('login-spinner').classList.remove('hidden');
    if (!email || !password) throw new Error('Email and password required');
    const user = await IDB.get('users', email);
    if (!user) throw new Error('User not found');
    if (user.password !== password) throw new Error('Wrong password');
    localStorage.setItem('currentUser', email);
    showToast('Signed in', 'success');
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('hub-main').classList.remove('hidden');
    showWelcome();
  } catch (error) {
    document.getElementById('auth-error').textContent = error.message;
    document.getElementById('auth-error').classList.remove('hidden');
    showToast(`Sign-in failed: ${error.message}`, 'error');
  } finally {
    document.getElementById('login-spinner').classList.add('hidden');
  }
}

function showWelcome() {
  if (!localStorage.getItem('seenWelcome')) {
    document.getElementById('welcome-overlay').classList.remove('hidden');
    localStorage.setItem('seenWelcome', 'true');
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.add('hidden'));
      tab.classList.add('active');
      document.getElementById(`${tab.dataset.tab}-tab`).classList.remove('hidden');
      if (tab.dataset.tab === 'creators') loadCreatorsHub();
    });
  });
}

async function loadDashboard() {
  document.getElementById('bot-status').textContent = `${(await IDB.getAll('bots')).length} active`;
  document.getElementById('weather').textContent = 'Sunny, 22°C'; // Placeholder
  document.getElementById('ai-insights').textContent = 'Optimize bot API calls for 15% faster runtime.';
  document.querySelectorAll('.dashboard-widget').forEach(widget => {
    widget.addEventListener('click', () => {
      const action = widget.dataset.action;
      if (action === 'view-bots') document.querySelector('[data-tab="bots"]').click();
      else if (action === 'view-insights') showToast('Insights: Reduce bot latency with caching', 'info');
    });
  });
}

async function loadCreatorsHub() {
  const bots = await IDB.getAll('bots');
  const botList = document.getElementById('bot-list');
  botList.innerHTML = '';
  bots.forEach(bot => {
    const item = document.createElement('div');
    item.className = 'bot-item';
    item.innerHTML = `
      <h3>${bot.name}</h3>
      <p><b>Purpose:</b> ${bot.purpose}</p>
      <p><b>Functionality:</b> ${bot.functionality}</p>
      <p><b>Success:</b> ${bot.success}% uptime</p>
      <p><b>Input:</b> ${bot.input}</p>
      <pre>${bot.code}</pre>
      <button class="btn blue-glow run-bot">Run</button>
    `;
    botList.appendChild(item);
    item.querySelector('.run-bot').addEventListener('click', () => {
      showToast(`Running ${bot.name}`, 'success');
    });
  });
  document.getElementById('bot-search').addEventListener('input', e => {
    const search = e.target.value.toLowerCase();
    botList.querySelectorAll('.bot-item').forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(search) ? '' : 'none';
    });
  });
}

function showToast(message, type) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

document.getElementById('sign-up-btn').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const username = document.getElementById('username').value;
  signUp(email, password, username);
});

document.getElementById('sign-in-btn').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  signIn(email, password);
});

document.getElementById('dismiss-welcome').addEventListener('click', () => {
  document.getElementById('welcome-overlay').classList.add('hidden');
});

document.getElementById('voice-input-btn').addEventListener('click', () => {
  showToast('Voice input: Make a Twitter bot (placeholder)', 'success');
});

document.getElementById('remix-btn').addEventListener('click', () => {
  showToast('Remixing bots (placeholder)', 'success');
});

document.getElementById('share-btn').addEventListener('click', () => {
  showToast('Code shared via link (placeholder)', 'success');
});

document.getElementById('webhook-setup').addEventListener('click', () => {
  showToast('Webhook URL generated (placeholder)', 'success');
});

document.getElementById('file-input').addEventListener('change', async e => {
  const files = e.target.files;
  for (const file of files) {
    const text = await file.text();
    const bot = {
      id: Date.now().toString(),
      name: file.name,
      purpose: 'Uploaded blueprint',
      functionality: 'Custom tasks',
      success: 99,
      input: text,
      code: '// Parsed blueprint'
    };
    await IDB.set('bots', bot.id, bot);
    showToast(`Uploaded ${file.name}`, 'success');
  }
});

(async () => {
  const progress = document.getElementById('progress');
  const message = document.getElementById('loading-message');
  const assets = ['app.js', 'styles.css', 'service-worker.js', 'smart-ai.js', 'editor.js', 'simplified-ui.js'];
  let loaded = 0;

  for (const asset of assets) {
    try {
      await fetch(asset);
      loaded++;
      progress.style.width = `${(loaded / assets.length) * 100}%`;
      message.textContent = `Loaded ${asset}`;
    } catch (error) {
      message.textContent = `Error loading ${asset}`;
      document.getElementById('retry-btn').classList.remove('hidden');
      return;
    }
  }

  document.getElementById('loading').classList.add('hidden');
  document.getElementById('login-modal').classList.remove('hidden');
  setupTabs();
  await loadDashboard();
})();