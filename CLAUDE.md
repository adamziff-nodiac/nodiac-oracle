# NORA - Claude Code Instructions

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

## Browser Testing

**ALWAYS visually verify UI changes before committing.** Use `agent-browser` for visual testing and UI review. Start the dev server (`bun run dev`), then use `agent-browser` to navigate and screenshot. Run `agent-browser --help` for the full list of commands.

For Mapbox/WebGL content, fall back to Playwright MCP tools (`mcp__playwright__browser_navigate`, `mcp__playwright__browser_take_screenshot`) since `agent-browser` can't render WebGL in headless mode.

## Brand Colors

Primary (Purple):
- `nodiac-primary`: #490f42 (Eggplant)
- `nodiac-primary-dark`: #250721 (Multiply)

Secondary (Teal):
- `nodiac-secondary`: #4de2e4 (Neon Teal)

Defined in `src/app/globals.css` under `@theme`.
