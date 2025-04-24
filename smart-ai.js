class SmartAI {
  static async processInput(input, type = 'text') {
    let code = '// Generated code';
    let purpose = input;
    let functionality = 'Custom tasks';
    
    if (input.toLowerCase().includes('meme')) {
      const query = input.toLowerCase().replace('create a meme bot', 'funny').trim();
      code = `async () => {
        const cached = await IDB.get('cache', 'meme-${query}');
        if (cached) return cached.value;
        const res = await fetch('https://api.giphy.com/v1/gifs/search?api_key=kOrIThLFfVdinZ3ORGBDmmX6cnnVWTzK&q=${query}');
        const data = await res.json();
        const url = data.data[0].images.fixed_height.url;
        await IDB.batchSet('cache', [{ key: 'meme-${query}', value: url, timestamp: Date.now() }]);
        return url;
      }`;
      functionality = 'Fetches memes via Giphy API';
    } else if (input.toLowerCase().includes('twitter')) {
      code = `async () => {
        const res = await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: { Authorization: 'Bearer YOUR_TWITTER_BEARER_TOKEN' },
          body: JSON.stringify({ text: 'Hello from Smart Hub!' })
        });
        const data = await res.json();
        return 'Tweet posted: ' + data.data.id;
      }`;
      functionality = 'Posts tweets via API';
    } else if (input.toLowerCase().includes('weather')) {
      const city = input.toLowerCase().includes('in') ? input.split('in')[1].trim() : 'London';
      code = `async () => {
        const res = await fetch('https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=4fc179285e1139b621267e810bb9ddcd');
        const data = await res.json();
        return \`Weather in ${city}: \${data.weather[0].description}, \${Math.round(data.main.temp - 273.15)}°C\`;
      }`;
      functionality = 'Fetches weather data via API';
    }

    return {
      message: `Processed: ${input}`,
      action: 'createBot',
      params: {
        id: Date.now().toString(),
        name: `Bot-${Date.now()}`,
        code,
        purpose,
        functionality,
        success: 99,
        input
      }
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