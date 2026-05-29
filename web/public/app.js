// ─── Constants ────────────────────────────────────────────────────────────────

const COMMON_VERBS = [
  { infinitive: 'sein', english: 'to be', conjugations: { ich: 'bin', du: 'bist', er: 'ist', wir: 'sind', ihr: 'seid', sie: 'sind' }, regular: false, example: 'Ich bin Student.' },
  { infinitive: 'haben', english: 'to have', conjugations: { ich: 'habe', du: 'hast', er: 'hat', wir: 'haben', ihr: 'habt', sie: 'haben' }, regular: false, example: 'Ich habe ein Buch.' },
  { infinitive: 'gehen', english: 'to go', conjugations: { ich: 'gehe', du: 'gehst', er: 'geht', wir: 'gehen', ihr: 'geht', sie: 'gehen' }, regular: true, example: 'Ich gehe zur Schule.' },
  { infinitive: 'machen', english: 'to make/do', conjugations: { ich: 'mache', du: 'machst', er: 'macht', wir: 'machen', ihr: 'macht', sie: 'machen' }, regular: true, example: 'Was machst du?' },
  { infinitive: 'können', english: 'can / to be able to', conjugations: { ich: 'kann', du: 'kannst', er: 'kann', wir: 'können', ihr: 'könnt', sie: 'können' }, regular: false, example: 'Ich kann Deutsch sprechen.' },
  { infinitive: 'müssen', english: 'must / have to', conjugations: { ich: 'muss', du: 'musst', er: 'muss', wir: 'müssen', ihr: 'müsst', sie: 'müssen' }, regular: false, example: 'Du musst lernen.' },
  { infinitive: 'dürfen', english: 'may / allowed to', conjugations: { ich: 'darf', du: 'darfst', er: 'darf', wir: 'dürfen', ihr: 'dürft', sie: 'dürfen' }, regular: false, example: 'Darf ich hereinkommen?' },
  { infinitive: 'wollen', english: 'to want to', conjugations: { ich: 'will', du: 'willst', er: 'will', wir: 'wollen', ihr: 'wollt', sie: 'wollen' }, regular: false, example: 'Ich will Deutsch lernen.' },
  { infinitive: 'sprechen', english: 'to speak', conjugations: { ich: 'spreche', du: 'sprichst', er: 'spricht', wir: 'sprechen', ihr: 'sprecht', sie: 'sprechen' }, regular: false, example: 'Er spricht Deutsch.' },
  { infinitive: 'lernen', english: 'to learn', conjugations: { ich: 'lerne', du: 'lernst', er: 'lernt', wir: 'lernen', ihr: 'lernt', sie: 'lernen' }, regular: true, example: 'Wir lernen Deutsch.' },
  { infinitive: 'kommen', english: 'to come', conjugations: { ich: 'komme', du: 'kommst', er: 'kommt', wir: 'kommen', ihr: 'kommt', sie: 'kommen' }, regular: true, example: 'Er kommt aus Deutschland.' },
  { infinitive: 'wohnen', english: 'to live/reside', conjugations: { ich: 'wohne', du: 'wohnst', er: 'wohnt', wir: 'wohnen', ihr: 'wohnt', sie: 'wohnen' }, regular: true, example: 'Ich wohne in Berlin.' },
];

const PRONOUNS = ['ich', 'du', 'er', 'wir', 'ihr', 'sie'];

// ─── State ────────────────────────────────────────────────────────────────────

let state = {
  currentView: 'dashboard',
  currentSet: null,

  // Flashcard state
  fc: {
    cards: [],
    index: 0,
    known: [],
    needsWork: [],
    flipped: false,
    setId: null,
  },

  // Quiz state
  quiz: {
    questions: [],
    index: 0,
    score: 0,
    answered: false,
    mistakes: [],
    setId: null,
  },

  // Verb trainer
  verbIndex: 0,
  verbMode: 'browse',
  verbAnswers: {},
  verbRevealed: false,

  // Vocab bank
  vocabFilter: 'all',
  vocabQuery: '',

  // Article trainer
  article: { nouns: [], index: 0, score: 0, total: 0, answered: false },

  // Sentence builder (word order)
  sb: { sentences: [], index: 0, score: 0, selected: [], pool: [], answered: false, setId: null },

  // Translation practice
  tp: { items: [], index: 0, score: 0, answered: false, direction: 'de-en', setId: null },

  // Mistake review
  mr: { items: [], index: 0, correct: 0, answered: false },

  // Fill-in-blank
  fib: { items: [], index: 0, score: 0, answered: false, setId: null },
};

// ─── Storage Helpers ──────────────────────────────────────────────────────────

function getSets() {
  try { return JSON.parse(localStorage.getItem('ds_sets') || '[]'); } catch { return []; }
}

function saveSets(sets) {
  localStorage.setItem('ds_sets', JSON.stringify(sets));
}

function getProgress() {
  const defaults = {
    streak: 0,
    lastStudyDate: null,
    totalWords: 0,
    totalScans: 0,
    totalQuizzes: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    history: [],
  };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem('ds_progress') || '{}') };
  } catch { return defaults; }
}

function saveProgress(p) {
  localStorage.setItem('ds_progress', JSON.stringify(p));
}

function getSettings() {
  // Default apiUrl to same origin so it works on Replit, localhost, anywhere
  const defaults = { name: 'Student', level: 'A2', apiUrl: window.location.origin, dailyGoal: 15, audioEnabled: true };
  try {
    const saved = JSON.parse(localStorage.getItem('ds_settings') || '{}');
    // If saved URL is localhost but we're not on localhost, reset it to current origin
    if (saved.apiUrl && saved.apiUrl.includes('localhost') && !window.location.hostname.includes('localhost')) {
      saved.apiUrl = window.location.origin;
    }
    return { ...defaults, ...saved };
  } catch { return defaults; }
}

function saveSettings(s) {
  localStorage.setItem('ds_settings', JSON.stringify(s));
}

function addHistoryEntry(entry) {
  const p = getProgress();
  p.history = [entry, ...(p.history || [])].slice(0, 100);
  saveProgress(p);
}

function updateStreak() {
  const p = getProgress();
  const today = new Date().toDateString();
  const last = p.lastStudyDate ? new Date(p.lastStudyDate).toDateString() : null;
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (last === today) {
    // Already studied today, no change
  } else if (last === yesterday) {
    p.streak = (p.streak || 0) + 1;
    p.lastStudyDate = new Date().toISOString();
    addXP(20);
    checkBadgeTrigger('streak_update', { streak: p.streak });
  } else {
    p.streak = 1;
    p.lastStudyDate = new Date().toISOString();
    addXP(20);
    checkBadgeTrigger('streak_update', { streak: p.streak });
  }
  saveProgress(p);
  document.getElementById('streak-badge').textContent = `🔥 ${p.streak}`;
}

function getMasteredWords() {
  try { return JSON.parse(localStorage.getItem('ds_masteredWords') || '[]'); } catch { return []; }
}
function saveMasteredWords(words) {
  localStorage.setItem('ds_masteredWords', JSON.stringify(words));
}
function markWordMastered(setId, german) {
  const key = `${setId}:${german}`;
  const words = getMasteredWords();
  if (!words.includes(key)) {
    words.push(key);
    saveMasteredWords(words);
  }
}

function getTodayWords() {
  try {
    const data = JSON.parse(localStorage.getItem('ds_wordsToday') || '{}');
    return data.date === new Date().toDateString() ? (data.count || 0) : 0;
  } catch { return 0; }
}
function incrementTodayWords() {
  try {
    const today = new Date().toDateString();
    const data = JSON.parse(localStorage.getItem('ds_wordsToday') || '{}');
    const count = (data.date === today ? (data.count || 0) : 0) + 1;
    localStorage.setItem('ds_wordsToday', JSON.stringify({ date: today, count }));
  } catch {}
}

function displayMastery(set) {
  const base = set.masteryLevel || 0;
  if (!set.lastStudied || base === 0) return base;
  const daysSince = Math.floor((Date.now() - new Date(set.lastStudied).getTime()) / 86400000);
  const decay = Math.max(0, Math.floor(daysSince / 7) * 8);
  return Math.max(base - decay, Math.floor(base * 0.4));
}

// ─── Mistake Bank ─────────────────────────────────────────────────────────────

function getMistakes() {
  try { return JSON.parse(localStorage.getItem('ds_mistakes') || '[]'); } catch { return []; }
}
function saveMistakes(m) { localStorage.setItem('ds_mistakes', JSON.stringify(m)); }

function recordMistake({ question, myAnswer, correct, explanation, topic, setId, setTitle, mode }) {
  const mistakes = getMistakes();
  const existing = mistakes.find(m => m.question === question && m.correct === correct);
  if (existing) {
    existing.lastSeen = new Date().toISOString();
    existing.seenCount = (existing.seenCount || 1) + 1;
    existing.nextReview = daysFromNow(1);
    saveMistakes(mistakes);
    return;
  }
  mistakes.unshift({
    id: uid(),
    question, myAnswer: myAnswer || '', correct,
    explanation: explanation || '',
    topic: topic || '', setId: setId || '', setTitle: setTitle || '',
    mode: mode || 'quiz',
    date: new Date().toISOString(),
    nextReview: daysFromNow(1),
    reviewCount: 0, interval: 1, resolved: false,
  });
  saveMistakes(mistakes.slice(0, 300));
}

function getDueMistakes() {
  const now = new Date();
  return getMistakes().filter(m => !m.resolved && new Date(m.nextReview || 0) <= now);
}

function updateMistakeReview(id, gotItRight) {
  const mistakes = getMistakes();
  const m = mistakes.find(x => x.id === id);
  if (!m) return;
  if (gotItRight) {
    m.reviewCount = (m.reviewCount || 0) + 1;
    const intervals = [1, 3, 7, 14, 30, 60];
    m.interval = intervals[Math.min(m.reviewCount, intervals.length - 1)];
    m.nextReview = daysFromNow(m.interval);
    m.resolved = m.reviewCount >= 4;
  } else {
    m.reviewCount = 0;
    m.interval = 1;
    m.nextReview = daysFromNow(1);
    m.resolved = false;
  }
  saveMistakes(mistakes);
}

function daysFromNow(n) {
  return new Date(Date.now() + n * 86400000).toISOString();
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${name}`);
  if (target) target.classList.add('active');

  // Update sidebar active state
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  const snavLink = document.getElementById(`snav-${name}`);
  if (snavLink) snavLink.classList.add('active');

  state.currentView = name;
  window.scrollTo(0, 0);

  // Init functions for views
  const viewInits = {
    'dashboard': initDashboard,
    'saved-sets': initSavedSets,
    'vocabulary-bank': initVocabBank,
    'verb-trainer': initVerbTrainer,
    'grammar-hub': initGrammarHub,
    'history': initHistory,
    'settings': initSettings,
    'create': initCreate,
    'article-trainer': initArticleTrainer,
    'mistake-bank': initMistakeBankView,
    'badges': renderBadgesView,
    'sentence-builder': () => {},
    'translation-practice': () => {},
  };
  if (viewInits[name]) viewInits[name]();
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('active');
  document.getElementById('hamburger-btn').classList.add('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
  document.getElementById('hamburger-btn').classList.remove('open');
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function initDashboard() {
  const settings = getSettings();
  const p = getProgress();
  const sets = getSets();
  const dueMistakes = getDueMistakes();
  const allMistakes = getMistakes().filter(m => !m.resolved);

  // Greeting (German!)
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Guten Morgen' : hour < 17 ? 'Guten Tag' : 'Guten Abend';
  document.getElementById('dash-greeting').textContent = `${greet}, ${settings.name}! 👋`;
  document.getElementById('dash-sub').textContent = getStreakMessage(p.streak);

  // Stats
  document.getElementById('stat-streak').textContent = p.streak || 0;
  document.getElementById('stat-sets').textContent = sets.length;
  document.getElementById('stat-words').textContent = getMasteredWords().length;
  document.getElementById('stat-mistakes').textContent = allMistakes.length;
  document.getElementById('streak-badge').textContent = `🔥 ${p.streak || 0}`;

  // Today's Study Plan
  const planEl = document.getElementById('dash-daily-plan');
  if (planEl) {
    const planCards = [];

    // Daily goal progress
    const goalWords = settings.dailyGoal || 15;
    const todayWords = getTodayWords();
    const goalPct = Math.min(100, Math.round((todayWords / goalWords) * 100));
    planCards.push(`
      <div class="plan-card">
        <div class="plan-icon">${todayWords >= goalWords ? '🎉' : '🎯'}</div>
        <div class="plan-info">
          <div class="plan-title">${todayWords >= goalWords ? 'Daily goal complete!' : `Today: ${todayWords} / ${goalWords} words`}</div>
          <div class="plan-sub">
            <div class="goal-bar-track"><div class="goal-bar-fill" style="width:${goalPct}%"></div></div>
          </div>
        </div>
      </div>`);

    if (dueMistakes.length > 0) {
      planCards.push(`
        <div class="plan-card plan-urgent" onclick="startMistakeReview()">
          <div class="plan-icon">🔁</div>
          <div class="plan-info">
            <div class="plan-title">${dueMistakes.length} mistake${dueMistakes.length !== 1 ? 's' : ''} due for review</div>
            <div class="plan-sub">Scheduled review — keep these fresh</div>
          </div>
          <span class="plan-arrow">→</span>
        </div>`);
    }

    if (sets.length > 0) {
      const lastSet = [...sets].sort((a, b) =>
        new Date(b.lastStudied || b.createdAt || 0) - new Date(a.lastStudied || a.createdAt || 0)
      )[0];
      planCards.push(`
        <div class="plan-card" onclick="openStudySet('${lastSet.id}')">
          <div class="plan-icon">📖</div>
          <div class="plan-info">
            <div class="plan-title">${esc(lastSet.title)}</div>
            <div class="plan-sub">Mastery ${displayMastery(lastSet)}% · ${formatDate(lastSet.lastStudied)}</div>
          </div>
          <span class="plan-arrow">→</span>
        </div>`);
    } else {
      planCards.push(`
        <div class="plan-card" onclick="showView('create')">
          <div class="plan-icon">➕</div>
          <div class="plan-info">
            <div class="plan-title">Add your first worksheet</div>
            <div class="plan-sub">Paste or type your German text to get started</div>
          </div>
          <span class="plan-arrow">→</span>
        </div>`);
    }

    planEl.innerHTML = planCards.join('');
  }

  // Recent sets (up to 4)
  const recentSets = sets.slice(0, 4);
  const container = document.getElementById('dash-recent-sets');

  if (recentSets.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <h3>No study sets yet</h3>
        <p>Add a worksheet to create your first set</p>
        <button class="btn btn-primary" onclick="showView('create')">➕ Add Worksheet</button>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="sets-grid">${recentSets.map(set => renderSetCard(set)).join('')}</div>`;
}

