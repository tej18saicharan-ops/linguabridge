# LinguaBridge

A modern translation application utilizing the Google Gemini API, running on Vercel Serverless Functions.

## Features
- Translate text between multiple languages.
- Sleek and responsive dark-themed user interface.
- Native ES Modules support for API endpoints to prevent CommonJS compilation warnings.

## Getting Started

1. Clone the project and navigate into it:
   ```bash
   cd linguabridge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your `GEMINI_API_KEY` (obtained from Google AI Studio).

4. Run locally with Vercel CLI:
   ```bash
   vercel dev
   ```
