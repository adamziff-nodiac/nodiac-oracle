# Nodiac Oracle

Internal development platform for Nodiac's distributed power infrastructure pipeline. Covers the full workflow from county scoring through site construction.

## Application Structure

### Four-Step Pipeline Workflow

The app is organized around four sequential development stages, reflected in the navigation:

| Step | Route | Purpose |
|------|-------|---------|
| **Score** | `/regional-hubs` | Rank all 3,143 US counties by infrastructure fit (co-op density, grid, permitting, labor, fiber) with interactive choropleth map |
| **Screen** | `/screening` | Import and qualify partner sites against county scores |
| **Pipeline** | `/pipeline` | Track deal flow across partners from screening to development |
| **Develop** | `/tracker` | Manage sites through 21 development checkpoints to construction |

### Supporting Tools

| Route | Purpose |
|-------|---------|
| `/todo` | GTD-inspired daily task dashboard — action items, waiting-for, needs attention |
| `/chat` | Multi-perspective AI advisor (Oracle Chat) |
| `/timeline` | Project timeline builder |
| `/docs` | Scoring methodology documentation |
| `/settings` | Team member management |

## Design Language

### Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `nodiac-primary` | `#490f42` | Eggplant — active nav items, primary actions, brand identity |
| `nodiac-primary-light` | `#6b1f5a` | Hover states, gradient midpoints |
| `nodiac-primary-dark` | `#250721` | Deep backgrounds, multiply overlays |
| `nodiac-secondary` | `#4de2e4` | Neon teal — accents, links, status indicators, data highlights |
| `nodiac-secondary-dark` | `#3bb8ba` | Teal hover states |
| `nodiac-soft-orchid` | `#b48fc1` | Decorative, muted accent |
| `nodiac-dusty-lilac` | `#928a97` | Subtle text, borders |

Colors are defined in `src/app/globals.css` under `@theme`.

### Dark Mode (Primary)

Dark mode is the default design target. Key background values:

| Surface | Value | Usage |
|---------|-------|-------|
| Page background | `#0f0f1a` | `dark:bg-[#0f0f1a]` — all pages |
| Card/panel | `#16162a` | `dark:bg-[#16162a]` — cards, inputs, panels |
| Elevated surface | `#1e1e30` | `dark:bg-[#1e1e30]` — dropdowns, modals |
| Subtle hover | `white/[0.04]` | `dark:bg-white/[0.04]` — nav items, buttons |
| Borders | `white/[0.08]` or `#2a2a40` | `dark:border-white/[0.08]` or `dark:border-[#2a2a40]` |

### Light Mode

| Surface | Value | Usage |
|---------|-------|-------|
| Page background | `#f5f5f7` | `bg-nodiac-light` |
| Card/panel | `white` | Standard white cards |
| Borders | `gray-200/80` | `border-gray-200/80` |

### Typography

- **System font stack**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...`
- **Page titles**: `text-2xl` or `text-3xl`, `font-semibold`, `tracking-tight`
- **Section headers**: `text-[11px] font-semibold uppercase tracking-wide` in muted color
- **Body text**: `text-[13px]` for dense data views (tracker, todo), `text-sm` for prose
- **Muted text**: `text-zinc-400 dark:text-zinc-500`

### Navigation

The top nav uses a **pill bar** design with clear hierarchy:

- **Primary items** (always visible): Home, Todo, Score, Screen, Pipeline, Develop
- **Secondary items** (overflow `...` menu): Oracle Chat, Timelines, Docs, Settings
- **Mobile**: Hamburger menu with grouped sections (Workflow / Tools)
- **Active state**: Eggplant pill (`bg-nodiac-primary text-white`)
- **Container**: `bg-white/70 dark:bg-white/[0.04]` with `border-white/[0.08]` and `backdrop-blur-sm`

### Component Patterns

#### StyledSelect (`src/components/ui/StyledSelect.tsx`)

Custom dropdown replacing all native `<select>` elements. Three variants:

- **`default`** — bordered, for form contexts (site pickers, filters)
- **`ghost`** — transparent, for inline/toolbar contexts (status changes, owner pickers)
- **`inline`** — underline style, for inline-edit contexts (checkpoint owners)

Three sizes: `xs` (11px), `sm` (12px), `md` (13px).

#### Cards & Panels

```
bg-white dark:bg-[#16162a]
border border-zinc-200 dark:border-[#2a2a40]
rounded-lg
```

#### Status Badges

- Green: `bg-emerald-500/15 text-emerald-600 dark:text-emerald-400`
- Amber: `bg-amber-500/15 text-amber-600 dark:text-amber-400`
- Red: `bg-red-500/15 text-red-600 dark:text-red-400`

#### Header Pattern (all pages)

```tsx
<header className="fixed top-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-[#0f0f1a]/80 backdrop-blur-sm border-b border-zinc-200/50 dark:border-white/5">
  <div className="max-w-6xl mx-auto flex justify-between items-center gap-2">
    <LogoLink />
    <div className="flex items-center gap-2 min-w-0">
      <ThemeToggle />
      <Navigation />
    </div>
  </div>
</header>
```

### Spacing Conventions

- Page padding: `pt-24 pb-20 px-4` (accounts for fixed header)
- Content max-width: `max-w-5xl mx-auto` (standard), `max-w-6xl` (wider pages like tracker)
- Section gaps: `space-y-6` or `gap-6`

## Data Pipeline

County scores are computed by `scripts/build-real-county-scores.py` from public datasets:
- **Co-op Density**: EIA Form 861 (2024)
- **Grid Reliability**: EIA Form 861 Reliability (2024)
- **Curtailment Proxy**: EIA Form 860 (2024) renewable MW + balancing authority
- **Permitting**: Research-based state+county scores with 42 verified citation URLs
- **Labor**: Census CBP 2023 (NAICS 5182/5415/517)
- **Fiber**: Census ACS 2023 (broadband subscription proxy)

Output: `public/data/county-scores.json` (static) + optional Supabase upsert

## Local Development

```bash
cp .env.example .env.local  # Add API keys
bun install
bun dev                      # http://localhost:3000
```

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript (strict)
- Tailwind CSS v4
- Supabase (Postgres + Auth)
- Vitest + React Testing Library
- Anthropic, OpenAI, Google AI SDKs