function getStreakMessage(streak) {
  if (!streak || streak === 0) return 'Start your streak — study something today!';
  if (streak === 1) return 'Day 1 streak! Come back tomorrow to keep it going.';
  if (streak < 5) return `${streak} day streak! You\'re building a habit.`;
  if (streak < 10) return `🔥 ${streak} days strong! Incredible consistency!`;
  return `🏆 ${streak} day streak! You\'re on fire!`;
}

// ─── Create / Scan ────────────────────────────────────────────────────────────

function initCreate() {
  updateCharCount();
  // Reset OCR state when entering create view
  const garbleWarning = document.getElementById('ocr-garble-warning');
  const ocrProgress = document.getElementById('ocr-progress');
  if (garbleWarning) garbleWarning.style.display = 'none';
  if (ocrProgress) ocrProgress.style.display = 'none';
  // Always show which API will be used
  const settings = getSettings();
  const hintEl = document.getElementById('api-url-hint');
  if (hintEl) {
    hintEl.textContent = `Using: ${settings.apiUrl}`;
    hintEl.style.display = 'block';
  }
}

async function handlePhoto(event) {
  const file = event.target.files[0];
  if (!file) return;

  const preview = document.getElementById('photo-preview');
  const previewWrap = document.getElementById('photo-preview-wrap');
  preview.src = URL.createObjectURL(file);
  previewWrap.style.display = 'flex';

  const ocrProgress = document.getElementById('ocr-progress');
  const ocrStatus = document.getElementById('ocr-status');
  ocrProgress.style.display = 'flex';
  ocrStatus.textContent = 'Enhancing image for better reading…';

  try {
    // ── Preprocess image for better OCR accuracy ────────────────────────────
    const processedBlob = await preprocessImageForOCR(file, ocrStatus);

    ocrStatus.textContent = 'Reading text… 0%';
    const result = await Tesseract.recognize(processedBlob, 'deu+eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          ocrStatus.textContent = `Reading… ${Math.round(m.progress * 100)}%`;
        }
      },
      // Better page segmentation for printed worksheets
      tessedit_pageseg_mode: '6',
      preserve_interword_spaces: '1',
    });

    let text = result.data.text.trim();

    // Detect garbled OCR (too many non-letter characters = bad scan)
    const letterRatio = (text.match(/[a-zA-ZäöüÄÖÜß]/g) || []).length / Math.max(text.length, 1);
    const garbleWarning = document.getElementById('ocr-garble-warning');

    if (letterRatio < 0.4 && text.length > 20) {
      // OCR probably failed — show raw output but warn prominently
      if (garbleWarning) garbleWarning.style.display = 'block';
      ocrStatus.textContent = '⚠️ Text may be garbled — please review and correct below.';
      showToast('OCR struggled with this photo. Correct the text below or type it manually.', 'warning');
    } else {
      if (garbleWarning) garbleWarning.style.display = 'none';
      // Clean up minor OCR artifacts
      text = text
        .replace(/[|}{\\^~`©®]/g, '')       // stray symbols common in bad OCR
        .replace(/[ \t]{3,}/g, '  ')          // collapse excessive spaces
        .replace(/\n{3,}/g, '\n\n')           // collapse excessive blank lines
        .trim();
      ocrStatus.textContent = `✅ Got ${text.length} characters! Review below, then tap Generate.`;
      showToast('Text extracted! Check it looks right before generating.', 'info');
    }

    const textarea = document.getElementById('worksheet-text');
    textarea.value = text;
    updateCharCount();

    if (!text) {
      ocrStatus.textContent = '❌ No text found — try better lighting or type it manually.';
      showToast('No text found in photo. Try a clearer shot or type the text.', 'warning');
    }

    setTimeout(() => { ocrProgress.style.display = 'none'; }, 4000);
  } catch (err) {
    ocrStatus.textContent = '❌ Could not read photo. Try again or type your text.';
    setTimeout(() => { ocrProgress.style.display = 'none'; }, 3000);
    console.error('OCR error:', err);
  }
  event.target.value = '';
}

/**
 * Preprocess image for OCR using Otsu binarization.
 *
 * Steps:
 * 1. Scale image up to 3000px on the longest side (Tesseract accuracy scales with resolution)
 * 2. Convert to greyscale
 * 3. Apply Otsu's threshold to find the optimal black/white cutoff automatically
 * 4. Output pure black-on-white image — the ideal input for Tesseract
 */
function preprocessImageForOCR(file, statusEl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        if (statusEl) statusEl.textContent = 'Enhancing image…';

        // Scale to 3000px on longest side — more pixels = better OCR
        const TARGET = 3000;
        let { width, height } = img;
        const scale = Math.min(TARGET / Math.max(width, height), 4);
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const d = imageData.data;
        const len = width * height;

        // ── Step 1: greyscale ────────────────────────────────────────
        const grey = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          grey[i] = Math.round(0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]);
        }

        // ── Step 2: Otsu threshold ───────────────────────────────────
        // Build histogram
        const hist = new Int32Array(256);
        for (let i = 0; i < len; i++) hist[grey[i]]++;

        // Find optimal threshold
        let sumAll = 0;
        for (let t = 0; t < 256; t++) sumAll += t * hist[t];

        let sumB = 0, wB = 0, maxVar = 0, threshold = 128;
        for (let t = 0; t < 256; t++) {
          wB += hist[t];
          if (!wB) continue;
          const wF = len - wB;
          if (!wF) break;
          sumB += t * hist[t];
          const mB = sumB / wB;
          const mF = (sumAll - sumB) / wF;
          const varBetween = wB * wF * (mB - mF) ** 2;
          if (varBetween > maxVar) { maxVar = varBetween; threshold = t; }
        }

        // ── Step 3: binarize ─────────────────────────────────────────
        for (let i = 0; i < len; i++) {
          const v = grey[i] > threshold ? 255 : 0;
          d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
          d[i * 4 + 3] = 255;
        }

        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        }, 'image/png');
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
}



function clearPhoto() {
  const preview = document.getElementById('photo-preview');
  const previewWrap = document.getElementById('photo-preview-wrap');
  const garbleWarning = document.getElementById('ocr-garble-warning');
  const ocrProgress = document.getElementById('ocr-progress');
  if (preview) preview.src = '';
  if (previewWrap) previewWrap.style.display = 'none';
  if (garbleWarning) garbleWarning.style.display = 'none';
  if (ocrProgress) ocrProgress.style.display = 'none';
  const input = document.getElementById('camera-input');
  if (input) input.value = '';
}

function updateCharCount() {
  const text = document.getElementById('worksheet-text')?.value || '';
  const el = document.getElementById('char-count');
  if (el) el.textContent = `${text.length} characters`;
}

async function generateStudySet() {
  const text = document.getElementById('worksheet-text').value.trim();
  if (!text) {
    showToast('Please paste some worksheet text first.', 'error');
    return;
  }

  const btn = document.getElementById('generate-btn');
  btn.disabled = true;

  showLoading('Sending to AI…');
  setTimeout(() => setLoadingMsg('AI is analyzing your worksheet…'), 1200);
  setTimeout(() => setLoadingMsg('Building your study set…'), 3500);

  const settings = getSettings();

  try {
    const res = await fetch(`${settings.apiUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    hideLoading();

    let data;
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok || data.demo) {
      // Fall back to heuristic parse
      const set = heuristicParse(text);
      set.demo = true;

      const sets = getSets();
      sets.unshift(set);
      saveSets(sets);

      const p = getProgress();
      p.totalScans = (p.totalScans || 0) + 1;
      saveProgress(p);

      btn.disabled = false;
      document.getElementById('worksheet-text').value = '';
      updateCharCount();

      showToast('Generated using offline mode (connect backend for AI).', 'warning');
      openStudySet(set.id);
      checkBadgeTrigger('set_created', {});
      return;
    }

    // Detect "Invalid Text" response from AI (AI rejected the input)
    const isInvalidResponse = (
      !data.vocabulary || data.vocabulary.length === 0 ||
      (data.title || '').toLowerCase().includes('invalid') ||
      (data.topic || '').toLowerCase().includes('does not contain')
    );

    if (isInvalidResponse) {
      // Fall back to heuristic, but show a helpful message
      const set = heuristicParse(text);
      set.demo = true;

      const sets2 = getSets();
      sets2.unshift(set);
      saveSets(sets2);

      const p2 = getProgress();
      p2.totalScans = (p2.totalScans || 0) + 1;
      saveProgress(p2);

      btn.disabled = false;
      document.getElementById('worksheet-text').value = '';
      updateCharCount();

      showToast('AI could not read the text clearly. Try typing it manually for best results.', 'warning');
      openStudySet(set.id);
      checkBadgeTrigger('set_created', {});
      return;
    }

    // Success — ensure all items have ids
    if (data.vocabulary) data.vocabulary.forEach(v => { if (!v.id) v.id = uid(); });
    if (data.grammarTopics) data.grammarTopics.forEach(g => { if (!g.id) g.id = uid(); });
    if (data.quizQuestions) data.quizQuestions.forEach(q => { if (!q.id) q.id = uid(); });

    const sets = getSets();
    sets.unshift(data);
    saveSets(sets);

    const p = getProgress();
    p.totalScans = (p.totalScans || 0) + 1;
    saveProgress(p);

    btn.disabled = false;
    document.getElementById('worksheet-text').value = '';
    updateCharCount();

    showToast('Study set created! ✨', 'success');
    openStudySet(data.id);
    checkBadgeTrigger('set_created', {});

  } catch (err) {
    hideLoading();
    btn.disabled = false;
    console.error('Generate error:', err);

    // Heuristic fallback on network error
    const set = heuristicParse(text);
    set.demo = true;
    const sets = getSets();
    sets.unshift(set);
    saveSets(sets);

    const p = getProgress();
    p.totalScans = (p.totalScans || 0) + 1;
    saveProgress(p);

    document.getElementById('worksheet-text').value = '';
    updateCharCount();
    showToast('Offline mode — backend not reachable. Demo set created.', 'warning');
    openStudySet(set.id);
  }
}

function heuristicParse(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const title = lines[0]?.substring(0, 60) || 'Study Set';
  const topic = lines[1]?.substring(0, 40) || 'German';

  // Extract vocab-like lines (German – English or German: English)
  const vocab = [];
  const sentences = [];
  const homework = [];

  lines.forEach(line => {
    const dashMatch = line.match(/^([A-ZÄÖÜa-zäöüß]+)\s+[–\-]\s+(.+)$/);
    const colonMatch = line.match(/^([A-ZÄÖÜa-zäöüß]+(?:\s+[A-ZÄÖÜa-zäöüß]+)?)\s*[:=]\s*(.+)$/);
    const numberedMatch = line.match(/^\d+[\.\)]\s+(.+)/);

    if (dashMatch && dashMatch[1].length > 1) {
      vocab.push({ id: uid(), german: dashMatch[1], english: dashMatch[2], article: '', wordType: 'noun', example: '', exampleTranslation: '' });
    } else if (colonMatch && colonMatch[1].length > 1 && !numberedMatch) {
      vocab.push({ id: uid(), german: colonMatch[1], english: colonMatch[2], article: '', wordType: 'other', example: '', exampleTranslation: '' });
    } else if (numberedMatch) {
      homework.push({ question: numberedMatch[1], hint: 'Think about the grammar structure.', answer: '(Answer not available in offline mode)', explanation: '' });
    } else if (line.length > 10 && line.includes(' ')) {
      sentences.push({ german: line, english: '' });
    }
  });

  return {
    id: uid(),
    title,
    topic,
    demo: true,
    createdAt: new Date().toISOString(),
    masteryLevel: 0,
    vocabulary: vocab.slice(0, 20),
    grammarTopics: [{
      id: uid(),
      title: 'Grammar Overview',
      rule: 'This study set was created in offline mode. Connect to a backend for AI-generated grammar analysis.',
      examples: [],
      tip: 'For richer grammar notes, make sure the backend is running.',
    }],
    exampleSentences: sentences.slice(0, 10),
    homework: homework.slice(0, 10),
    quizQuestions: vocab.slice(0, 8).map(v => ({
      id: uid(),
      question: `What is the German word for "${v.english}"?`,
      options: shuffle([v.german, 'lernen', 'spielen', 'machen']).slice(0, 4),
      correctAnswer: v.german,
      explanation: '',
    })),
    toMemorize: vocab.slice(0, 5).map(v => `${v.german} = ${v.english}`),
    toUnderstand: ['Review the full text of your worksheet for grammar rules.'],
  };
}

