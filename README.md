# Nodiac Oracle

A multi-perspective AI chatbot with voice mode for getting insights from different industry perspectives on data centers and clean energy.

## Features

- **Multi-Model Support**: Choose from Claude (Opus 4.5, Sonnet 4), GPT-4o, and Gemini models
- **Four Industry Perspectives**: Hyperscaler DC Executive, Tech VC, Power Utility Executive, Renewables IPP Executive
- **Voice Mode**: Speak your questions and hear responses
- **Regional Hub Strategy** (`/regional-hubs`): Interactive choropleth map scoring all 3,143 US counties across six criteria (co-op density, grid reliability, curtailment, permitting, labor, fiber) with adjustable weight profiles
- **Site Screening** (`/screening`): Portfolio-level site evaluation tool
- **Developer Docs** (`/docs`): Full methodology documentation

### Data Pipeline

County scores are computed by `scripts/build-real-county-scores.py` from public datasets:
- **Co-op Density**: EIA Form 861 (2024)
- **Grid Reliability**: EIA Form 861 Reliability (2024)
- **Curtailment Proxy**: EIA Form 860 (2024) renewable MW + balancing authority
- **Permitting**: Research-based state+county scores with 42 verified citation URLs (NCSL, SDI Alliance, H5, Data Center Watch)
- **Labor**: Census CBP 2023 (NAICS 5182/5415/517)
- **Fiber**: Census ACS 2023 (broadband subscription proxy)

Output: `public/data/county-scores.json` (static) + optional Supabase upsert

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
