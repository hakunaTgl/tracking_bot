class IDB {
  static async init() {
    for (let i = 0; i < 5; i++) {
      try {
        return await new Promise((resolve, reject) => {
          const req = indexedDB.open('SmartHubDB', 7);
          req.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('bots')) db.createObjectStore('bots', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'email' });
            if (!db.objectStoreNames.contains('tracking')) db.createObjectStore('tracking', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache', { keyPath: 'key' });
            if (!db.objectStoreNames.contains('collab')) db.createObjectStore('collab', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('analytics')) db.createObjectStore('analytics', { keyPath: 'id' });
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

const translations = {
  en: { welcome: "Welcome to Smart Hub Ultra", bots: "Bots", create: "Create", run: "Run" },
  es: { welcome: "Bienvenido a Smart Hub Ultra", bots: "Bots", create: "Crear", run: "Ejecutar" },
  fr: { welcome: "Bienvenue sur Smart Hub Ultra", bots: "Bots", create: "Créer", run: "Exécuter" }
};

async function signUp(email, password, username = '') {
  try {
    document.getElementById('login-spinner').classList.remove('hidden');
    if (!email.includes('@') || email.length < 3) throw new Error('Invalid email');
    if (password.length < 6) throw new Error('Password too short');
    const user = await IDB.get('users', email);
    if (user) throw new Error('Email already registered');
    await IDB.batchSet('users', [{ email, password, username, createdAt: Date.now(), points: 0 }]);
    localStorage.setItem('currentUser', email);
    showToast('Signed up!', 'success');
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('hub-main').classList.remove('hidden');
    showWelcome();
    narrate('Welcome to Smart Hub Ultra!');
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
    showToast('Signed in!', 'success');
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('hub-main').classList.remove('hidden');
    showWelcome();
    narrate('Signed in to Smart Hub!');
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
      const content = document.getElementById(`${tab.dataset.tab}-tab`);
      content.classList.remove('hidden');
      if (tab.dataset.tab === 'creators') loadCreatorsHub();
      else if (tab.dataset.tab === 'inspiration') loadInspirationLab();
      else if (tab.dataset.tab === 'builder') setupBotBuilder();
      else if (tab.dataset.tab === 'workshop') loadAIWorkshop();
      else if (tab.dataset.tab === 'collab') loadCollabHub();
      else if (tab.dataset.tab === 'voice') setupVoiceCommand();
      else if (tab.dataset.tab === 'analytics') loadAnalytics();
      narrate(`Switched to ${tab.dataset.tab}`);
    });
    tab.addEventListener('touchstart', () => tab.classList.add('active'));
    tab.addEventListener('touchend', () => tab.click());
  });
}

async function loadDashboard() {
  const bots = await IDB.getAll('bots');
  document.getElementById('bot-status').textContent = `${bots.length} active`;
  try {
    const res = await fetch('https://api.openweathermap.org/data/2.5/weather?q=London&appid=4fc179285e1139b621267e810bb9ddcd');
    const data = await res.json();
    const weather = `${data.weather[0].description}, ${Math.round(data.main.temp - 273.15)}°C`;
    document.getElementById('weather').textContent = weather;
    updateTheme(data.weather[0].main.toLowerCase());
  } catch {
    document.getElementById('weather').textContent = 'Weather unavailable';
  }
  document.getElementById('ai-insights').textContent = 'Optimize bot runtime with caching.';
  document.querySelectorAll('.dashboard-widget').forEach(widget => {
    widget.addEventListener('click', () => {
      const action = widget.dataset.action;
      if (action === 'view-bots') document.querySelector('[data-tab="bots"]').click();
      else if (action === 'view-insights') showToast('Insights: Cache API calls for speed', 'info');
    });
  });
}

function updateTheme(weather) {
  const themes = {
    clear: '#FFD700', // Sunny
    clouds: '#B0C4DE', // Cloudy
    rain: '#4682B4', // Rainy
    snow: '#F0F8FF' // Snowy
  };
  document.body.style.background = themes[weather] || '#1A1A2E';
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
      <button class="btn blue-glow run-bot">${translations[localStorage.getItem('language') || 'en'].run}</button>
      <button class="btn blue-glow edit-bot">Edit</button>
      <button class="btn blue-glow clone-bot">Clone</button>
      <button class="btn blue-glow share-bot">Share</button>
    `;
    botList.appendChild(item);
    item.querySelector('.run-bot').addEventListener('click', async () => {
      await runBot(bot);
      TrackingBot.log(bot.id, 'run', 'success', `Ran ${bot.name}`);
      showToast(`Running ${bot.name}`, 'success');
      updateUserPoints(10);
    });
    item.querySelector('.edit-bot').addEventListener('click', () => {
      document.getElementById('code-editor').value = bot.code;
      document.querySelector('[data-tab="editor"]').click();
      TrackingBot.log(bot.id, 'edit', 'success', `Edited ${bot.name}`);
    });
    item.querySelector('.clone-bot').addEventListener('click', async () => {
      const newBot = { ...bot, id: Date.now().toString(), name: `${bot.name} (Clone)` };
      await IDB.batchSet('bots', [newBot]);
      TrackingBot.log(newBot.id, 'clone', 'success', `Cloned ${bot.name}`);
      showToast(`Cloned ${bot.name}`, 'success');
      loadCreatorsHub();
    });
    item.querySelector('.share-bot').addEventListener('click', async () => {
      const token = document.getElementById('telegram-token').value;
      const chatId = document.getElementById('telegram-chat-id').value;
      if (token && chatId) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `Check out my bot: ${bot.name}\nPurpose: ${bot.purpose}\nCode: ${bot.code}`
          })
        });
        TrackingBot.log(bot.id, 'share', 'success', `Shared ${bot.name}`);
        showToast(`Shared ${bot.name} on Telegram`, 'success');
      } else {
        showToast('Set Telegram token and chat ID in Settings', 'error');
      }
    });
  });

  const logs = await IDB.getAll('tracking');
  const logList = document.getElementById('tracking-logs');
  logList.innerHTML = '';
  logs.forEach(log => {
    const item = document.createElement('div');
    item.className = 'log-item';
    item.innerHTML = `
      <p><b>Bot ID:</b> ${log.botId}</p>
      <p><b>Action:</b> ${log.action}</p>
      <p><b>Status:</b> ${log.status}</p>
      <p><b>Details:</b> ${log.details}</p>
      <p><b>Time:</b> ${new Date(log.timestamp).toLocaleString()}</p>
    `;
    logList.appendChild(item);
  });

  const users = await IDB.getAll('users');
  const leaderboard = document.getElementById('leaderboard');
  leaderboard.innerHTML = '';
  users.sort((a, b) => b.points - a.points).slice(0, 5).forEach(user => {
    const item = document.createElement('div');
    item.className = 'log-item';
    item.innerHTML = `<p>${user.username || user.email}: ${user.points} points</p>`;
    leaderboard.appendChild(item);
  });

  document.getElementById('bot-search').addEventListener('input', e => {
    const search = e.target.value.toLowerCase();
    botList.querySelectorAll('.bot-item').forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(search) ? '' : 'none';
    });
  });
}

async function runBot(bot) {
  const playground = document.getElementById('bot-playground');
  playground.innerHTML = `<p class="animate-run">Running ${bot.name}...</p>`;
  try {
    const startTime = performance.now();
    const func = new Function('return ' + bot.code)();
    const result = await func();
    const runtime = performance.now() - startTime;
    playground.innerHTML += `<p>Result: ${result}</p><p>Runtime: ${runtime.toFixed(2)}ms</p>`;
    if (result.includes('giphy.com')) {
      playground.innerHTML += `<img src="${result}" class="meme-preview">`;
    } else if (result.includes('unsplash.com')) {
      playground.innerHTML += `<img src="${result}" class="image-preview">`;
    }
    await IDB.batchSet('bots', [{ ...bot, success: Math.min(100, bot.success + 1), runs: (bot.runs || 0) + 1 }]);
  } catch (error) {
    playground.innerHTML += `<p>Error: ${error.message}</p>`;
    TrackingBot.log(bot.id, 'run', 'error', `Error running ${bot.name}: ${error.message}`);
    await IDB.batchSet('bots', [{ ...bot, success: Math.max(0, bot.success - 1), runs: (bot.runs || 0) + 1 }]);
  }
  document.querySelector('[data-tab="playground"]').click();
  await logAnalytics('bot_run', { botId: bot.id, runtime: performance.now() - startTime });
}

async function loadInspirationLab() {
  const ideas = [
    { title: 'Meme Bot', desc: 'Fetches memes from Giphy based on keywords.', code: `async () => {
      const cached = await IDB.get('cache', 'meme-funny');
      if (cached) return cached.value;
      const res = await fetch('https://api.giphy.com/v1/gifs/search?api_key=kOrIThLFfVdinZ3ORGBDmmX6cnnVWTzK&q=funny');
      const data = await res.json();
      const url = data.data[0].images.fixed_height.url;
      await IDB.batchSet('cache', [{ key: 'meme-funny', value: url, timestamp: Date.now() }]);
      return url;
    }` },
    { title: 'Weather Bot', desc: 'Fetches real-time weather data.', code: `async () => {
      const res = await fetch('https://api.openweathermap.org/data/2.5/weather?q=London&appid=4fc179285e1139b621267e810bb9ddcd');
      const data = await res.json();
      return \`Weather in London: \${data.weather[0].description}, \${Math.round(data.main.temp - 273.15)}°C\`;
    }` },
    { title: 'Image Bot', desc: 'Fetches high-quality images from Unsplash.', code: `async () => {
      const cached = await IDB.get('cache', 'image-nature');
      if (cached) return cached.value;
      const res = await fetch('https://api.unsplash.com/photos/random?query=nature&client_id=tL5Z9kXzJ6p8iN7vQ2mW3rY4uT8xL9oP0qR1sE2wK3j');
      const data = await res.json();
      const url = data.urls.small;
      await IDB.batchSet('cache', [{ key: 'image-nature', value: url, timestamp: Date.now() }]);
      return url;
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
        code: idea.code
      };
      await IDB.batchSet('bots', [bot]);
      TrackingBot.log(bot.id, 'create', 'success', `Created ${bot.name} from Inspiration Lab`);
      showToast(`Created ${bot.name}`, 'success');
      updateUserPoints(20);
      loadCreatorsHub();
      document.querySelector('[data-tab="creators"]').click();
    });
  });

  document.getElementById('meme-search').addEventListener('input', async e => {
    const query = e.target.value;
    if (!query) return;
    const cached = await IDB.get('cache', `meme-${query}`);
    let url;
    if (cached) {
      url = cached.value;
    } else {
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=kOrIThLFfVdinZ3ORGBDmmX6cnnVWTzK&q=${query}`);
      const data = await res.json();
      url = data.data[0]?.images.fixed_height.url || 'No meme found';
      await IDB.batchSet('cache', [{ key: `meme-${query}`, value: url, timestamp: Date.now() }]);
    }
    const item = document.createElement('div');
    item.className = 'bot-item';
    item.innerHTML = `
      <h3>${query} Meme</h3>
      <p>Fetched from Giphy</p>
      <img src="${url}" class="meme-preview">
      <button class="btn blue-glow use-idea">Use Idea</button>
    `;
    ideaList.prepend(item);
    item.querySelector('.use-idea').addEventListener('click', async () => {
      const bot = {
        id: Date.now().toString(),
        name: `${query} Meme Bot`,
        purpose: `Fetch ${query} memes`,
        functionality: 'Giphy API',
        success: 99,
        input: query,
        code: `async () => {
          const cached = await IDB.get('cache', 'meme-${query}');
          if (cached) return cached.value;
          const res = await fetch('https://api.giphy.com/v1/gifs/search?api_key=kOrIThLFfVdinZ3ORGBDmmX6cnnVWTzK&q=${query}');
          const data = await res.json();
          const url = data.data[0].images.fixed_height.url;
          await IDB.batchSet('cache', [{ key: 'meme-${query}', value: url, timestamp: Date.now() }]);
          return url;
        }`
      };
      await IDB.batchSet('bots', [bot]);
      TrackingBot.log(bot.id, 'create', 'success', `Created ${bot.name} from Inspiration Lab`);
      showToast(`Created ${bot.name}`, 'success');
      updateUserPoints(20);
      loadCreatorsHub();
      document.querySelector('[data-tab="creators"]').click();
    });
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
    item.querySelector('.use-idea').addEventListener('click', async () => {
      const bot = {
        id: Date.now().toString(),
        name: 'Trending Meme Bot',
        purpose: 'Fetch trending memes',
        functionality: 'Giphy API',
        success: 99,
        input: 'trending',
        code: `async () => {
          const res = await fetch('https://api.giphy.com/v1/gifs/trending?api_key=kOrIThLFfVdinZ3ORGBDmmX6cnnVWTzK');
          const data = await res.json();
          return data.data[0].images.fixed_height.url;
        }`
      };
      await IDB.batchSet('bots', [bot]);
      TrackingBot.log(bot.id, 'create', 'success', `Created ${bot.name} from Inspiration Lab`);
      showToast(`Created ${bot.name}`, 'success');
      updateUserPoints(20);
      loadCreatorsHub();
      document.querySelector('[data-tab="creators"]').click();
    });
  });
}

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
      code
    };
    await IDB.batchSet('bots', [bot]);
    TrackingBot.log(bot.id, 'create', 'success', `Created ${bot.name} from Bot Builder`);
    showToast(`Created ${bot.name}`, 'success');
    updateUserPoints(30);
    loadCreatorsHub();
    document.querySelector('[data-tab="creators"]').click();
  });
}

