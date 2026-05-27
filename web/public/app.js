// ─── Camera & OCR ─────────────────────────────────────────────────────────────

async function handlePhoto(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Show preview
  const preview = document.getElementById('photo-preview');
  const previewWrap = document.getElementById('photo-preview-wrap');
  preview.src = URL.createObjectURL(file);
  previewWrap.style.display = 'flex';

  // Show OCR progress
  const ocrProgress = document.getElementById('ocr-progress');
  const ocrStatus = document.getElementById('ocr-status');
  ocrProgress.style.display = 'flex';
  ocrStatus.textContent = 'Reading your worksheet…';

  try {
    const result = await Tesseract.recognize(file, 'deu+eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          ocrStatus.textContent = `Reading… ${Math.round(m.progress * 100)}%`;
        }
      },
    });

    const text = result.data.text.trim();
    const textarea = document.getElementById('worksheet-text');
    textarea.value = text;
    updateCharCount();
    ocrStatus.textContent = '✅ Text extracted! Check it, then tap Generate.';
    setTimeout(() => { ocrProgress.style.display = 'none'; }, 2500);

    if (!text) {
      showToast('No text found — try better lighting or a clearer photo.');
    }
  } catch (err) {
    ocrStatus.textContent = '❌ Could not read photo. Try again.';
    setTimeout(() => { ocrProgress.style.display = 'none'; }, 2500);
    console.error('OCR error:', err);
  }

  // Reset file input so same photo can be re-selected
  event.target.value = '';
}

function clearPhoto() {
  document.getElementById('photo-preview').src = '';
  document.getElementById('photo-preview-wrap').style.display = 'none';
}

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  studySets: [],
  currentSet: null,
  currentView: 'home',

  // Flashcard state
  fc: {
    cards: [],
    index: 0,
    known: [],
    needsWork: [],
    flipped: false,
  },

  // Quiz state
  quiz: {
    questions: [],
    index: 0,
    score: 0,
    answered: false,
    mistakes: [],
  },
};

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await loadStudySets();
  renderHome();
  checkApiKey();
});

async function checkApiKey() {
  // Ping the server to see if the API key is configured
  try {
    const res = await fetch('/api/sets');
    // If we can reach the server, check if the API key warning should show
    const warning = document.getElementById('api-warning');
    // We only show the warning when the user tries to generate
    warning.style.display = 'none';
  } catch {
    // Server not reachable — shouldn't happen since we're serving from it
  }
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function showView(name) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('active'));

  document.getElementById(`view-${name}`)?.classList.add('active');
  document.getElementById(`nav-${name}`)?.classList.add('active');

  state.currentView = name;
  window.scrollTo(0, 0);
}

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', b.getAttribute('onclick').includes(`'${name}'`));
  });
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
  document.getElementById(`tab-${name}`)?.classList.add('active');
}

// ─── Storage ──────────────────────────────────────────────────────────────────

async function loadStudySets() {
  try {
    const res = await fetch('/api/sets');
    state.studySets = await res.json();
  } catch {
    state.studySets = [];
  }
}

async function saveSet(set) {
  await fetch('/api/sets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(set),
  });
  // Refresh local state
  const idx = state.studySets.findIndex((s) => s.id === set.id);
  if (idx >= 0) state.studySets[idx] = set;
  else state.studySets.unshift(set);
}

async function deleteSet(id, e) {
  e.stopPropagation();
  if (!confirm('Delete this study set?')) return;
  await fetch(`/api/sets/${id}`, { method: 'DELETE' });
  state.studySets = state.studySets.filter((s) => s.id !== id);
  renderHome();
  toast('Study set deleted.');
}

// ─── Home ─────────────────────────────────────────────────────────────────────

