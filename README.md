# Nodiac Oracle

A multi-perspective AI chatbot with voice mode for getting insights from different industry perspectives on data centers and clean energy.

## Features

- **Multi-Model Support**: Choose from Claude (Opus 4.5, Sonnet 4), GPT-4o, and Gemini models
- **Four Industry Perspectives**:
  - Hyperscaler Data Center Executive
  - Tech VC
  - Power Utility Executive
  - Renewables IPP Executive
- **Voice Mode**: Speak your questions and hear responses
- **Intuitive UI**: Clean, responsive chat interface

## Local Development

1. Copy `.env.example` to `.env.local` and add your API keys:

```bash
cp .env.example .env.local
```

2. Edit `.env.local` with your API keys:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

3. Install dependencies:

```bash
bun install
```

4. Run the development server:

```bash
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Testing

```bash
bun test        # Run tests in watch mode
bun test --run  # Run tests once
```

## Building for Production

```bash
bun run build
bun start
```

## Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add the following environment variables in Vercel's project settings:
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `GOOGLE_AI_API_KEY`
4. Deploy

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Vitest + React Testing Library
- Anthropic SDK, OpenAI SDK, Google Generative AI SDK