async function loadAIWorkshop() {
  const suggestions = document.getElementById('workshop-suggestions');
  suggestions.innerHTML = '';

  document.getElementById('debug-code').addEventListener('click', async () => {
    const code = document.getElementById('workshop-code').value;
    try {
      new Function(code);
      suggestions.innerHTML = '<p>Code looks good! Try adding a Giphy API call for memes.</p>';
      const improvedCode = `${code}\ntry { const res = await fetch('https://api.giphy.com/v1/gifs/search?api_key=kOrIThLFfVdinZ3ORGBDmmX6cnnVWTzK&q=funny'); const data = await res.json(); return data.data[0].images.fixed_height.url; } catch (e) { return 'Error fetching meme'; }`;
      suggestions.innerHTML += `<p>Improved code:</p><pre>${improvedCode}</pre>`;
    } catch (error) {
      suggestions.innerHTML = `<p>Error: ${error.message}</p><p>Suggestion: Check syntax or wrap in try-catch.</p>`;
    }
  });
}

async function loadCollabHub() {
  const space = document.getElementById('collab-space');
  space.innerHTML = '';
  const collabs = await IDB.getAll('collab');
  collabs.forEach(collab => {
    const item = document.createElement('div');
    item.className = 'collab-item';
    item.innerHTML = `
      <h3>Collab with ${collab.user}</h3>
      <p>Bot: ${collab.botName}</p>
      <pre>${collab.code}</pre>
    `;
    space.appendChild(item);
  });

  document.getElementById('invite-user').addEventListener('click', async () => {
    const email = document.getElementById('collab-user').value;
    const user = await IDB.get('users', email);
    if (!user) {
      showToast('User not found', 'error');
      return;
    }
    const bot = (await IDB.getAll('bots'))[0];
    if (!bot) {
      showToast('No bots to share', 'error');
      return;
    }
    await IDB.batchSet('collab', [{ id: Date.now().toString(), user: email, botName: bot.name, code: bot.code }]);
    TrackingBot.log(bot.id, 'collab', 'success', `Invited ${email} to collab on ${bot.name}`);
    showToast(`Invited ${email} to collab`, 'success');
    loadCollabHub();
  });
}