// ─── Saved Sets ───────────────────────────────────────────────────────────────

function initSavedSets() {
  const sets = getSets();
  const count = document.getElementById('saved-sets-count');
  if (count) count.textContent = `${sets.length} set${sets.length !== 1 ? 's' : ''} saved`;

  const grid = document.getElementById('all-sets-grid');
  if (sets.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <h3>No study sets yet</h3>
        <p>Scan a worksheet to create your first study set.</p>
        <button class="btn btn-primary" onclick="showView('create')">📷 Scan Worksheet</button>
      </div>`;
    return;
  }
  grid.innerHTML = sets.map(set => renderSetCard(set)).join('');
}

function renderSetCard(set) {
  const mastery = displayMastery(set);
  const isRusty = mastery < (set.masteryLevel || 0) - 15;
  const color = mastery >= 80 ? 'var(--success)' : mastery >= 50 ? 'var(--warning)' : 'var(--primary)';
  const lastStudied = set.lastStudied ? formatDate(set.lastStudied) : 'Not studied yet';
  const vocabCount = (set.vocabulary || []).length;

  return `
    <div class="set-card" onclick="openStudySet('${set.id}')">
      <button class="set-card-delete" onclick="deleteSet('${set.id}', event)" title="Delete">✕</button>
      <div class="set-card-header">
        <div class="set-card-icon">📄</div>
        <div>
          <div class="set-card-title">${esc(set.title)}</div>
          <div class="set-card-topic">${esc(set.topic || '')}</div>
        </div>
      </div>
      <div class="progress-label">
        <span>Mastery${isRusty ? ' <span class="rusty-badge">needs review</span>' : ''}</span>
        <span style="color:${color};font-weight:700">${mastery}%</span>
      </div>
      <div class="progress-bar-track" style="margin-bottom:10px">
        <div class="progress-bar-fill" style="width:${mastery}%;background:${color}"></div>
      </div>
      <div class="set-card-meta">
        <span>📖 ${vocabCount} word${vocabCount !== 1 ? 's' : ''}</span>
        <span>🕐 ${lastStudied}</span>
        ${set.bestQuizScore !== undefined ? `<span class="badge badge-success">${set.bestQuizScore}%</span>` : ''}
      </div>
      <div class="set-card-actions">
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();startFlashcards('${set.id}')">🃏 Flashcards</button>
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();startQuiz('${set.id}')">✅ Quiz</button>
      </div>
    </div>`;
}

function deleteSet(id, e) {
  e.stopPropagation();
  if (!confirm('Delete this study set? This cannot be undone.')) return;
  const sets = getSets().filter(s => s.id !== id);
  saveSets(sets);
  if (state.currentSet?.id === id) state.currentSet = null;
  showToast('Study set deleted.', 'success');

  // Re-render whichever view we're on
  if (state.currentView === 'dashboard') initDashboard();
  else if (state.currentView === 'saved-sets') initSavedSets();
}

// ─── Study Set View ───────────────────────────────────────────────────────────

function openStudySet(id) {
  const sets = getSets();
  const set = sets.find(s => s.id === id);
  if (!set) { showToast('Study set not found.', 'error'); return; }
  state.currentSet = set;

  // Update lastStudied
  set.lastStudied = new Date().toISOString();
  const updatedSets = sets.map(s => s.id === id ? set : s);
  saveSets(updatedSets);
  state.currentSet = set;

  renderStudySetView(set);
  showView('study-set');
  switchTab('overview');
}

function renderStudySetView(set) {
  document.getElementById('ss-title').textContent = set.title || 'Study Set';
  document.getElementById('ss-topic').textContent = set.topic || '';

  // Demo banner
  const demoBanner = document.getElementById('ss-demo-banner');
  demoBanner.style.display = set.demo ? 'block' : 'none';

  // Delete button
  const delBtn = document.getElementById('ss-delete-btn');
  delBtn.onclick = () => {
    if (!confirm('Delete this study set?')) return;
    const sets = getSets().filter(s => s.id !== set.id);
    saveSets(sets);
    state.currentSet = null;
    showToast('Study set deleted.', 'success');
    showView('saved-sets');
  };

  renderOverviewTab(set);
  renderVocabTab(set);
  renderGrammarTab(set);
  renderSentencesTab(set);
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(`tab-${tab}`);
  if (panel) panel.classList.add('active');
}

function renderOverviewTab(set) {
  const panel = document.getElementById('tab-overview');
  const memItems = set.toMemorize || [];
  const undItems = set.toUnderstand || [];
  const vocabCount = (set.vocabulary || []).length;
  const grammarCount = (set.grammarTopics || []).length;
  const sentenceCount = (set.exampleSentences || []).length;
  const mastery = set.masteryLevel || 0;
  const masteryColor = mastery >= 80 ? 'var(--success)' : mastery >= 50 ? 'var(--warning)' : 'var(--primary)';

  let html = `
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;gap:20px;flex-wrap:wrap">
        <div style="flex:1;min-width:120px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:var(--primary)">${vocabCount}</div>
          <div style="font-size:13px;color:var(--text-light)">Words</div>
        </div>
        <div style="flex:1;min-width:120px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:var(--success)">${grammarCount}</div>
          <div style="font-size:13px;color:var(--text-light)">Grammar Topics</div>
        </div>
        <div style="flex:1;min-width:120px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:var(--warning)">${sentenceCount}</div>
          <div style="font-size:13px;color:var(--text-light)">Sentences</div>
        </div>
      </div>
      <div style="margin-top:16px">
        <div class="progress-label">
          <span>Mastery</span>
          <span style="color:${masteryColor};font-weight:700">${mastery}%</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width:${mastery}%;background:${masteryColor}"></div>
        </div>
      </div>
    </div>`;

  if (memItems.length) {
    html += `
      <div class="info-card">
        <div class="info-card-title">🧠 What to Memorize</div>
        <ul class="bullet-list">${memItems.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      </div>`;
  }

  if (undItems.length) {
    html += `
      <div class="info-card success-card">
        <div class="info-card-title">💡 What to Understand</div>
        <ul class="bullet-list">${undItems.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      </div>`;
  }

  panel.innerHTML = html;
}

function renderVocabTab(set) {
  const panel = document.getElementById('tab-vocabulary');
  const vocab = set.vocabulary || [];

  if (vocab.length === 0) {
    panel.innerHTML = `<div class="empty-state" style="padding:40px 20px"><div class="empty-state-icon">📖</div><h3>No vocabulary</h3><p>No vocabulary was found in this study set.</p></div>`;
    return;
  }

  panel.innerHTML = `
    <p style="font-size:14px;color:var(--text-sec);margin-bottom:16px">${vocab.length} word${vocab.length !== 1 ? 's' : ''} to learn</p>
    <div class="vocab-grid">
      ${vocab.map(v => {
        const art = (v.article || '').toLowerCase();
        const artClass = art === 'der' ? 'badge-der' : art === 'die' ? 'badge-die' : art === 'das' ? 'badge-das' : 'badge-primary';
        return `
          <div class="vocab-card">
            <div class="vocab-card-top">
              <div class="vocab-german">${esc(v.german)}</div>
              ${v.article ? `<span class="badge ${artClass}">${esc(v.article)}</span>` : ''}
            </div>
            <div class="vocab-english">${esc(v.english)}</div>
            ${v.wordType ? `<span class="vocab-type">${esc(v.wordType)}</span>` : ''}
            ${v.example ? `
              <div class="vocab-example">
                <div class="vocab-example-de">🇩🇪 ${esc(v.example)}</div>
                ${v.exampleTranslation ? `<div class="vocab-example-en">🇬🇧 ${esc(v.exampleTranslation)}</div>` : ''}
              </div>` : ''}
          </div>`;
      }).join('')}
    </div>`;
}

function renderGrammarTab(set) {
  const panel = document.getElementById('tab-grammar');
  const grammar = set.grammarTopics || [];

  if (grammar.length === 0) {
    panel.innerHTML = `<div class="empty-state" style="padding:40px 20px"><div class="empty-state-icon">📐</div><h3>No grammar topics</h3><p>No grammar was detected in this study set.</p></div>`;
    return;
  }

  panel.innerHTML = grammar.map(g => `
    <div class="grammar-card">
      <div class="grammar-title">${esc(g.title)}</div>
      <div class="grammar-rule">${esc(g.rule)}</div>
      ${(g.examples || []).length ? `
        <div class="grammar-examples">
          ${g.examples.map(ex => `
            <div class="grammar-example">
              <div class="grammar-example-de">🇩🇪 ${esc(ex.german)}</div>
              <div class="grammar-example-en">🇬🇧 ${esc(ex.english)}</div>
            </div>`).join('')}
        </div>` : ''}
      ${g.tip ? `<div class="grammar-tip">${esc(g.tip)}</div>` : ''}
    </div>`).join('');
}

function renderSentencesTab(set) {
  const panel = document.getElementById('tab-sentences');
  const sentences = set.exampleSentences || [];

  if (sentences.length === 0) {
    panel.innerHTML = `<div class="empty-state" style="padding:40px 20px"><div class="empty-state-icon">💬</div><h3>No example sentences</h3><p>No sentences found in this study set.</p></div>`;
    return;
  }

  panel.innerHTML = sentences.map(s => `
    <div class="sentence-card">
      <div class="sentence-de">🇩🇪 ${esc(s.german)}</div>
      ${s.english ? `<div class="sentence-en">🇬🇧 ${esc(s.english)}</div>` : ''}
    </div>`).join('');
}

function backToStudySet() {
  if (state.currentSet) openStudySet(state.currentSet.id);
  else showView('saved-sets');
}

// ─── Flashcards ───────────────────────────────────────────────────────────────

function startFlashcards(setId) {
  const sets = getSets();
  const set = sets.find(s => s.id === setId) || state.currentSet;
  if (!set) { showToast('Study set not found.', 'error'); return; }
  if (!set.vocabulary?.length) { showToast('No vocabulary in this set.', 'error'); return; }

  state.currentSet = set;
  state.fc = {
    cards: shuffle([...set.vocabulary]),
    index: 0,
    known: [],
    needsWork: [],
    flipped: false,
    setId: set.id,
  };

  document.getElementById('fc-set-name').textContent = set.title;
  document.getElementById('fc-active').style.display = '';
  document.getElementById('fc-results').style.display = 'none';

  renderFlashcard();
  showView('flashcards');
  updateStreak();
  checkBadgeTrigger('mode_used', { mode: 'flashcards' });
}

function renderFlashcard() {
  const { cards, index } = state.fc;
  const card = cards[index];

  document.getElementById('fc-counter').textContent = `${index + 1} / ${cards.length}`;
  document.getElementById('fc-progress-bar').style.width = `${(index / cards.length) * 100}%`;

  document.getElementById('fc-article').textContent = card.article || '';
  document.getElementById('fc-word-front').textContent = card.german;
  document.getElementById('fc-word-back').textContent = card.english;

  const exEl = document.getElementById('fc-example');
  if (card.example) {
    exEl.innerHTML = `<div class="vocab-example-de">${esc(card.example)}</div>${card.exampleTranslation ? `<div class="vocab-example-en">${esc(card.exampleTranslation)}</div>` : ''}`;
  } else {
    exEl.textContent = '';
  }

  state.fc.flipped = false;
  document.getElementById('flashcard').classList.remove('flipped');
}

function flipCard() {
  state.fc.flipped = !state.fc.flipped;
  document.getElementById('flashcard').classList.toggle('flipped', state.fc.flipped);
  if (state.fc.flipped) {
    const card = state.fc.cards[state.fc.index];
    if (card) speakGerman(card.german);
  }
}

function markCard(knewIt) {
  const { cards, index } = state.fc;
  const card = cards[index];
  if (knewIt) {
    state.fc.known.push(card.id || card.german);
    markWordMastered(state.fc.setId, card.german);
    incrementTodayWords();
    addXP(5);
    checkBadgeTrigger('word_mastered', { count: getMasteredWords().length });
  } else {
    state.fc.needsWork.push(card.id || card.german);
    recordMistake({
      question: `What does "${card.german}" mean?`,
      myAnswer: "(couldn't remember)",
      correct: `${card.article ? card.article + ' ' : ''}${card.german} = ${card.english}`,
      explanation: card.example ? `Example: ${card.example}` : '',
      topic: state.currentSet?.title || '',
      setId: state.fc.setId || '',
      setTitle: state.currentSet?.title || '',
      mode: 'flashcard',
    });
  }

  if (index + 1 >= cards.length) {
    showFlashcardResults();
  } else {
    state.fc.index++;
    renderFlashcard();
  }
}

function showFlashcardResults() {
  const { known, needsWork, cards, setId } = state.fc;
  const score = Math.round((known.length / cards.length) * 100);
  const { emoji, label } = getScoreInfo(score);

  document.getElementById('fc-active').style.display = 'none';
  document.getElementById('fc-results').style.display = '';
  document.getElementById('fc-result-emoji').textContent = emoji;
  document.getElementById('fc-result-score').textContent = `${score}%`;
  document.getElementById('fc-result-label').textContent = label;
  document.getElementById('fc-result-sub').textContent = `${known.length} knew it · ${needsWork.length} need more practice`;

  // Update mastery
  const sets = getSets();
  const set = sets.find(s => s.id === setId);
  if (set) {
    set.masteryLevel = Math.max(set.masteryLevel || 0, score);
    saveSets(sets.map(s => s.id === setId ? set : s));
    state.currentSet = set;
  }

  addHistoryEntry({ date: new Date().toISOString(), setId, setTitle: state.currentSet?.title || '', mode: 'flashcards', score, wordsStudied: cards.length });
  if (score === 100) {
    triggerConfetti();
    checkBadgeTrigger('fc_complete', { wrong: 0 });
  }
}

function restartFlashcards() {
  if (state.fc.setId) startFlashcards(state.fc.setId);
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

function startQuiz(setId) {
  const sets = getSets();
  const set = sets.find(s => s.id === setId) || state.currentSet;
  if (!set) { showToast('Study set not found.', 'error'); return; }

  // Build quiz questions from quizQuestions or generate from vocabulary
  let questions = [];
  if (set.quizQuestions?.length) {
    questions = shuffle([...set.quizQuestions]);
  } else if (set.vocabulary?.length >= 2) {
    questions = buildVocabQuiz(set.vocabulary);
  }

  if (questions.length === 0) {
    showToast('Not enough content for a quiz.', 'error');
    return;
  }

  state.currentSet = set;
  state.quiz = {
    questions: questions.slice(0, 10),
    index: 0,
    score: 0,
    answered: false,
    mistakes: [],
    setId: set.id,
  };

  document.getElementById('quiz-set-name').textContent = set.title;
  document.getElementById('quiz-active').style.display = '';
  document.getElementById('quiz-results').style.display = 'none';
  document.getElementById('quiz-feedback').style.display = 'none';
  document.getElementById('quiz-next-btn').style.display = 'none';

  renderQuizQuestion();
  showView('quiz');
  updateStreak();
  checkBadgeTrigger('mode_used', { mode: 'quiz' });
}

function buildVocabQuiz(vocab) {
  const vocabList = [...vocab];
  return vocabList.slice(0, 10).map(v => {
    const others = vocabList.filter(w => w.german !== v.german).map(w => w.english);
    const distractors = shuffle(others).slice(0, 3);
    const options = shuffle([v.english, ...distractors]);
    return {
      id: uid(),
      question: `What does "${v.german}" mean?`,
      options,
      correctAnswer: v.english,
      explanation: v.example ? `Example: ${v.example}` : '',
    };
  });
}

function renderQuizQuestion() {
  const { questions, index, score } = state.quiz;
  const q = questions[index];

  document.getElementById('quiz-counter').textContent = `${index + 1} / ${questions.length}`;
  document.getElementById('quiz-score-badge').textContent = `Score: ${score}`;
  document.getElementById('quiz-progress-bar').style.width = `${(index / questions.length) * 100}%`;
  document.getElementById('quiz-q-text').textContent = q.question;
  document.getElementById('quiz-feedback').style.display = 'none';
  document.getElementById('quiz-next-btn').style.display = 'none';
  state.quiz.answered = false;

  const optionsEl = document.getElementById('quiz-options');
  if (q.options?.length) {
    // Store answer data on the container to avoid inline JSON in onclick attributes
    optionsEl.dataset.correct = q.correctAnswer;
    optionsEl.dataset.explanation = q.explanation || '';
    optionsEl.innerHTML = q.options.map(opt =>
      `<button class="quiz-option" data-opt="${esc(opt)}" onclick="selectOption(this)">${esc(opt)}</button>`
    ).join('');
  } else {
    optionsEl.innerHTML = `<div class="info-card"><p style="color:var(--text-light);font-size:13px">Answer:</p><p style="font-size:16px;font-weight:700;color:var(--primary)">${esc(q.correctAnswer)}</p></div>`;
    setTimeout(() => quizNext(), 2000);
  }
}

function selectOption(el) {
  if (state.quiz.answered) return;
  state.quiz.answered = true;

  const optionsEl = document.getElementById('quiz-options');
  const selected = el.dataset.opt;
  const correct = optionsEl.dataset.correct;
  const explanation = optionsEl.dataset.explanation || '';

  const quizMatch = isAnswerAccepted(selected, correct);
  const isCorrect = !!quizMatch;

  document.querySelectorAll('.quiz-option').forEach(b => {
    b.disabled = true;
    if (normalizeAnswer(b.dataset.opt || b.textContent.trim()) === normalizeAnswer(correct)) b.classList.add('correct');
  });

  if (!isCorrect) {
    el.classList.add('incorrect');
    const questionText = document.getElementById('quiz-q-text').textContent;
    state.quiz.mistakes.push({ question: questionText, correct });
    // Persist to mistake bank for spaced repetition review
    recordMistake({
      question: questionText,
      myAnswer: selected,
      correct,
      explanation,
      topic: state.currentSet?.topic || state.currentSet?.title || '',
      setId: state.quiz.setId || '',
      setTitle: state.currentSet?.title || '',
      mode: 'quiz',
    });
  } else {
    state.quiz.score++;
    addXP(10);
  }

  const fb = document.getElementById('quiz-feedback');
  fb.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
  fb.style.display = '';
  document.getElementById('quiz-feedback-title').textContent = isCorrect && quizMatch === 'close' ? '✅ Close enough!' : isCorrect ? '✅ Correct!' : `❌ The answer is: ${correct}`;
  document.getElementById('quiz-feedback-exp').textContent = explanation || '';

  const nextBtn = document.getElementById('quiz-next-btn');
  nextBtn.textContent = state.quiz.index + 1 >= state.quiz.questions.length ? 'See Results 🎉' : 'Next Question →';
  nextBtn.style.display = '';
}

function quizNext() {
  const { questions, index } = state.quiz;
  if (index + 1 >= questions.length) {
    showQuizResults();
  } else {
    state.quiz.index++;
    renderQuizQuestion();
  }
}

function showQuizResults() {
  const { score, questions, mistakes, setId } = state.quiz;
  const finalScore = Math.round((score / questions.length) * 100);
  const { emoji, label } = getScoreInfo(finalScore);

  document.getElementById('quiz-active').style.display = 'none';
  document.getElementById('quiz-results').style.display = '';
  document.getElementById('quiz-result-emoji').textContent = emoji;
  document.getElementById('quiz-result-score').textContent = `${finalScore}%`;
  document.getElementById('quiz-result-label').textContent = label;
  document.getElementById('quiz-result-sub').textContent = `${score} / ${questions.length} correct`;

  const mistakesEl = document.getElementById('quiz-mistakes-section');
  if (mistakes.length > 0) {
    mistakesEl.innerHTML = `<p style="font-weight:700;margin-bottom:12px">🔁 Review These:</p>` +
      mistakes.map(m => `
        <div style="background:var(--error-light);border-radius:var(--radius);padding:12px 14px;margin-bottom:8px;border-left:3px solid var(--error)">
          <p style="font-size:14px;font-weight:600;margin-bottom:4px">${esc(m.question)}</p>
          <p style="font-size:13px;color:var(--text-sec)">Correct: <strong style="color:var(--success)">${esc(m.correct)}</strong></p>
        </div>`).join('');
  } else {
    mistakesEl.innerHTML = '';
  }

  // Update sets mastery
  const sets = getSets();
  const set = sets.find(s => s.id === setId);
  if (set) {
    set.masteryLevel = Math.max(set.masteryLevel || 0, finalScore);
    set.bestQuizScore = Math.max(set.bestQuizScore || 0, finalScore);
    saveSets(sets.map(s => s.id === setId ? set : s));
    state.currentSet = set;
  }

  // Progress
  const p = getProgress();
  p.totalQuizzes = (p.totalQuizzes || 0) + 1;
  p.correctAnswers = (p.correctAnswers || 0) + score;
  p.totalQuestions = (p.totalQuestions || 0) + questions.length;
  addHistoryEntry({ date: new Date().toISOString(), setId, setTitle: state.currentSet?.title || '', mode: 'quiz', score: finalScore, wordsStudied: questions.length });
  saveProgress(p);
  checkBadgeTrigger('quiz_complete', { score: finalScore });
  if (finalScore === 100) triggerConfetti();
}

function restartQuiz() {
  if (state.quiz.setId) startQuiz(state.quiz.setId);
}

// ─── Homework Helper ──────────────────────────────────────────────────────────

function startHomework(setId) {
  const sets = getSets();
  const set = sets.find(s => s.id === setId) || state.currentSet;
  if (!set) { showToast('Study set not found.', 'error'); return; }
  state.currentSet = set;
  document.getElementById('hw-set-name').textContent = set.title;

  if (!set.homework?.length) {
    document.getElementById('hw-questions').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>No homework questions</h3>
        <p>This study set has no homework questions. They appear when numbered questions (1. 2. 3.) are found in your worksheet.</p>
        <button class="btn btn-primary" onclick="backToStudySet()">← Back to Study Set</button>
      </div>`;
    showView('homework');
    return;
  }

  document.getElementById('hw-questions').innerHTML = set.homework.map((q, i) => `
    <div class="hw-card" id="hw-${i}">
      <div class="hw-q-num">Question ${i + 1}</div>
      <div class="hw-question">${esc(q.question)}</div>
      <div class="hw-hint" id="hw-hint-${i}">
        💡 <strong>Hint:</strong> ${esc(q.hint || 'Think about the grammar.')}
      </div>
      <div class="hw-answer" id="hw-answer-${i}">
        <div class="hw-answer-text">✅ ${esc(q.answer)}</div>
        <div class="hw-answer-exp">${esc(q.explanation || '')}</div>
      </div>
      <div class="hw-actions">
        <button class="btn btn-outline btn-sm" onclick="revealHint(${i})">💡 Show Hint</button>
        <button class="btn btn-success btn-sm" onclick="revealAnswer(${i})">👁 Show Answer</button>
      </div>
    </div>`).join('');

  showView('homework');
  updateStreak();
  addHistoryEntry({ date: new Date().toISOString(), setId: set.id, setTitle: set.title, mode: 'homework', score: null, wordsStudied: set.homework.length });
  checkBadgeTrigger('mode_used', { mode: 'homework' });
}

function revealHint(i) {
  document.getElementById(`hw-hint-${i}`)?.classList.add('visible');
}

function revealAnswer(i) {
  document.getElementById(`hw-answer-${i}`)?.classList.add('visible');
  document.getElementById(`hw-hint-${i}`)?.classList.add('visible');
}

// ─── Vocabulary Bank ──────────────────────────────────────────────────────────

function initVocabBank() {
  state.vocabFilter = 'all';
  state.vocabQuery = '';
  const searchEl = document.getElementById('vocab-search');
  if (searchEl) searchEl.value = '';
  renderVocabBank();
}

function renderVocabBank() {
  const sets = getSets();
  const allVocab = [];

  sets.forEach(set => {
    (set.vocabulary || []).forEach(v => {
      allVocab.push({ ...v, setTitle: set.title, setId: set.id });
    });
  });

  if (allVocab.length === 0) {
    document.getElementById('vocab-bank-list').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📖</div>
        <h3>No vocabulary yet</h3>
        <p>Create a study set to populate the vocabulary bank.</p>
        <button class="btn btn-primary" onclick="showView('create')">📷 Scan Worksheet</button>
      </div>`;
    document.getElementById('vocab-bank-count').textContent = '';
    return;
  }

  let filtered = allVocab;

  // Apply filter
  const f = state.vocabFilter;
  if (f !== 'all') {
    filtered = filtered.filter(v => {
      const art = (v.article || '').toLowerCase();
      const type = (v.wordType || '').toLowerCase();
      if (f === 'der') return art === 'der';
      if (f === 'die') return art === 'die';
      if (f === 'das') return art === 'das';
      if (f === 'verb') return type === 'verb' || type.includes('verb');
      if (f === 'other') return !['der','die','das'].includes(art) && !type.includes('verb');
      return true;
    });
  }

  // Apply search
  if (state.vocabQuery) {
    const q = state.vocabQuery.toLowerCase();
    filtered = filtered.filter(v =>
      v.german.toLowerCase().includes(q) ||
      v.english.toLowerCase().includes(q)
    );
  }

  document.getElementById('vocab-bank-count').textContent = `Showing ${filtered.length} of ${allVocab.length} words`;

  if (filtered.length === 0) {
    document.getElementById('vocab-bank-list').innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--text-light)">
        <div style="font-size:40px;margin-bottom:12px">🔍</div>
        <p>No words match your search.</p>
      </div>`;
    return;
  }

  document.getElementById('vocab-bank-list').innerHTML = filtered.map(v => {
    const art = (v.article || '').toLowerCase();
    const type = (v.wordType || '').toLowerCase();
    let artClass, artLabel;
    if (art === 'der') { artClass = 'vbc-article-der'; artLabel = 'der'; }
    else if (art === 'die') { artClass = 'vbc-article-die'; artLabel = 'die'; }
    else if (art === 'das') { artClass = 'vbc-article-das'; artLabel = 'das'; }
    else if (type.includes('verb')) { artClass = 'vbc-article-verb'; artLabel = 'verb'; }
    else { artClass = 'vbc-article-other'; artLabel = art || type.substring(0,3) || '—'; }

    return `
      <div class="vocab-bank-card">
        <div class="vbc-article ${artClass}">${esc(artLabel)}</div>
        <div class="vbc-info">
          <div class="vbc-german">${esc(v.german)}</div>
          <div class="vbc-english">${esc(v.english)}</div>
          <div class="vbc-set">from: ${esc(v.setTitle)}</div>
        </div>
        <button class="speak-btn" data-word="${esc(v.german)}" onclick="speakGerman(this.dataset.word)" title="Listen">🔊</button>
      </div>`;
  }).join('');
}

function filterVocab(filter, el) {
  state.vocabFilter = filter;
  document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  renderVocabBank();
}

function searchVocab(query) {
  state.vocabQuery = query;
  renderVocabBank();
}

// ─── Verb Trainer ─────────────────────────────────────────────────────────────

function getVerbList() {
  const fromSets = [];
  getSets().forEach(set => {
    (set.vocabulary || []).forEach(v => {
      const type = (v.wordType || '').toLowerCase();
      if ((type === 'verb' || type === 'modal') &&
          !COMMON_VERBS.some(cv => cv.infinitive.toLowerCase() === v.german.toLowerCase()) &&
          !fromSets.some(fv => fv.infinitive.toLowerCase() === v.german.toLowerCase())) {
        fromSets.push({
          infinitive: v.german,
          english: v.english,
          conjugations: null,
          regular: null,
          example: v.example || '',
          fromSet: set.title,
        });
      }
    });
  });
  return [...COMMON_VERBS, ...fromSets];
}

function initVerbTrainer() {
  state.verbIndex = 0;
  state.verbMode = 'browse';
  state.verbAnswers = {};
  state.verbRevealed = false;
  document.getElementById('verb-mode-browse').classList.add('active');
  document.getElementById('verb-mode-practice').classList.remove('active');
  renderVerb();
}

function setVerbMode(mode) {
  state.verbMode = mode;
  state.verbAnswers = {};
  state.verbRevealed = false;
  document.getElementById('verb-mode-browse').classList.toggle('active', mode === 'browse');
  document.getElementById('verb-mode-practice').classList.toggle('active', mode === 'practice');
  renderVerb();
}

function renderVerb() {
  const verbs = getVerbList();
  const verb = verbs[state.verbIndex];
  document.getElementById('verb-nav-counter').textContent = `${state.verbIndex + 1} / ${verbs.length}`;
  document.getElementById('verb-prev-btn').disabled = state.verbIndex === 0;
  document.getElementById('verb-next-btn').disabled = state.verbIndex === verbs.length - 1;

  const cardArea = document.getElementById('verb-card-area');

  // Verbs without conjugation tables (imported from study sets)
  if (!verb.conjugations) {
    const fromLabel = verb.fromSet ? `<div style="font-size:12px;color:var(--text-light);margin-top:4px">from: ${esc(verb.fromSet)}</div>` : '';
    cardArea.innerHTML = `
      <div class="verb-card">
        <div class="verb-infinitive">${esc(verb.infinitive)}</div>
        <div class="verb-english">${esc(verb.english)}</div>
        ${fromLabel}
        <div style="margin-top:16px;padding:16px;background:var(--bg);border-radius:var(--radius);color:var(--text-light);font-size:13px;text-align:center">
          Conjugation table not available — study set verbs don't include full conjugations.
        </div>
        ${verb.example ? `<div class="verb-example">💬 ${esc(verb.example)}</div>` : ''}
      </div>`;
    return;
  }

  const typeClass = verb.regular ? 'verb-type-regular' : 'verb-type-irregular';
  const typeLabel = verb.regular ? '✅ Regular' : '⚡ Irregular';

  if (state.verbMode === 'browse') {
    cardArea.innerHTML = `
      <div class="verb-card">
        <div class="verb-infinitive">${esc(verb.infinitive)}</div>
        <div class="verb-english">${esc(verb.english)}</div>
        <span class="verb-type-badge ${typeClass}">${typeLabel}</span>
        <table class="conjugation-table">
          <thead><tr><th>Pronoun</th><th>Form</th></tr></thead>
          <tbody>
            ${PRONOUNS.map(p => `
              <tr>
                <td class="conj-pronoun">${esc(p)}</td>
                <td class="conj-form">${esc(verb.conjugations[p])}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div class="verb-example">💬 ${esc(verb.example)}</div>
      </div>`;
  } else {
    // Practice mode
    cardArea.innerHTML = `
      <div class="verb-card">
        <div class="verb-infinitive">${esc(verb.infinitive)}</div>
        <div class="verb-english">${esc(verb.english)}</div>
        <span class="verb-type-badge ${typeClass}">${typeLabel}</span>
        <div style="margin-top:16px">
          ${PRONOUNS.map(p => {
            const val = state.verbAnswers[p] || '';
            const correct = verb.conjugations[p];
            let inputClass = '';
            let hint = '';
            if (state.verbRevealed) {
              const userVal = (state.verbAnswers[p] || '').trim().toLowerCase();
              const correctVal = correct.toLowerCase();
              if (userVal === correctVal) {
                inputClass = 'correct';
              } else {
                inputClass = 'incorrect';
                hint = `<div class="vpc-correct-label">✓ ${esc(correct)}</div>`;
              }
            }
            return `
              <div class="verb-practice-row">
                <div class="vpc-pronoun">${esc(p)}</div>
                <div style="flex:1">
                  <input class="vpc-input ${inputClass}" id="vpc-${p}" type="text"
                    value="${esc(val)}" placeholder="conjugation…"
                    oninput="state.verbAnswers['${p}'] = this.value"
                    ${state.verbRevealed ? 'readonly' : ''}>
                  ${hint}
                </div>
              </div>`;
          }).join('')}
        </div>
        ${!state.verbRevealed
          ? `<button class="btn btn-primary verb-check-btn" onclick="checkVerbAnswers()">✅ Check Answers</button>`
          : `<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
               <button class="btn btn-outline" onclick="resetVerbPractice()">🔁 Try Again</button>
               <button class="btn btn-primary" onclick="nextVerb()">Next Verb →</button>
             </div>`
        }
      </div>`;
  }
}

function checkVerbAnswers() {
  state.verbRevealed = true;
  renderVerb();
  const verb = getVerbList()[state.verbIndex];
  if (!verb.conjugations) return;
  let correct = 0;
  PRONOUNS.forEach(p => {
    if ((state.verbAnswers[p] || '').trim().toLowerCase() === verb.conjugations[p].toLowerCase()) correct++;
  });
  showToast(`${correct} / ${PRONOUNS.length} correct!`, correct === PRONOUNS.length ? 'success' : 'warning');
}

function resetVerbPractice() {
  state.verbAnswers = {};
  state.verbRevealed = false;
  renderVerb();
}

function nextVerb() {
  if (state.verbIndex < getVerbList().length - 1) {
    state.verbIndex++;
    state.verbAnswers = {};
    state.verbRevealed = false;
    renderVerb();
  }
}

function prevVerb() {
  if (state.verbIndex > 0) {
    state.verbIndex--;
    state.verbAnswers = {};
    state.verbRevealed = false;
    renderVerb();
  }
}

// ─── Grammar Hub ──────────────────────────────────────────────────────────────

function initGrammarHub() {
  const sets = getSets();
  const allGrammar = [];

  sets.forEach(set => {
    (set.grammarTopics || []).forEach(g => {
      allGrammar.push({ ...g, setTitle: set.title });
    });
  });

  const container = document.getElementById('grammar-hub-list');

  if (allGrammar.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📐</div>
        <h3>No grammar yet</h3>
        <p>Create a study set and its grammar rules will appear here.</p>
        <button class="btn btn-primary" onclick="showView('create')">📷 Scan Worksheet</button>
      </div>`;
    return;
  }

  container.innerHTML = allGrammar.map((g, i) => `
    <div class="grammar-accordion-item" id="gacc-${i}">
      <div class="grammar-accordion-header" onclick="toggleGrammar(${i})">
        <div>
          <div class="grammar-accordion-title">${esc(g.title)}</div>
          <div class="grammar-accordion-source">from: ${esc(g.setTitle)}</div>
        </div>
        <span class="grammar-accordion-chevron">▼</span>
      </div>
      <div class="grammar-accordion-body">
        <p class="grammar-accordion-rule">${esc(g.rule)}</p>
        ${(g.examples || []).length ? `
          <div class="grammar-accordion-examples">
            ${g.examples.map(ex => `
              <div class="grammar-example">
                <div class="grammar-example-de">🇩🇪 ${esc(ex.german)}</div>
                <div class="grammar-example-en">🇬🇧 ${esc(ex.english)}</div>
              </div>`).join('')}
          </div>` : ''}
        ${g.tip ? `<div class="grammar-accordion-tip">${esc(g.tip)}</div>` : ''}
      </div>
    </div>`).join('');
}

function toggleGrammar(i) {
  const item = document.getElementById(`gacc-${i}`);
  if (item) item.classList.toggle('open');
}

// ─── History ──────────────────────────────────────────────────────────────────

function initHistory() {
  const p = getProgress();
  const history = p.history || [];
  const container = document.getElementById('history-list');

  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <h3>No history yet</h3>
        <p>Complete a flashcard session, quiz, or homework to see your history.</p>
        <button class="btn btn-primary" onclick="showView('saved-sets')">📚 Study Now</button>
      </div>`;
    return;
  }

  const modeIcons = { flashcards: '🃏', quiz: '✅', homework: '📝' };
  const modeClasses = { flashcards: 'history-mode-flashcards', quiz: 'history-mode-quiz', homework: 'history-mode-homework' };

  container.innerHTML = `<div class="history-list">${history.map(entry => {
    const icon = modeIcons[entry.mode] || '📚';
    const iconClass = modeClasses[entry.mode] || 'history-mode-flashcards';
    const scoreText = entry.score != null ? `${entry.score}%` : '—';
    const dateStr = formatDate(entry.date);
    return `
      <div class="history-card">
        <div class="history-mode-icon ${iconClass}">${icon}</div>
        <div class="history-info">
          <div class="history-title">${esc(entry.setTitle || 'Study Session')}</div>
          <div class="history-meta">${esc(entry.mode)} · ${esc(String(entry.wordsStudied || 0))} items · ${esc(dateStr)}</div>
        </div>
        <div class="history-score" style="color:${getScoreColor(entry.score)}">${scoreText}</div>
      </div>`;
  }).join('')}</div>`;
}

function getScoreColor(score) {
  if (score == null) return 'var(--text-light)';
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--warning)';
  return 'var(--error)';
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function initSettings() {
  const s = getSettings();
  document.getElementById('settings-name').value = s.name || '';
  document.getElementById('settings-level').value = s.level || 'A2';
  document.getElementById('settings-api-url').value = s.apiUrl || window.location.origin;
  document.getElementById('settings-goal').value = s.dailyGoal || 15;
  const audioEl = document.getElementById('settings-audio');
  if (audioEl) audioEl.checked = s.audioEnabled !== false;
  document.getElementById('api-connection-status').textContent = '';
}

function saveSettingsForm() {
  const audioEl = document.getElementById('settings-audio');
  const s = {
    name: document.getElementById('settings-name').value.trim() || 'Student',
    level: document.getElementById('settings-level').value,
    apiUrl: (document.getElementById('settings-api-url').value.trim() || window.location.origin).replace(/\/$/, ''),
    dailyGoal: parseInt(document.getElementById('settings-goal').value) || 15,
    audioEnabled: audioEl ? audioEl.checked : true,
  };
  saveSettings(s);
  showToast('Settings saved! ✅', 'success');
}

async function checkApiConnection() {
  const apiUrl = (document.getElementById('settings-api-url').value.trim() || window.location.origin).replace(/\/$/, '');
  const statusEl = document.getElementById('api-connection-status');
  statusEl.textContent = 'Testing…';
  statusEl.style.color = 'var(--text-light)';

  try {
    const res = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      statusEl.textContent = '✅ Connected';
      statusEl.style.color = 'var(--success)';
    } else {
      statusEl.textContent = `⚠️ Server responded with ${res.status}`;
      statusEl.style.color = 'var(--warning)';
    }
  } catch {
    statusEl.textContent = '❌ Not reachable';
    statusEl.style.color = 'var(--error)';
  }
}

function resetAllData() {
  if (!confirm('Are you sure? This will delete ALL your study sets, progress, and history. This cannot be undone.')) return;
  localStorage.removeItem('ds_sets');
  localStorage.removeItem('ds_progress');
  localStorage.removeItem('ds_settings');
  localStorage.removeItem('ds_mistakes');
  localStorage.removeItem('ds_masteredWords');
  localStorage.removeItem('ds_wordsToday');
  localStorage.removeItem('ds_xp');
  localStorage.removeItem('ds_badges');
  localStorage.removeItem('ds_welcomed');
  localStorage.removeItem('ds_modes_used');
  localStorage.removeItem('ds_art_correct');
  state.currentSet = null;
  showToast('All data reset.', 'success');
  showView('dashboard');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  setTimeout(() => el.classList.remove('show'), 3200);
}

function showLoading(msg) {
  document.getElementById('loading-msg').textContent = msg || 'Loading…';
  document.getElementById('loading-overlay').classList.add('active');
}

function setLoadingMsg(msg) {
  document.getElementById('loading-msg').textContent = msg;
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.remove('active');
}

function formatDate(iso) {
  if (!iso) return 'Never';
  try {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return new Date(iso).toLocaleDateString();
  } catch { return 'Unknown'; }
}

function getScoreInfo(score) {
  if (score >= 90) return { emoji: '🏆', label: 'Excellent!' };
  if (score >= 75) return { emoji: '⭐', label: 'Great job!' };
  if (score >= 60) return { emoji: '👍', label: 'Good work!' };
  if (score >= 40) return { emoji: '💪', label: 'Keep going!' };
  return { emoji: '📚', label: 'Keep practicing!' };
}

function normalizeAnswer(s) {
  return String(s)
    .toLowerCase().trim()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[.,!?;:'"()]/g, '').replace(/\s+/g, ' ');
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(0).map((__, j) => j === 0 ? i : 0));
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

function isAnswerAccepted(userAns, correct) {
  const u = normalizeAnswer(userAns);
  const c = normalizeAnswer(correct);
  if (!u) return false;
  if (u === c) return 'exact';
  if (u.length >= 3 && levenshtein(u, c) <= 1) return 'close';
  return false;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function esc(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Article Trainer (der / die / das) ────────────────────────────────────────

function initArticleTrainer() {
  const sets = getSets();
  const allNouns = [];

  sets.forEach(set => {
    (set.vocabulary || []).forEach(v => {
      const art = (v.article || '').toLowerCase().trim();
      if (['der', 'die', 'das'].includes(art)) {
        allNouns.push({ ...v, setTitle: set.title, setId: set.id });
      }
    });
  });

  const body = document.getElementById('article-trainer-body');

  if (allNouns.length === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>No nouns yet</h3>
        <p>Generate study sets with German nouns — articles will appear here for practice.</p>
        <button class="btn btn-primary" onclick="showView('create')">Add Worksheet</button>
      </div>`;
    return;
  }

  state.article = { nouns: shuffle(allNouns), index: 0, score: 0, total: 0, answered: false };
  renderArticleCard();
  checkBadgeTrigger('mode_used', { mode: 'article-trainer' });
}

function renderArticleCard() {
  const { nouns, index, score } = state.article;
  const body = document.getElementById('article-trainer-body');

  if (index >= nouns.length) {
    const pct = Math.round((score / nouns.length) * 100);
    const info = getScoreInfo(pct);
    body.innerHTML = `
      <div class="results-screen" style="display:block">
        <div class="results-emoji">${info.emoji}</div>
        <div class="results-score">${pct}%</div>
        <div class="results-label">${info.label}</div>
        <div class="results-sub">${score} / ${nouns.length} correct</div>
        <div class="results-actions">
          <button class="btn btn-primary" onclick="initArticleTrainer()">Practice Again</button>
          <button class="btn btn-outline" onclick="showView('dashboard')">Home</button>
        </div>
      </div>`;
    updateStreak();
    addHistoryEntry({ date: new Date().toISOString(), setId: '', setTitle: 'Article Trainer', mode: 'quiz', score: pct, wordsStudied: nouns.length });
    return;
  }

  const noun = nouns[index];
  body.innerHTML = `
    <div class="article-progress">
      <span style="color:var(--text-sec);font-size:14px">${index + 1} / ${nouns.length}</span>
      <span style="color:var(--success);font-weight:700">✅ ${score}</span>
    </div>
    <div class="progress-bar-track" style="margin-bottom:20px">
      <div class="progress-bar-fill" style="width:${(index / nouns.length) * 100}%"></div>
    </div>
    <div class="article-card">
      <div class="article-label">What is the article for:</div>
      <div class="article-word">${esc(noun.german)}</div>
      ${noun.english ? `<div class="article-hint-en">${esc(noun.english)}</div>` : ''}
      <div class="article-source">from: ${esc(noun.setTitle || '')}</div>
    </div>
    <div id="art-feedback" class="article-feedback" style="display:none"></div>
    <div class="article-buttons" id="art-buttons">
      <button class="btn article-btn art-der" onclick="checkArticle('der')">der</button>
      <button class="btn article-btn art-die" onclick="checkArticle('die')">die</button>
      <button class="btn article-btn art-das" onclick="checkArticle('das')">das</button>
    </div>
    <button class="btn btn-primary" id="art-next-btn" onclick="nextArticle()" style="display:none;margin-top:16px;width:100%">Next Word →</button>`;
}

function checkArticle(chosen) {
  if (state.article.answered) return;
  state.article.answered = true;
  state.article.total++;

  const noun = state.article.nouns[state.article.index];
  const correct = (noun.article || '').toLowerCase().trim();
  const isRight = chosen === correct;

  if (isRight) {
    state.article.score++;
    addXP(5);
    checkBadgeTrigger('article_correct', {});
  } else {
    recordMistake({
      question: `What is the article for "${noun.german}"?`,
      myAnswer: chosen,
      correct: `${correct} — ${correct} ${noun.german}`,
      explanation: noun.example ? `Example: ${noun.example}` : `The correct article is "${correct}".`,
      topic: noun.setTitle || 'Articles',
      setId: noun.setId || '',
      setTitle: noun.setTitle || '',
      mode: 'article',
    });
  }

  document.querySelectorAll('.article-btn').forEach(b => {
    b.disabled = true;
    const btnArticle = b.getAttribute('onclick')?.match(/'(\w+)'/)?.[1];
    if (btnArticle === correct) b.classList.add('art-correct');
    else if (btnArticle === chosen && !isRight) b.classList.add('art-incorrect');
  });

  const fb = document.getElementById('art-feedback');
  fb.style.display = 'block';
  fb.className = `article-feedback ${isRight ? 'correct' : 'incorrect'}`;
  fb.innerHTML = isRight
    ? `✅ Correct! <strong>${correct} ${esc(noun.german)}</strong>`
    : `❌ It's <strong>${correct} ${esc(noun.german)}</strong>${noun.example ? `<br><small style="opacity:0.8">${esc(noun.example)}</small>` : ''}`;

  document.getElementById('art-next-btn').style.display = 'block';
}

function nextArticle() {
  state.article.index++;
  state.article.answered = false;
  renderArticleCard();
}

// ─── Fill-in-the-Blank ────────────────────────────────────────────────────────

function startFillInBlank(setId) {
  const sets = getSets();
  const set = sets.find(s => s.id === setId) || state.currentSet;
  if (!set) { showToast('Study set not found.', 'error'); return; }

  const items = set.fillInTheBlank || [];
  if (items.length === 0) {
    showToast('No fill-in-the-blank questions in this set.', 'warning');
    return;
  }

  state.currentSet = set;
  state.fib = { items: shuffle([...items]), index: 0, score: 0, answered: false, setId: set.id };

  document.getElementById('fib-set-name').textContent = set.title;
  document.getElementById('fib-active').style.display = '';
  document.getElementById('fib-results').style.display = 'none';

  renderFibQuestion();
  showView('fill-in-blank');
  updateStreak();
  checkBadgeTrigger('mode_used', { mode: 'fill-in-blank' });
}

function renderFibQuestion() {
  const { items, index, score } = state.fib;
  const q = items[index];

  document.getElementById('fib-counter').textContent = `${index + 1} / ${items.length}`;
  document.getElementById('fib-score').textContent = `Score: ${score}`;
  document.getElementById('fib-progress-bar').style.width = `${(index / items.length) * 100}%`;

  const sentence = (q.sentence || '').replace(/_+/, '<span class="fib-blank">___</span>');
  document.getElementById('fib-sentence').innerHTML = sentence;
  document.getElementById('fib-hint').textContent = q.hint || '';
  document.getElementById('fib-input').value = '';
  document.getElementById('fib-input').disabled = false;
  document.getElementById('fib-feedback').style.display = 'none';
  document.getElementById('fib-check-btn').style.display = '';
  document.getElementById('fib-next-btn').style.display = 'none';
  state.fib.answered = false;
  setTimeout(() => document.getElementById('fib-input')?.focus(), 100);
}

function checkFibAnswer() {
  if (state.fib.answered) return;
  state.fib.answered = true;

  const { items, index } = state.fib;
  const q = items[index];
  const userAnswer = document.getElementById('fib-input').value.trim();
  const correct = q.answer || '';
  const fibMatch = isAnswerAccepted(userAnswer, correct);
  const isRight = !!fibMatch;

  document.getElementById('fib-input').disabled = true;
  document.getElementById('fib-check-btn').style.display = 'none';

  if (isRight) {
    state.fib.score++;
    addXP(10);
    document.getElementById('fib-input').classList.add('fib-correct');
  } else {
    document.getElementById('fib-input').classList.add('fib-incorrect');
    recordMistake({
      question: q.sentence || '',
      myAnswer: userAnswer,
      correct,
      explanation: q.explanation || '',
      topic: state.currentSet?.title || '',
      setId: state.fib.setId || '',
      setTitle: state.currentSet?.title || '',
      mode: 'fill-in-blank',
    });
  }

  const fb = document.getElementById('fib-feedback');
  fb.className = `quiz-feedback ${isRight ? 'correct' : 'incorrect'}`;
  fb.style.display = '';
  document.getElementById('fib-feedback-title').textContent = isRight && fibMatch === 'close' ? '✅ Close enough!' : isRight ? '✅ Correct!' : `❌ Answer: ${correct}`;
  document.getElementById('fib-feedback-exp').textContent = q.explanation || '';

  const nextBtn = document.getElementById('fib-next-btn');
  nextBtn.textContent = index + 1 >= items.length ? 'See Results 🎉' : 'Next →';
  nextBtn.style.display = '';
}

function fibNext() {
  const { items, index } = state.fib;
  if (index + 1 >= items.length) {
    const pct = Math.round((state.fib.score / items.length) * 100);
    const info = getScoreInfo(pct);
    document.getElementById('fib-active').style.display = 'none';
    document.getElementById('fib-results').style.display = '';
    document.getElementById('fib-result-emoji').textContent = info.emoji;
    document.getElementById('fib-result-score').textContent = `${pct}%`;
    document.getElementById('fib-result-label').textContent = info.label;
    document.getElementById('fib-result-sub').textContent = `${state.fib.score} / ${items.length} correct`;
    addHistoryEntry({ date: new Date().toISOString(), setId: state.fib.setId, setTitle: state.currentSet?.title || '', mode: 'fill-in-blank', score: pct, wordsStudied: items.length });
  } else {
    state.fib.index++;
    document.getElementById('fib-input').classList.remove('fib-correct', 'fib-incorrect');
    renderFibQuestion();
  }
}

// ─── Mistake Review (Spaced Repetition) ───────────────────────────────────────

function startMistakeReview(reviewAll = false) {
  const due = reviewAll ? getMistakes().filter(m => !m.resolved) : getDueMistakes();

  if (due.length === 0) {
    if (reviewAll) showToast('No active mistakes in the bank.', 'info');
    else showToast('No mistakes due today — great work! 🎉', 'success');
    return;
  }

  state.mr = { items: shuffle(due).slice(0, 20), index: 0, correct: 0, answered: false };

  document.getElementById('mr-count').textContent = `${state.mr.items.length} to review`;
  document.getElementById('mr-active').style.display = '';
  document.getElementById('mr-results').style.display = 'none';

  renderMistakeCard();
  showView('mistake-review');
  checkBadgeTrigger('mode_used', { mode: 'mistake-review' });
}

function renderMistakeCard() {
  const { items, index, correct } = state.mr;
  const item = items[index];

  document.getElementById('mr-progress').textContent = `${index + 1} / ${items.length}`;
  document.getElementById('mr-score').textContent = `✅ ${correct}`;
  document.getElementById('mr-bar').style.width = `${(index / items.length) * 100}%`;
  document.getElementById('mr-question').textContent = item.question;
  document.getElementById('mr-topic').textContent = item.setTitle || item.topic || '';
  document.getElementById('mr-feedback').style.display = 'none';
  document.getElementById('mr-next-btn').style.display = 'none';
  state.mr.answered = false;

  // Build options: correct answer + distractors from other mistakes
  const others = items.filter((_, i) => i !== index).map(m => m.correct).filter(Boolean);
  const distractors = shuffle([...new Set(others)]).slice(0, 3);
  const options = shuffle([item.correct, ...distractors]).slice(0, 4);

  const optionsEl = document.getElementById('mr-options');
  optionsEl.dataset.correct = item.correct;
  optionsEl.dataset.id = item.id;

  if (options.length >= 2) {
    optionsEl.innerHTML = options.map(opt =>
      `<button class="quiz-option" data-opt="${esc(opt)}" onclick="selectMrOption(this)">${esc(opt)}</button>`
    ).join('');
  } else {
    optionsEl.innerHTML = `
      <div style="padding:8px 0">
        <button class="btn btn-success btn-lg" style="width:100%;margin-bottom:10px" onclick="selectMrOption(null,true)">✅ I knew it</button>
        <button class="btn btn-outline btn-lg" style="width:100%" onclick="selectMrOption(null,false)">❌ I didn't know</button>
      </div>`;
  }
}

function selectMrOption(el, forceResult = null) {
  if (state.mr.answered) return;
  state.mr.answered = true;

  const optionsEl = document.getElementById('mr-options');
  const correct = optionsEl.dataset.correct;
  const id = optionsEl.dataset.id;

  let isCorrect;
  if (forceResult !== null) {
    isCorrect = forceResult;
  } else {
    const selected = el?.dataset.opt || '';
    isCorrect = normalizeAnswer(selected) === normalizeAnswer(correct);
    document.querySelectorAll('#mr-options .quiz-option').forEach(b => {
      b.disabled = true;
      if (normalizeAnswer(b.dataset.opt || '') === normalizeAnswer(correct)) b.classList.add('correct');
    });
    if (!isCorrect && el) el.classList.add('incorrect');
  }

  if (isCorrect) {
    state.mr.correct++;
    addXP(15);
  }
  updateMistakeReview(id, isCorrect);

  const item = state.mr.items[state.mr.index];
  const fb = document.getElementById('mr-feedback');
  fb.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
  fb.style.display = '';
  document.getElementById('mr-feedback-title').textContent = isCorrect ? '✅ Got it!' : `❌ Answer: ${correct}`;
  document.getElementById('mr-feedback-exp').textContent = item.explanation || '';

  const nextBtn = document.getElementById('mr-next-btn');
  nextBtn.textContent = state.mr.index + 1 >= state.mr.items.length ? 'See Results 🎉' : 'Next →';
  nextBtn.style.display = '';
}

function mrNext() {
  const { items, index } = state.mr;
  if (index + 1 >= items.length) showMrResults();
  else { state.mr.index++; renderMistakeCard(); }
}

function showMrResults() {
  const { correct, items } = state.mr;
  const pct = Math.round((correct / items.length) * 100);
  const info = getScoreInfo(pct);

  document.getElementById('mr-active').style.display = 'none';
  document.getElementById('mr-results').style.display = '';
  document.getElementById('mr-result-emoji').textContent = info.emoji;
  document.getElementById('mr-result-score').textContent = `${pct}%`;
  document.getElementById('mr-result-label').textContent = info.label;
  document.getElementById('mr-result-sub').textContent = `${correct} / ${items.length} · ${getMistakes().filter(m => !m.resolved).length} active mistakes remaining`;

  addHistoryEntry({ date: new Date().toISOString(), setId: '', setTitle: 'Mistake Review', mode: 'quiz', score: pct, wordsStudied: items.length });
  updateStreak();
  checkBadgeTrigger('mr_complete', { wrong: items.length - correct });
  if (pct === 100) triggerConfetti();
}

// ─── Mistake Bank View (browse all mistakes) ──────────────────────────────────

function initMistakeBankView() {
  const all = getMistakes();
  const due = getDueMistakes();
  const active = all.filter(m => !m.resolved);
  const resolved = all.filter(m => m.resolved);

  document.getElementById('mb-stats').innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat-card">
        <div class="stat-value" style="color:var(--error)">${active.length}</div>
        <div class="stat-label">Active</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--warning)">${due.length}</div>
        <div class="stat-label">Due Today</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--success)">${resolved.length}</div>
        <div class="stat-label">Resolved</div>
      </div>
    </div>`;

  const listEl = document.getElementById('mb-list');

  if (all.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎯</div>
        <h3>No mistakes yet</h3>
        <p>Wrong answers from quizzes, flashcards, and the article trainer will appear here for review.</p>
      </div>`;
    return;
  }

  const modeIcons = { quiz: '✅', flashcard: '🃏', article: '📝', 'fill-in-blank': '✏️' };

  listEl.innerHTML = active.map(m => `
    <div class="mistake-item">
      <div class="mistake-header">
        <span class="mistake-mode">${modeIcons[m.mode] || '📚'} ${m.mode}</span>
        <span class="mistake-date">${formatDate(m.date)}</span>
      </div>
      <div class="mistake-question">${esc(m.question)}</div>
      <div class="mistake-answer">
        <span class="mistake-wrong">✗ ${esc(m.myAnswer || '—')}</span>
        <span class="mistake-correct">✓ ${esc(m.correct)}</span>
      </div>
      ${m.explanation ? `<div class="mistake-exp">${esc(m.explanation)}</div>` : ''}
      <div class="mistake-footer">
        <span>Review in: ${m.nextReview ? formatDate(m.nextReview) : '—'}</span>
        <button class="btn btn-ghost btn-sm" onclick="resolveMistake('${m.id}')">Mark resolved</button>
      </div>
    </div>`).join('');
}

