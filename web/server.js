require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'sets.json');

// ─── Setup ────────────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

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

// ─── Groq API ─────────────────────────────────────────────────────────────────

const STUDY_PROMPT = (text) => `You are a German language teacher assistant. Your job is to ALWAYS create a useful study set from ANY text provided — never refuse or return an error.

IMPORTANT RULES:
- ALWAYS return valid JSON, no matter what the text looks like
- NEVER say the text is invalid or refuse to process it
- If the text is unclear (e.g. from OCR), do your best to identify German words and grammar
- If you can't find specific content, invent 5–10 relevant German vocabulary items based on any topic you can infer
- Always populate vocabulary with at least 5 items and quizQuestions with at least 4 items
- The text may come from a photo scan and may have OCR artifacts — work around them

Return ONLY valid JSON — no markdown, no explanation, no code fences, just the raw JSON object.

Required structure:
{
  "title": "Short descriptive title like 'Modal Verbs' or 'Food Vocabulary' (never 'Invalid Text')",
  "topic": "Full topic description based on what you can infer",
  "vocabulary": [
    {
      "german": "German word",
      "english": "English meaning",
      "article": "der/die/das or null if not a noun",
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

function groqRequest(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
      temperature: 0.3,
    });

    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid response from Groq'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── API Routes ───────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'DeutschSnap API', version: '2.0.0' });
});

// OCR endpoint (client-side OCR is recommended; this is a stub)
app.post('/api/ocr', (req, res) => {
  // Groq does not support vision/image input.
  // OCR should be performed client-side or via a dedicated vision API.
  res.json({ text: '', confidence: 0, message: 'Use manual entry', isManualEntry: true });
});

// Generate a study set from pasted text
app.post('/api/generate', async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text provided.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    return res.status(503).json({
      error: 'GROQ_API_KEY not set. Get a free key at console.groq.com — no credit card needed.',
      demo: true,
    });
  }

  try {
    const response = await groqRequest(apiKey, STUDY_PROMPT(text));

    if (response.error) {
      throw new Error(response.error.message || 'Groq API error');
    }

    const responseText = response.choices[0].message.content.trim();

    // Strip markdown code fences more aggressively
    let jsonText = responseText
      .replace(/^```[\w]*\s*/i, '')  // opening fence with optional language tag
      .replace(/\s*```\s*$/i, '')     // closing fence
      .replace(/^`+|`+$/g, '')        // any remaining backticks
      .trim();

    // Find first { to handle any preamble text
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace > 0 && lastBrace > firstBrace) {
      jsonText = jsonText.slice(firstBrace, lastBrace + 1);
    }

    let studyData;
    try {
      studyData = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error('JSON parse failed. Raw response:', responseText.slice(0, 200));
      throw new Error('AI returned malformed JSON. Please try again.');
    }

    const studySet = {
      id: `ss-${Date.now()}`,
      ...studyData,
      rawText: text,
      createdAt: new Date().toISOString(),
      masteryLevel: 0,
    };

    res.json(studySet);
  } catch (err) {
    console.error('Groq API error:', err.message);
    if (err.message?.includes('JSON')) {
      res.status(500).json({ error: 'AI returned unexpected output. Try again.' });
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
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🇩🇪  DeutschSnap Study is running!`);
    console.log(`   Open: http://localhost:${PORT}\n`);
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      console.log(`⚠️  No API key found. Get a free key at: https://console.groq.com`);
      console.log(`   No credit card needed.\n`);
    }
  });
});