function setupVoiceCommand() {
  const output = document.getElementById('voice-output');
  output.innerHTML = '<p>Listening...</p>';
  document.getElementById('start-voice').addEventListener('click', () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = localStorage.getItem('language') || 'en-US';
    recognition.onresult = async e => {
      const command = e.results[0][0].transcript.toLowerCase();
      output.innerHTML += `<p>Command: ${command}</p>`;
      if (command.includes('create') && command.includes('bot')) {
        const type = command.includes('weather') ? 'weather' : command.includes('meme') ? 'm imbue includes('image') ? 'meme' : 'weather';
        const result = await SmartAI.processInput(command, 'voice');
        await IDB.batchSet('bots', [result.params]);
        TrackingBot.log(result.params.id, 'create', 'success', `Created ${result.params.name} via voice`);
        showToast(`Created ${result.params.name}`, 'success');
        updateUserPoints(25);
        loadCreatorsHub();
        document.querySelector('[data-tab="creators"]').click();
      }
    };
    recognition.onerror = e => output.innerHTML += `<p>Error: ${e.error}</p>`;
    recognition.start();
  });
}

async function loadAnalytics() {
  const stats = document.getElementById('analytics-stats');
  stats.innerHTML = '';
  const analytics = await IDB.getAll('analytics');
  const botRuns = analytics.filter(a => a.event === 'bot_run').length;
  const apiCalls = analytics.filter(a => a.event === 'api_call').length;
  const userActions = analytics.filter(a => a.event === 'user_action').length;
  stats.innerHTML = `
    <div class="stat-card"><h3>Bot Runs</h3><p>${botRuns}</p></div>
    <div class="stat-card"><h3>API Calls</h3><p>${apiCalls}</p></div>
    <div class="stat-card"><h3>User Actions</h3><p>${userActions}</p></div>
  `;
}