function resolveMistake(id) {
  const mistakes = getMistakes();
  const m = mistakes.find(x => x.id === id);
  if (m) { m.resolved = true; saveMistakes(mistakes); }
  initMistakeBankView();
  showToast('Marked as resolved.', 'success');
}

// ─── Sentence Builder (Word Order Trainer) ────────────────────────────────────

function startSentenceBuilder(setId) {
  const sets = getSets();
  const set = sets.find(s => s.id === setId) || state.currentSet;
  if (!set) { showToast('Study set not found.', 'error'); return; }

  const sentences = (set.exampleSentences || []).filter(s => s.german && s.german.split(' ').length >= 3);
  if (sentences.length === 0) {
    showToast('Not enough sentences in this set for word-order practice.', 'warning');
    return;
  }

  state.currentSet = set;
  state.sb = { sentences: shuffle([...sentences]), index: 0, score: 0, selected: [], pool: [], answered: false, setId: set.id };

  document.getElementById('sb-set-name').textContent = set.title;
  document.getElementById('sb-active').style.display = '';
  document.getElementById('sb-results').style.display = 'none';

  renderSbCard();
  showView('sentence-builder');
  updateStreak();
  checkBadgeTrigger('mode_used', { mode: 'sentence-builder' });
}

function renderSbCard() {
  const { sentences, index, score } = state.sb;
  const s = sentences[index];

  document.getElementById('sb-counter').textContent = `${index + 1} / ${sentences.length}`;
  document.getElementById('sb-score').textContent = `✅ ${score}`;
  document.getElementById('sb-progress-bar').style.width = `${(index / sentences.length) * 100}%`;
  document.getElementById('sb-english').textContent = s.english ? `🇬🇧 ${s.english}` : '';
  document.getElementById('sb-feedback').style.display = 'none';
  document.getElementById('sb-check-btn').style.display = '';
  document.getElementById('sb-next-btn').style.display = 'none';
  state.sb.answered = false;

  // Split into words, keep punctuation attached to words
  const words = s.german.split(/\s+/).filter(Boolean);
  state.sb.pool = shuffle(words.map((w, i) => ({ word: w, id: `w${i}` })));
  state.sb.selected = [];

  renderSbWords();
}

