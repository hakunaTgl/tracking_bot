# Smart Bot Hub

The **Smart Bot Hub** is a Progressive Web App (PWA) for creating, managing, and deploying bots from your Android phone, no computer needed. Powered by a **Unified AI**—a single, intelligent entity acting as both project manager and system overseer—it generates full, functional code, saves bots and logs persistently, and offers real-time conversational control. Build web scrapers, weather bots, or custom automations with a touch-friendly interface and take command of your bot empire!

## Features

- **Unified AI**: One AI handles all tasks:
  - **Bot Creation**: Generates complete Python code (e.g., weather APIs, scrapers) with descriptions.
  - **Bot Management**: Sends commands, monitors statuses, and suggests actions (e.g., deploy idle bots).
  - **Hub Queries**: Answers questions (e.g., “list running bots”) using hub state.
  - **Hub Enhancements**: Suggests features (e.g., dashboards) based on your inputs.
  - **Conversational Chat**: Distinguishes bot-building, hub queries, and casual talk.
- **Auto-Saved Bots**: Bots (name, code, analysis, status, performance) saved to IndexedDB on creation/edit.
- **Full Code Generation**: Complete Python with error handling, comments, and descriptions (e.g., “Fetches weather data”).
- **Command System**: Dropdowns for individual bot commands (Start, Stop, Restart) and global commands (Start All, Stop All, Restart All).
- **Functional Buttons**:
  - **Add Function**: Append logging or email features.
  - **Remove Function**: Delete specific functions.
  - **Edit**: Modify code in a textarea.
  - **Refine/Suggest**: Get AI-driven tweaks.
  - **Copy/Create**: Copy code or save bots.
- **Mobile-Optimized**: Touch-friendly UI, bottom nav, offline support for UI and data.
- **Persistent Logs**: All actions logged and saved, with a clear option.

## Prerequisites

- **Android Phone**: Chrome browser (version 90+) for PWA support.
- **Internet Connection**: Needed for setup and code generation (offline for UI/data).
- **GitHub Account**: Free account for hosting.
- **Netlify Account**: Free account for PWA deployment.

## Setup Instructions (Phone-Only)

Deploy the hub using Chrome on your Android phone.

