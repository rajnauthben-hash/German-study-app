require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'sets.json');

// ─── Setup ────────────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data file exists
async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([]));
  }
}

async function readSets() {
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeSets(sets) {
  await fs.writeFile(DATA_FILE, JSON.stringify(sets, null, 2));
}

// ─── Gemini API ───────────────────────────────────────────────────────────────

const CLAUDE_PROMPT = (text) => `You are a German language teacher assistant.
Analyze this German worksheet text and create a detailed study set.

Return ONLY valid JSON — no markdown, no explanation, just the JSON object.

Required structure:
{
  "title": "Short title like 'Modal Verbs' or 'Food Vocabulary'",
  "topic": "Full topic description",
  "vocabulary": [
    {
      "german": "German word",
      "english": "English meaning",
      "article": "der/die/das (null if not a noun)",
      "wordType": "noun/verb/adjective/modal/adverb/preposition",
      "example": "Example sentence in German",
      "exampleTranslation": "English translation of the example"
    }
  ],
  "grammarTopics": [
    {
      "title": "Grammar rule name",
      "rule": "Clear explanation of the grammar rule",
      "examples": [{ "german": "sentence", "english": "translation" }],
      "tip": "Memory trick or shortcut"
    }
  ],
  "exampleSentences": [
    { "german": "...", "english": "..." }
  ],
  "quizQuestions": [
    {
      "question": "Question text",
      "correctAnswer": "The correct answer",
      "options": ["option1", "option2", "option3", "option4"],
      "explanation": "Why this is the correct answer"
    }
  ],
  "toMemorize": ["Key thing 1 to memorize", "Key thing 2"],
  "toUnderstand": ["Concept 1 to understand", "Concept 2"],
  "homework": [
    {
      "question": "Homework question text",
      "hint": "A helpful hint without giving away the answer",
      "answer": "The correct answer",
      "explanation": "Full explanation of the answer and grammar used"
    }
  ]
}

Worksheet text:
${text}`;

// ─── API Routes ───────────────────────────────────────────────────────────────

// Generate a study set from pasted text using Gemini
app.post('/api/generate', async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text provided.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return res.status(503).json({
      error: 'GEMINI_API_KEY not set. Copy .env.example to .env and add your free key from aistudio.google.com',
      demo: true,
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent(CLAUDE_PROMPT(text));
    const responseText = result.response.text().trim();

    // Strip markdown code fences if present
    const jsonText = responseText.replace(/^```json?\s*/i, '').replace(/\s*```$/, '');
    const studyData = JSON.parse(jsonText);

    const studySet = {
      id: `ss-${Date.now()}`,
      ...studyData,
      rawText: text,
      createdAt: new Date().toISOString(),
      masteryLevel: 0,
    };

    res.json(studySet);
  } catch (err) {
    console.error('Gemini API error:', err.message);
    if (err.message?.includes('JSON')) {
      res.status(500).json({ error: 'Claude returned unexpected output. Try again.' });
    } else {
      res.status(500).json({ error: err.message || 'Generation failed.' });
    }
  }
});

// Get all saved study sets
app.get('/api/sets', async (req, res) => {
  try {
    const sets = await readSets();
    res.json(sets);
  } catch {
    res.json([]);
  }
});

// Save a study set
app.post('/api/sets', async (req, res) => {
  try {
    const set = req.body;
    const sets = await readSets();
    const existing = sets.findIndex((s) => s.id === set.id);
    if (existing >= 0) {
      sets[existing] = set;
    } else {
      sets.unshift(set);
    }
    await writeSets(sets);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a study set
app.delete('/api/sets/:id', async (req, res) => {
  try {
    const sets = await readSets();
    await writeSets(sets.filter((s) => s.id !== req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update mastery level
app.patch('/api/sets/:id/mastery', async (req, res) => {
  try {
    const sets = await readSets();
    const set = sets.find((s) => s.id === req.params.id);
    if (set) {
      set.masteryLevel = req.body.masteryLevel;
      set.lastStudied = new Date().toISOString();
      await writeSets(sets);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

ensureDataFile().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🇩🇪  DeutschSnap Study is running!`);
    console.log(`   Open: http://localhost:${PORT}\n`);
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.log(`⚠️  No API key found. Copy .env.example to .env and add your free Gemini key.`);
      console.log(`   Get one free at: https://aistudio.google.com\n`);
    }
  });
});