function renderSbWords() {
  const { pool, selected } = state.sb;

  document.getElementById('sb-selected').innerHTML = selected.length
    ? selected.map(w => `<button class="sb-word sb-word-selected" onclick="sbRemoveWord('${w.id}')">${esc(w.word)}</button>`).join('')
    : '<span class="sb-placeholder">Tap words below to build the sentence</span>';

  document.getElementById('sb-pool').innerHTML = pool
    .filter(w => !selected.find(s => s.id === w.id))
    .map(w => `<button class="sb-word" onclick="sbAddWord('${w.id}')">${esc(w.word)}</button>`)
    .join('');
}

function sbAddWord(id) {
  if (state.sb.answered) return;
  const wordObj = state.sb.pool.find(w => w.id === id);
  if (wordObj && !state.sb.selected.find(s => s.id === id)) {
    state.sb.selected.push(wordObj);
    renderSbWords();
  }
}

function sbRemoveWord(id) {
  if (state.sb.answered) return;
  state.sb.selected = state.sb.selected.filter(w => w.id !== id);
  renderSbWords();
}

function checkSentence() {
  if (state.sb.answered) return;
  const { sentences, index, selected } = state.sb;

  if (selected.length === 0) { showToast('Tap some words first!', 'warning'); return; }

  state.sb.answered = true;
  const original = sentences[index].german.trim();
  const attempt = selected.map(w => w.word).join(' ');
  const isCorrect = normalizeAnswer(attempt) === normalizeAnswer(original);

  if (isCorrect) {
    state.sb.score++;
    addXP(8);
  } else {
    recordMistake({
      question: `Put in order: ${sentences[index].english || original}`,
      myAnswer: attempt,
      correct: original,
      explanation: '',
      topic: state.currentSet?.title || '',
      setId: state.sb.setId,
      setTitle: state.currentSet?.title || '',
      mode: 'sentence-builder',
    });
  }

  const fb = document.getElementById('sb-feedback');
  fb.style.display = '';
  fb.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
  document.getElementById('sb-feedback-title').textContent = isCorrect ? '✅ Correct!' : `❌ Correct order:`;
  document.getElementById('sb-feedback-correct').textContent = isCorrect ? '' : original;

  // Highlight selected words
  document.querySelectorAll('.sb-word-selected').forEach(b => {
    b.classList.toggle('sb-correct', isCorrect);
    b.classList.toggle('sb-incorrect', !isCorrect);
    b.disabled = true;
  });

  const nextBtn = document.getElementById('sb-next-btn');
  nextBtn.textContent = state.sb.index + 1 >= state.sb.sentences.length ? 'See Results 🎉' : 'Next →';
  nextBtn.style.display = '';
  document.getElementById('sb-check-btn').style.display = 'none';
}

