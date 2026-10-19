# Desk Hub 🎯

A tablet-first Progressive Web App designed for the **Lenovo Tab M10** (10.1", landscape orientation, 1280x800 / 1920x1200) for personal study and preparation for **GATE CSE**.

---

## 🚀 Features

### 🖥️ Tablet-First Visual Design
- **Dark Theme**: `#0F0F14` background, `#1A1A23` card surfaces, `#7557ED` purple accent, `#EDEDF2` text.
- **Ergonomic**: Landscape-optimized layout, large touch targets (min 48px), 16px rounded cards, Inter typography.
- **Screen Wake Lock API**: Automatically requests screen wake lock while the app is active to prevent the tablet display from sleeping while studying.

### 📊 Dashboard Screen
1. **Header Bar**: Displays today's full date, live clock, and a dynamic **"N cards due"** badge that immediately opens the Revise tab.
2. **Pomodoro Timer (Top-Left)**:
   - Countdown with circular visual ring.
   - Start / Pause / Reset controls.
   - Default 25m Focus / 5m Short Break / 15m Long Break after 4 sessions.
   - Durations editable directly in-card.
   - Phase auto-advance with Web Audio soft sound tone when a session ends.
   - **Background accurate**: Computes remaining time from timestamps, not tick counters.
3. **Syllabus Progress (Top-Right)**:
   - Circular overall progress ring with percentage.
   - Preloaded with all 11 GATE CSE subjects and topics (Engineering Mathematics, Digital Logic, COA, Programming & DS, Algorithms, TOC, Compiler Design, OS, DBMS, Computer Networks, General Aptitude).
   - Expandable subjects with individual progress bars and topic checklists.
   - Full in-place editing: Add, rename, and delete subjects & topics.
4. **Today's Targets (Bottom-Left)**:
   - Checklist of 3 to 5 tasks for the day.
   - Check off to complete, add/edit/delete tasks.
   - Automatically resets for each new calendar day.
5. **Spotify (Bottom-Right)**:
   - Placeholder card indicating "Spotify control coming soon".

### 🧠 Revise Screen (Spaced Repetition with SM-2)
- **Home View**:
  - List of decks with live **Due**, **New**, and **Total** card counters.
  - Quick **"Review All Due"** button or review per individual deck.
  - Stats strip: **Current daily streak** (🔥 consecutive active days) and **Cards reviewed today** (✓).
  - Deck CRUD: create, rename, and delete decks.
- **Review Mode**:
  - Full-screen card showing the FRONT.
  - Tap card or press `Space` to flip and reveal the BACK.
  - 4 rating buttons with live next interval previews:
    - **Again (1)**: 10m relearn, reps=0, ease -0.2
    - **Hard (2)**: interval × 1.2, ease -0.15
    - **Good (3)**: 1d -> 6d -> interval × ease
    - **Easy (4)**: interval × ease × 1.3, ease +0.15
  - Top progress bar and "N left" counter.
  - Keyboard shortcuts (`Space` to flip, `1-4` to rate, `Esc` to exit).
- **Add / Edit Cards**:
  - Front & back text with Markdown and code-block rendering preview.
  - Deck picker.
  - Image attachments (stored as Blobs in IndexedDB).
- **Browse View**:
  - Searchable list of all flashcards with deck filtering, due date status, and edit/delete actions.
- **Pure SM-2 Scheduler Module**:
  - Unit-tested with Vitest (`scheduler.test.ts`) covering all branches and edge cases.

### 💾 Local Data & Offline PWA
- **100% Offline & Local**: Dexie (IndexedDB) stores all data. No accounts, no backend servers.
- **PWA**: Installable to tablet home screen with Service Worker caching (`vite-plugin-pwa`).
- **Data Backup & Restore**: JSON export and import modal with full base64 encoding of image attachments.
- **Sample GATE Flashcards**: One-click button in the Backup modal to load curated GATE CSE sample questions.

---

## 🛠️ Local Development & Running

### 1. Install dependencies
```bash
npm install
```

### 2. Run unit tests
```bash
npm test
```

### 3. Start development server
```bash
npm run dev
```
Open `http://localhost:5173/` in your tablet or desktop browser.

### 4. Build and preview production PWA locally
```bash
npm run build
npm run preview
```

---

## 🌐 Deploying to GitHub Pages

Desk Hub is configured as static files ready for GitHub Pages:

### Method A: Automated GitHub Actions (Recommended)
1. Initialize git and push to your repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Desk Hub"
   git remote add origin https://github.com/<your-username>/desk-hub.git
   git branch -M main
   git push -u origin main
   ```
2. In your GitHub repository, go to **Settings** > **Pages** > **Build and deployment** > **Source** and select **GitHub Actions**.
3. A standard Vite workflow file `.github/workflows/deploy.yml` can be added (see below).

### Method B: Deploy using `gh-pages`
1. Install `gh-pages`:
   ```bash
   npm install -D gh-pages
   ```
2. Add a deploy script to `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```
3. Run:
   ```bash
   npm run deploy
   ```
4. In GitHub repo Settings > Pages, ensure the source is set to `gh-pages` branch.