async function logAnalytics(event, data) {
  await IDB.batchSet('analytics', [{ id: Date.now().toString(), event, data, timestamp: Date.now() }]);
}

async function updateUserPoints(points) {
  const email = localStorage.getItem('currentUser');
  const user = await IDB.get('users', email);
  await IDB.batchSet('users', [{ ...user, points: (user.points || 0) + points }]);
}

function showToast(message, type) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
  narrate(message);
}

function narrate(message) {
  if (document.getElementById('enable-narration').checked) {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = localStorage.getItem('language') || 'en-US';
    speechSynthesis.speak(utterance);
  }
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

document.getElementById('voice-input-btn').addEventListener('click', async () => {
  const input = 'Create a meme bot'; // Simulated voice input
  const result = await SmartAI.processInput(input, 'voice');
  await IDB.batchSet('bots', [result.params]);
  TrackingBot.log(result.params.id, 'create', 'success', `Created ${result.params.name}`);
  showToast('Bot created via voice', 'success');
  updateUserPoints(25);
  loadCreatorsHub();
});

document.getElementById('text-input-btn').addEventListener('click', async () => {
  const input = 'Create a weather bot';
  const result = await SmartAI.processInput(input, 'text');
  await IDB.batchSet('bots', [result.params]);
  TrackingBot.log(result.params.id, 'create', 'success', `Created ${result.params.name}`);
  showToast('Bot created via text', 'success');
  updateUserPoints(25);
  loadCreatorsHub();
});

document.getElementById('fusion-btn').addEventListener('click', async () => {
  const bots = await IDB.getAll('bots');
  if (bots.length < 2) {
    showToast('Need at least 2 bots to fuse', 'error');
    return;
  }
  const bot1 = bots[0];
  const bot2 = bots[1];
  const fusedBot = {
    id: Date.now().toString(),
    name: `Fused-${bot1.name}-${bot2.name}`,
    purpose: `Fusion of ${bot1.name} and ${bot2.name}`,
    functionality: 'Hybrid bot',
    success: 99,
    input: 'Bot fusion',
    code: `async () => {
      const result1 = await (${bot1.code})();
      const result2 = await (${bot2.code})();
      return \`Combined: \${result1} + \${result2}\`;
    }`
  };
  await IDB.batchSet('bots', [fusedBot]);
  TrackingBot.log(fusedBot.id, 'create', 'success', `Created ${fusedBot.name} via fusion`);
  showToast(`Created ${fusedBot.name}`, 'success');
  updateUserPoints(50);
  loadCreatorsHub();
});

document.getElementById('share-btn').addEventListener('click', async () => {
  const code = document.getElementById('code-editor').value;
  const token = document.getElementById('telegram-token').value;
  const chatId = document.getElementById('telegram-chat-id').value;
  if (token && chatId) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `Shared code:\n${code}`
      })
    });
    showToast('Code shared on Telegram', 'success');
  } else {
    showToast('Set Telegram token and chat ID in Settings', 'error');
  }
});