function sbNext() {
  const { sentences, index, score } = state.sb;
  if (index + 1 >= sentences.length) {
    const pct = Math.round((score / sentences.length) * 100);
    const info = getScoreInfo(pct);
    document.getElementById('sb-active').style.display = 'none';
    document.getElementById('sb-results').style.display = '';
    document.getElementById('sb-result-emoji').textContent = info.emoji;
    document.getElementById('sb-result-score').textContent = `${pct}%`;
    document.getElementById('sb-result-label').textContent = info.label;
    document.getElementById('sb-result-sub').textContent = `${score} / ${sentences.length} correct`;
    addHistoryEntry({ date: new Date().toISOString(), setId: state.sb.setId, setTitle: state.currentSet?.title || '', mode: 'sentence-builder', score: pct, wordsStudied: sentences.length });
  } else {
    state.sb.index++;
    renderSbCard();
  }
}

// ─── Translation Practice ──────────────────────────────────────────────────────

function startTranslationPractice(setId, direction) {
  const sets = getSets();
  const set = sets.find(s => s.id === setId) || state.currentSet;
  if (!set) { showToast('Study set not found.', 'error'); return; }

  // Build items from vocabulary + example sentences
  const vocabItems = (set.vocabulary || []).filter(v => v.german && v.english).map(v => ({
    prompt: direction === 'en-de' ? v.english : `${v.article ? v.article + ' ' : ''}${v.german}`,
    answer: direction === 'en-de' ? v.german : v.english,
    type: 'vocab',
    hint: v.wordType || '',
    example: v.example || '',
  }));

  const sentenceItems = (set.exampleSentences || []).filter(s => s.german && s.english).map(s => ({
    prompt: direction === 'en-de' ? s.english : s.german,
    answer: direction === 'en-de' ? s.german : s.english,
    type: 'sentence',
    hint: '',
    example: '',
  }));

  const items = shuffle([...vocabItems, ...sentenceItems.slice(0, 5)]);

  if (items.length === 0) {
    showToast('Not enough vocabulary for translation practice.', 'warning');
    return;
  }

  state.currentSet = set;
  state.tp = { items, index: 0, score: 0, answered: false, direction: direction || 'de-en', setId: set.id };

  document.getElementById('tp-set-name').textContent = set.title;
  document.getElementById('tp-dir-label').textContent = direction === 'en-de' ? '🇬🇧 → 🇩🇪' : '🇩🇪 → 🇬🇧';
  document.getElementById('tp-active').style.display = '';
  document.getElementById('tp-results').style.display = 'none';

  renderTpCard();
  showView('translation-practice');
  updateStreak();
  checkBadgeTrigger('mode_used', { mode: 'translation' });
}

