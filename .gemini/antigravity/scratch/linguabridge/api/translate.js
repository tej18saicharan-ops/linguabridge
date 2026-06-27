import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Allow simple CORS for local development testing if needed
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, sourceLang, targetLang } = req.body || {};

  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Missing required fields. "text" and "targetLang" are required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please add it to your environment variables.'
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Design a clear system prompt for translation accuracy
    const prompt = `You are a professional, accurate translator. Translate the following text from ${sourceLang || 'auto-detection'} to ${targetLang}. 
Do NOT write any introduction or explanation, and do NOT wrap the output in quotes or markdown. Just output the translation.

Text to translate:
${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();

    return res.status(200).json({
      originalText: text,
      translatedText: translatedText,
      sourceLang: sourceLang || 'auto',
      targetLang: targetLang
    });
  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({
      error: 'Failed to translate text using Gemini API.',
      details: error.message
    });
  }
}