document.getElementById('webhook-setup').addEventListener('click', async () => {
  const token = document.getElementById('telegram-token').value;
  const webhookUrl = `https://api.telegram.org/bot${token}/setWebhook?url=https://your-hub.netlify.app/webhook`;
  await fetch(webhookUrl);
  showToast(`Webhook set: ${webhookUrl}`, 'success');
});

document.getElementById('file-input').addEventListener('change', async e => {
  const files = e.target.files;
  const operations = [];
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
    operations.push(bot);
  }
  await IDB.batchSet('bots', operations);
  operations.forEach(bot => TrackingBot.log(bot.id, 'upload', 'success', `Uploaded ${bot.name}`));
  showToast(`Uploaded ${operations.length} blueprints`, 'success');
  updateUserPoints(operations.length * 10);
  loadCreatorsHub();
});

document.getElementById('telegram-notifs').addEventListener('change', e => {
  if (e.target.checked) {
    const token = document.getElementById('telegram-token').value;
    const chatId = document.getElementById('telegram-chat-id').value;
    if (token && chatId) {
      TrackingBot.setTelegram(token, chatId);
      showToast('Telegram notifications enabled', 'success');
    } else {
      e.target.checked = false;
      showToast('Enter Telegram chat ID', 'error');
    }
  }
});