function renderTpCard() {
  const { items, index, score, direction } = state.tp;
  const item = items[index];

  document.getElementById('tp-counter').textContent = `${index + 1} / ${items.length}`;
  document.getElementById('tp-score').textContent = `✅ ${score}`;
  document.getElementById('tp-progress-bar').style.width = `${(index / items.length) * 100}%`;
  document.getElementById('tp-prompt').textContent = item.prompt;
  document.getElementById('tp-prompt-lang').textContent = direction === 'en-de' ? '🇬🇧 English' : '🇩🇪 German';
  document.getElementById('tp-hint').textContent = item.hint ? `(${item.hint})` : '';
  document.getElementById('tp-input').value = '';
  document.getElementById('tp-input').disabled = false;
  document.getElementById('tp-input').classList.remove('fib-correct', 'fib-incorrect');
  document.getElementById('tp-feedback').style.display = 'none';
  document.getElementById('tp-check-btn').style.display = '';
  document.getElementById('tp-next-btn').style.display = 'none';
  state.tp.answered = false;
  setTimeout(() => document.getElementById('tp-input')?.focus(), 100);
  if (direction === 'de-en' && item.prompt) setTimeout(() => speakGerman(item.prompt), 300);
}

function checkTranslation() {
  if (state.tp.answered) return;
  state.tp.answered = true;

  const { items, index } = state.tp;
  const item = items[index];
  const userAns = document.getElementById('tp-input').value.trim();
  const correct = item.answer;

  const tpMatch = isAnswerAccepted(userAns, correct);
  const isCorrect = tpMatch === 'exact';
  const isClose = tpMatch === 'close';

  document.getElementById('tp-input').disabled = true;
  document.getElementById('tp-check-btn').style.display = 'none';

  if (isCorrect || isClose) {
    state.tp.score++;
    addXP(10);
    document.getElementById('tp-input').classList.add('fib-correct');
  } else {
    document.getElementById('tp-input').classList.add('fib-incorrect');
    recordMistake({
      question: `Translate: "${item.prompt}"`,
      myAnswer: userAns,
      correct,
      explanation: item.example ? `Example: ${item.example}` : '',
      topic: state.currentSet?.title || '',
      setId: state.tp.setId,
      setTitle: state.currentSet?.title || '',
      mode: 'translation',
    });
  }

  const fb = document.getElementById('tp-feedback');
  fb.className = `quiz-feedback ${(isCorrect || isClose) ? 'correct' : 'incorrect'}`;
  fb.style.display = '';
  document.getElementById('tp-feedback-title').textContent = isCorrect ? '✅ Perfect!' : isClose ? '✅ Close enough!' : `❌ Answer: ${correct}`;
  document.getElementById('tp-feedback-exp').textContent = item.example || '';

  const nextBtn = document.getElementById('tp-next-btn');
  nextBtn.textContent = index + 1 >= items.length ? 'See Results 🎉' : 'Next →';
  nextBtn.style.display = '';
}