function renderHome() {
  const grid = document.getElementById('sets-grid');

  if (state.studySets.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <h2>No study sets yet</h2>
        <p>Create your first study set by pasting a German worksheet.</p>
        <button class="btn btn-primary btn-lg" onclick="showView('create')">📷 New Study Set</button>
      </div>`;
    return;
  }

  grid.innerHTML = state.studySets.map((set) => {
    const mastery = set.masteryLevel || 0;
    const color = mastery >= 80 ? 'var(--success)' : mastery >= 50 ? 'var(--warning)' : 'var(--primary)';
    const lastStudied = set.lastStudied ? relativeDate(set.lastStudied) : 'Not studied yet';
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
        <div class="progress-bar-wrap">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-light);margin-bottom:4px">
            <span>Mastery</span><span style="color:${color};font-weight:700">${mastery}%</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width:${mastery}%;background:${color}"></div>
          </div>
        </div>
        <div class="set-card-meta">
          <span>📖 ${(set.vocabulary || []).length} words</span>
          <span>🕐 ${lastStudied}</span>
          ${set.bestQuizScore !== undefined ? `<span class="badge badge-success">${set.bestQuizScore}%</span>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ─── Create / Generate ────────────────────────────────────────────────────────

function updateCharCount() {
  const text = document.getElementById('worksheet-text').value;
  document.getElementById('char-count').textContent = `${text.length} characters`;
}

async function generateStudySet() {
  const text = document.getElementById('worksheet-text').value.trim();
  if (!text) {
    toast('Please paste some worksheet text first.', 'error');
    return;
  }

  const btn = document.getElementById('generate-btn');
  btn.disabled = true;

  showLoading('Reading your worksheet…');
  setTimeout(() => setLoadingMsg('Claude is analyzing your text…'), 1200);
  setTimeout(() => setLoadingMsg('Creating your study set…'), 3000);

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    hideLoading();

    if (!res.ok) {
      if (data.demo) {
        document.getElementById('api-warning').style.display = 'block';
        toast('Add your Claude API key to generate real study sets.', 'error');
      } else {
        toast(data.error || 'Generation failed.', 'error');
      }
      btn.disabled = false;
      return;
    }

    // Save the set
    await saveSet(data);

    // Clear the form
    document.getElementById('worksheet-text').value = '';
    updateCharCount();
    btn.disabled = false;

    toast('Study set created! ✨', 'success');
    openStudySet(data.id);

  } catch (err) {
    hideLoading();
    btn.disabled = false;
    toast('Something went wrong. Is the server running?', 'error');
  }
}

// ─── Study Set View ───────────────────────────────────────────────────────────

function openStudySet(id) {
  const set = state.studySets.find((s) => s.id === id);
  if (!set) return;
  state.currentSet = set;
  renderStudySet(set);
  showView('study-set');
  switchTab('overview');
}

function renderStudySet(set) {
  document.getElementById('ss-title').textContent = set.title || 'Study Set';
  document.getElementById('ss-topic').textContent = set.topic || '';

  // Overview: memorize
  const memEl = document.getElementById('ss-memorize');
  if (set.toMemorize?.length) {
    memEl.style.display = '';
    memEl.innerHTML = `<div class="info-card-title">🧠 What to Memorize</div>
      <ul class="bullet-list">${(set.toMemorize || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  } else {
    memEl.style.display = 'none';
  }

  // Overview: understand
  const undEl = document.getElementById('ss-understand');
  if (set.toUnderstand?.length) {
    undEl.style.display = '';
    undEl.innerHTML = `<div class="info-card-title">💡 What to Understand</div>
      <ul class="bullet-list">${(set.toUnderstand || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  } else {
    undEl.style.display = 'none';
  }

  // Vocabulary
  const vocab = set.vocabulary || [];
  document.getElementById('vocab-count').textContent = `${vocab.length} words to learn`;
  document.getElementById('vocab-grid').innerHTML = vocab.map((v) => `
    <div class="vocab-card">
      <div class="vocab-german">
        ${v.article ? `<span class="vocab-article">${esc(v.article)} </span>` : ''}${esc(v.german)}
      </div>
      <div class="vocab-english">${esc(v.english)}</div>
      ${v.wordType ? `<span class="vocab-type">${esc(v.wordType)}</span>` : ''}
      ${v.example ? `
        <div class="vocab-example">
          <div class="vocab-example-de">🇩🇪 ${esc(v.example)}</div>
          ${v.exampleTranslation ? `<div class="vocab-example-en">🇬🇧 ${esc(v.exampleTranslation)}</div>` : ''}
        </div>` : ''}
    </div>`).join('');

  // Grammar
  const grammar = set.grammarTopics || [];
  document.getElementById('grammar-list').innerHTML = grammar.length ? grammar.map((g) => `
    <div class="grammar-card">
      <div class="grammar-title">${esc(g.title)}</div>
      <div class="grammar-rule">${esc(g.rule)}</div>
      <div class="grammar-examples">
        ${(g.examples || []).map((ex) => `
          <div class="grammar-example">
            <div class="grammar-example-de">🇩🇪 ${esc(ex.german)}</div>
            <div class="grammar-example-en">🇬🇧 ${esc(ex.english)}</div>
          </div>`).join('')}
      </div>
      ${g.tip ? `<div class="grammar-tip">${esc(g.tip)}</div>` : ''}
    </div>`).join('') : '<p style="color:var(--text-light)">No grammar topics detected.</p>';

  // Sentences
  const sentences = set.exampleSentences || [];
  document.getElementById('sentences-list').innerHTML = sentences.length ? sentences.map((s) => `
    <div class="sentence-card">
      <div class="sentence-de">🇩🇪 ${esc(s.german)}</div>
      <div class="sentence-en">🇬🇧 ${esc(s.english)}</div>
    </div>`).join('') : '<p style="color:var(--text-light)">No example sentences.</p>';
}

function backToStudySet() {
  if (state.currentSet) openStudySet(state.currentSet.id);
  else showView('home');
}

// ─── Flashcards ───────────────────────────────────────────────────────────────

function startFlashcards() {
  const set = state.currentSet;
  if (!set || !set.vocabulary?.length) {
    toast('No vocabulary to practice.', 'error');
    return;
  }

  state.fc = {
    cards: shuffle([...set.vocabulary]),
    index: 0,
    known: [],
    needsWork: [],
    flipped: false,
  };

  document.getElementById('fc-set-name').textContent = set.title;
  document.getElementById('fc-back-btn').onclick = backToStudySet;
  document.getElementById('fc-active').style.display = '';
  document.getElementById('fc-results').style.display = 'none';
  document.getElementById('flashcard').classList.remove('flipped');

  renderFlashcard();
  showView('flashcards');
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
    exEl.innerHTML = `<div class="vocab-example-de">${esc(card.example)}</div>
      ${card.exampleTranslation ? `<div class="vocab-example-en">${esc(card.exampleTranslation)}</div>` : ''}`;
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

  if (knewIt) state.fc.known.push(card.id);
  else state.fc.needsWork.push(card.id);

  if (index + 1 >= cards.length) {
    showFlashcardResults();
    updateMastery();
  } else {
    state.fc.index++;
    renderFlashcard();
  }
}

function showFlashcardResults() {
  const { known, needsWork, cards } = state.fc;
  const score = Math.round((known.length / cards.length) * 100);
  const { emoji, label } = getScoreInfo(score);

  document.getElementById('fc-active').style.display = 'none';
  document.getElementById('fc-results').style.display = '';
  document.getElementById('fc-result-emoji').textContent = emoji;
  document.getElementById('fc-result-score').textContent = `${score}%`;
  document.getElementById('fc-result-label').textContent = label;
  document.getElementById('fc-result-sub').textContent =
    `${known.length} knew it · ${needsWork.length} need more practice`;
}

function restartFlashcards() {
  const set = state.currentSet;
  if (set) startFlashcards();
}

async function updateMastery() {
  const set = state.currentSet;
  if (!set) return;
  const { known, cards } = state.fc;
  const score = Math.round((known.length / cards.length) * 100);
  set.masteryLevel = Math.max(set.masteryLevel || 0, score);
  set.bestQuizScore = Math.max(set.bestQuizScore || 0, score);
  await saveSet(set);
  renderHome();
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

function startQuiz() {
  const set = state.currentSet;
  if (!set || !set.quizQuestions?.length) {
    toast('No quiz questions available.', 'error');
    return;
  }

  state.quiz = {
    questions: shuffle([...set.quizQuestions]),
    index: 0,
    score: 0,
    answered: false,
    mistakes: [],
  };

  document.getElementById('quiz-set-name').textContent = set.title;
  document.getElementById('quiz-back-btn').onclick = backToStudySet;
  document.getElementById('quiz-active').style.display = '';
  document.getElementById('quiz-results').style.display = 'none';
  document.getElementById('quiz-feedback').style.display = 'none';
  document.getElementById('quiz-next-btn').style.display = 'none';

  renderQuizQuestion();
  showView('quiz');
}

function renderQuizQuestion() {
  const { questions, index, score } = state.quiz;
  const q = questions[index];

  document.getElementById('quiz-counter').textContent = `${index + 1} / ${questions.length}`;
  document.getElementById('quiz-score-badge').textContent = `Score: ${score}`;
  document.getElementById('quiz-progress-bar').style.width = `${(index / questions.length) * 100}%`;
  document.getElementById('quiz-q-type').textContent = formatQuestionType(q.question);
  document.getElementById('quiz-q-text').textContent = q.question;
  document.getElementById('quiz-feedback').style.display = 'none';
  document.getElementById('quiz-next-btn').style.display = 'none';

  state.quiz.answered = false;

  const optionsEl = document.getElementById('quiz-options');
  if (q.options?.length) {
    optionsEl.innerHTML = q.options.map((opt) =>
      `<button class="quiz-option" onclick="selectAnswer(this, ${JSON.stringify(opt)}, ${JSON.stringify(q.correctAnswer)}, ${JSON.stringify(q.explanation || '')})">
        ${esc(opt)}
      </button>`
    ).join('');
  } else {
    // No options — just show the answer directly (for non-MC questions)
    optionsEl.innerHTML = `<div style="background:var(--primary-light);border-radius:var(--radius);padding:16px 20px">
      <p style="font-size:13px;color:var(--text-light);margin-bottom:4px">Answer:</p>
      <p style="font-size:16px;font-weight:700;color:var(--primary)">${esc(q.correctAnswer)}</p>
    </div>`;
    // Auto-advance after 2s
    setTimeout(() => quizNext(), 2000);
  }
}

function selectAnswer(btn, selected, correct, explanation) {
  if (state.quiz.answered) return;
  state.quiz.answered = true;

  const isCorrect = normalizeAnswer(selected) === normalizeAnswer(correct);

  // Style buttons
  document.querySelectorAll('.quiz-option').forEach((b) => {
    b.disabled = true;
    if (b.textContent.trim() === correct.trim()) b.classList.add('correct');
  });
  if (!isCorrect) {
    btn.classList.add('incorrect');
    state.quiz.mistakes.push({ question: document.getElementById('quiz-q-text').textContent, correct });
  } else {
    state.quiz.score++;
  }

  // Show feedback
  const fb = document.getElementById('quiz-feedback');
  fb.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
  fb.style.display = '';
  document.getElementById('quiz-feedback-title').textContent = isCorrect ? '✅ Correct!' : `❌ The answer is: ${correct}`;
  document.getElementById('quiz-feedback-exp').textContent = explanation || '';

  document.getElementById('quiz-next-btn').textContent =
    state.quiz.index + 1 >= state.quiz.questions.length ? 'See Results 🎉' : 'Next Question →';
  document.getElementById('quiz-next-btn').style.display = '';
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
  const { score, questions, mistakes } = state.quiz;
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
      mistakes.map((m) => `
        <div style="background:var(--error-light);border-radius:var(--radius-sm);padding:12px 14px;margin-bottom:8px;border-left:3px solid var(--error)">
          <p style="font-size:14px;font-weight:600;margin-bottom:4px">${esc(m.question)}</p>
          <p style="font-size:13px;color:var(--text-sec)">Correct: <strong style="color:var(--success)">${esc(m.correct)}</strong></p>
        </div>`).join('');
  } else {
    mistakesEl.innerHTML = '';
  }

  // Update mastery
  const set = state.currentSet;
  if (set) {
    set.masteryLevel = Math.max(set.masteryLevel || 0, finalScore);
    set.bestQuizScore = Math.max(set.bestQuizScore || 0, finalScore);
    saveSet(set);
    renderHome();
  }
}

function restartQuiz() {
  startQuiz();
}

// ─── Homework Helper ──────────────────────────────────────────────────────────

function startHomework() {
  const set = state.currentSet;
  if (!set?.homework?.length) {
    toast('No homework questions in this study set.', 'error');
    return;
  }

  document.getElementById('hw-set-name').textContent = set.title;
  document.getElementById('hw-questions').innerHTML = set.homework.map((q, i) => `
    <div class="hw-card" id="hw-${i}">
      <div class="hw-q-num">Question ${i + 1}</div>
      <div class="hw-question">${esc(q.question)}</div>

      <div class="hw-hint" id="hw-hint-${i}">
        💡 <strong>Hint:</strong> ${esc(q.hint)}
      </div>

      <div class="hw-answer" id="hw-answer-${i}">
        <div class="hw-answer-text">✅ ${esc(q.answer)}</div>
        <div class="hw-answer-exp">${esc(q.explanation || '')}</div>
      </div>

      <div class="hw-actions">
        <button class="btn btn-outline btn-sm" onclick="toggleHint(${i})">💡 Show Hint</button>
        <button class="btn btn-success btn-sm" onclick="toggleAnswer(${i})">👁 Show Answer</button>
      </div>
    </div>`).join('');

  showView('homework');
}

function toggleHint(i) {
  const el = document.getElementById(`hw-hint-${i}`);
  el.classList.toggle('visible');
}

function toggleAnswer(i) {
  const el = document.getElementById(`hw-answer-${i}`);
  el.classList.toggle('visible');
  // Also show hint if revealing answer
  document.getElementById(`hw-hint-${i}`).classList.add('visible');
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function showLoading(msg) {
  document.getElementById('loading-msg').textContent = msg;
  document.getElementById('loading-overlay').classList.add('active');
}
function setLoadingMsg(msg) {
  document.getElementById('loading-msg').textContent = msg;
}
function hideLoading() {
  document.getElementById('loading-overlay').classList.remove('active');
}

function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  setTimeout(() => el.classList.remove('show'), 3000);
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeAnswer(s) {
  return String(s).toLowerCase().trim().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ');
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getScoreInfo(score) {
  if (score >= 90) return { emoji: '🏆', label: 'Excellent!' };
  if (score >= 75) return { emoji: '⭐', label: 'Great job!' };
  if (score >= 60) return { emoji: '👍', label: 'Good work!' };
  if (score >= 40) return { emoji: '💪', label: 'Keep going!' };
  return { emoji: '📚', label: 'Keep practicing!' };
}

function formatQuestionType(q) {
  return 'Multiple Choice';
}

function relativeDate(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return `${Math.floor(diff / 7)}w ago`;
}
