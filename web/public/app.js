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

  // Homework helper
  hw: { items: [], index: 0, correct: 0, answered: false, setId: null, revealed: false },

  // Listening exercise
  listening: null,
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

  // Update bottom nav active state
  const bnavMap = { dashboard: 'bnav-home', course: 'bnav-course', 'saved-sets': 'bnav-saved-sets', 'mistake-bank': 'bnav-mistake-bank', settings: 'bnav-settings' };
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
  const bnavId = bnavMap[name] || null;
  if (bnavId) document.getElementById(bnavId)?.classList.add('active');
  // Update due-mistakes badge on bottom nav
  const dueBadge = document.getElementById('bnav-mistakes-count');
  if (dueBadge) {
    const dueCount = getDueMistakes().length;
    dueBadge.textContent = dueCount;
    dueBadge.style.display = dueCount > 0 ? 'flex' : 'none';
  }

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
    'course': initCourseView,
    'listening': initListeningView,
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

    // Continue Course card
    const nextUnit = GERMAN_COURSE.find(u => isUnitUnlocked(u) && getUnitMastery(u) < 80);
    if (nextUnit) {
      planCards.push(`
        <div class="plan-card" onclick="openCourseUnit('${nextUnit.id}')">
          <div class="plan-icon">${nextUnit.emoji}</div>
          <div class="plan-info">
            <div class="plan-title">Unit ${nextUnit.unit}: ${esc(nextUnit.title)}</div>
            <div class="plan-sub">A1 Course · ${getUnitMastery(nextUnit)}% complete</div>
          </div>
          <span class="plan-arrow">→</span>
        </div>`);
    }

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

  // Sample Lesson CTA — shown when no real (non-sample) sets exist
  const sampleCta = document.getElementById('dash-sample-cta');
  const hasRealSets = sets.some(s => s.id !== 'ss-sample-a1-daily');
  if (sampleCta) {
    sampleCta.style.display = hasRealSets ? 'none' : 'flex';
  }

  // Recent sets (up to 4)
  const recentSets = sets.slice(0, 4);
  const container = document.getElementById('dash-recent-sets');

  if (recentSets.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <h3>No study sets yet</h3>
        <p>Try the sample lesson or scan a worksheet to get started.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:12px">
          <button class="btn btn-primary" onclick="startSampleLesson()">▶ Start Sample Lesson</button>
          <button class="btn btn-outline" onclick="showView('create')">📷 Scan Worksheet</button>
        </div>
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

  const lvl = set.level || '';
  const lvlClass = lvl === 'A1' ? 'level-badge-a1' : lvl === 'A2' ? 'level-badge-a2' : lvl === 'B1' ? 'level-badge-b1' : 'level-badge-a2';
  const lvlBadge = lvl ? `<span class="level-badge ${lvlClass}">${esc(lvl)}</span>` : '';

  return `
    <div class="set-card" onclick="openStudySet('${set.id}')">
      <button class="set-card-delete" onclick="deleteSet('${set.id}', event)" title="Delete">✕</button>
      <div class="set-card-header">
        <div class="set-card-icon">📄</div>
        <div>
          <div class="set-card-title">${esc(set.title)}${lvlBadge}</div>
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
  const lvl = set.level || '';
  const lvlClass = lvl === 'A1' ? 'level-badge-a1' : lvl === 'A2' ? 'level-badge-a2' : 'level-badge-b1';
  document.getElementById('ss-title').innerHTML = esc(set.title || 'Study Set') +
    (lvl ? ` <span class="level-badge ${lvlClass}" style="font-size:12px">${esc(lvl)}</span>` : '');
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

  // Show Dialogue tab only for course units
  const dialogueTabBtn = document.getElementById('tab-btn-dialogue');
  const dialoguePanel = document.getElementById('tab-dialogue');
  const isCourseUnit = GERMAN_COURSE.some(u => u.id === set.id);
  if (dialogueTabBtn) dialogueTabBtn.style.display = isCourseUnit ? '' : 'none';
  if (dialoguePanel) dialoguePanel.style.display = isCourseUnit ? '' : 'none';

  renderOverviewTab(set);
  renderVocabTab(set);
  renderGrammarTab(set);
  renderSentencesTab(set);
  if (isCourseUnit) renderDialogueTab(set);
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
  if (isCorrect) {
    document.getElementById('quiz-feedback-title').textContent = quizMatch === 'close' ? '✅ Close enough!' : '✅ Correct!';
    document.getElementById('quiz-feedback-exp').textContent = explanation || '';
  } else {
    document.getElementById('quiz-feedback-title').innerHTML =
      `<div class="mistake-explain-your">❌ You chose: ${esc(selected)}</div>
       <div class="mistake-explain-correct">✓ Correct: ${esc(correct)}</div>`;
    document.getElementById('quiz-feedback-exp').innerHTML =
      explanation ? `<div class="mistake-explain-why">${esc(explanation)}</div>` : '';
  }

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
  const el = document.getElementById('hw-set-name');
  if (el) el.textContent = set.title;

  if (!set.homework?.length) {
    document.getElementById('hw-empty').style.display = '';
    document.getElementById('hw-active').style.display = 'none';
    document.getElementById('hw-results').style.display = 'none';
    document.getElementById('hw-empty').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>No homework questions</h3>
        <p>Numbered questions (1. 2. 3.) in your worksheet become Homework Helper questions.</p>
        <button class="btn btn-primary" onclick="backToStudySet()">← Back to Study Set</button>
      </div>`;
    showView('homework');
    return;
  }

  state.hw = {
    items: [...set.homework],
    index: 0,
    correct: 0,
    answered: false,
    setId: set.id,
    revealed: false,
  };

  document.getElementById('hw-empty').style.display = 'none';
  document.getElementById('hw-active').style.display = '';
  document.getElementById('hw-results').style.display = 'none';

  renderHwQuestion();
  showView('homework');
  updateStreak();
  checkBadgeTrigger('mode_used', { mode: 'homework' });
}

function renderHwQuestion() {
  const { items, index, correct } = state.hw;
  const q = items[index];

  document.getElementById('hw-counter').textContent = `${index + 1} / ${items.length}`;
  document.getElementById('hw-score-badge').textContent = `✅ ${correct}`;
  document.getElementById('hw-progress-bar').style.width = `${(index / items.length) * 100}%`;
  document.getElementById('hw-question-text').textContent = q.question;

  // Reset UI for new question
  const inputEl = document.getElementById('hw-input');
  inputEl.value = '';
  inputEl.disabled = false;
  inputEl.classList.remove('fib-correct', 'fib-incorrect');

  document.getElementById('hw-hint-area').style.display = 'none';
  document.getElementById('hw-hint-text').textContent = q.hint || '';
  document.getElementById('hw-hint-btn').style.display = '';
  document.getElementById('hw-check-btn').style.display = '';
  document.getElementById('hw-feedback').style.display = 'none';
  document.getElementById('hw-next-btn').style.display = 'none';
  document.getElementById('hw-reveal-btn').style.display = 'none';

  state.hw.answered = false;
  state.hw.revealed = false;
  setTimeout(() => document.getElementById('hw-input')?.focus(), 100);
}

function showHwHint() {
  document.getElementById('hw-hint-area').style.display = '';
}

function checkHwAnswer() {
  if (state.hw.answered) return;
  state.hw.answered = true;

  const { items, index } = state.hw;
  const q = items[index];
  const userAnswer = document.getElementById('hw-input').value.trim();
  const correct = q.answer || '';
  const match = isAnswerAccepted(userAnswer, correct);
  const isRight = !!match;

  document.getElementById('hw-input').disabled = true;
  document.getElementById('hw-check-btn').style.display = 'none';
  document.getElementById('hw-hint-btn').style.display = 'none';

  if (isRight) {
    state.hw.correct++;
    addXP(10);
    document.getElementById('hw-input').classList.add('fib-correct');
  } else {
    document.getElementById('hw-input').classList.add('fib-incorrect');
    recordMistake({
      question: q.question,
      myAnswer: userAnswer,
      correct,
      explanation: q.explanation || '',
      topic: 'Homework',
      setId: state.hw.setId || '',
      setTitle: state.currentSet?.title || '',
      mode: 'homework',
    });
    document.getElementById('hw-reveal-btn').style.display = '';
  }

  const fb = document.getElementById('hw-feedback');
  fb.className = `quiz-feedback ${isRight ? 'correct' : 'incorrect'}`;
  fb.style.display = '';
  document.getElementById('hw-feedback-title').innerHTML = isRight
    ? (match === 'close' ? '✅ Close enough!' : '✅ Correct!')
    : `<div class="mistake-explain-your">❌ Your answer: ${esc(userAnswer || '(blank)')}</div>
       <div class="mistake-explain-correct">✓ Correct: ${esc(correct)}</div>`;
  document.getElementById('hw-feedback-exp').textContent = isRight ? (q.explanation || '') : '';

  const nextBtn = document.getElementById('hw-next-btn');
  nextBtn.textContent = index + 1 >= items.length ? 'See Results 🎉' : 'Next Question →';
  nextBtn.style.display = '';
}

function revealFullHwAnswer() {
  const { items, index } = state.hw;
  const q = items[index];
  const expEl = document.getElementById('hw-feedback-exp');
  expEl.innerHTML = `<div class="mistake-explain-correct">✓ ${esc(q.answer)}</div>
    ${q.explanation ? `<div class="mistake-explain-why">${esc(q.explanation)}</div>` : ''}`;
  document.getElementById('hw-reveal-btn').style.display = 'none';
}

function hwNext() {
  const { items, index, correct } = state.hw;
  if (index + 1 >= items.length) {
    showHwResults();
  } else {
    state.hw.index++;
    renderHwQuestion();
  }
}