function tpNext() {
  const { items, index, score, setId, direction } = state.tp;
  if (index + 1 >= items.length) {
    const pct = Math.round((score / items.length) * 100);
    const info = getScoreInfo(pct);
    document.getElementById('tp-active').style.display = 'none';
    document.getElementById('tp-results').style.display = '';
    document.getElementById('tp-result-emoji').textContent = info.emoji;
    document.getElementById('tp-result-score').textContent = `${pct}%`;
    document.getElementById('tp-result-label').textContent = info.label;
    document.getElementById('tp-result-sub').textContent = `${score} / ${items.length} correct`;
    addHistoryEntry({ date: new Date().toISOString(), setId, setTitle: state.currentSet?.title || '', mode: 'translation', score: pct, wordsStudied: items.length });
  } else {
    state.tp.index++;
    renderTpCard();
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const p = getProgress();
  document.getElementById('streak-badge').textContent = `🔥 ${p.streak || 0}`;
  initDarkMode();
  updateXpDisplay();
  maybeShowOnboarding();
  initInstallPrompt();
  showView('dashboard');
});

// ─── Dark Mode ────────────────────────────────────────────────────────────────

function initDarkMode() {
  const isDark = localStorage.getItem('ds_dark') === '1';
  if (isDark) document.body.classList.add('dark');
  _applyDarkToggleIcon(isDark);
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('ds_dark', isDark ? '1' : '0');
  _applyDarkToggleIcon(isDark);
  const meta = document.getElementById('theme-color-meta');
  if (meta) meta.content = isDark ? '#0F1117' : '#5B67F8';
}

function _applyDarkToggleIcon(isDark) {
  const btn = document.getElementById('dark-toggle');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

// ─── Text-to-Speech ───────────────────────────────────────────────────────────

function speakGerman(text) {
  if (!window.speechSynthesis || !text) return;
  if (!getSettings().audioEnabled) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'de-DE';
  utt.rate = 0.85;
  function doSpeak() {
    const voices = speechSynthesis.getVoices();
    const deVoice = voices.find(v => v.lang.startsWith('de'));
    if (deVoice) utt.voice = deVoice;
    window.speechSynthesis.speak(utt);
  }
  const voices = speechSynthesis.getVoices();
  if (voices.length > 0) doSpeak();
  else speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
}

// ─── XP System ───────────────────────────────────────────────────────────────

const XP_LEVELS = [
  { xp: 0,    level: 1, name: 'Lernling',          emoji: '🌱' },
  { xp: 200,  level: 2, name: 'Schüler',            emoji: '📚' },
  { xp: 600,  level: 3, name: 'Fortgeschrittener',  emoji: '⚡' },
  { xp: 1500, level: 4, name: 'Kenner',             emoji: '🎓' },
  { xp: 3000, level: 5, name: 'Meister',            emoji: '🏆' },
];

function getLevelInfo(total) {
  let info = XP_LEVELS[0];
  for (const lvl of XP_LEVELS) {
    if (total >= lvl.xp) info = lvl;
  }
  return info;
}

function getXP() {
  try { return parseInt(localStorage.getItem('ds_xp') || '0', 10); } catch { return 0; }
}

function saveXP(total) {
  localStorage.setItem('ds_xp', String(Math.max(0, total)));
}

function addXP(amount) {
  if (!amount || amount <= 0) return;
  const prev = getXP();
  const next = prev + amount;
  saveXP(next);
  showXpPopup(amount);
  const prevInfo = getLevelInfo(prev);
  const nextInfo = getLevelInfo(next);
  if (nextInfo.level > prevInfo.level) {
    setTimeout(() => {
      showToast(`🎉 Level up! You are now a ${nextInfo.name} ${nextInfo.emoji}`, 'success');
      triggerConfetti();
    }, 400);
  }
  updateXpDisplay();
}

function showXpPopup(amount) {
  const el = document.createElement('div');
  el.className = 'xp-popup';
  el.textContent = `+${amount} XP`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function updateXpDisplay() {
  const total = getXP();
  const info = getLevelInfo(total);
  const el = document.getElementById('sidebar-xp');
  if (el) el.textContent = `⭐ ${total} XP · ${info.name} ${info.emoji}`;
}

// ─── Achievement Badges ───────────────────────────────────────────────────────

const BADGES = [
  { id: 'first_set',    emoji: '🌟', name: 'Erster Schritt', desc: 'Create your first study set' },
  { id: 'perfect_quiz', emoji: '🏆', name: 'Perfektionist',  desc: 'Score 100% on a quiz' },
  { id: 'week_warrior', emoji: '🔥', name: 'Sieben Tage',    desc: 'Reach a 7-day study streak' },
  { id: 'word_king',    emoji: '📚', name: 'Wortkönig',      desc: 'Master 50 words' },
  { id: 'mistake_free', emoji: '⚡', name: 'Fehlerlos',      desc: 'Ace a mistake review (no wrong answers)' },
  { id: 'article_ace',  emoji: '🎯', name: 'Artikel-Ass',   desc: 'Get 20 articles correct' },
  { id: 'translator',   emoji: '🌍', name: 'Übersetzer',    desc: 'Use Translation Practice mode' },
  { id: 'all_modes',    emoji: '🏅', name: 'Alleskönner',   desc: 'Use all 6 study modes at least once' },
];

function getBadges() {
  try { return JSON.parse(localStorage.getItem('ds_badges') || '[]'); } catch { return []; }
}

function saveBadges(b) {
  localStorage.setItem('ds_badges', JSON.stringify(b));
}

function unlockBadge(id) {
  const earned = getBadges();
  if (earned.includes(id)) return;
  earned.push(id);
  saveBadges(earned);
  const badge = BADGES.find(b => b.id === id);
  if (badge) {
    setTimeout(() => showToast(`${badge.emoji} Achievement unlocked: ${badge.name}!`, 'success'), 200);
    setTimeout(() => triggerConfetti(), 300);
  }
}

function checkBadgeTrigger(event, data = {}) {
  if (event === 'set_created') {
    if (getSets().length >= 1) unlockBadge('first_set');
  }
  if (event === 'quiz_complete' && data.score === 100) {
    unlockBadge('perfect_quiz');
  }
  if (event === 'streak_update' && (data.streak || 0) >= 7) {
    unlockBadge('week_warrior');
  }
  if (event === 'word_mastered' && (data.count || 0) >= 50) {
    unlockBadge('word_king');
  }
  if (event === 'mr_complete' && data.wrong === 0) {
    unlockBadge('mistake_free');
  }
  if (event === 'article_correct') {
    const prev = parseInt(localStorage.getItem('ds_art_correct') || '0', 10);
    const next = prev + 1;
    localStorage.setItem('ds_art_correct', String(next));
    if (next >= 20) unlockBadge('article_ace');
  }
  if (event === 'mode_used') {
    const modes = new Set(JSON.parse(localStorage.getItem('ds_modes_used') || '[]'));
    if (data.mode) modes.add(data.mode);
    localStorage.setItem('ds_modes_used', JSON.stringify([...modes]));
    if (data.mode === 'translation') unlockBadge('translator');
    if (modes.size >= 6) unlockBadge('all_modes');
  }
  if (event === 'fc_complete' && data.wrong === 0) {
    // Perfect flashcard session — bonus XP already handled
  }
}

function renderBadgesView() {
  const earned = getBadges();
  const grid = document.getElementById('badges-grid');
  if (!grid) return;
  grid.innerHTML = BADGES.map(b => {
    const isEarned = earned.includes(b.id);
    return `
      <div class="badge-card ${isEarned ? 'earned' : 'locked'}">
        <div class="badge-card-emoji">${b.emoji}</div>
        <div class="badge-card-name">${esc(b.name)}</div>
        <div class="badge-card-desc">${esc(b.desc)}</div>
        <div class="badge-card-status">${isEarned ? '✅ Unlocked' : '🔒 Locked'}</div>
      </div>`;
  }).join('');
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function triggerConfetti() {
  const colors = ['#5B67F8', '#FF6B6B', '#4CAF78', '#FFD93D', '#FF9F43', '#a78bfa'];
  const count = 55;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const size = 6 + Math.random() * 7;
    el.style.cssText = [
      `left:${Math.random() * 100}vw`,
      `background:${colors[i % colors.length]}`,
      `animation-delay:${Math.random() * 0.5}s`,
      `animation-duration:${1.2 + Math.random() * 1}s`,
      `width:${size}px`,
      `height:${size}px`,
      `border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`,
    ].join(';');
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

const SAMPLE_STUDY_SET = {
  id: 'ss-sample-modal-verbs',
  title: 'Modal Verbs — A1',
  topic: 'Grammar / Modal Verbs',
  createdAt: new Date().toISOString(),
  masteryLevel: 0,
  demo: false,
  vocabulary: [
    { id: uid(), german: 'können', english: 'can / to be able to', article: '', wordType: 'modal', example: 'Ich kann Deutsch sprechen.', exampleTranslation: 'I can speak German.' },
    { id: uid(), german: 'müssen', english: 'must / have to', article: '', wordType: 'modal', example: 'Du musst lernen.', exampleTranslation: 'You must study.' },
    { id: uid(), german: 'dürfen', english: 'may / allowed to', article: '', wordType: 'modal', example: 'Darf ich hereinkommen?', exampleTranslation: 'May I come in?' },
    { id: uid(), german: 'wollen', english: 'to want to', article: '', wordType: 'modal', example: 'Ich will Deutsch lernen.', exampleTranslation: 'I want to learn German.' },
    { id: uid(), german: 'sollen', english: 'should / supposed to', article: '', wordType: 'modal', example: 'Du sollst pünktlich sein.', exampleTranslation: 'You should be on time.' },
    { id: uid(), german: 'mögen', english: 'to like', article: '', wordType: 'modal', example: 'Ich mag Schokolade.', exampleTranslation: 'I like chocolate.' },
  ],
  quizQuestions: [
    { id: uid(), question: 'What does "können" mean?', options: ['can / to be able to', 'must / have to', 'may / allowed to', 'to want to'], correctAnswer: 'can / to be able to', explanation: '"Können" expresses ability — what you are able to do.' },
    { id: uid(), question: 'Which modal verb means "must / have to"?', options: ['müssen', 'dürfen', 'wollen', 'mögen'], correctAnswer: 'müssen', explanation: '"Müssen" expresses obligation or necessity.' },
    { id: uid(), question: 'Translate: "Darf ich hereinkommen?"', options: ['May I come in?', 'Must I come in?', 'Can I come in?', 'I want to come in.'], correctAnswer: 'May I come in?', explanation: '"Dürfen" is used to ask or give permission.' },
    { id: uid(), question: 'What does "wollen" mean?', options: ['to want to', 'should', 'to like', 'must'], correctAnswer: 'to want to', explanation: '"Wollen" expresses desire or intention.' },
  ],
  fillInTheBlank: [
    { id: uid(), sentence: 'Ich ___ Deutsch sprechen. (can)', answer: 'kann', explanation: 'Ich → "kann" (ich-form of können)' },
    { id: uid(), sentence: 'Du ___ lernen. (must)', answer: 'musst', explanation: 'Du → "musst" (du-form of müssen)' },
    { id: uid(), sentence: 'Er ___ Deutsch lernen. (wants to)', answer: 'will', explanation: 'Er → "will" (er-form of wollen)' },
  ],
  grammarTopics: [
    { id: uid(), title: 'Modal Verbs in German', content: 'German has 6 main modal verbs: können (can), müssen (must), dürfen (may), wollen (want), sollen (should), mögen (like). They combine with an infinitive at the end of the clause. Example: Ich kann Deutsch sprechen.' },
  ],
  exampleSentences: [
    { id: uid(), german: 'Ich kann Deutsch sprechen.', english: 'I can speak German.' },
    { id: uid(), german: 'Du musst jeden Tag lernen.', english: 'You must study every day.' },
    { id: uid(), german: 'Darf ich hereinkommen?', english: 'May I come in?' },
  ],
  homework: [
    { id: uid(), question: 'Fill in: Ich ___ morgen zur Schule gehen. (must)', hint: 'Use "müssen". ich → ???', answer: 'Ich muss morgen zur Schule gehen.', explanation: '"Müssen" for necessity: ich → muss.' },
    { id: uid(), question: 'Translate: "He can speak German."', hint: 'Use "können": er → ???', answer: 'Er kann Deutsch sprechen.', explanation: '"Er kann" + infinitive at the end.' },
  ],
};

function maybeShowOnboarding() {
  if (getSets().length > 0 || localStorage.getItem('ds_welcomed')) return;
  document.getElementById('onboarding-overlay')?.classList.remove('hidden');
}

function dismissOnboarding() {
  localStorage.setItem('ds_welcomed', '1');
  document.getElementById('onboarding-overlay')?.classList.add('hidden');
  // Add sample set only if still none
  if (getSets().length === 0) {
    saveSets([SAMPLE_STUDY_SET]);
    showView('dashboard');
  }
}

// ─── PWA Install Prompt ───────────────────────────────────────────────────────

let _deferredInstallPrompt = null;

function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _deferredInstallPrompt = e;
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.remove('hidden');
    const btn = document.getElementById('install-banner-btn');
    if (btn) {
      btn.onclick = () => {
        _deferredInstallPrompt.prompt();
        _deferredInstallPrompt.userChoice.then(() => {
          _deferredInstallPrompt = null;
          banner.classList.add('hidden');
        });
      };
    }
  });
  window.addEventListener('appinstalled', () => {
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.add('hidden');
  });
}