document.getElementById('fetch-chat-id').addEventListener('click', async () => {
  const token = document.getElementById('telegram-token').value;
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
  const data = await res.json();
  if (data.result.length > 0) {
    const chatId = data.result[0].message.chat.id;
    document.getElementById('telegram-chat-id').value = chatId;
    showToast(`Chat ID fetched: ${chatId}`, 'success');
  } else {
    showToast('No recent messages found. Send a message to your bot first.', 'error');
  }
});

document.getElementById('language-select').addEventListener('change', e => {
  localStorage.setItem('language', e.target.value);
  location.reload();
});

(async () => {
  const progress = document.getElementById('progress');
  const message = document.getElementById('loading-message');
  const assets = ['app.js', 'styles.css', 'service-worker.js', 'smart-ai.js', 'editor.js', 'simplified-ui.js', 'icon.png'];
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

  const demoBot = {
    id: 'demo-1',
    name: 'Meme Bot',
    purpose: 'Fetch memes from Giphy',
    functionality: 'Uses Giphy API',
    success: 99,
    input: 'Create a meme bot',
    code: `async () => {
      const cached = await IDB.get('cache', 'meme-funny');
      if (cached) return cached.value;
      const res = await fetch('https://api.giphy.com/v1/gifs/search?api_key=kOrIThLFfVdinZ3ORGBDmmX6cnnVWTzK&q=funny');
      const data = await res.json();
      const url = data.data[0].images.fixed_height.url;
      await IDB.batchSet('cache', [{ key: 'meme-funny', value: url, timestamp: Date.now() }]);
      return url;
    }`
  };
  await IDB.batchSet('bots', [demoBot]);
})();