// api/messages.js — lightweight in-memory message store
// GET  /api/messages?since=<timestamp>  → returns new messages
// POST /api/messages                    → stores a translated message

// NOTE: Vercel serverless functions are stateless per invocation.
// We use a module-level array which persists within the same warm instance.
// For production, replace with Vercel KV or Upstash Redis.
// For a portfolio demo, this works perfectly fine.

const messages = [];
const MAX_MESSAGES = 100;

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const since = parseInt(req.query.since || "0", 10);
    const newMessages = messages.filter(m => m.timestamp > since);
    return res.status(200).json(newMessages);
  }

  if (req.method === "POST") {
    const message = req.body;
    messages.push(message);
    if (messages.length > MAX_MESSAGES) messages.shift();
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
