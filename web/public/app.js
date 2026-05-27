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
  const defaults = { name: 'Student', level: 'A2', apiUrl: window.location.origin, dailyGoal: 15 };
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
  } else {
    p.streak = 1;
    p.lastStudyDate = new Date().toISOString();
  }
  saveProgress(p);
  document.getElementById('streak-badge').textContent = `🔥 ${p.streak}`;
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
  };
  if (viewInits[name]) viewInits[name]();
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function initDashboard() {
  const settings = getSettings();
  const p = getProgress();
  const sets = getSets();

  // Greeting
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dash-greeting').textContent = `${greet}, ${settings.name}! 👋`;
  document.getElementById('dash-sub').textContent = getStreakMessage(p.streak);

  // Stats
  document.getElementById('stat-streak').textContent = p.streak || 0;
  document.getElementById('stat-sets').textContent = sets.length;
  document.getElementById('stat-words').textContent = p.totalWords || 0;
  document.getElementById('stat-quizzes').textContent = p.totalQuizzes || 0;

  // Streak badge
  document.getElementById('streak-badge').textContent = `🔥 ${p.streak || 0}`;

  // Recent sets (up to 4)
  const recentSets = sets.slice(0, 4);
  const container = document.getElementById('dash-recent-sets');

  if (recentSets.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <h3>No study sets yet</h3>
        <p>Scan a worksheet to create your first set</p>
        <button class="btn btn-primary" onclick="showView('create')">📷 Scan Worksheet</button>
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
  const settings = getSettings();
  updateCharCount();

  // Show API URL hint if not localhost
  const hintEl = document.getElementById('api-url-hint');
  if (settings.apiUrl && settings.apiUrl !== 'http://localhost:3000') {
    hintEl.textContent = `Using: ${settings.apiUrl}`;
    hintEl.style.display = 'block';
  } else {
    hintEl.style.display = 'none';
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
 * Preprocess image using Canvas for better OCR accuracy:
 * - Resize to max 2400px wide (Tesseract works better with larger images)
 * - Convert to greyscale
 * - Boost contrast to make text pop against background
 */
function preprocessImageForOCR(file, statusEl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        if (statusEl) statusEl.textContent = 'Enhancing image…';

        const MAX_DIM = 2400;
        let { width, height } = img;

        // Scale up if too small, scale down if too large
        const scale = Math.min(MAX_DIM / Math.max(width, height), 3);
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Draw scaled image
        ctx.drawImage(img, 0, 0, width, height);

        // Apply greyscale + contrast boost via pixel manipulation
        const imageData = ctx.getImageData(0, 0, width, height);
        const d = imageData.data;
        const contrast = 60; // 0–100, higher = sharper text
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < d.length; i += 4) {
          // Greyscale
          const grey = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          // Contrast stretch
          const c = factor * (grey - 128) + 128;
          const v = Math.max(0, Math.min(255, c));
          d[i] = d[i + 1] = d[i + 2] = v;
          // alpha unchanged
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
    p.totalWords = (p.totalWords || 0) + (data.vocabulary?.length || 0);
    saveProgress(p);

    btn.disabled = false;
    document.getElementById('worksheet-text').value = '';
    updateCharCount();

    showToast('Study set created! ✨', 'success');
    openStudySet(data.id);

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
  const mastery = set.masteryLevel || 0;
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
        <span>Mastery</span>
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
}

function markCard(knewIt) {
  const { cards, index } = state.fc;
  const card = cards[index];
  if (knewIt) state.fc.known.push(card.id || card.german);
  else state.fc.needsWork.push(card.id || card.german);

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

  // Progress
  const p = getProgress();
  p.totalWords = (p.totalWords || 0) + known.length;
  addHistoryEntry({ date: new Date().toISOString(), setId, setTitle: state.currentSet?.title || '', mode: 'flashcards', score, wordsStudied: cards.length });
  saveProgress(p);
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
    optionsEl.innerHTML = q.options.map(opt =>
      `<button class="quiz-option" onclick="selectOption(this, ${JSON.stringify(opt)}, ${JSON.stringify(q.correctAnswer)}, ${JSON.stringify(q.explanation || '')})">${esc(opt)}</button>`
    ).join('');
  } else {
    optionsEl.innerHTML = `<div class="info-card"><p style="color:var(--text-light);font-size:13px">Answer:</p><p style="font-size:16px;font-weight:700;color:var(--primary)">${esc(q.correctAnswer)}</p></div>`;
    setTimeout(() => quizNext(), 2000);
  }
}

function selectOption(el, selected, correct, explanation) {
  if (state.quiz.answered) return;
  state.quiz.answered = true;

  const isCorrect = normalizeAnswer(selected) === normalizeAnswer(correct);

  document.querySelectorAll('.quiz-option').forEach(b => {
    b.disabled = true;
    if (normalizeAnswer(b.textContent.trim()) === normalizeAnswer(correct)) b.classList.add('correct');
  });

  if (!isCorrect) {
    el.classList.add('incorrect');
    state.quiz.mistakes.push({
      question: document.getElementById('quiz-q-text').textContent,
      correct,
    });
  } else {
    state.quiz.score++;
  }

  const fb = document.getElementById('quiz-feedback');
  fb.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
  fb.style.display = '';
  document.getElementById('quiz-feedback-title').textContent = isCorrect ? '✅ Correct!' : `❌ The answer is: ${correct}`;
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
}

function restartQuiz() {
  if (state.quiz.setId) startQuiz(state.quiz.setId);
}

// ─── Homework Helper ──────────────────────────────────────────────────────────

function startHomework(setId) {
  const sets = getSets();
  const set = sets.find(s => s.id === setId) || state.currentSet;
  if (!set) { showToast('Study set not found.', 'error'); return; }
  if (!set.homework?.length) { showToast('No homework questions in this set.', 'error'); return; }

  state.currentSet = set;
  document.getElementById('hw-set-name').textContent = set.title;

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
  const verb = COMMON_VERBS[state.verbIndex];
  document.getElementById('verb-nav-counter').textContent = `${state.verbIndex + 1} / ${COMMON_VERBS.length}`;
  document.getElementById('verb-prev-btn').disabled = state.verbIndex === 0;
  document.getElementById('verb-next-btn').disabled = state.verbIndex === COMMON_VERBS.length - 1;

  const cardArea = document.getElementById('verb-card-area');

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
  // Score feedback
  const verb = COMMON_VERBS[state.verbIndex];
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
  if (state.verbIndex < COMMON_VERBS.length - 1) {
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
  document.getElementById('settings-api-url').value = s.apiUrl || 'http://localhost:3000';
  document.getElementById('settings-goal').value = s.dailyGoal || 15;
  document.getElementById('api-connection-status').textContent = '';
}

function saveSettingsForm() {
  const s = {
    name: document.getElementById('settings-name').value.trim() || 'Student',
    level: document.getElementById('settings-level').value,
    apiUrl: (document.getElementById('settings-api-url').value.trim() || 'http://localhost:3000').replace(/\/$/, ''),
    dailyGoal: parseInt(document.getElementById('settings-goal').value) || 15,
  };
  saveSettings(s);
  showToast('Settings saved! ✅', 'success');
}

async function checkApiConnection() {
  const apiUrl = (document.getElementById('settings-api-url').value.trim() || 'http://localhost:3000').replace(/\/$/, '');
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
  return String(s).toLowerCase().trim().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ');
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

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const p = getProgress();
  document.getElementById('streak-badge').textContent = `🔥 ${p.streak || 0}`;
  showView('dashboard');
});
