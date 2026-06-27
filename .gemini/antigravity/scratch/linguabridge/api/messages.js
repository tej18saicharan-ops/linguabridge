export default function handler(req, res) {
  // Mock history of translations
  const mockMessages = [
    {
      id: "1",
      original: "Welcome to LinguaBridge!",
      translated: "¡Bienvenido a LinguaBridge!",
      source: "English",
      target: "Spanish",
      timestamp: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: "2",
      original: "AI-powered real-time translation.",
      translated: "Traduction en temps réel propulsée par l'IA.",
      source: "English",
      target: "French",
      timestamp: new Date(Date.now() - 60000).toISOString()
    }
  ];

  if (req.method === 'GET') {
    return res.status(200).json(mockMessages);
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}
