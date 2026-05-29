export default function handler(req, res) {
  const hasKey = !!(process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY);
  res.json({ ok: true, service: 'DeutschSnap API', version: '2.0.0', aiReady: hasKey });
}
