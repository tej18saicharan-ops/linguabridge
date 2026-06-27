// api/translate.js — Vercel serverless function
// Calls Gemini API to detect language and translate text

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, targetLang, sender } = req.body;

  if (!text || !targetLang || !sender) {
    return res.status(400).json({ error: "Missing text, targetLang or sender" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not set" });

  const prompt =
    `You are a translation assistant. Detect the language of the following text and translate it to ${targetLang}.\n\n` +
    `Respond ONLY in this exact JSON format (no markdown, no extra text):\n` +
    `{"detected_language": "<language name>", "translation": "<translated text>"}\n\n` +
    `Text to translate: ${text}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return res.status(500).json({ error: "Gemini API error: " + err });
    }

    const data = await geminiRes.json();
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    const parsed = JSON.parse(content);

    return res.status(200).json({
      sender,
      originalText: text,
      translatedText: parsed.translation || text,
      detectedLang: parsed.detected_language || "Unknown",
      targetLang,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error("Translation error:", err);
    return res.status(500).json({ error: err.message });
  }
}
