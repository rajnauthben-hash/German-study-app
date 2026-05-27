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

const STUDY_PROMPT = (text) => `You are an expert German language teacher. Analyze the worksheet text and produce a comprehensive study set.

CRITICAL RULES:
- ALWAYS return valid JSON — no markdown, no code fences, just the raw JSON object
- NEVER refuse or say the text is invalid — always make a best-effort study set
- If text is unclear (OCR artifacts), infer the topic and create relevant content
- Clearly distinguish: content FROM the worksheet vs AI-generated practice material
- All German nouns MUST have their article (der/die/das)
- Generate at least 5 vocabulary items, 4 quiz questions, 3 fill-in-blank sentences

Return ONLY this JSON structure:

{
  "title": "Short title like 'Modal Verbs' or 'Sich vorstellen' — max 6 words",
  "topic": "Full description of what this worksheet covers",
  "vocabulary": [
    {
      "german": "German word (WITHOUT article)",
      "english": "English meaning",
      "article": "der/die/das or null if not a noun",
      "wordType": "noun/verb/adjective/modal/adverb/preposition/phrase",
      "example": "A natural German sentence using this word",
      "exampleTranslation": "English translation of the example"
    }
  ],
  "grammarTopics": [
    {
      "title": "Grammar rule name",
      "rule": "Clear explanation of the grammar rule in plain English",
      "examples": [{ "german": "German sentence", "english": "Translation" }],
      "tip": "A memorable trick or shortcut for this rule"
    }
  ],
  "exampleSentences": [
    { "german": "Full German sentence from the worksheet", "english": "English translation" }
  ],
  "quizQuestions": [
    {
      "question": "Question text — mix of translation, meaning, grammar fill-in, and article questions",
      "correctAnswer": "The single correct answer",
      "options": ["correct answer", "wrong option 2", "wrong option 3", "wrong option 4"],
      "explanation": "Why this is correct, with grammar rule reference"
    }
  ],
  "fillInTheBlank": [
    {
      "sentence": "German sentence with ___ where the answer goes",
      "answer": "The missing word",
      "hint": "Grammar hint e.g. 'modal verb, 1st person singular'",
      "explanation": "Why this is the correct word and what grammar rule applies"
    }
  ],
  "toMemorize": ["Key vocabulary item or phrase to memorize", "..."],
  "toUnderstand": ["Grammar concept to understand deeply", "..."],
  "homework": [
    {
      "question": "A practice question based on worksheet content",
      "hint": "Helpful hint without giving the answer",
      "answer": "Complete correct answer",
      "explanation": "Full grammar explanation of why this is correct"
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