function showHwResults() {
  const { correct, items, setId } = state.hw;
  const total = items.length;
  const pct = Math.round((correct / total) * 100);
  const info = getScoreInfo(pct);

  document.getElementById('hw-active').style.display = 'none';
  document.getElementById('hw-results').style.display = '';
  document.getElementById('hw-result-emoji').textContent = info.emoji;
  document.getElementById('hw-result-score').textContent = `${correct} / ${total}`;
  document.getElementById('hw-result-label').textContent = info.label;
  document.getElementById('hw-result-sub').textContent = `${pct}% correct · Mistakes saved to review`;

  addHistoryEntry({ date: new Date().toISOString(), setId, setTitle: state.currentSet?.title || '', mode: 'homework', score: pct, wordsStudied: total });
  checkBadgeTrigger('mode_used', { mode: 'homework' });
  if (pct === 100) triggerConfetti();
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
  if (isRight) {
    document.getElementById('fib-feedback-title').textContent = fibMatch === 'close' ? '✅ Close enough!' : '✅ Correct!';
    document.getElementById('fib-feedback-exp').textContent = q.explanation || '';
  } else {
    document.getElementById('fib-feedback-title').innerHTML =
      `<div class="mistake-explain-your">❌ You wrote: ${esc(userAnswer || '(blank)')}</div>
       <div class="mistake-explain-correct">✓ Answer: ${esc(correct)}</div>`;
    document.getElementById('fib-feedback-exp').innerHTML =
      q.explanation ? `<div class="mistake-explain-why">${esc(q.explanation)}</div>` : '';
  }

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

// ─── German A1 Course ─────────────────────────────────────────────────────────

const GERMAN_COURSE = [
  {
    id:'course-a1-01',unit:1,level:'A1',emoji:'👋',
    title:'Greetings & Introductions',
    description:'Say hello, introduce yourself, and ask where someone is from.',
    vocabulary:[
      {german:'Hallo',english:'Hello',article:null,wordType:'phrase',example:'Hallo! Wie geht es dir?',exampleTranslation:'Hello! How are you?'},
      {german:'Guten Morgen',english:'Good morning',article:null,wordType:'phrase',example:'Guten Morgen! Schön, Sie zu sehen.',exampleTranslation:'Good morning! Nice to see you.'},
      {german:'Guten Tag',english:'Good day / Hello',article:null,wordType:'phrase',example:'Guten Tag, wie kann ich helfen?',exampleTranslation:'Good day, how can I help?'},
      {german:'Guten Abend',english:'Good evening',article:null,wordType:'phrase',example:'Guten Abend! Willkommen.',exampleTranslation:'Good evening! Welcome.'},
      {german:'Auf Wiedersehen',english:'Goodbye (formal)',article:null,wordType:'phrase',example:'Auf Wiedersehen, bis morgen!',exampleTranslation:'Goodbye, until tomorrow!'},
      {german:'Tschüss',english:'Bye (informal)',article:null,wordType:'phrase',example:'Tschüss! Bis bald!',exampleTranslation:'Bye! See you soon!'},
      {german:'heißen',english:'to be called / named',article:null,wordType:'verb',example:'Ich heiße Maria.',exampleTranslation:'My name is Maria.'},
      {german:'kommen',english:'to come (from)',article:null,wordType:'verb',example:'Ich komme aus Deutschland.',exampleTranslation:'I come from Germany.'},
      {german:'wohnen',english:'to live / reside',article:null,wordType:'verb',example:'Ich wohne in Berlin.',exampleTranslation:'I live in Berlin.'},
      {german:'sprechen',english:'to speak',article:null,wordType:'verb',example:'Ich spreche ein bisschen Deutsch.',exampleTranslation:'I speak a little German.'},
      {german:'Name',english:'name',article:'der',wordType:'noun',example:'Wie ist Ihr Name?',exampleTranslation:'What is your name?'},
      {german:'Land',english:'country',article:'das',wordType:'noun',example:'Aus welchem Land kommen Sie?',exampleTranslation:'Which country are you from?'},
    ],
    grammarTopics:[
      {title:'sein (to be)',rule:'ich bin, du bist, er/sie ist, wir sind, ihr seid, sie/Sie sind. Highly irregular — must be memorized.',examples:[{german:'Ich bin Student.',english:'I am a student.'},{german:'Wir sind Freunde.',english:'We are friends.'}],tip:'"bin" is ONLY for ich. Everything else changes.'},
      {title:'W-Questions: Wie, Wo, Woher',rule:'Wie=How/What (names), Wo=Where, Woher=Where from. Questions invert verb+subject.',examples:[{german:'Wie heißen Sie?',english:'What is your name?'},{german:'Woher kommen Sie?',english:'Where are you from?'}],tip:'W-word → verb → subject. Always invert!'},
    ],
    quizQuestions:[
      {id:'q1u1a',question:'How do you say "Good morning" in German?',options:['Guten Morgen','Guten Abend','Guten Tag','Auf Wiedersehen'],correctAnswer:'Guten Morgen',explanation:'"Morgen" = morning. Used until noon.'},
      {id:'q1u1b',question:'What does "Woher kommen Sie?" mean?',options:['Where are you from?','Where do you live?','What is your name?','How are you?'],correctAnswer:'Where are you from?',explanation:'"Woher" = where from.'},
      {id:'q1u1c',question:'"Ich ___ Maria." — correct verb?',options:['heiße','heißt','heißen','bin'],correctAnswer:'heiße',explanation:'heißen → ich heiße (remove -en, add -e).'},
      {id:'q1u1d',question:'The formal goodbye in German is:',options:['Auf Wiedersehen','Tschüss','Hallo','Servus'],correctAnswer:'Auf Wiedersehen',explanation:'"Auf Wiedersehen" = until we see each other again.'},
      {id:'q1u1e',question:'"Ich komme ___ England." — correct preposition?',options:['aus','in','von','nach'],correctAnswer:'aus',explanation:'"aus" + country = where you are FROM.'},
      {id:'q1u1f',question:'Correct form of "sein" for "wir":',options:['wir sind','wir bin','wir bist','wir ist'],correctAnswer:'wir sind',explanation:'sein: wir sind = we are.'},
    ],
    fillInTheBlank:[
      {id:'f1u1a',sentence:'Ich ___ Klaus.',answer:'heiße',hint:'heißen, ich-form',explanation:'heißen → ich heiße'},
      {id:'f1u1b',sentence:'Woher ___ du?',answer:'kommst',hint:'kommen, du-form',explanation:'kommen → du kommst'},
      {id:'f1u1c',sentence:'Ich ___ in Hamburg.',answer:'wohne',hint:'wohnen, ich-form',explanation:'wohnen → ich wohne'},
      {id:'f1u1d',sentence:'___ Morgen! Wie geht es Ihnen?',answer:'Guten',hint:'Morning greeting',explanation:'"Guten" is the adjective form of "gut".'},
    ],
    exampleSentences:[
      {german:'Hallo! Ich heiße Anna und komme aus Österreich.',english:'Hello! My name is Anna and I come from Austria.'},
      {german:'Guten Tag! Wie heißen Sie?',english:'Good day! What is your name?'},
      {german:'Ich wohne in München und spreche Deutsch.',english:'I live in Munich and speak German.'},
      {german:'Woher kommen Sie? — Ich komme aus Kanada.',english:'Where are you from? — I come from Canada.'},
      {german:'Auf Wiedersehen! Bis morgen!',english:'Goodbye! Until tomorrow!'},
    ],
    homework:[
      {id:'h1u1a',question:'Write 3 sentences: your name, where you are from, where you live.',hint:'Ich heiße... / Ich komme aus... / Ich wohne in...',answer:'Ich heiße [Name]. Ich komme aus [Land]. Ich wohne in [Stadt].',explanation:'These three sentences are the foundation of any German introduction.'},
      {id:'h1u1b',question:'Conjugate "heißen" for all 6 pronouns.',hint:'du-form: heißt (stem ends in -ß)',answer:'ich heiße, du heißt, er/sie heißt, wir heißen, ihr heißt, sie heißen',explanation:'Stem ends in -ß so du heißt (not heißest).'},
      {id:'h1u1c',question:'Formal + informal: "What is your name? Where are you from?"',hint:'Formal = Sie, informal = du',answer:'Formal: Wie heißen Sie? Woher kommen Sie? | Informal: Wie heißt du? Woher kommst du?',explanation:'Formal "Sie" always capitalized; takes plural verb form.'},
      {id:'h1u1d',question:'Translate: "Good evening! I am from England and I live in Berlin."',hint:'Guten Abend + komme aus + wohne in',answer:'Guten Abend! Ich komme aus England und ich wohne in Berlin.',explanation:'"Guten Abend" from ~6pm. "aus" for origin, "in" for residence.'},
    ],
    toMemorize:['Ich heiße ___ = My name is ___','Ich komme aus ___ = I come from ___','Ich wohne in ___ = I live in ___','Guten Morgen / Tag / Abend','Auf Wiedersehen (formal) | Tschüss (informal)'],
    toUnderstand:['sein is irregular — memorize all 6 forms','W-questions invert: W-word → verb → subject','"aus" for origin, "in" for current location'],
    dialogue:[
      {speaker:'Anna',text:'Guten Morgen! Wie heißen Sie?',translation:'Good morning! What is your name?'},
      {speaker:'Klaus',text:'Guten Morgen! Ich heiße Klaus Müller. Und Sie?',translation:'Good morning! My name is Klaus Müller. And you?'},
      {speaker:'Anna',text:'Ich bin Anna Schmidt. Woher kommen Sie?',translation:'I am Anna Schmidt. Where are you from?'},
      {speaker:'Klaus',text:'Ich komme aus München. Und Sie, Frau Schmidt?',translation:'I come from Munich. And you, Mrs. Schmidt?'},
      {speaker:'Anna',text:'Ich komme aus Wien, aber ich wohne jetzt in Berlin.',translation:'I come from Vienna, but I live in Berlin now.'},
      {speaker:'Klaus',text:'Oh, interessant! Sprechen Sie auch Englisch?',translation:'Oh, interesting! Do you also speak English?'},
      {speaker:'Anna',text:'Ja, ich spreche Englisch und ein bisschen Französisch.',translation:'Yes, I speak English and a little French.'},
      {speaker:'Klaus',text:'Sehr gut! Auf Wiedersehen, Frau Schmidt!',translation:'Very good! Goodbye, Mrs. Schmidt!'},
    ],
    listeningItems:[
      {audio:'Guten Morgen!',question:'What greeting did you hear?',options:['Guten Morgen!','Guten Abend!','Guten Tag!','Auf Wiedersehen!'],answer:'Guten Morgen!'},
      {audio:'Ich heiße Klaus.',question:'What is the speaker\'s name?',options:['Klaus','Anna','Maria','Thomas'],answer:'Klaus'},
      {audio:'Ich komme aus München.',question:'Where does the speaker come from?',options:['München','Berlin','Wien','Hamburg'],answer:'München'},
      {audio:'Auf Wiedersehen!',question:'What did you hear?',options:['Auf Wiedersehen!','Tschüss!','Hallo!','Guten Tag!'],answer:'Auf Wiedersehen!'},
    ],
    culturalNote:'In Germany people shake hands when meeting someone new. Always use formal "Sie" with strangers — switching to informal "du" is initiated by the older or higher-ranking person.',
  },
  {
    id:'course-a1-02',unit:2,level:'A1',emoji:'👨‍👩‍👧',
    title:'Family & Relationships',
    description:'Talk about family members, describe relationships, and use possessive articles.',
    vocabulary:[
      {german:'Familie',english:'family',article:'die',wordType:'noun',example:'Meine Familie ist groß.',exampleTranslation:'My family is big.'},
      {german:'Mutter',english:'mother',article:'die',wordType:'noun',example:'Meine Mutter heißt Sandra.',exampleTranslation:'My mother\'s name is Sandra.'},
      {german:'Vater',english:'father',article:'der',wordType:'noun',example:'Mein Vater arbeitet in Hamburg.',exampleTranslation:'My father works in Hamburg.'},
      {german:'Bruder',english:'brother',article:'der',wordType:'noun',example:'Ich habe einen Bruder.',exampleTranslation:'I have a brother.'},
      {german:'Schwester',english:'sister',article:'die',wordType:'noun',example:'Meine Schwester ist 15 Jahre alt.',exampleTranslation:'My sister is 15 years old.'},
      {german:'Eltern',english:'parents (plural)',article:'die',wordType:'noun',example:'Meine Eltern wohnen in Berlin.',exampleTranslation:'My parents live in Berlin.'},
      {german:'Kind',english:'child',article:'das',wordType:'noun',example:'Das Kind spielt im Garten.',exampleTranslation:'The child plays in the garden.'},
      {german:'Großmutter',english:'grandmother',article:'die',wordType:'noun',example:'Meine Großmutter kocht sehr gut.',exampleTranslation:'My grandmother cooks very well.'},
      {german:'Großvater',english:'grandfather',article:'der',wordType:'noun',example:'Mein Großvater ist 75 Jahre alt.',exampleTranslation:'My grandfather is 75 years old.'},
      {german:'Geschwister',english:'siblings (plural)',article:'die',wordType:'noun',example:'Ich habe zwei Geschwister.',exampleTranslation:'I have two siblings.'},
      {german:'alt',english:'old',article:null,wordType:'adjective',example:'Wie alt bist du?',exampleTranslation:'How old are you?'},
      {german:'jung',english:'young',article:null,wordType:'adjective',example:'Meine Schwester ist sehr jung.',exampleTranslation:'My sister is very young.'},
    ],
    grammarTopics:[
      {title:'Possessive Articles: mein/meine',rule:'mein = my (der/das nouns), meine = my (die nouns and plurals).',examples:[{german:'Mein Bruder ist groß.',english:'My brother is tall.'},{german:'Meine Schwester ist klein.',english:'My sister is short.'}],tip:'If the noun takes "die", use "meine". If "der" or "das", use "mein".'},
      {title:'haben (to have)',rule:'ich habe, du hast, er/sie hat, wir haben, ihr habt, sie/Sie haben.',examples:[{german:'Ich habe einen Bruder.',english:'I have a brother.'},{german:'Hast du Geschwister?',english:'Do you have siblings?'}],tip:'"hat" (he/she has) is short — only 3 letters, no -e ending.'},
    ],
    quizQuestions:[
      {id:'q2u1a',question:'Article for "Mutter" (mother)?',options:['die','der','das','eine'],correctAnswer:'die',explanation:'"die Mutter" — feminine. Female family members use "die".'},
      {id:'q2u1b',question:'"Ich ___ zwei Geschwister." — correct verb?',options:['habe','bin','komme','hast'],correctAnswer:'habe',explanation:'haben → ich habe = I have.'},
      {id:'q2u1c',question:'"mein" is used with:',options:['der and das nouns','die nouns only','plural nouns','all nouns'],correctAnswer:'der and das nouns',explanation:'mein = masculine (der) + neuter (das). meine = feminine (die) + plural.'},
      {id:'q2u1d',question:'What does "Geschwister" mean?',options:['siblings','children','parents','grandparents'],correctAnswer:'siblings',explanation:'"Geschwister" is the collective plural for brothers and sisters.'},
      {id:'q2u1e',question:'"Wie alt ___ du?" — correct verb?',options:['bist','hast','ist','bin'],correctAnswer:'bist',explanation:'sein → du bist = you are.'},
      {id:'q2u1f',question:'"___ Vater arbeitet in Berlin."',options:['Mein','Meine','Meinen','Meiner'],correctAnswer:'Mein',explanation:'"der Vater" is masculine → mein Vater.'},
    ],
    fillInTheBlank:[
      {id:'f2u1a',sentence:'Ich habe eine ___ und einen Bruder.',answer:'Schwester',hint:'Female sibling',explanation:'die Schwester = sister'},
      {id:'f2u1b',sentence:'___ Mutter heißt Petra.',answer:'Meine',hint:'My (feminine noun)',explanation:'Mutter is die → meine'},
      {id:'f2u1c',sentence:'Wie alt ___ du?',answer:'bist',hint:'sein, du-form',explanation:'sein → du bist'},
      {id:'f2u1d',sentence:'Meine Eltern ___ in München.',answer:'wohnen',hint:'wohnen, plural',explanation:'Eltern = plural → wohnen'},
    ],
    exampleSentences:[
      {german:'Meine Familie hat vier Personen.',english:'My family has four people.'},
      {german:'Ich habe einen Bruder und eine Schwester.',english:'I have a brother and a sister.'},
      {german:'Mein Vater ist 50 Jahre alt.',english:'My father is 50 years old.'},
      {german:'Meine Großeltern wohnen auf dem Land.',english:'My grandparents live in the countryside.'},
      {german:'Hast du Geschwister?',english:'Do you have siblings?'},
    ],
    homework:[
      {id:'h2u1a',question:'Describe your family in 4 sentences.',hint:'Meine Familie hat... / Ich habe... / Mein/Meine ___ heißt/ist...',answer:'Meine Familie hat vier Personen. Ich habe einen Bruder. Meine Mutter heißt Anna. Mein Vater ist 45 Jahre alt.',explanation:'Combine "haben" for what you have, "sein" for age/descriptions.'},
      {id:'h2u1b',question:'Explain mein vs meine and give two examples each.',hint:'Think about noun gender',answer:'mein = der/das (mein Vater, mein Kind); meine = die + plural (meine Mutter, meine Eltern)',explanation:'Possessives match noun gender, not the owner\'s gender.'},
      {id:'h2u1c',question:'Conjugate "haben" for all 6 pronouns.',hint:'er/sie/es form: just "hat"',answer:'ich habe, du hast, er/sie hat, wir haben, ihr habt, sie/Sie haben',explanation:'"hat" is irregular — short form, no -e ending.'},
      {id:'h2u1d',question:'Translate: "My grandmother is 70 years old and she lives in Hamburg."',hint:'Großmutter + Jahre alt + wohnen',answer:'Meine Großmutter ist 70 Jahre alt und sie wohnt in Hamburg.',explanation:'wohnen → sie wohnt (remove -en, add -t).'},
    ],
    toMemorize:['die Mutter, der Vater, das Kind','die Geschwister (siblings, always plural)','mein (der/das) vs meine (die/plural)','ich habe / du hast / er hat / wir haben','Wie alt bist du? = How old are you?'],
    toUnderstand:['Possessives match noun gender, not owner gender','haben is slightly irregular (hat for er/sie)','Female persons almost always take "die"'],
    dialogue:[
      {speaker:'Lena',text:'Erzähl mir von deiner Familie!',translation:'Tell me about your family!'},
      {speaker:'Max',text:'Ich habe eine kleine Familie. Meine Eltern und ich.',translation:'I have a small family. My parents and I.'},
      {speaker:'Lena',text:'Hast du Geschwister?',translation:'Do you have siblings?'},
      {speaker:'Max',text:'Nein, ich bin Einzelkind. Und du?',translation:'No, I am an only child. And you?'},
      {speaker:'Lena',text:'Ich habe einen Bruder und eine Schwester.',translation:'I have a brother and a sister.'},
      {speaker:'Max',text:'Wie alt sind sie?',translation:'How old are they?'},
      {speaker:'Lena',text:'Mein Bruder ist 20 und meine Schwester ist 16 Jahre alt.',translation:'My brother is 20 and my sister is 16 years old.'},
      {speaker:'Max',text:'Das ist schön! Eine große Familie.',translation:'That\'s nice! A big family.'},
    ],
    listeningItems:[
      {audio:'Ich habe einen Bruder.',question:'What does the speaker have?',options:['a brother','a sister','a child','siblings'],answer:'a brother'},
      {audio:'Meine Mutter ist 45 Jahre alt.',question:'How old is the speaker\'s mother?',options:['45','54','40','50'],answer:'45'},
      {audio:'Hast du Geschwister?',question:'What is being asked?',options:['Do you have siblings?','How old are you?','Where do you live?','What is your name?'],answer:'Do you have siblings?'},
      {audio:'Meine Familie hat vier Personen.',question:'How many people in the family?',options:['4','3','5','2'],answer:'4'},
    ],
    culturalNote:'German families are typically small — 1-2 children is common. "Einzelkind" (only child) is very common. Grandparents often play an active role in childcare.',
  },
  {
    id:'course-a1-03',unit:3,level:'A1',emoji:'⏰',
    title:'Daily Routine',
    description:'Describe your daily schedule, tell the time, and use separable verbs.',
    vocabulary:[
      {german:'aufstehen',english:'to get up (separable)',article:null,wordType:'verb',example:'Ich stehe um 7 Uhr auf.',exampleTranslation:'I get up at 7 o\'clock.'},
      {german:'frühstücken',english:'to have breakfast',article:null,wordType:'verb',example:'Ich frühstücke um halb acht.',exampleTranslation:'I have breakfast at 7:30.'},
      {german:'arbeiten',english:'to work',article:null,wordType:'verb',example:'Ich arbeite von 9 bis 17 Uhr.',exampleTranslation:'I work from 9 to 5.'},
      {german:'schlafen',english:'to sleep',article:null,wordType:'verb',example:'Ich schlafe 8 Stunden.',exampleTranslation:'I sleep 8 hours.'},
      {german:'Morgen',english:'morning',article:'der',wordType:'noun',example:'Am Morgen trinke ich Kaffee.',exampleTranslation:'In the morning I drink coffee.'},
      {german:'Abend',english:'evening',article:'der',wordType:'noun',example:'Am Abend lese ich ein Buch.',exampleTranslation:'In the evening I read a book.'},
      {german:'Uhr',english:'o\'clock / clock',article:'die',wordType:'noun',example:'Es ist 3 Uhr.',exampleTranslation:'It is 3 o\'clock.'},
      {german:'früh',english:'early',article:null,wordType:'adverb',example:'Ich stehe früh auf.',exampleTranslation:'I get up early.'},
      {german:'spät',english:'late',article:null,wordType:'adverb',example:'Er kommt spät nach Hause.',exampleTranslation:'He comes home late.'},
      {german:'immer',english:'always',article:null,wordType:'adverb',example:'Ich trinke immer Kaffee.',exampleTranslation:'I always drink coffee.'},
      {german:'manchmal',english:'sometimes',article:null,wordType:'adverb',example:'Manchmal esse ich Pizza.',exampleTranslation:'Sometimes I eat pizza.'},
      {german:'Frühstück',english:'breakfast',article:'das',wordType:'noun',example:'Das Frühstück ist fertig.',exampleTranslation:'Breakfast is ready.'},
    ],
    grammarTopics:[
      {title:'Separable Verbs',rule:'Verbs with prefixes that split off to the END in main clauses. aufstehen → Ich stehe um 6 auf. Other examples: anfangen, aufmachen, einschlafen.',examples:[{german:'Ich stehe um 6 Uhr auf.',english:'I get up at 6 o\'clock.'},{german:'Er macht das Fenster auf.',english:'He opens the window.'}],tip:'Spot the prefix (auf-, an-, ab-, ein-...). It always jumps to the end!'},
      {title:'Telling Time',rule:'Es ist + time. Exact: Es ist drei Uhr. Half: Es ist halb vier = 3:30 (half BEFORE four!). Quarter: Viertel nach drei = 3:15, Viertel vor vier = 3:45.',examples:[{german:'Es ist halb acht.',english:'It is 7:30.'},{german:'Es ist Viertel nach zwei.',english:'It is 2:15.'}],tip:'"halb vier" = 3:30, NOT 4:30! "Half" refers to the NEXT hour in German.'},
    ],
    quizQuestions:[
      {id:'q3u1a',question:'What does "aufstehen" mean?',options:['to get up','to go to sleep','to eat breakfast','to go to work'],correctAnswer:'to get up',explanation:'"auf" (up) + "stehen" (to stand) = to get up.'},
      {id:'q3u1b',question:'"Es ist halb acht." — What time is it?',options:['7:30','8:30','8:00','7:00'],correctAnswer:'7:30',explanation:'"halb acht" = half before eight = 7:30. Not 8:30!'},
      {id:'q3u1c',question:'In "Ich stehe um 7 Uhr auf" — where does the prefix go?',options:['at the end','at the beginning','after "ich"','attached to "stehe"'],correctAnswer:'at the end',explanation:'Separable prefix always moves to the end of the main clause.'},
      {id:'q3u1d',question:'"Ich ___ immer früh auf." — correct verb form?',options:['stehe','stehen','aufstehe','stehst'],correctAnswer:'stehe',explanation:'aufstehen → ich stehe... auf. The prefix splits off.'},
      {id:'q3u1e',question:'"Es ist Viertel nach drei." = ?',options:['3:15','3:45','2:45','3:30'],correctAnswer:'3:15',explanation:'"nach" = after. Viertel nach drei = quarter after three = 3:15.'},
      {id:'q3u1f',question:'What does "manchmal" mean?',options:['sometimes','always','never','often'],correctAnswer:'sometimes',explanation:'"manchmal" = sometimes. "immer" = always, "nie" = never.'},
    ],
    fillInTheBlank:[
      {id:'f3u1a',sentence:'Ich ___ um 7 Uhr auf.',answer:'stehe',hint:'aufstehen, ich-form (prefix splits!)',explanation:'aufstehen → ich stehe ... auf'},
      {id:'f3u1b',sentence:'Es ___ halb neun.',answer:'ist',hint:'sein, es-form',explanation:'es ist = it is'},
      {id:'f3u1c',sentence:'Ich arbeite ___ 9 bis 17 Uhr.',answer:'von',hint:'"from" in German',explanation:'"von ... bis" = from ... to'},
      {id:'f3u1d',sentence:'___ Morgen trinke ich Kaffee.',answer:'Am',hint:'"In the morning" = am Morgen',explanation:'"am Morgen" = in the morning (am = an dem)'},
    ],
    exampleSentences:[
      {german:'Ich stehe um 6 Uhr auf und frühstücke um halb sieben.',english:'I get up at 6 and have breakfast at 6:30.'},
      {german:'Mein Arbeitstag beginnt um 9 Uhr.',english:'My workday starts at 9 o\'clock.'},
      {german:'Am Abend schaue ich manchmal fern.',english:'In the evening I sometimes watch TV.'},
      {german:'Ich schlafe immer 8 Stunden.',english:'I always sleep 8 hours.'},
      {german:'Wann stehst du auf?',english:'When do you get up?'},
    ],
    homework:[
      {id:'h3u1a',question:'Describe your typical day using 5 sentences with at least 2 separable verbs.',hint:'aufstehen, anfangen, aufmachen, einschlafen',answer:'Ich stehe um 7 Uhr auf. Ich frühstücke um halb acht. Die Arbeit fängt um 9 Uhr an. Ich höre um 18 Uhr auf. Ich schlafe um 23 Uhr ein.',explanation:'Separable prefixes always go to the end in main clauses.'},
      {id:'h3u1b',question:'Write these times in German: 8:00, 8:30, 8:15, 8:45.',hint:'halb, Viertel nach, Viertel vor',answer:'acht Uhr / halb neun / Viertel nach acht / Viertel vor neun',explanation:'"halb neun" = 8:30 (half before nine). Very tricky!'},
      {id:'h3u1c',question:'What is the difference between "immer", "manchmal", and "nie"?',hint:'Frequency adverbs',answer:'immer = always, manchmal = sometimes, nie = never',explanation:'Frequency adverbs come after the verb: Ich trinke immer Kaffee.'},
      {id:'h3u1d',question:'Translate: "He always gets up early and works from 8 to 6."',hint:'aufstehen (separable) + von...bis',answer:'Er steht immer früh auf und arbeitet von 8 bis 18 Uhr.',explanation:'Separable "auf" goes to end. "von...bis" = from...to.'},
    ],
    toMemorize:['aufstehen → ich stehe...auf (prefix splits!)','halb acht = 7:30 (NOT 8:30!)','am Morgen / am Abend / am Nachmittag','immer/manchmal/oft/nie = always/sometimes/often/never','von...bis = from...to'],
    toUnderstand:['Separable verb prefix always goes to sentence end','halb + next hour = 30 minutes BEFORE that hour','Frequency adverbs go after the verb'],
    dialogue:[
      {speaker:'Tom',text:'Wann stehst du normalerweise auf?',translation:'When do you normally get up?'},
      {speaker:'Sara',text:'Ich stehe um 6 Uhr auf. Ich muss früh arbeiten.',translation:'I get up at 6. I have to work early.'},
      {speaker:'Tom',text:'Das ist sehr früh! Und wann frühstückst du?',translation:'That\'s very early! And when do you have breakfast?'},
      {speaker:'Sara',text:'Ich frühstücke um halb sieben. Nur Kaffee und Toast.',translation:'I have breakfast at 6:30. Just coffee and toast.'},
      {speaker:'Tom',text:'Ich stehe immer spät auf — um halb neun.',translation:'I always get up late — at 8:30.'},
      {speaker:'Sara',text:'Und wann fängt deine Arbeit an?',translation:'And when does your work start?'},
      {speaker:'Tom',text:'Um 10 Uhr. Ich arbeite von zu Hause.',translation:'At 10 o\'clock. I work from home.'},
      {speaker:'Sara',text:'Das klingt gut! Ich höre um 17 Uhr auf.',translation:'That sounds good! I finish at 5 o\'clock.'},
    ],
    listeningItems:[
      {audio:'Ich stehe um sieben Uhr auf.',question:'What time does the speaker get up?',options:['7:00','6:00','8:00','7:30'],answer:'7:00'},
      {audio:'Es ist halb neun.',question:'What time is it?',options:['8:30','9:30','9:00','8:00'],answer:'8:30'},
      {audio:'Ich arbeite von neun bis fünf.',question:'What are the work hours?',options:['9 to 5','8 to 4','9 to 6','10 to 5'],answer:'9 to 5'},
      {audio:'Manchmal schlafe ich spät.',question:'What does the speaker sometimes do?',options:['sleep late','get up early','work late','eat late'],answer:'sleep late'},
    ],
    culturalNote:'Germans are known for punctuality — "pünktlich" is a cultural virtue. Being 5 minutes late is considered rude. Sunday (Sonntag) is a rest day — most shops are closed by law.',
  },
  {
    id:'course-a1-04',unit:4,level:'A1',emoji:'🛒',
    title:'Shopping & Numbers',
    description:'Count to 100, use prices, shop for items, and ask how much things cost.',
    vocabulary:[
      {german:'kaufen',english:'to buy',article:null,wordType:'verb',example:'Ich kaufe ein Buch.',exampleTranslation:'I am buying a book.'},
      {german:'kosten',english:'to cost',article:null,wordType:'verb',example:'Was kostet das?',exampleTranslation:'What does that cost?'},
      {german:'bezahlen',english:'to pay',article:null,wordType:'verb',example:'Ich bezahle mit Karte.',exampleTranslation:'I pay by card.'},
      {german:'Geld',english:'money',article:'das',wordType:'noun',example:'Ich habe kein Geld.',exampleTranslation:'I have no money.'},
      {german:'Euro',english:'euro',article:'der',wordType:'noun',example:'Das kostet fünf Euro.',exampleTranslation:'That costs five euros.'},
      {german:'teuer',english:'expensive',article:null,wordType:'adjective',example:'Das ist zu teuer!',exampleTranslation:'That is too expensive!'},
      {german:'billig',english:'cheap',article:null,wordType:'adjective',example:'Das ist sehr billig.',exampleTranslation:'That is very cheap.'},
      {german:'Supermarkt',english:'supermarket',article:'der',wordType:'noun',example:'Ich gehe in den Supermarkt.',exampleTranslation:'I go to the supermarket.'},
      {german:'Kasse',english:'checkout / register',article:'die',wordType:'noun',example:'Wo ist die Kasse?',exampleTranslation:'Where is the checkout?'},
      {german:'brauchen',english:'to need',article:null,wordType:'verb',example:'Ich brauche Milch und Brot.',exampleTranslation:'I need milk and bread.'},
      {german:'Quittung',english:'receipt',article:'die',wordType:'noun',example:'Kann ich eine Quittung haben?',exampleTranslation:'Can I have a receipt?'},
      {german:'Preis',english:'price',article:'der',wordType:'noun',example:'Der Preis ist zu hoch.',exampleTranslation:'The price is too high.'},
    ],
    grammarTopics:[
      {title:'Numbers 1-100',rule:'1-12 are unique. 13-19 add -zehn (dreizehn...). 20,30...: zwanzig, dreißig, vierzig... Compound: 21 = einundzwanzig (one-and-twenty).',examples:[{german:'Das kostet dreiundzwanzig Euro.',english:'That costs 23 euros.'},{german:'Ich brauche fünfzig Gramm.',english:'I need 50 grams.'}],tip:'German counts backwards: 21 = "one and twenty". Write all as ONE word.'},
      {title:'kein / keine (no, not a)',rule:'kein = no (der/das nouns), keine = no (die nouns and plurals). Negates nouns directly.',examples:[{german:'Ich habe kein Geld.',english:'I have no money.'},{german:'Ich habe keine Zeit.',english:'I have no time.'}],tip:'"kein/keine" follows the same pattern as "ein/eine".'},
    ],
    quizQuestions:[
      {id:'q4u1a',question:'"Was ___ das?" — Which verb means "costs"?',options:['kostet','kauft','bezahlt','ist'],correctAnswer:'kostet',explanation:'"kosten" = to cost. Was kostet das? = What does that cost?'},
      {id:'q4u1b',question:'How do you say 21 in German?',options:['einundzwanzig','zwanzigein','zwanzigeins','einzwanzig'],correctAnswer:'einundzwanzig',explanation:'German: unit + "und" + tens. 21 = ein+und+zwanzig.'},
      {id:'q4u1c',question:'"Ich habe ___ Geld." — "no money"?',options:['kein','keine','nicht','nein'],correctAnswer:'kein',explanation:'"Geld" is neuter (das Geld) → kein Geld.'},
      {id:'q4u1d',question:'What does "teuer" mean?',options:['expensive','cheap','free','new'],correctAnswer:'expensive',explanation:'"teuer" = expensive. "billig" = cheap.'},
      {id:'q4u1e',question:'Where do you pay in a German shop?',options:['an der Kasse','im Supermarkt','beim Preis','in der Quittung'],correctAnswer:'an der Kasse',explanation:'"an der Kasse" = at the checkout.'},
      {id:'q4u1f',question:'"Das ___ fünf Euro." — correct verb?',options:['kostet','kauft','bezahlt','hat'],correctAnswer:'kostet',explanation:'kosten → es kostet = it costs.'},
    ],
    fillInTheBlank:[
      {id:'f4u1a',sentence:'Was ___ dieses Buch?',answer:'kostet',hint:'to cost, es-form',explanation:'kosten → es kostet'},
      {id:'f4u1b',sentence:'Ich habe ___ Zeit.',answer:'keine',hint:'no (die Zeit = feminine)',explanation:'"die Zeit" → keine Zeit'},
      {id:'f4u1c',sentence:'Das ist zu ___!',answer:'teuer',hint:'expensive',explanation:'"teuer" = expensive'},
      {id:'f4u1d',sentence:'Ich ___ mit Karte.',answer:'bezahle',hint:'bezahlen, ich-form',explanation:'bezahlen → ich bezahle'},
    ],
    exampleSentences:[
      {german:'Was kostet das? — Das kostet zwölf Euro fünfzig.',english:'How much is that? — That costs 12.50 euros.'},
      {german:'Ich brauche Brot, Milch und Eier.',english:'I need bread, milk, and eggs.'},
      {german:'Haben Sie das billiger?',english:'Do you have that cheaper?'},
      {german:'Kann ich mit Karte bezahlen?',english:'Can I pay by card?'},
      {german:'Wo ist die Kasse, bitte?',english:'Where is the checkout, please?'},
    ],
    homework:[
      {id:'h4u1a',question:'Write these numbers in German: 15, 37, 64, 99.',hint:'13-19: -zehn. 21-99: unit+und+tens',answer:'fünfzehn, siebenunddreißig, vierundsechzig, neunundneunzig',explanation:'German compound numbers are one word.'},
      {id:'h4u1b',question:'Difference between "kein" and "keine"? Give two examples each.',hint:'Think about noun gender',answer:'kein = der/das (kein Mann, kein Kind); keine = die + plural (keine Frau, keine Bücher)',explanation:'"kein/keine" mirrors "ein/eine" but also has a plural form.'},
      {id:'h4u1c',question:'Write a short shopping dialogue: ask price, say too expensive, ask if cheaper.',hint:'Was kostet...? / Das ist zu teuer! / Haben Sie...billiger?',answer:'"Was kostet das?" — "Zwanzig Euro." — "Das ist zu teuer! Haben Sie etwas Billigeres?"',explanation:'Common shopping conversation pattern.'},
      {id:'h4u1d',question:'Translate: "I need 3 things: milk, bread, eggs. I have no money."',hint:'brauchen + list + kein',answer:'Ich brauche drei Dinge: Milch, Brot und Eier. Ich habe kein Geld.',explanation:'"kein Geld" — das Geld is neuter → kein.'},
    ],
    toMemorize:['Was kostet das? = How much is that?','eins, zwei...zehn, zwanzig, dreißig...hundert','einundzwanzig (unit+und+tens)','kein (der/das) vs keine (die/plural)','teuer = expensive, billig = cheap'],
    toUnderstand:['German numbers: unit THEN tens (einundzwanzig not zwanzigein)','kein/keine negates nouns (I have no...)','kosten is a regular verb: es kostet'],
    dialogue:[
      {speaker:'Kunde',text:'Entschuldigung, was kostet dieses T-Shirt?',translation:'Excuse me, how much is this T-shirt?'},
      {speaker:'Verkäufer',text:'Das kostet neunzehn Euro neunzig.',translation:'That costs 19.90 euros.'},
      {speaker:'Kunde',text:'Das ist etwas teuer. Haben Sie es billiger?',translation:'That\'s a bit expensive. Do you have it cheaper?'},
      {speaker:'Verkäufer',text:'Ja, dieses hier kostet nur zwölf Euro.',translation:'Yes, this one here costs only 12 euros.'},
      {speaker:'Kunde',text:'Gut! Ich nehme es. Kann ich mit Karte bezahlen?',translation:'Good! I\'ll take it. Can I pay by card?'},
      {speaker:'Verkäufer',text:'Ja, natürlich. Die Kasse ist dort drüben.',translation:'Yes, of course. The checkout is over there.'},
      {speaker:'Kunde',text:'Danke. Kann ich eine Quittung haben?',translation:'Thank you. Can I have a receipt?'},
      {speaker:'Verkäufer',text:'Hier ist Ihre Quittung. Auf Wiedersehen!',translation:'Here is your receipt. Goodbye!'},
    ],
    listeningItems:[
      {audio:'Das kostet zwanzig Euro.',question:'How much does it cost?',options:['20 euros','12 euros','22 euros','2 euros'],answer:'20 euros'},
      {audio:'Das ist zu teuer!',question:'What does the speaker think?',options:['It\'s too expensive','It\'s too cheap','It\'s just right','It\'s free'],answer:'It\'s too expensive'},
      {audio:'Ich habe kein Geld.',question:'What does the speaker say?',options:['I have no money','I have some money','I need money','I want money'],answer:'I have no money'},
      {audio:'Kann ich mit Karte bezahlen?',question:'What is the speaker asking?',options:['Can I pay by card?','Where is the checkout?','How much is it?','Can I have a receipt?'],answer:'Can I pay by card?'},
    ],
    culturalNote:'Germany is surprisingly cash-heavy — many shops still only accept cash ("nur Bargeld"). Always carry euros! "Stimmt so" (keep the change) is used when tipping. 10% tip is standard in restaurants.',
  },
  {
    id:'course-a1-05',unit:5,level:'A1',emoji:'🍽️',
    title:'Food & Drink',
    description:'Order food, talk about preferences, express hunger, and navigate a restaurant.',
    vocabulary:[
      {german:'essen',english:'to eat',article:null,wordType:'verb',example:'Ich esse gern Pizza.',exampleTranslation:'I like eating pizza.'},
      {german:'trinken',english:'to drink',article:null,wordType:'verb',example:'Was trinkst du?',exampleTranslation:'What are you drinking?'},
      {german:'Hunger',english:'hunger',article:'der',wordType:'noun',example:'Ich habe Hunger.',exampleTranslation:'I am hungry.'},
      {german:'Durst',english:'thirst',article:'der',wordType:'noun',example:'Ich habe Durst.',exampleTranslation:'I am thirsty.'},
      {german:'Brot',english:'bread',article:'das',wordType:'noun',example:'Ich esse gern Brot.',exampleTranslation:'I like eating bread.'},
      {german:'Wasser',english:'water',article:'das',wordType:'noun',example:'Ein Glas Wasser, bitte.',exampleTranslation:'A glass of water, please.'},
      {german:'Kaffee',english:'coffee',article:'der',wordType:'noun',example:'Möchten Sie Kaffee oder Tee?',exampleTranslation:'Would you like coffee or tea?'},
      {german:'Fleisch',english:'meat',article:'das',wordType:'noun',example:'Ich esse kein Fleisch.',exampleTranslation:'I do not eat meat.'},
      {german:'Gemüse',english:'vegetables',article:'das',wordType:'noun',example:'Ich esse viel Gemüse.',exampleTranslation:'I eat a lot of vegetables.'},
      {german:'schmecken',english:'to taste / taste good',article:null,wordType:'verb',example:'Das schmeckt sehr gut!',exampleTranslation:'That tastes very good!'},
      {german:'Rechnung',english:'bill / check',article:'die',wordType:'noun',example:'Die Rechnung, bitte!',exampleTranslation:'The bill, please!'},
      {german:'bestellen',english:'to order',article:null,wordType:'verb',example:'Ich möchte bestellen.',exampleTranslation:'I would like to order.'},
    ],
    grammarTopics:[
      {title:'möchten (would like)',rule:'Polite modal: ich möchte, du möchtest, er/sie möchte, wir möchten. Dependent verb goes to END.',examples:[{german:'Ich möchte ein Wasser, bitte.',english:'I would like a water, please.'},{german:'Möchtest du Kaffee?',english:'Would you like coffee?'}],tip:'Always use "möchten" in restaurants and shops — "ich will" sounds too demanding.'},
      {title:'gern / nicht gern (like / dislike)',rule:'"gern" after a verb = to like doing it. "nicht gern" = to not like it.',examples:[{german:'Ich trinke gern Kaffee.',english:'I like drinking coffee.'},{german:'Er isst nicht gern Fisch.',english:'He does not like eating fish.'}],tip:'"gern" expresses enjoyment of an activity — no direct English equivalent.'},
    ],
    quizQuestions:[
      {id:'q5u1a',question:'"Ich ___ Hunger." — correct verb?',options:['habe','bin','fühle','esse'],correctAnswer:'habe',explanation:'In German: "Ich habe Hunger" (I have hunger) = I am hungry.'},
      {id:'q5u1b',question:'How do you politely say "I would like a coffee"?',options:['Ich möchte einen Kaffee.','Ich will Kaffee.','Ich habe Kaffee.','Kaffee, bitte ich.'],correctAnswer:'Ich möchte einen Kaffee.',explanation:'"möchten" is the polite form. Always use it in restaurants.'},
      {id:'q5u1c',question:'"Das ___ sehr gut!" — correct verb for "tastes"?',options:['schmeckt','isst','kostet','klingt'],correctAnswer:'schmeckt',explanation:'"schmecken" = to taste. Das schmeckt gut = That tastes good.'},
      {id:'q5u1d',question:'"Ich esse ___ Pizza." — "I like eating pizza"?',options:['gern','gut','viel','lieber'],correctAnswer:'gern',explanation:'"gern" after the verb = to like doing something.'},
      {id:'q5u1e',question:'How do you ask for the bill in a restaurant?',options:['Die Rechnung, bitte!','Die Kasse, bitte!','Zahlen, danke!','Können Sie zahlen?'],correctAnswer:'Die Rechnung, bitte!',explanation:'"die Rechnung" = the bill. Standard restaurant phrase.'},
      {id:'q5u1f',question:'"Ich esse ___ Fleisch." — meaning "I do not eat meat"?',options:['kein','nicht','nie','nein'],correctAnswer:'kein',explanation:'"kein" negates nouns. "kein Fleisch" = no meat.'},
    ],
    fillInTheBlank:[
      {id:'f5u1a',sentence:'Ich ___ gern Kaffee.',answer:'trinke',hint:'trinken, ich-form',explanation:'trinken → ich trinke'},
      {id:'f5u1b',sentence:'Ich ___ Hunger.',answer:'habe',hint:'"I am hungry" uses haben in German',explanation:'Hunger/Durst use "haben" not "sein"'},
      {id:'f5u1c',sentence:'___ möchtest du essen?',answer:'Was',hint:'What (question word)',explanation:'"Was" = what'},
      {id:'f5u1d',sentence:'Das ___ wirklich gut!',answer:'schmeckt',hint:'to taste, es-form',explanation:'schmecken → es schmeckt'},
    ],
    exampleSentences:[
      {german:'Ich möchte ein Schnitzel und ein Bier, bitte.',english:'I would like a schnitzel and a beer, please.'},
      {german:'Schmeckt es dir?',english:'Does it taste good to you?'},
      {german:'Ich bin Vegetarier — ich esse kein Fleisch.',english:'I am a vegetarian — I do not eat meat.'},
      {german:'Die Rechnung, bitte! Wir zahlen zusammen.',english:'The bill, please! We are paying together.'},
      {german:'Was empfehlen Sie heute?',english:'What do you recommend today?'},
    ],
    homework:[
      {id:'h5u1a',question:'Write 4 foods/drinks you like and 2 you dislike using "gern" and "nicht gern".',hint:'Ich esse/trinke gern... / nicht gern...',answer:'Ich esse gern Pizza. Ich trinke gern Kaffee. Ich esse gern Salat. Ich trinke gern Tee. Ich esse nicht gern Fisch. Ich trinke nicht gern Alkohol.',explanation:'"gern" comes directly after the verb.'},
      {id:'h5u1b',question:'Why does German say "Ich habe Hunger" instead of "Ich bin hungrig"?',hint:'Common German nouns used with haben',answer:'German uses "haben" for hunger and thirst: "Ich habe Hunger/Durst". English says "to be hungry/thirsty", German says "to have hunger/thirst".',explanation:'Several states that English expresses with "to be" use "haben" in German.'},
      {id:'h5u1c',question:'Write a restaurant dialogue: order food + drink, ask for the bill.',hint:'möchten + item + bitte / Die Rechnung, bitte',answer:'Ich möchte ein Schnitzel und ein Wasser, bitte. — Gerne! — Danke. Die Rechnung, bitte!',explanation:'"möchten" for ordering; "Die Rechnung, bitte!" for the bill.'},
      {id:'h5u1d',question:'Translate: "Would you like something to eat? — Yes, I would like a salad, please."',hint:'möchten + etwas essen / Ja, ich möchte...',answer:'Möchten Sie etwas essen? — Ja, ich möchte einen Salat, bitte.',explanation:'"Möchten Sie" = Would you like (formal). "etwas essen" = something to eat.'},
    ],
    toMemorize:['Ich habe Hunger/Durst (NOT ich bin hungrig)','möchten = would like (always use in restaurants)','Das schmeckt gut! = That tastes good!','Die Rechnung, bitte! = The bill, please!','gern = like doing (Ich esse gern = I like eating)'],
    toUnderstand:['möchten sends the main verb to END','German uses "haben" for hunger/thirst, not "sein"','kein/keine negates nouns; nicht negates verbs/adjectives'],
    dialogue:[
      {speaker:'Kellner',text:'Guten Abend! Was möchten Sie bestellen?',translation:'Good evening! What would you like to order?'},
      {speaker:'Gast',text:'Ich möchte das Schnitzel, bitte. Was empfehlen Sie zu trinken?',translation:'I would like the schnitzel, please. What do you recommend to drink?'},
      {speaker:'Kellner',text:'Das Bier vom Fass ist sehr gut. Oder möchten Sie Wasser?',translation:'The draft beer is very good. Or would you like water?'},
      {speaker:'Gast',text:'Ein Wasser, bitte. Ich habe großen Durst.',translation:'A water, please. I am very thirsty.'},
      {speaker:'Kellner',text:'Sehr gerne. Haben Sie Allergien?',translation:'Of course. Do you have any allergies?'},
      {speaker:'Gast',text:'Ich esse kein Fleisch — aber Schnitzel ist okay.',translation:'I do not eat meat — but schnitzel is okay.'},
      {speaker:'Kellner',text:'Gut. Ihr Essen kommt gleich.',translation:'Good. Your food will come shortly.'},
      {speaker:'Gast',text:'Danke! Und später die Rechnung, bitte.',translation:'Thank you! And later the bill, please.'},
    ],
    listeningItems:[
      {audio:'Ich möchte ein Wasser, bitte.',question:'What does the speaker want?',options:['water','coffee','beer','juice'],answer:'water'},
      {audio:'Das schmeckt sehr gut!',question:'What does the speaker think?',options:['It tastes very good','It looks good','It smells good','It costs a lot'],answer:'It tastes very good'},
      {audio:'Die Rechnung, bitte!',question:'What is the speaker asking for?',options:['the bill','the menu','water','the waiter'],answer:'the bill'},
      {audio:'Ich habe Hunger.',question:'What does the speaker mean?',options:['I am hungry','I am thirsty','I am tired','I am full'],answer:'I am hungry'},
    ],
    culturalNote:'At a German restaurant, the waiter never brings the bill until you ask — say "Die Rechnung, bitte!" or make a writing gesture. Tipping 10% is common. "Stimmt so" = keep the change.',
  },
  {
    id:'course-a1-06',unit:6,level:'A1',emoji:'🏠',
    title:'At Home — Rooms & Furniture',
    description:'Name rooms, describe where things are, and use prepositions of place.',
    vocabulary:[
      {german:'Zimmer',english:'room',article:'das',wordType:'noun',example:'Das Zimmer ist groß.',exampleTranslation:'The room is big.'},
      {german:'Küche',english:'kitchen',article:'die',wordType:'noun',example:'Ich koche in der Küche.',exampleTranslation:'I cook in the kitchen.'},
      {german:'Schlafzimmer',english:'bedroom',article:'das',wordType:'noun',example:'Das Schlafzimmer ist klein.',exampleTranslation:'The bedroom is small.'},
      {german:'Wohnzimmer',english:'living room',article:'das',wordType:'noun',example:'Wir sitzen im Wohnzimmer.',exampleTranslation:'We sit in the living room.'},
      {german:'Badezimmer',english:'bathroom',article:'das',wordType:'noun',example:'Das Badezimmer hat eine Dusche.',exampleTranslation:'The bathroom has a shower.'},
      {german:'Tisch',english:'table',article:'der',wordType:'noun',example:'Der Tisch ist in der Küche.',exampleTranslation:'The table is in the kitchen.'},
      {german:'Stuhl',english:'chair',article:'der',wordType:'noun',example:'Ich sitze auf dem Stuhl.',exampleTranslation:'I sit on the chair.'},
      {german:'Bett',english:'bed',article:'das',wordType:'noun',example:'Das Bett ist sehr bequem.',exampleTranslation:'The bed is very comfortable.'},
      {german:'Fenster',english:'window',article:'das',wordType:'noun',example:'Das Fenster ist offen.',exampleTranslation:'The window is open.'},
      {german:'Tür',english:'door',article:'die',wordType:'noun',example:'Die Tür ist geschlossen.',exampleTranslation:'The door is closed.'},
      {german:'oben',english:'upstairs / above',article:null,wordType:'adverb',example:'Das Schlafzimmer ist oben.',exampleTranslation:'The bedroom is upstairs.'},
      {german:'neben',english:'next to',article:null,wordType:'preposition',example:'Das Sofa steht neben dem Tisch.',exampleTranslation:'The sofa stands next to the table.'},
    ],
    grammarTopics:[
      {title:'Prepositions of Place + Dative',rule:'Location prepositions (in, an, auf, neben, zwischen, vor, hinter, über, unter) use DATIVE when describing WHERE something IS. der→dem, die→der, das→dem.',examples:[{german:'Das Buch liegt auf dem Tisch.',english:'The book is on the table.'},{german:'Die Lampe hängt über dem Bett.',english:'The lamp hangs above the bed.'}],tip:'Location (where?) = dative. Movement (where to?) = accusative. "liegt AUF DEM Tisch" vs "lege AUF DEN Tisch."'},
      {title:'es gibt (there is / there are)',rule:'"Es gibt" + accusative = there is/are. Always "gibt", regardless of singular or plural.',examples:[{german:'Es gibt ein Sofa im Wohnzimmer.',english:'There is a sofa in the living room.'},{german:'Es gibt drei Zimmer.',english:'There are three rooms.'}],tip:'"Es gibt" never changes — always "gibt", never "geben".'},
    ],
    quizQuestions:[
      {id:'q6u1a',question:'What is "das Schlafzimmer"?',options:['bedroom','kitchen','bathroom','living room'],correctAnswer:'bedroom',explanation:'"Schlaf" = sleep + "Zimmer" = room → bedroom.'},
      {id:'q6u1b',question:'"Das Buch liegt ___ dem Tisch." (on the table)',options:['auf','in','an','neben'],correctAnswer:'auf',explanation:'"auf" = on (a horizontal surface).'},
      {id:'q6u1c',question:'"Es ___ ein Sofa im Zimmer."',options:['gibt','geben','hat','ist'],correctAnswer:'gibt',explanation:'"es gibt" = there is/are. "gibt" never changes form.'},
      {id:'q6u1d',question:'Which room is "die Küche"?',options:['kitchen','bedroom','bathroom','hallway'],correctAnswer:'kitchen',explanation:'"die Küche" = the kitchen.'},
      {id:'q6u1e',question:'"Das Sofa steht ___ dem Tisch." (next to)',options:['neben','über','unter','hinter'],correctAnswer:'neben',explanation:'"neben" = next to.'},
      {id:'q6u1f',question:'Dative of "der Tisch" is:',options:['dem Tisch','den Tisch','des Tisches','die Tisch'],correctAnswer:'dem Tisch',explanation:'der (masculine) → dem in dative.'},
    ],
    fillInTheBlank:[
      {id:'f6u1a',sentence:'Ich schlafe im ___ .',answer:'Schlafzimmer',hint:'room for sleeping',explanation:'Schlaf+zimmer = bedroom'},
      {id:'f6u1b',sentence:'Das Buch liegt ___ dem Tisch.',answer:'auf',hint:'on (horizontal surface)',explanation:'"auf" = on. Location → dative → dem Tisch'},
      {id:'f6u1c',sentence:'Es ___ drei Zimmer in meiner Wohnung.',answer:'gibt',hint:'there are',explanation:'"es gibt" = there is/are'},
      {id:'f6u1d',sentence:'Die Tür ist ___.',answer:'geschlossen',hint:'closed / shut',explanation:'"geschlossen" = closed'},
    ],
    exampleSentences:[
      {german:'Meine Wohnung hat drei Zimmer.',english:'My apartment has three rooms.'},
      {german:'Das Sofa steht im Wohnzimmer neben dem Fenster.',english:'The sofa is in the living room next to the window.'},
      {german:'Es gibt eine Küche und ein Bad.',english:'There is a kitchen and a bathroom.'},
      {german:'Wo ist das Badezimmer? — Es ist oben links.',english:'Where is the bathroom? — It is upstairs on the left.'},
      {german:'Ich lege das Buch auf den Tisch.',english:'I put the book on the table.'},
    ],
    homework:[
      {id:'h6u1a',question:'Describe your home: how many rooms, what furniture is where.',hint:'Meine Wohnung hat... / Im Wohnzimmer gibt es... / Das Schlafzimmer hat...',answer:'Meine Wohnung hat vier Zimmer. Im Wohnzimmer gibt es ein Sofa. Das Schlafzimmer hat ein Bett und einen Schrank.',explanation:'Use "es gibt" + accusative or "hat" + accusative to describe contents.'},
      {id:'h6u1b',question:'Explain location vs movement: "Das Buch liegt auf dem Tisch" vs "Ich lege das Buch auf den Tisch."',hint:'Dative (where?) vs accusative (where to?)',answer:'Lying on the table (location) = auf dem Tisch (dative). Putting on the table (movement) = auf den Tisch (accusative).',explanation:'Same preposition, different case: location = dative, directed movement = accusative.'},
      {id:'h6u1c',question:'Translate: "There is a big bedroom upstairs and a small kitchen downstairs."',hint:'es gibt + adjective + room + oben/unten',answer:'Es gibt ein großes Schlafzimmer oben und eine kleine Küche unten.',explanation:'Adjective endings: großes (neuter), kleine (feminine after ein-article).'},
      {id:'h6u1d',question:'Where are these? Book/table, lamp/bedroom, sofa/living room.',hint:'Das ___ liegt/steht/hängt in/auf/im...',answer:'Das Buch liegt auf dem Tisch. Die Lampe hängt im Schlafzimmer. Das Sofa steht im Wohnzimmer.',explanation:'liegen=lying flat, stehen=standing, hängen=hanging.'},
    ],
    toMemorize:['das Wohnzimmer, die Küche, das Schlafzimmer, das Badezimmer','auf dem Tisch (location, dative) vs auf den Tisch (movement, accusative)','es gibt = there is/are (always "gibt")','der→dem, die→der, das→dem in dative','neben/vor/hinter/über/unter + dative for location'],
    toUnderstand:['Two-way prepositions: dative for location, accusative for directed movement','es gibt is impersonal and never changes form','Compound nouns: Schlaf+Zimmer, Wohn+Zimmer, Bad+Zimmer'],
    dialogue:[
      {speaker:'Paul',text:'Wie ist deine neue Wohnung?',translation:'How is your new apartment?'},
      {speaker:'Julia',text:'Sie ist schön! Es gibt drei Zimmer: ein Wohnzimmer, ein Schlafzimmer und eine Küche.',translation:'It is nice! There are three rooms: a living room, a bedroom and a kitchen.'},
      {speaker:'Paul',text:'Ist sie groß?',translation:'Is it big?'},
      {speaker:'Julia',text:'Das Wohnzimmer ist groß, aber das Schlafzimmer ist klein.',translation:'The living room is big, but the bedroom is small.'},
      {speaker:'Paul',text:'Wo steht dein Sofa?',translation:'Where is your sofa?'},
      {speaker:'Julia',text:'Das Sofa steht im Wohnzimmer neben dem Fenster.',translation:'The sofa is in the living room next to the window.'},
      {speaker:'Paul',text:'Klingt gemütlich! Gibt es auch einen Balkon?',translation:'Sounds cozy! Is there also a balcony?'},
      {speaker:'Julia',text:'Ja! Ich sitze abends gern auf dem Balkon.',translation:'Yes! I like sitting on the balcony in the evenings.'},
    ],
    listeningItems:[
      {audio:'Das Sofa steht im Wohnzimmer.',question:'Where is the sofa?',options:['in the living room','in the bedroom','in the kitchen','in the bathroom'],answer:'in the living room'},
      {audio:'Es gibt drei Zimmer.',question:'How many rooms are there?',options:['3','2','4','1'],answer:'3'},
      {audio:'Das Buch liegt auf dem Tisch.',question:'Where is the book?',options:['on the table','under the table','next to the table','above the table'],answer:'on the table'},
      {audio:'Das Schlafzimmer ist oben.',question:'Where is the bedroom?',options:['upstairs','downstairs','on the left','in the middle'],answer:'upstairs'},
    ],
    culturalNote:'"Gemütlichkeit" (coziness/comfort) is a core German cultural value. Removing shoes at the door is standard — guests are often offered Hausschuhe (house slippers).',
  },
  {
    id:'course-a1-07',unit:7,level:'A1',emoji:'🗺️',
    title:'Directions & Transport',
    description:'Ask for and give directions, use transport vocabulary, and navigate a city.',
    vocabulary:[
      {german:'links',english:'left',article:null,wordType:'adverb',example:'Biegen Sie links ab.',exampleTranslation:'Turn left.'},
      {german:'rechts',english:'right',article:null,wordType:'adverb',example:'Die Bank ist rechts.',exampleTranslation:'The bank is on the right.'},
      {german:'geradeaus',english:'straight ahead',article:null,wordType:'adverb',example:'Gehen Sie geradeaus.',exampleTranslation:'Go straight ahead.'},
      {german:'Straße',english:'street',article:'die',wordType:'noun',example:'Die Straße ist lang.',exampleTranslation:'The street is long.'},
      {german:'Bahnhof',english:'train station',article:'der',wordType:'noun',example:'Der Bahnhof ist in der Stadtmitte.',exampleTranslation:'The train station is in the city center.'},
      {german:'Bus',english:'bus',article:'der',wordType:'noun',example:'Ich fahre mit dem Bus.',exampleTranslation:'I travel by bus.'},
      {german:'U-Bahn',english:'subway / underground',article:'die',wordType:'noun',example:'Die U-Bahn kommt in 5 Minuten.',exampleTranslation:'The subway comes in 5 minutes.'},
      {german:'fahren',english:'to drive / travel',article:null,wordType:'verb',example:'Ich fahre mit dem Zug.',exampleTranslation:'I travel by train.'},
      {german:'entlang',english:'along',article:null,wordType:'preposition',example:'Gehen Sie die Straße entlang.',exampleTranslation:'Go along the street.'},
      {german:'weit',english:'far',article:null,wordType:'adjective',example:'Ist es weit von hier?',exampleTranslation:'Is it far from here?'},
      {german:'nah',english:'near / close',article:null,wordType:'adjective',example:'Der Bahnhof ist nah.',exampleTranslation:'The station is close.'},
      {german:'Entschuldigung',english:'Excuse me',article:null,wordType:'phrase',example:'Entschuldigung, wo ist die Post?',exampleTranslation:'Excuse me, where is the post office?'},
    ],
    grammarTopics:[
      {title:'Imperatives (Commands)',rule:'Formal (Sie): Gehen Sie geradeaus! Informal (du): Geh geradeaus! The verb comes FIRST.',examples:[{german:'Gehen Sie links.',english:'Go left. (formal)'},{german:'Nehmen Sie die U-Bahn.',english:'Take the subway. (formal)'}],tip:'Formal imperative: verb first + Sie. It looks like a question but is not one.'},
      {title:'mit + Dative for Transport',rule:'"mit" + dative = using / by means of. mit dem Bus = by bus, mit der U-Bahn = by subway, mit dem Zug = by train.',examples:[{german:'Ich fahre mit dem Bus.',english:'I travel by bus.'},{german:'Wir kommen mit der U-Bahn.',english:'We come by subway.'}],tip:'"mit" always takes dative: dem (der/das), der (die).'},
    ],
    quizQuestions:[
      {id:'q7u1a',question:'How do you say "Turn left" formally?',options:['Biegen Sie links ab.','Biegen du links ab.','Links abbiegen!','Gehen Sie links.'],correctAnswer:'Biegen Sie links ab.',explanation:'Formal imperative: verb first + "Sie". "abbiegen" is separable — "ab" goes to end.'},
      {id:'q7u1b',question:'"Ich fahre ___ dem Bus." — correct preposition?',options:['mit','in','auf','an'],correctAnswer:'mit',explanation:'"mit" + dative = by (transport). "mit dem Bus" = by bus.'},
      {id:'q7u1c',question:'What does "geradeaus" mean?',options:['straight ahead','to the right','to the left','backwards'],correctAnswer:'straight ahead',explanation:'"geradeaus" = straight ahead. Essential direction word.'},
      {id:'q7u1d',question:'"Entschuldigung, ___ ist die Post?"',options:['wo','wie','was','wer'],correctAnswer:'wo',explanation:'"wo" = where. "Entschuldigung" = excuse me.'},
      {id:'q7u1e',question:'Which means "the train station"?',options:['der Bahnhof','die U-Bahn','der Bus','die Straße'],correctAnswer:'der Bahnhof',explanation:'"der Bahnhof" = the train station.'},
      {id:'q7u1f',question:'"Ist es ___ von hier?" — meaning "far"?',options:['weit','nah','lang','groß'],correctAnswer:'weit',explanation:'"weit" = far. "nah" = near/close.'},
    ],
    fillInTheBlank:[
      {id:'f7u1a',sentence:'Gehen Sie ___ und dann links.',answer:'geradeaus',hint:'straight ahead',explanation:'"geradeaus" = straight ahead'},
      {id:'f7u1b',sentence:'Ich fahre mit ___ U-Bahn.',answer:'der',hint:'mit + dative. die U-Bahn → ?',explanation:'"mit" takes dative. die → der in dative.'},
      {id:'f7u1c',sentence:'___, wo ist der Bahnhof?',answer:'Entschuldigung',hint:'Excuse me',explanation:'Always start with "Entschuldigung" when asking strangers.'},
      {id:'f7u1d',sentence:'Der Supermarkt ist ___ — nur 5 Minuten.',answer:'nah',hint:'close, not far',explanation:'"nah" = near/close. Opposite of "weit".'},
    ],
    exampleSentences:[
      {german:'Entschuldigung, wie komme ich zum Bahnhof?',english:'Excuse me, how do I get to the train station?'},
      {german:'Gehen Sie geradeaus, dann rechts.',english:'Go straight ahead, then turn right.'},
      {german:'Nehmen Sie die U-Bahn Linie 3.',english:'Take subway line 3.'},
      {german:'Der Bahnhof ist etwa zehn Minuten zu Fuß.',english:'The train station is about ten minutes on foot.'},
      {german:'Ich fahre lieber mit dem Fahrrad.',english:'I prefer to travel by bicycle.'},
    ],
    homework:[
      {id:'h7u1a',question:'Write formal directions from a hotel to a supermarket (invent a simple route).',hint:'Gehen Sie... / Biegen Sie...ab / Die Straße entlang',answer:'Gehen Sie geradeaus die Hauptstraße entlang. Biegen Sie dann links ab. Der Supermarkt ist rechts, neben der Bank.',explanation:'Use formal imperatives (verb + Sie) for polite directions.'},
      {id:'h7u1b',question:'How do you express "by bus", "by train", "by subway", "on foot"?',hint:'mit + dative or zu Fuß',answer:'mit dem Bus / mit dem Zug / mit der U-Bahn / zu Fuß',explanation:'"mit dem/der" for vehicles. "zu Fuß" = on foot.'},
      {id:'h7u1c',question:'Write 3 sentences asking where places are (bank, pharmacy, post office).',hint:'Entschuldigung, wo ist die/der/das...?',answer:'Entschuldigung, wo ist die Bank? / Wo ist die Apotheke? / Wo ist die Post?',explanation:'Always start with "Entschuldigung" when asking strangers.'},
      {id:'h7u1d',question:'Translate: "Excuse me! Is the train station far? — No, take bus line 7."',hint:'Entschuldigung + weit + Nehmen Sie den Bus',answer:'Entschuldigung! Ist der Bahnhof weit? — Nein, nehmen Sie den Bus, Linie 7.',explanation:'"nehmen Sie" = take (formal imperative). den Bus (accusative after nehmen).'},
    ],
    toMemorize:['links = left, rechts = right, geradeaus = straight ahead','Entschuldigung, wo ist...? = Excuse me, where is...?','mit dem Bus/Zug, mit der U-Bahn = by bus/train/subway','zu Fuß = on foot','Biegen Sie...ab = Turn... (separable: abbiegen)'],
    toUnderstand:['Formal imperatives: verb + Sie (Gehen Sie, Nehmen Sie)','mit always takes dative (dem/der)','Two-way prepositions use accusative for destination'],
    dialogue:[
      {speaker:'Tourist',text:'Entschuldigung! Wie komme ich zum Bahnhof?',translation:'Excuse me! How do I get to the train station?'},
      {speaker:'Passant',text:'Das ist nicht weit. Gehen Sie geradeaus diese Straße entlang.',translation:'That is not far. Go straight along this street.'},
      {speaker:'Tourist',text:'Und dann?',translation:'And then?'},
      {speaker:'Passant',text:'Biegen Sie an der Ampel rechts ab. Der Bahnhof ist dann links.',translation:'Turn right at the traffic light. The station is then on the left.'},
      {speaker:'Tourist',text:'Wie weit ist es zu Fuß?',translation:'How far is it on foot?'},
      {speaker:'Passant',text:'Etwa zehn Minuten. Oder nehmen Sie die U-Bahn — Linie 2.',translation:'About ten minutes. Or take the subway — Line 2.'},
      {speaker:'Tourist',text:'Ich gehe lieber zu Fuß. Vielen Dank!',translation:'I prefer to walk. Thank you very much!'},
      {speaker:'Passant',text:'Bitte sehr! Gute Reise!',translation:'You are welcome! Have a good trip!'},
    ],
    listeningItems:[
      {audio:'Gehen Sie geradeaus.',question:'What direction is given?',options:['straight ahead','turn left','turn right','go back'],answer:'straight ahead'},
      {audio:'Ich fahre mit der U-Bahn.',question:'How does the speaker travel?',options:['by subway','by bus','by train','on foot'],answer:'by subway'},
      {audio:'Der Bahnhof ist nicht weit.',question:'What does the speaker say about the station?',options:['It is not far','It is very far','It is on the left','It is straight ahead'],answer:'It is not far'},
      {audio:'Biegen Sie rechts ab.',question:'What instruction is given?',options:['Turn right','Turn left','Go straight','Stop here'],answer:'Turn right'},
    ],
    culturalNote:'Germany has excellent public transport (ÖPNV). DB (Deutsche Bahn) trains connect all cities. Most cities have U-Bahn (subway), S-Bahn (suburban rail), Straßenbahn (tram), and Bus. A Tageskarte (day ticket) is great value.',
  },
  {
    id:'course-a1-08',unit:8,level:'A1',emoji:'🎨',
    title:'Hobbies & Free Time',
    description:'Talk about hobbies, express preferences, and use modal verbs können and wollen.',
    vocabulary:[
      {german:'spielen',english:'to play',article:null,wordType:'verb',example:'Ich spiele Gitarre.',exampleTranslation:'I play guitar.'},
      {german:'lesen',english:'to read',article:null,wordType:'verb',example:'Ich lese gern Bücher.',exampleTranslation:'I like reading books.'},
      {german:'Sport',english:'sport / exercise',article:'der',wordType:'noun',example:'Ich mache viel Sport.',exampleTranslation:'I do a lot of sport.'},
      {german:'Musik',english:'music',article:'die',wordType:'noun',example:'Ich höre gern Musik.',exampleTranslation:'I like listening to music.'},
      {german:'Kino',english:'cinema',article:'das',wordType:'noun',example:'Wir gehen ins Kino.',exampleTranslation:'We go to the cinema.'},
      {german:'kochen',english:'to cook',article:null,wordType:'verb',example:'Ich koche gern.',exampleTranslation:'I like to cook.'},
      {german:'Freizeit',english:'free time / leisure',article:'die',wordType:'noun',example:'Was machst du in deiner Freizeit?',exampleTranslation:'What do you do in your free time?'},
      {german:'lieber',english:'prefer to / rather',article:null,wordType:'adverb',example:'Ich lese lieber als fernsehen.',exampleTranslation:'I prefer reading to watching TV.'},
      {german:'am liebsten',english:'like most / love to',article:null,wordType:'phrase',example:'Am liebsten spiele ich Tennis.',exampleTranslation:'I love playing tennis most.'},
      {german:'interessant',english:'interesting',article:null,wordType:'adjective',example:'Das ist sehr interessant.',exampleTranslation:'That is very interesting.'},
      {german:'langweilig',english:'boring',article:null,wordType:'adjective',example:'Das finde ich langweilig.',exampleTranslation:'I find that boring.'},
      {german:'Hobby',english:'hobby',article:'das',wordType:'noun',example:'Was ist dein Hobby?',exampleTranslation:'What is your hobby?'},
    ],
    grammarTopics:[
      {title:'können (can) & wollen (want to)',rule:'können: ich kann, du kannst, er kann, wir können, ihr könnt, sie können. wollen: ich will, du willst, er will, wir wollen. The dependent verb goes to the END.',examples:[{german:'Ich kann Gitarre spielen.',english:'I can play guitar.'},{german:'Wir wollen ins Kino gehen.',english:'We want to go to the cinema.'}],tip:'Modal verb stays in position 2. The second verb (infinitive) jumps to the very END.'},
      {title:'gern / lieber / am liebsten',rule:'Three degrees of preference: gern (like), lieber (prefer), am liebsten (like most). Used after a verb.',examples:[{german:'Ich lese gern.',english:'I like reading.'},{german:'Am liebsten gehe ich wandern.',english:'Most of all I like hiking.'}],tip:'Think of it as like → prefer → love.'},
    ],
    quizQuestions:[
      {id:'q8u1a',question:'"Ich ___ Gitarre spielen." — using "can"',options:['kann','will','mag','darf'],correctAnswer:'kann',explanation:'"können" → ich kann = I can.'},
      {id:'q8u1b',question:'Where does the infinitive go with a modal verb?',options:['at the end','in position 2','after the subject','before the modal'],correctAnswer:'at the end',explanation:'Modal verb takes position 2; infinitive goes to the very END.'},
      {id:'q8u1c',question:'"Wir ___ ins Kino gehen." — meaning "want to"',options:['wollen','können','müssen','sollen'],correctAnswer:'wollen',explanation:'"wollen" = to want to. wir wollen = we want to.'},
      {id:'q8u1d',question:'What does "lieber" mean in "Ich lese lieber"?',options:['I prefer reading','I like reading','I love reading','I hate reading'],correctAnswer:'I prefer reading',explanation:'"lieber" = prefer. One step above "gern" (like).'},
      {id:'q8u1e',question:'"Was machst du in deiner ___?" — free time word?',options:['Freizeit','Sport','Musik','Hobby'],correctAnswer:'Freizeit',explanation:'"die Freizeit" = free time / leisure time.'},
      {id:'q8u1f',question:'Correct word order: "I can speak German."',options:['Ich kann Deutsch sprechen.','Ich kann sprechen Deutsch.','Ich sprechen kann Deutsch.','Deutsch ich kann sprechen.'],correctAnswer:'Ich kann Deutsch sprechen.',explanation:'Subject → modal → ... → infinitive at end.'},
    ],
    fillInTheBlank:[
      {id:'f8u1a',sentence:'Ich ___ gern Fußball spielen.',answer:'kann',hint:'können, ich-form',explanation:'können → ich kann'},
      {id:'f8u1b',sentence:'Was machst du in deiner ___?',answer:'Freizeit',hint:'free time',explanation:'die Freizeit = free time'},
      {id:'f8u1c',sentence:'Ich lese ___ als fernsehen.',answer:'lieber',hint:'prefer (middle level)',explanation:'lieber = prefer (gern < lieber < am liebsten)'},
      {id:'f8u1d',sentence:'Wir wollen ins Kino ___.',answer:'gehen',hint:'infinitive at the end',explanation:'Modal verb: infinitive always goes to the end.'},
    ],
    exampleSentences:[
      {german:'In meiner Freizeit spiele ich Tennis und lese Bücher.',english:'In my free time I play tennis and read books.'},
      {german:'Ich kann gut kochen — ich mache gern italienisches Essen.',english:'I can cook well — I like making Italian food.'},
      {german:'Wir wollen am Wochenende ins Kino gehen.',english:'We want to go to the cinema at the weekend.'},
      {german:'Am liebsten höre ich Musik.',english:'Most of all I like listening to music.'},
      {german:'Sport ist wichtig, aber ich finde Laufen langweilig.',english:'Sport is important, but I find running boring.'},
    ],
    homework:[
      {id:'h8u1a',question:'Describe your hobbies using gern, lieber, am liebsten.',hint:'Ich ___ gern / Ich ___ lieber / Am liebsten ___',answer:'Ich lese gern. Ich spiele lieber Gitarre. Am liebsten gehe ich wandern.',explanation:'Three degrees of preference with different verbs.'},
      {id:'h8u1b',question:'Write 4 sentences about what you can and cannot do.',hint:'Ich kann... / Ich kann nicht...',answer:'Ich kann gut kochen. Ich kann Gitarre spielen. Ich kann nicht gut singen. Ich kann kein Französisch sprechen.',explanation:'"nicht" negates the action. "kein" negates the noun object.'},
      {id:'h8u1c',question:'Conjugate "können" for all 6 pronouns.',hint:'ich/er/sie forms are the same (kann)',answer:'ich kann, du kannst, er/sie kann, wir können, ihr könnt, sie/Sie können',explanation:'können: ich and er/sie both use "kann" — easy to remember!'},
      {id:'h8u1d',question:'Translate: "On weekends I want to sleep long and go to the cinema."',hint:'Wochenende + wollen + schlafen + ins Kino gehen',answer:'Am Wochenende will ich lange schlafen und ins Kino gehen.',explanation:'"Am Wochenende" at front → inversion: will ich. Two infinitives both go to end.'},
    ],
    toMemorize:['Ich kann... = I can... (infinitive at end)','Ich will... = I want to... (infinitive at end)','gern = like, lieber = prefer, am liebsten = love most','Was machst du in deiner Freizeit? = What do you do in your free time?','ins Kino gehen = to go to the cinema'],
    toUnderstand:['Modal verbs stay position 2; dependent infinitive goes to END','Three-level preference: gern/lieber/am liebsten','können and wollen have stem changes (kann, will)'],
    dialogue:[
      {speaker:'Felix',text:'Was machst du gern in deiner Freizeit?',translation:'What do you like doing in your free time?'},
      {speaker:'Sophie',text:'Ich lese gern und spiele manchmal Tennis. Und du?',translation:'I like reading and sometimes play tennis. And you?'},
      {speaker:'Felix',text:'Ich höre am liebsten Musik und spiele Gitarre.',translation:'Most of all I like listening to music and playing guitar.'},
      {speaker:'Sophie',text:'Oh cool! Kannst du gut Gitarre spielen?',translation:'Oh cool! Can you play guitar well?'},
      {speaker:'Felix',text:'Ja, ich spiele seit drei Jahren. Willst du mal zuhören?',translation:'Yes, I have been playing for three years. Would you like to listen some time?'},
      {speaker:'Sophie',text:'Gerne! Wann hast du Zeit?',translation:'Sure! When do you have time?'},
      {speaker:'Felix',text:'Am Wochenende — wir können auch ins Kino gehen danach.',translation:'At the weekend — we can also go to the cinema afterwards.'},
      {speaker:'Sophie',text:'Super Idee! Ich freue mich!',translation:'Great idea! I am looking forward to it!'},
    ],
    listeningItems:[
      {audio:'Ich kann gut kochen.',question:'What can the speaker do?',options:['cook well','play guitar','read fast','sing well'],answer:'cook well'},
      {audio:'Wir wollen ins Kino gehen.',question:'What do they want to do?',options:['go to the cinema','go to a restaurant','go to the park','stay home'],answer:'go to the cinema'},
      {audio:'Am liebsten höre ich Musik.',question:'What does the speaker like most?',options:['listening to music','reading','cooking','playing sport'],answer:'listening to music'},
      {audio:'Was machst du in deiner Freizeit?',question:'What is being asked?',options:['What do you do in your free time?','What is your hobby?','Can you play music?','When do you have time?'],answer:'What do you do in your free time?'},
    ],
    culturalNote:'"Vereinskultur" (club culture) is huge in Germany — millions belong to sports clubs, choirs, and hobby groups. The most popular sport is Fußball. The weekend (Wochenende) is sacred — most shops are closed on Sundays.',
  },
  {
    id:'course-a1-09',unit:9,level:'A1',emoji:'💼',
    title:'Work & Professions',
    description:'Talk about jobs, say what you do for work, and use the present tense confidently.',
    vocabulary:[
      {german:'Beruf',english:'profession / job',article:'der',wordType:'noun',example:'Was ist Ihr Beruf?',exampleTranslation:'What is your profession?'},
      {german:'Arzt',english:'doctor (male)',article:'der',wordType:'noun',example:'Er ist Arzt.',exampleTranslation:'He is a doctor.'},
      {german:'Ärztin',english:'doctor (female)',article:'die',wordType:'noun',example:'Sie ist Ärztin.',exampleTranslation:'She is a doctor.'},
      {german:'Lehrer',english:'teacher (male)',article:'der',wordType:'noun',example:'Er ist Lehrer in Berlin.',exampleTranslation:'He is a teacher in Berlin.'},
      {german:'Lehrerin',english:'teacher (female)',article:'die',wordType:'noun',example:'Sie ist Lehrerin.',exampleTranslation:'She is a teacher.'},
      {german:'Büro',english:'office',article:'das',wordType:'noun',example:'Ich arbeite im Büro.',exampleTranslation:'I work in the office.'},
      {german:'Firma',english:'company / firm',article:'die',wordType:'noun',example:'Ich arbeite bei einer Firma.',exampleTranslation:'I work at a company.'},
      {german:'Kollege',english:'colleague (male)',article:'der',wordType:'noun',example:'Mein Kollege ist sehr nett.',exampleTranslation:'My colleague is very nice.'},
      {german:'verdienen',english:'to earn',article:null,wordType:'verb',example:'Er verdient gut.',exampleTranslation:'He earns well.'},
      {german:'Vollzeit',english:'full-time',article:null,wordType:'noun',example:'Ich arbeite Vollzeit.',exampleTranslation:'I work full-time.'},
      {german:'Teilzeit',english:'part-time',article:null,wordType:'noun',example:'Sie arbeitet Teilzeit.',exampleTranslation:'She works part-time.'},
      {german:'Chef',english:'boss / manager',article:'der',wordType:'noun',example:'Mein Chef ist sehr streng.',exampleTranslation:'My boss is very strict.'},
    ],
    grammarTopics:[
      {title:'Job Titles: No Article with sein',rule:'In German, no article is used when saying what job someone does: "Ich bin Arzt" (NOT "Ich bin ein Arzt"). This is different from English.',examples:[{german:'Er ist Lehrer.',english:'He is a teacher.'},{german:'Sie ist Ärztin.',english:'She is a doctor.'}],tip:'Profession after "sein" = no article. "Er ist Arzt" not "Er ist ein Arzt".'},
      {title:'Regular Verbs: Present Tense Review',rule:'Regular verb endings: -e (ich), -st (du), -t (er/sie/es), -en (wir/sie), -t (ihr). Applies to all regular verbs: arbeiten, lernen, wohnen, kochen...',examples:[{german:'Ich arbeite. Du arbeitest. Er arbeitet.',english:'I work. You work. He works.'},{german:'Wir lernen. Ihr lernt. Sie lernen.',english:'We learn. You learn. They learn.'}],tip:'Remember: -e, -st, -t, -en, -t, -en. The ich form always ends in -e.'},
    ],
    quizQuestions:[
      {id:'q9u1a',question:'"Ich bin ___ Arzt." — correct?',options:['[no article] Arzt','ein Arzt','der Arzt','einem Arzt'],correctAnswer:'[no article] Arzt',explanation:'With "sein" + profession: NO article! "Ich bin Arzt" (not "ein Arzt").'},
      {id:'q9u1b',question:'What does "Beruf" mean?',options:['profession / job','office','boss','colleague'],correctAnswer:'profession / job',explanation:'"der Beruf" = profession, occupation. "Was ist Ihr Beruf?" = What is your profession?'},
      {id:'q9u1c',question:'The female form of "Lehrer" is:',options:['Lehrerin','Lehrere','Lehrerinne','Lehererin'],correctAnswer:'Lehrerin',explanation:'Female job titles: add -in. Lehrer → Lehrerin, Arzt → Ärztin.'},
      {id:'q9u1d',question:'"Ich ___ im Büro." — correct verb?',options:['arbeite','arbeitet','arbeitest','arbeiten'],correctAnswer:'arbeite',explanation:'arbeiten → ich arbeite (regular: -en → -e for ich).'},
      {id:'q9u1e',question:'What is "Vollzeit"?',options:['full-time','part-time','overtime','vacation'],correctAnswer:'full-time',explanation:'"Vollzeit" = full-time. "Teilzeit" = part-time.'},
      {id:'q9u1f',question:'Regular verb ending for "du":',options:['-st','-e','-t','-en'],correctAnswer:'-st',explanation:'du form: always add -st. du machst, du arbeitest, du lernst.'},
    ],
    fillInTheBlank:[
      {id:'f9u1a',sentence:'Sie ist ___ — sie arbeitet in einem Krankenhaus.',answer:'Ärztin',hint:'female doctor',explanation:'die Ärztin = female doctor (Arzt + -in)'},
      {id:'f9u1b',sentence:'Ich ___ von 9 bis 17 Uhr.',answer:'arbeite',hint:'arbeiten, ich-form',explanation:'arbeiten → ich arbeite'},
      {id:'f9u1c',sentence:'Er ist ___ Chef.',answer:'mein',hint:'my (masculine noun)',explanation:'der Chef is masculine → mein Chef'},
      {id:'f9u1d',sentence:'Ich arbeite bei einer ___.',answer:'Firma',hint:'company',explanation:'die Firma = company/firm'},
    ],
    exampleSentences:[
      {german:'Ich bin Ingenieur und arbeite bei einer großen Firma.',english:'I am an engineer and I work at a big company.'},
      {german:'Was machen Sie beruflich?',english:'What do you do professionally?'},
      {german:'Meine Kollegin ist sehr hilfsbereit.',english:'My colleague is very helpful.'},
      {german:'Er arbeitet Teilzeit — nur drei Tage pro Woche.',english:'He works part-time — only three days a week.'},
      {german:'Mein Chef ist nett, aber manchmal sehr streng.',english:'My boss is nice, but sometimes very strict.'},
    ],
    homework:[
      {id:'h9u1a',question:'Introduce yourself professionally: name, job, where you work, full or part-time.',hint:'Ich bin... / Ich arbeite bei... / Ich arbeite Vollzeit/Teilzeit',answer:'Ich heiße [Name]. Ich bin [Beruf]. Ich arbeite bei [Firma]. Ich arbeite Vollzeit.',explanation:'No article with profession after "sein"!'},
      {id:'h9u1b',question:'What is the rule for female job titles? Give 4 examples.',hint:'Lehrer → Lehrerin, Arzt → Ärztin',answer:'Add -in to make a profession feminine. Lehrer→Lehrerin, Arzt→Ärztin, Kollege→Kollegin, Koch→Köchin.',explanation:'Most German professions have male and female forms.'},
      {id:'h9u1c',question:'Conjugate "arbeiten" for all 6 pronouns. Note: du/er form has an extra -e- before the ending.',hint:'Special: arbeit+e+st, arbeit+e+t',answer:'ich arbeite, du arbeitest, er/sie arbeitet, wir arbeiten, ihr arbeitet, sie arbeiten',explanation:'Verbs with stems ending in -t add an extra -e- before endings for pronunciation: arbeitest, arbeitet.'},
      {id:'h9u1d',question:'Translate: "My colleague is a teacher and she works part-time at a school."',hint:'Kollegin + Lehrerin + Teilzeit + Schule',answer:'Meine Kollegin ist Lehrerin und sie arbeitet Teilzeit an einer Schule.',explanation:'"an einer Schule" = at a school (dative after an for location).'},
    ],
    toMemorize:['Ich bin Arzt/Lehrerin... (NO article with professions!)','der Beruf = profession','Vollzeit = full-time, Teilzeit = part-time','Was machen Sie beruflich? = What do you do professionally?','Female form: add -in (Lehrer→Lehrerin, Arzt→Ärztin)'],
    toUnderstand:['No article after sein with professions (unique German rule)','Female job titles formed with -in suffix','Regular verbs with stems ending in -t/-d add extra -e- (arbeitest not arbeitst)'],
    dialogue:[
      {speaker:'Lisa',text:'Was machen Sie beruflich, Herr Weber?',translation:'What do you do professionally, Mr. Weber?'},
      {speaker:'Weber',text:'Ich bin Ingenieur. Ich arbeite bei einer Technologiefirma in München.',translation:'I am an engineer. I work at a technology company in Munich.'},
      {speaker:'Lisa',text:'Oh interessant! Arbeiten Sie Vollzeit?',translation:'Oh interesting! Do you work full-time?'},
      {speaker:'Weber',text:'Ja, ich arbeite Vollzeit. Und Sie? Was sind Sie von Beruf?',translation:'Yes, I work full-time. And you? What is your profession?'},
      {speaker:'Lisa',text:'Ich bin Lehrerin. Ich unterrichte Deutsch und Englisch.',translation:'I am a teacher. I teach German and English.'},
      {speaker:'Weber',text:'Das ist ein schöner Beruf! Arbeiten Sie gern mit Kindern?',translation:'That is a nice profession! Do you like working with children?'},
      {speaker:'Lisa',text:'Ja, sehr! Meine Schüler sind wirklich toll.',translation:'Yes, very much! My students are really great.'},
      {speaker:'Weber',text:'Das höre ich gern! Schönen Tag noch, Frau Lisa.',translation:'Nice to hear! Have a nice day, Mrs. Lisa.'},
    ],
    listeningItems:[
      {audio:'Ich bin Arzt.',question:'What is the speaker\'s profession?',options:['doctor','teacher','engineer','lawyer'],answer:'doctor'},
      {audio:'Ich arbeite Teilzeit.',question:'How does the speaker work?',options:['part-time','full-time','from home','overtime'],answer:'part-time'},
      {audio:'Was machen Sie beruflich?',question:'What is being asked?',options:['What do you do professionally?','Where do you work?','How much do you earn?','When do you work?'],answer:'What do you do professionally?'},
      {audio:'Mein Chef ist sehr nett.',question:'What does the speaker say about their boss?',options:['very nice','very strict','very busy','very smart'],answer:'very nice'},
    ],
    culturalNote:'Germany has strong worker protections — typically 30 days of paid vacation (Urlaub) per year. Apprenticeships (Ausbildung) are highly valued. The standard workweek is 35-40 hours. Work-life balance ("Work-Life-Balance") is increasingly important.',
  },
  {
    id:'course-a1-10',unit:10,level:'A1',emoji:'🤝',
    title:'Polite Conversation',
    description:'Make small talk, express opinions, apologize, and use common courtesy phrases.',
    vocabulary:[
      {german:'Entschuldigung',english:'Excuse me / Sorry',article:null,wordType:'phrase',example:'Entschuldigung, das war ein Fehler.',exampleTranslation:'Sorry, that was a mistake.'},
      {german:'bitte',english:'please / you\'re welcome',article:null,wordType:'phrase',example:'Bitte helfen Sie mir.',exampleTranslation:'Please help me.'},
      {german:'danke',english:'thank you',article:null,wordType:'phrase',example:'Vielen Dank für Ihre Hilfe!',exampleTranslation:'Thank you very much for your help!'},
      {german:'Es tut mir leid.',english:'I am sorry',article:null,wordType:'phrase',example:'Es tut mir sehr leid.',exampleTranslation:'I am very sorry.'},
      {german:'Meinung',english:'opinion',article:'die',wordType:'noun',example:'Was ist Ihre Meinung?',exampleTranslation:'What is your opinion?'},
      {german:'finden',english:'to find / to think',article:null,wordType:'verb',example:'Ich finde das interessant.',exampleTranslation:'I find that interesting.'},
      {german:'denken',english:'to think / believe',article:null,wordType:'verb',example:'Ich denke, das ist richtig.',exampleTranslation:'I think that is correct.'},
      {german:'leider',english:'unfortunately',article:null,wordType:'adverb',example:'Leider kann ich nicht kommen.',exampleTranslation:'Unfortunately I cannot come.'},
      {german:'natürlich',english:'of course / naturally',article:null,wordType:'adverb',example:'Natürlich helfe ich dir.',exampleTranslation:'Of course I will help you.'},
      {german:'vielleicht',english:'perhaps / maybe',article:null,wordType:'adverb',example:'Vielleicht komme ich morgen.',exampleTranslation:'Maybe I will come tomorrow.'},
      {german:'einverstanden',english:'agreed / OK with it',article:null,wordType:'adjective',example:'Ich bin einverstanden.',exampleTranslation:'I agree / I am OK with it.'},
      {german:'Glückwunsch',english:'congratulations',article:'der',wordType:'noun',example:'Herzlichen Glückwunsch!',exampleTranslation:'Congratulations!'},
    ],
    grammarTopics:[
      {title:'Expressing Opinions: ich finde / ich denke / ich glaube',rule:'"Ich finde" + accusative/adjective = I find... "Ich denke/glaube, dass..." = I think that... In A1, use "Ich denke, + sentence" (with comma, no dass needed).',examples:[{german:'Ich finde das toll.',english:'I find that great.'},{german:'Ich denke, Berlin ist schön.',english:'I think Berlin is beautiful.'}],tip:'"finden" for opinions about things. "denken" for thoughts and beliefs.'},
      {title:'Modal Verbs: dürfen & sollen',rule:'dürfen = may / allowed to. sollen = should / supposed to. ich darf, du darfst, er darf. ich soll, du sollst, er soll.',examples:[{german:'Darf ich hier sitzen?',english:'May I sit here?'},{german:'Du sollst mehr Wasser trinken.',english:'You should drink more water.'}],tip:'"darf ich?" is the polite way to ask permission. Always more polite than "kann ich?".'},
    ],
    quizQuestions:[
      {id:'q10u1a',question:'What does "Es tut mir leid" mean?',options:['I am sorry','Excuse me','Thank you','You\'re welcome'],correctAnswer:'I am sorry',explanation:'"Es tut mir leid" = I am sorry (literally: it does me pain).'},
      {id:'q10u1b',question:'"Darf ich hier ___?" — correct verb for "sit"?',options:['sitzen','sitze','sitz','gesessen'],correctAnswer:'sitzen',explanation:'"dürfen" + infinitive at end. "Darf ich hier sitzen?" = May I sit here?'},
      {id:'q10u1c',question:'What does "leider" mean?',options:['unfortunately','of course','maybe','gladly'],correctAnswer:'unfortunately',explanation:'"leider" = unfortunately. Very common in polite refusals: "Leider kann ich nicht."'},
      {id:'q10u1d',question:'"Ich finde das ___." — expressing opinion',options:['interessant','interessante','interessanten','ein interessant'],correctAnswer:'interessant',explanation:'"finden" + adjective. No ending needed after "das" as direct object.'},
      {id:'q10u1e',question:'"Herzlichen ___!" — congratulations?',options:['Glückwunsch','Dankeschön','Entschuldigung','Bitte'],correctAnswer:'Glückwunsch',explanation:'"Herzlichen Glückwunsch!" = Heartfelt congratulations! Used for birthdays, achievements.'},
      {id:'q10u1f',question:'"Du ___ mehr schlafen." — "you should"',options:['sollst','darfst','kannst','musst'],correctAnswer:'sollst',explanation:'"sollen" = should/supposed to. du sollst = you should.'},
    ],
    fillInTheBlank:[
      {id:'f10u1a',sentence:'___ kann ich leider nicht kommen.',answer:'Leider',hint:'unfortunately (at start = inversion)',explanation:'"Leider" at start causes verb inversion: kann ich (not ich kann)'},
      {id:'f10u1b',sentence:'Ich ___ das sehr interessant.',answer:'finde',hint:'finden, ich-form',explanation:'finden → ich finde'},
      {id:'f10u1c',sentence:'___ ich hier sitzen?',answer:'Darf',hint:'dürfen, ich-form, polite question',explanation:'dürfen → ich darf → Darf ich...? (question inversion)'},
      {id:'f10u1d',sentence:'Vielen Dank — bitte ___!',answer:'sehr',hint:'common response to thank you',explanation:'"Bitte sehr!" = You are most welcome! (common response to Danke)'},
    ],
    exampleSentences:[
      {german:'Entschuldigung, darf ich Sie etwas fragen?',english:'Excuse me, may I ask you something?'},
      {german:'Ich finde Berlin wirklich schön — besonders die Museen.',english:'I find Berlin really beautiful — especially the museums.'},
      {german:'Leider kann ich heute nicht kommen, es tut mir leid.',english:'Unfortunately I cannot come today, I am sorry.'},
      {german:'Natürlich! Ich helfe Ihnen sehr gerne.',english:'Of course! I am very happy to help you.'},
      {german:'Herzlichen Glückwunsch zum Geburtstag!',english:'Happy birthday! (lit: Heartfelt congratulations on your birthday!)'},
    ],
    homework:[
      {id:'h10u1a',question:'Write 3 polite requests using "dürfen" and 3 polite refusals using "leider".',hint:'Darf ich...? / Leider kann ich nicht...',answer:'Darf ich hier sitzen? / Darf ich Sie etwas fragen? / Darf ich das Fenster öffnen? | Leider kann ich nicht kommen. / Leider habe ich keine Zeit. / Leider weiß ich das nicht.',explanation:'"Darf ich?" is softer than "Kann ich?". "Leider" softens refusals.'},
      {id:'h10u1b',question:'Express opinions on 3 topics: a city, a food, a hobby.',hint:'Ich finde [topic] + adjective',answer:'Ich finde Berlin sehr schön. Ich finde Pizza lecker. Ich finde Lesen interessant.',explanation:'"finden" for opinions. Adjective comes at the end without change.'},
      {id:'h10u1c',question:'What is the difference between "Entschuldigung" and "Es tut mir leid"?',hint:'One is for getting attention, one is for apologizing',answer:'"Entschuldigung" = excuse me (getting attention, small mistakes). "Es tut mir leid" = I am sorry (genuine apology, stronger).',explanation:'"Entschuldigung" is lighter; "Es tut mir leid" shows real regret.'},
      {id:'h10u1d',question:'Translate: "Of course I can help you. Maybe we can meet tomorrow at 3 o\'clock."',hint:'natürlich + helfen + vielleicht + treffen + morgen + Uhr',answer:'Natürlich kann ich Ihnen helfen. Vielleicht können wir morgen um 3 Uhr treffen.',explanation:'"Natürlich" at start → inversion (kann ich). "vielleicht" → können wir.'},
    ],
    toMemorize:['bitte = please / you\'re welcome','danke / Vielen Dank = thank you / thank you very much','Entschuldigung = excuse me | Es tut mir leid = I am sorry','Leider kann ich nicht = Unfortunately I cannot','Herzlichen Glückwunsch! = Congratulations!'],
    toUnderstand:['No article with professions after sein (now applies to all units!)','dürfen = may/allowed to (permission); sollen = should (obligation)','Adverbs at sentence start cause subject-verb inversion'],
    dialogue:[
      {speaker:'Marie',text:'Guten Tag! Darf ich Sie kurz stören?',translation:'Good day! May I disturb you briefly?'},
      {speaker:'Hans',text:'Natürlich! Was kann ich für Sie tun?',translation:'Of course! What can I do for you?'},
      {speaker:'Marie',text:'Ich suche das Stadtmuseum. Wissen Sie, wo das ist?',translation:'I am looking for the city museum. Do you know where that is?'},
      {speaker:'Hans',text:'Ja, das weiß ich. Es ist nicht weit. Gehen Sie geradeaus.',translation:'Yes, I know that. It is not far. Go straight ahead.'},
      {speaker:'Marie',text:'Vielen Dank! Sie sind sehr hilfsbereit.',translation:'Thank you very much! You are very helpful.'},
      {speaker:'Hans',text:'Bitte sehr! Ich finde es wichtig, Touristen zu helfen.',translation:'You are welcome! I find it important to help tourists.'},
      {speaker:'Marie',text:'Das ist sehr nett. Noch eine Frage — ist das Museum heute geöffnet?',translation:'That is very nice. One more question — is the museum open today?'},
      {speaker:'Hans',text:'Leider nicht — montags ist es geschlossen. Es tut mir leid!',translation:'Unfortunately not — it is closed on Mondays. I am sorry!'},
    ],
    listeningItems:[
      {audio:'Es tut mir leid.',question:'What does the speaker say?',options:['I am sorry','Excuse me','Thank you','You\'re welcome'],answer:'I am sorry'},
      {audio:'Natürlich kann ich helfen.',question:'What does the speaker say?',options:['Of course I can help','Unfortunately I cannot help','Maybe I can help','I should help'],answer:'Of course I can help'},
      {audio:'Leider kann ich nicht kommen.',question:'What does the speaker say?',options:['Unfortunately I cannot come','Of course I can come','Maybe I can come','I should come'],answer:'Unfortunately I cannot come'},
      {audio:'Herzlichen Glückwunsch!',question:'What occasion is this for?',options:['congratulations / celebration','apology','greeting','farewell'],answer:'congratulations / celebration'},
    ],
    culturalNote:'Germans value direct but polite communication. "Bitte" is both "please" and "you\'re welcome". Punctuality is a courtesy. When invited to someone\'s home, bring a small gift (wine, flowers) and say "Herzlichen Dank für die Einladung!" (Thank you for the invitation!).',
  },
];

const SAMPLE_STUDY_SET = {
  id: 'ss-sample-a1-daily',
  title: 'Daily Life — A1/A2',
  topic: 'Everyday Vocabulary & Grammar',
  level: 'A1',
  createdAt: new Date().toISOString(),
  masteryLevel: 0,
  demo: false,
  vocabulary: [
    { id: uid(), german: 'Haus', english: 'house', article: 'das', wordType: 'noun', example: 'Das Haus ist groß.', exampleTranslation: 'The house is big.' },
    { id: uid(), german: 'Schule', english: 'school', article: 'die', wordType: 'noun', example: 'Ich gehe in die Schule.', exampleTranslation: 'I go to school.' },
    { id: uid(), german: 'Freund', english: 'friend (male)', article: 'der', wordType: 'noun', example: 'Mein Freund heißt Max.', exampleTranslation: 'My friend is called Max.' },
    { id: uid(), german: 'Stadt', english: 'city / town', article: 'die', wordType: 'noun', example: 'Berlin ist eine große Stadt.', exampleTranslation: 'Berlin is a big city.' },
    { id: uid(), german: 'Buch', english: 'book', article: 'das', wordType: 'noun', example: 'Ich lese ein Buch.', exampleTranslation: 'I am reading a book.' },
    { id: uid(), german: 'Arbeit', english: 'work / job', article: 'die', wordType: 'noun', example: 'Meine Arbeit beginnt um 9 Uhr.', exampleTranslation: 'My work starts at 9 o\'clock.' },
    { id: uid(), german: 'lernen', english: 'to learn / to study', article: '', wordType: 'verb', example: 'Ich lerne jeden Tag Deutsch.', exampleTranslation: 'I learn German every day.' },
    { id: uid(), german: 'kaufen', english: 'to buy', article: '', wordType: 'verb', example: 'Ich kaufe Brot im Supermarkt.', exampleTranslation: 'I buy bread at the supermarket.' },
    { id: uid(), german: 'wohnen', english: 'to live / to reside', article: '', wordType: 'verb', example: 'Ich wohne in Berlin.', exampleTranslation: 'I live in Berlin.' },
    { id: uid(), german: 'groß', english: 'big / tall', article: '', wordType: 'adjective', example: 'Das Haus ist sehr groß.', exampleTranslation: 'The house is very big.' },
    { id: uid(), german: 'klein', english: 'small / little', article: '', wordType: 'adjective', example: 'Das Kind ist noch klein.', exampleTranslation: 'The child is still small.' },
    { id: uid(), german: 'jeden Tag', english: 'every day', article: '', wordType: 'phrase', example: 'Ich lerne jeden Tag.', exampleTranslation: 'I study every day.' },
  ],
  grammarTopics: [
    {
      id: uid(),
      title: 'German Articles: der / die / das',
      rule: 'Every German noun has a grammatical gender — masculine (der), feminine (die), or neuter (das). You must memorize the article with each noun. Tip: most nouns ending in -ung, -heit, -keit are die. Nouns ending in -chen or -lein are always das.',
      examples: [
        { german: 'der Freund — masculine', english: 'the friend (male)' },
        { german: 'die Stadt — feminine', english: 'the city' },
        { german: 'das Haus — neuter', english: 'the house' },
      ],
      tip: 'Make flashcards with the article — never learn a noun without it!',
    },
    {
      id: uid(),
      title: 'Verb Conjugation — Present Tense',
      rule: 'Regular German verbs follow a simple pattern in present tense: remove -en from the infinitive and add the correct ending. ich → -e, du → -st, er/sie/es → -t, wir → -en, ihr → -t, sie/Sie → -en.',
      examples: [
        { german: 'Ich lerne Deutsch. (ich + lerne)', english: 'I learn German.' },
        { german: 'Du wohnst in Berlin. (du + wohnst)', english: 'You live in Berlin.' },
        { german: 'Wir kaufen Brot. (wir + kaufen)', english: 'We buy bread.' },
      ],
      tip: 'Irregular verbs (sein, haben, gehen) must be memorized separately.',
    },
    {
      id: uid(),
      title: 'Word Order — Verb in Second Position',
      rule: 'In a German main clause, the conjugated verb is always in the second position, no matter what comes first. If you start with a time word or adverb, the verb still comes second — and the subject moves to third position.',
      examples: [
        { german: 'Ich gehe heute zur Schule.', english: 'I go to school today.' },
        { german: 'Heute gehe ich zur Schule.', english: 'Today I go to school. (verb stays 2nd!)' },
      ],
      tip: 'Count to two — the verb is always slot number two.',
    },
  ],
  quizQuestions: [
    { id: uid(), question: 'What is the article for "Haus" (house)?', options: ['das', 'der', 'die', 'ein'], correctAnswer: 'das', explanation: '"das Haus" — neuter gender. Neuter nouns often use "das".' },
    { id: uid(), question: 'What does "wohnen" mean?', options: ['to live / to reside', 'to buy', 'to learn', 'to work'], correctAnswer: 'to live / to reside', explanation: '"Ich wohne in Berlin" = I live in Berlin.' },
    { id: uid(), question: 'Which article goes with "Schule" (school)?', options: ['die', 'der', 'das', 'eine'], correctAnswer: 'die', explanation: '"die Schule" — feminine. Nouns ending in -e are often feminine.' },
    { id: uid(), question: 'How do you conjugate "lernen" for "ich"?', options: ['ich lerne', 'ich lernt', 'ich lernen', 'ich lernst'], correctAnswer: 'ich lerne', explanation: 'Regular verb: lernen → remove -en, add -e for ich → lerne.' },
    { id: uid(), question: 'Translate: "I am reading a book."', options: ['Ich lese ein Buch.', 'Ich kaufe ein Buch.', 'Ich habe ein Buch.', 'Ich lerne ein Buch.'], correctAnswer: 'Ich lese ein Buch.', explanation: '"lesen" = to read. Ich lese = I read / I am reading.' },
    { id: uid(), question: 'What does "groß" mean?', options: ['big / tall', 'small', 'fast', 'old'], correctAnswer: 'big / tall', explanation: '"groß" is one of the most common German adjectives — it means big or tall depending on context.' },
  ],
  fillInTheBlank: [
    { id: uid(), sentence: 'Ich ___ in Berlin. (to live)', answer: 'wohne', hint: 'Verb: wohnen. Conjugate for "ich".', explanation: 'ich + wohnen → ich wohne (remove -en, add -e)' },
    { id: uid(), sentence: '___ Buch ist groß. (the — neuter)', answer: 'Das', hint: 'Buch is neuter gender.', explanation: '"das Buch" — the book. Neuter → das.' },
    { id: uid(), sentence: 'Mein Freund ___ in München. (to live)', answer: 'wohnt', hint: 'Conjugate wohnen for er/sie.', explanation: 'er/sie/es + wohnen → wohnt (remove -en, add -t)' },
    { id: uid(), sentence: 'Ich lerne ___ Tag Deutsch. (every)', answer: 'jeden', hint: 'The phrase means "every day".', explanation: '"jeden Tag" = every day. Accusative case for masculine "Tag".' },
    { id: uid(), sentence: 'Die ___ ist sehr groß. (city)', answer: 'Stadt', hint: 'German for city — starts with Sta-', explanation: '"Stadt" = city. It takes the article "die" (feminine).' },
  ],
  exampleSentences: [
    { german: 'Ich wohne in Berlin.', english: 'I live in Berlin.' },
    { german: 'Meine Schule ist in der Stadt.', english: 'My school is in the city.' },
    { german: 'Ich lerne jeden Tag Deutsch.', english: 'I learn German every day.' },
    { german: 'Das Haus ist groß und schön.', english: 'The house is big and beautiful.' },
    { german: 'Mein Freund kauft ein Buch.', english: 'My friend is buying a book.' },
    { german: 'Die Arbeit beginnt um neun Uhr.', english: 'Work starts at nine o\'clock.' },
  ],
  toMemorize: [
    'das Haus — house (neuter)',
    'die Schule — school (feminine)',
    'der Freund — friend / boyfriend (masculine)',
    'die Stadt — city (feminine)',
    'wohnen → ich wohne, du wohnst, er wohnt',
    'lernen → ich lerne, du lernst, er lernt',
  ],
  toUnderstand: [
    'Verb always in second position in a main clause',
    'Every noun has a gender: der (m), die (f), das (n)',
    'Regular verb conjugation: remove -en, add the correct ending',
  ],
  homework: [
    { id: uid(), question: 'Write a sentence: "I live in a big city." Use wohnen + groß + Stadt.', hint: 'Start with "Ich wohne..." and remember the adjective ending.', answer: 'Ich wohne in einer großen Stadt.', explanation: '"in einer großen Stadt" — dative case after "in" for location. Adjective gets -en ending.' },
    { id: uid(), question: 'Conjugate "kaufen" for all 6 pronouns (ich, du, er, wir, ihr, sie).', hint: 'Regular verb: remove -en, then add: -e, -st, -t, -en, -t, -en', answer: 'ich kaufe, du kaufst, er kauft, wir kaufen, ihr kauft, sie kaufen', explanation: 'kaufen is a regular verb. The stem is "kauf-" and the endings follow the standard pattern.' },
    { id: uid(), question: 'What article does "Arbeit" take? Write a sentence with it.', hint: 'Think about nouns ending in -eit — they are usually feminine.', answer: 'die Arbeit. Example: Meine Arbeit beginnt um 9 Uhr.', explanation: 'Nouns ending in -heit, -keit, -eit are always feminine → die Arbeit.' },
    { id: uid(), question: 'Rewrite using V2 word order: Start the sentence with "Jeden Tag": "___ ich Deutsch lerne."', hint: 'The verb must come second. Swap verb and subject.', answer: 'Jeden Tag lerne ich Deutsch.', explanation: 'V2 rule: if "Jeden Tag" is first, the verb "lerne" moves to second position and "ich" moves to third.' },
    { id: uid(), question: 'Translate to German: "My friend buys a book every day."', hint: 'mein Freund = my friend, kaufen = to buy, ein Buch = a book, jeden Tag = every day', answer: 'Mein Freund kauft jeden Tag ein Buch.', explanation: 'Verb in second position: Mein Freund (1) kauft (2) jeden Tag ein Buch.' },
  ],
};

function maybeShowOnboarding() {
  if (getSets().length > 0 || localStorage.getItem('ds_welcomed')) return;
  // Auto-inject sample set so app isn\'t empty
  saveSets([SAMPLE_STUDY_SET]);
  document.getElementById('onboarding-overlay')?.classList.remove('hidden');
}

function dismissOnboarding() {
  localStorage.setItem('ds_welcomed', '1');
  document.getElementById('onboarding-overlay')?.classList.add('hidden');
  showView('dashboard');
}

function startSampleLesson() {
  // Ensure sample set is present
  const sets = getSets();
  if (!sets.find(s => s.id === SAMPLE_STUDY_SET.id)) {
    saveSets([SAMPLE_STUDY_SET, ...sets]);
  }
  openStudySet(SAMPLE_STUDY_SET.id);
}

// ─── German Course Functions ──────────────────────────────────────────────────

function getCourseProgress() {
  try { return JSON.parse(localStorage.getItem('ds_course_progress') || '{}'); } catch { return {}; }
}
function saveCourseProgress(data) {
  localStorage.setItem('ds_course_progress', JSON.stringify(data));
}

function getUnitMastery(unit) {
  const sets = getSets();
  const set = sets.find(s => s.id === unit.id);
  return set ? (set.masteryLevel || 0) : 0;
}

function isUnitUnlocked(unit) {
  if (unit.unit <= 2) return true;
  const prev = GERMAN_COURSE.find(u => u.unit === unit.unit - 1);
  return prev ? getUnitMastery(prev) >= 60 : false;
}

function openCourseUnit(unitId) {
  const unit = GERMAN_COURSE.find(u => u.id === unitId);
  if (!unit) return;
  if (!isUnitUnlocked(unit)) {
    const prev = GERMAN_COURSE.find(u => u.unit === unit.unit - 1);
    showToast(`Complete Unit ${prev?.unit || unit.unit - 1} (60%+) to unlock this unit.`, 'info');
    return;
  }
  const sets = getSets();
  if (!sets.find(s => s.id === unit.id)) {
    const newSet = { ...unit, createdAt: new Date().toISOString(), masteryLevel: 0, lastStudied: null };
    saveSets([newSet, ...sets]);
  }
  openStudySet(unit.id);
}

function initCourseView() {
  const container = document.getElementById('course-units-container');
  if (!container) return;

  const overall = GERMAN_COURSE.reduce((sum, u) => sum + getUnitMastery(u), 0);
  const overallPct = Math.round(overall / GERMAN_COURSE.length);
  const progEl = document.getElementById('course-overall-progress');
  if (progEl) {
    progEl.innerHTML = `
      <div class="progress-label"><span>Overall Progress</span><span style="font-weight:700;color:var(--primary)">${overallPct}%</span></div>
      <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${overallPct}%"></div></div>`;
  }

  container.innerHTML = GERMAN_COURSE.map(unit => {
    const mastery = getUnitMastery(unit);
    const unlocked = isUnitUnlocked(unit);
    const complete = mastery >= 80;
    const statusIcon = complete ? '✅' : unlocked ? '🔓' : '🔒';
    const cardClass = `course-unit-card${!unlocked ? ' unit-locked' : complete ? ' unit-complete' : ''}`;
    return `
      <div class="${cardClass}" onclick="openCourseUnit('${unit.id}')">
        <div class="unit-card-left">
          <div class="unit-emoji">${unit.emoji}</div>
          <div class="unit-card-info">
            <div class="unit-card-title">Unit ${unit.unit}: ${esc(unit.title)}</div>
            <div class="unit-card-desc">${esc(unit.description)}</div>
            <div class="unit-card-meta">
              <span class="level-badge level-badge-a1">${unit.level}</span>
              <span class="unit-status-icon">${statusIcon}</span>
            </div>
          </div>
        </div>
        <div class="unit-card-right">
          <div class="unit-mastery-pct">${mastery}%</div>
          <div class="unit-progress-mini">
            <div class="unit-progress-fill" style="width:${mastery}%;background:${mastery>=80?'var(--success)':mastery>=50?'var(--warning)':'var(--primary)'}"></div>
          </div>
          <span class="plan-arrow">→</span>
        </div>
      </div>`;
  }).join('');
}

function renderDialogueTab(set) {
  const panel = document.getElementById('tab-dialogue');
  if (!panel) return;
  const unit = GERMAN_COURSE.find(u => u.id === set.id);
  if (!unit || !unit.dialogue || !unit.dialogue.length) {
    panel.innerHTML = '<div class="empty-state" style="padding:40px 20px"><div class="empty-state-icon">💬</div><h3>No dialogue</h3><p>This study set does not have a dialogue.</p></div>';
    return;
  }

  panel.innerHTML = `
    <div class="dialogue-controls">
      <button class="btn btn-primary btn-sm" onclick="playAllDialogue('${set.id}')">▶ Play All</button>
      <button class="btn btn-outline btn-sm" id="dialogue-slow-btn" onclick="toggleDialogueSlow()">🐢 Slow Mode: OFF</button>
      <button class="btn btn-ghost btn-sm" onclick="toggleDialogueTranslations()">👁 Translations</button>
    </div>
    <div class="dialogue-container" id="dialogue-lines">
      ${unit.dialogue.map((line, i) => `
        <div class="dialogue-bubble ${i % 2 === 0 ? 'bubble-a' : 'bubble-b'}" id="dialogue-line-${i}">
          <div class="bubble-speaker">${esc(line.speaker)}</div>
          <div class="bubble-text">${esc(line.text)}
            <button class="bubble-speak-btn" onclick="speakDialogueLine(${i},'${set.id}')" title="Listen">🔊</button>
          </div>
          <div class="bubble-translation hidden" id="bubble-trans-${i}">${esc(line.translation)}</div>
        </div>`).join('')}
    </div>
    ${unit.culturalNote ? `<div class="cultural-note-card"><span class="cultural-icon">🌍</span><div><strong>Cultural Note:</strong> ${esc(unit.culturalNote)}</div></div>` : ''}
    <div style="text-align:center;margin-top:16px">
      <button class="btn btn-primary" onclick="startListeningExercise('${set.id}')">🎧 Start Listening Exercise →</button>
    </div>`;

  window._dialogueSlow = false;
  window._dialogueTranslationsVisible = false;
}

window._dialogueSlow = false;
window._dialogueTranslationsVisible = false;

function toggleDialogueSlow() {
  window._dialogueSlow = !window._dialogueSlow;
  const btn = document.getElementById('dialogue-slow-btn');
  if (btn) btn.textContent = `🐢 Slow Mode: ${window._dialogueSlow ? 'ON' : 'OFF'}`;
}

function toggleDialogueTranslations() {
  window._dialogueTranslationsVisible = !window._dialogueTranslationsVisible;
  document.querySelectorAll('.bubble-translation').forEach(el => {
    el.classList.toggle('hidden', !window._dialogueTranslationsVisible);
  });
}

function speakDialogueLine(index, unitId) {
  const unit = GERMAN_COURSE.find(u => u.id === unitId);
  if (!unit || !unit.dialogue[index]) return;
  const rate = window._dialogueSlow ? 0.5 : 0.85;
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(unit.dialogue[index].text);
  utt.lang = 'de-DE';
  utt.rate = rate;
  const voices = speechSynthesis.getVoices();
  const deVoice = voices.find(v => v.lang.startsWith('de'));
  if (deVoice) utt.voice = deVoice;
  window.speechSynthesis.speak(utt);

  const lineEl = document.getElementById(`dialogue-line-${index}`);
  if (lineEl) {
    lineEl.classList.add('dialogue-active');
    utt.onend = () => lineEl.classList.remove('dialogue-active');
  }
}

function playAllDialogue(unitId) {
  const unit = GERMAN_COURSE.find(u => u.id === unitId);
  if (!unit || !unit.dialogue) return;
  let i = 0;
  function playNext() {
    if (i >= unit.dialogue.length) return;
    speakDialogueLine(i, unitId);
    const rate = window._dialogueSlow ? 0.5 : 0.85;
    const words = unit.dialogue[i].text.split(' ').length;
    const ms = Math.round((words / (rate * 2.5)) * 1000) + 800;
    i++;
    setTimeout(playNext, ms);
  }
  playNext();
}

function startListeningExercise(unitId) {
  const unit = GERMAN_COURSE.find(u => u.id === unitId);
  if (!unit || !unit.listeningItems || !unit.listeningItems.length) {
    showToast('No listening exercises for this unit.', 'info');
    return;
  }
  state.listening = { unitId, items: [...unit.listeningItems], index: 0, score: 0, answered: false };
  showView('listening');
}

function initListeningView() {
  if (!state.listening) return;
  renderListeningQuestion();
}

function renderListeningQuestion() {
  const ls = state.listening;
  if (!ls) return;
  const container = document.getElementById('listening-active');
  if (!container) return;
  if (ls.index >= ls.items.length) {
    showListeningResults();
    return;
  }
  const item = ls.items[ls.index];
  const unit = GERMAN_COURSE.find(u => u.id === ls.unitId);
  container.innerHTML = `
    <div class="listening-header">
      <div class="fc-counter">${ls.index + 1} / ${ls.items.length}</div>
      <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${(ls.index/ls.items.length)*100}%"></div></div>
    </div>
    <div class="listening-card">
      <div class="listening-play-area">
        <button class="listening-play-btn" onclick="playListeningAudio()" id="listen-play-btn">🔊 Play</button>
        <button class="listening-slow-btn" onclick="playListeningAudio(true)">🐢 Slow</button>
      </div>
      <p class="listening-question">${esc(item.question)}</p>
      <div class="listening-options" id="listening-options">
        ${item.options.map(opt => `
          <button class="quiz-option" onclick="checkListeningAnswer(this,'${esc(opt)}','${esc(item.answer)}')">${esc(opt)}</button>`).join('')}
      </div>
      <div class="listening-feedback hidden" id="listening-feedback"></div>
    </div>`;
  ls.answered = false;
  setTimeout(() => playListeningAudio(), 600);
}

function playListeningAudio(slow = false) {
  const ls = state.listening;
  if (!ls) return;
  const item = ls.items[ls.index];
  if (!item) return;
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(item.audio);
  utt.lang = 'de-DE';
  utt.rate = slow ? 0.5 : 0.85;
  const voices = speechSynthesis.getVoices();
  const deVoice = voices.find(v => v.lang.startsWith('de'));
  if (deVoice) utt.voice = deVoice;
  window.speechSynthesis.speak(utt);
}

function checkListeningAnswer(el, chosen, correct) {
  const ls = state.listening;
  if (!ls || ls.answered) return;
  ls.answered = true;
  const isCorrect = chosen === correct;
  if (isCorrect) ls.score++;

  document.querySelectorAll('.listening-options .quiz-option').forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === correct) btn.classList.add('correct');
    else if (btn.textContent === chosen) btn.classList.add('incorrect');
  });

  const fb = document.getElementById('listening-feedback');
  if (fb) {
    fb.classList.remove('hidden');
    fb.innerHTML = isCorrect
      ? `<div class="feedback-correct">✅ Correct!</div>`
      : `<div class="feedback-incorrect">❌ The answer was: <strong>${esc(correct)}</strong></div>`;
    fb.innerHTML += `<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="nextListeningQuestion()">Next →</button>`;
  }

  if (!isCorrect) {
    recordMistake({ question: ls.items[ls.index].question, myAnswer: chosen, correct, mode: 'listening', setId: ls.unitId });
  }
  updateStreak();
  if (isCorrect) addXP(10);
}

function nextListeningQuestion() {
  state.listening.index++;
  state.listening.answered = false;
  renderListeningQuestion();
}

function showListeningResults() {
  const ls = state.listening;
  const score = ls.score;
  const total = ls.items.length;
  const pct = Math.round((score / total) * 100);
  const container = document.getElementById('listening-active');
  if (!container) return;
  container.innerHTML = `
    <div class="results-screen">
      <div class="results-emoji">${pct === 100 ? '🎉' : pct >= 70 ? '👍' : '💪'}</div>
      <div class="results-score">${pct}%</div>
      <div class="results-label">${score} / ${total} correct</div>
      <div class="results-sub">Listening exercise complete!</div>
      <div class="results-actions">
        <button class="btn btn-primary" onclick="startListeningExercise('${ls.unitId}')">Try Again</button>
        <button class="btn btn-outline" onclick="backToStudySet()">Back to Study Set</button>
      </div>
    </div>`;
  addXP(25);
  if (pct === 100) triggerConfetti();
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
