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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.body || {};
  if (!text?.trim()) return res.status(400).json({ error: 'No text provided.' });

  const groqKey = process.env.GROQ_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const apiKey = groqKey || openrouterKey;

  if (!apiKey) {
    return res.status(503).json({
      error: 'GROQ_API_KEY not set. Get a free key at console.groq.com — no credit card needed.',
      demo: true,
    });
  }

  const isOpenRouter = !groqKey && !!openrouterKey;
  const endpoint = isOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.groq.com/openai/v1/chat/completions';
  const model = isOpenRouter ? 'meta-llama/llama-3.3-70b-instruct' : 'llama-3.3-70b-versatile';

  try {
    const aiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: STUDY_PROMPT(text) }],
        max_tokens: 4096,
        temperature: 0.3,
      }),
    });

    const data = await aiRes.json();

    if (data.error) {
      throw new Error(data.error.message || 'AI API error');
    }

    const responseText = data.choices[0].message.content.trim();

    let jsonText = responseText
      .replace(/^```[\w]*\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .replace(/^`+|`+$/g, '')
      .trim();

    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace > 0 && lastBrace > firstBrace) {
      jsonText = jsonText.slice(firstBrace, lastBrace + 1);
    }

    let studyData;
    try {
      studyData = JSON.parse(jsonText);
    } catch {
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
    console.error('AI API error:', err.message);
    if (err.message?.includes('JSON')) {
      res.status(500).json({ error: 'AI returned unexpected output. Try again.' });
    } else {
      res.status(500).json({ error: err.message || 'Generation failed.' });
    }
  }
}
