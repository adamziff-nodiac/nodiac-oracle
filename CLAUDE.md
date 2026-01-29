# Nodiac Oracle - Claude Code Instructions

## Package Manager

**USE BUN ONLY. DO NOT USE NPM.**
**ALWAYS USE ATOMIC COMMITS.**
**ALWAYS USE A FEATURE BRANCH OFF OF MAIN. ALWAYS PUSH TO THE FEATURE BRANCH.**
**NEVER PUSH TO MAIN UNLESS EXPLICITLY ASKED TO BY THE USER.**

- Install dependencies: `bun install`
- Run dev server: `bun run dev`
- Build: `bun run build`
- Lint: `bun run lint`
- Type check: `bun run type-check`

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth
- **AI:** OpenAI, Anthropic APIs

## Project Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # React components
├── contexts/      # React contexts (Auth, Perspectives, TTS)
├── hooks/         # Custom hooks
├── lib/           # Utilities and Supabase client
└── types/         # TypeScript types
```

## Brand Colors

Primary (Purple):
- `nodiac-primary`: #490f42 (Eggplant)
- `nodiac-primary-dark`: #250721 (Multiply)

Secondary (Teal):
- `nodiac-secondary`: #4de2e4 (Neon Teal)

Defined in `src/app/globals.css` under `@theme`.