### 1. Create a GitHub Repository
1. Go to [github.com](https://github.com/) in Chrome.
2. Sign in or sign up (tap “Sign up,” enter email/password/username, verify email).
3. Tap “+” (top-right) or “New repository.”
4. Name it (e.g., `bot-hub`), set to **Public**, check “Add a README file,” tap “Create repository.”
5. **Time**: ~2-3 minutes.

### 2. Add Project Files
1. In your repo (e.g., `github.com/yourusername/bot-hub`), tap “Add file” > “Create new file.”
2. Add these files by copying from the provided code:
   - `index.html`: Main app (React, Tailwind CSS, IndexedDB).
   - `manifest.json`: PWA config.
   - `service-worker.js`: Offline support.
   - `README.md`: This file.
3. For each file:
   - Enter the filename (e.g., `index.html`).
   - Paste the code (long-press to copy, zoom in, or use Google Keep as a buffer).
   - Commit with a message (e.g., “Add index.html”).
4. **Tip**: If pasting lags, use a note app or type a few lines.
5. **Time**: ~5-10 minutes.

### 3. Deploy to Netlify
1. Go to [netlify.com](https://www.netlify.com/) in a new tab.
2. Sign up (tap “Sign up,” choose “GitHub,” authorize).
3. Tap “New site from Git” or “Sites” > “Add new site.”
4. Select “GitHub,” choose `bot-hub` repo.
5. Use defaults (branch: `main`, no build command, publish: `/`).
6. Tap “Deploy site.” Wait ~1 minute for the URL (e.g., `https://your-bot-hub.netlify.app`).
7. **Time**: ~3-5 minutes.

### 4. Install as a PWA
1. Visit the Netlify URL in Chrome.
2. Tap three-dot menu > “Add to Home screen” or “Install app.”
3. Confirm to add to your home screen.
4. Launch from the home screen.
5. **Time**: ~1-2 minutes.

## Usage

1. **Launch**: Open the app from your home screen.
2. **Unified AI**:
   - Type in the “Unified AI” input (e.g., “build a weather bot,” “list running bots,” “how’s it going?”).
   - The AI detects intent: bot-building, hub queries, or chat.
   - Example: “weather bot” → “City? Email alerts?”
3. **Upload Ideas**:
   - Upload a text file (PDFs logged, not parsed).
   - Tap “Generate” to create code.
4. **Generate Code**:
   - Enter a prompt or use a file.
   - Get full Python code with a description (e.g., “Scrapes website paragraphs”).
   - Analysis shows name, functions, value, risks.
5. **Manage Bots**:
   - **Individual Commands**: Select “Start,” “Stop,” “Restart” per bot.
   - **Global Commands**: Choose “Start All,” “Stop All,” “Restart All.”
   - **Edit**: Modify code, save changes.
   - **Debug**: Run simulated checks (e.g., “API key needed”).
   - **Deploy**: Set status to “Deployed.”
6. **Modify Code**:
   - **Add Function**: Select “Logging” or “Email,” append code.
   - **Remove Function**: Delete a function.
   - **Refine Details**: Get AI suggestions (e.g., “Add multiple cities?”).
   - **Suggest Edits**: View AI improvements.
7. **Create/Copy**:
   - “Create Bot” saves to Bots table (auto-saved).
   - “Copy Code” copies to clipboard.
8. **Suggestions**:
   - View AI-suggested bots (e.g., “Crypto Tracker”).
   - Tap “Create” to generate (requires approval).
9. **Logs**:
   - Check all actions in the Logs section.
   - Tap “Clear Logs” to reset.
10. **Navigate**: Use bottom nav (AI, Bots, Logs).

## Example Workflow

1. Type “build a weather bot” in the Unified AI input.
2. AI asks, “City? Daily or hourly updates?”
3. Respond “New York, daily.”
4. Tap “Generate” for Python code (e.g., `fetch_weather`, `send_email`).
5. Review analysis (e.g., “Fetches weather data”).
6. Add “Logging” function via dropdown.
7. Tap “Create Bot” to save.
8. Send “Start” command to the bot.
9. Ask, “list running bots,” to confirm.
10. Check logs for actions.

## Troubleshooting

- **GitHub Pasting**:
  - Use Google Keep to store code, then paste.
  - Zoom in or type a few lines if laggy.
- **Netlify Deploy**:
  - Ensure files are in the repo’s root.
  - Check Netlify’s deploy logs.
- **PWA Install**:
  - Update Chrome (Settings > Apps > Chrome).
  - Clear cache (Settings > Privacy > Clear data).
- **UI Issues**:
  - Share phone model (e.g., Galaxy S23) if buttons/text are off.
  - Test scrolling in Bots/Logs.
- **File Uploads**:
  - Ensure Chrome has file access (Settings > Apps > Chrome > Permissions).
  - Use small text files.
- **Offline Mode**:
  - UI and saved data work offline; code generation needs internet.

## Future Enhancements

- **Real AI**: Add WebLLM or Hugging Face for true NLP (needs computer).
- **Code Execution**: Use Pyodide for in-browser Python.
- **File Parsing**: Support PDFs with pdf.js.
- **Backend**: Deploy FastAPI with CodeLlama.
- **UI**: Custom icons, swipe gestures, analytics dashboard.

## Contributing

This is your hub! Suggest features via the Unified AI chat (e.g., “add a dashboard”). Share feedback on AI, UI, or functionality. Backend integration can come when you have computer access.

## License

Unlicensed for now—your personal bot command center. Modify or share as you like!

## Contact

Ping the Unified AI in the hub’s chat for help or ideas. Let’s make this epic! 🚀