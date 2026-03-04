# Tracker Design Spec

Detailed design specification for the 5 tracker pages in nodiac-oracle. Written for a Frontend Engineer to implement without making design decisions.

---

## 1. Design System

### Color Palette

**Brand tokens** (from `globals.css` `@theme`):

| Token | Value | Usage |
|-------|-------|-------|
| `nodiac-primary` | `#490f42` | Accent backgrounds, active nav states |
| `nodiac-primary-light` | `#6b1f5a` | Hover states on primary elements |
| `nodiac-primary-dark` | `#250721` | Deep backgrounds, overlays |
| `nodiac-secondary` | `#4de2e4` | Data highlights, active indicators, links |
| `nodiac-secondary-dark` | `#3bb8ba` | Hover states on secondary elements |
| `nodiac-soft-orchid` | `#b48fc1` | Supporting accents, secondary badges |
| `nodiac-dusty-lilac` | `#928a97` | Muted borders, placeholder text |

**Semantic status colors** (checkpoint/phase statuses):

| Status | Light mode | Dark mode | Tailwind classes |
|--------|-----------|-----------|-----------------|
| Not Started | `bg-zinc-100 text-zinc-500` | `dark:bg-zinc-800 dark:text-zinc-500` | `bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500` |
| In Progress | `bg-amber-50 text-amber-600` | `dark:bg-amber-950/40 dark:text-amber-400` | `bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400` |
| Complete | `bg-emerald-50 text-emerald-600` | `dark:bg-emerald-950/40 dark:text-emerald-400` | `bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400` |
| Blocked | `bg-red-50 text-red-600` | `dark:bg-red-950/40 dark:text-red-400` | `bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400` |
| N/A | `bg-transparent text-zinc-400` | `dark:text-zinc-600` | `text-zinc-400 dark:text-zinc-600` |

**Financial status colors** (amount_status):

| Status | Badge classes |
|--------|-------------|
| Estimated | `bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400` |
| Quoted | `bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400` |
| Approved | `bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400` |
| Paid | `bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400` |

**Priority colors**:

| Priority | Dot color | Text classes |
|----------|-----------|-------------|
| Lead | `bg-nodiac-secondary` | `text-nodiac-secondary` |
| Active | `bg-emerald-500` | `text-emerald-500 dark:text-emerald-400` |
| Pipeline | `bg-sky-500` | `text-sky-500 dark:text-sky-400` |
| On Hold | `bg-amber-500` | `text-amber-500 dark:text-amber-400` |
| Deprioritized | `bg-zinc-400` | `text-zinc-400 dark:text-zinc-500` |

**Surface colors**:

| Surface | Light | Dark | Tailwind |
|---------|-------|------|----------|
| Page background | `#f5f5f7` | `#0f0f1a` | `bg-[var(--background)]` |
| Card | `#ffffff` | `#16162a` | `bg-white dark:bg-[#16162a]` |
| Card elevated | `#ffffff` | `#1c1c34` | `bg-white dark:bg-[#1c1c34]` |
| Table row hover | `#f9f9fb` | `#1a1a30` | `hover:bg-zinc-50 dark:hover:bg-[#1a1a30]` |
| Border | `#e4e4e7` | `#2a2a40` | `border-zinc-200 dark:border-[#2a2a40]` |
| Border subtle | `#f0f0f2` | `#22223a` | `border-zinc-100 dark:border-[#22223a]` |

### Typography Scale

System font stack (already set in `globals.css`): `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif`

| Element | Size | Weight | Line height | Letter spacing | Tailwind |
|---------|------|--------|-------------|---------------|----------|
| Page title | 24px | 700 | 1.2 | -0.025em | `text-2xl font-bold tracking-tight` |
| Section heading | 16px | 600 | 1.3 | -0.01em | `text-base font-semibold tracking-tight` |
| Table header | 11px | 600 | 1 | 0.05em | `text-[11px] font-semibold uppercase tracking-wide` |
| Table cell | 13px | 400 | 1.4 | 0 | `text-[13px]` |
| Badge text | 11px | 500 | 1 | 0.02em | `text-[11px] font-medium tracking-slight` |
| Body | 14px | 400 | 1.5 | 0 | `text-sm` |
| Caption/meta | 12px | 400 | 1.4 | 0 | `text-xs` |
| Metric value (large) | 32px | 700 | 1 | -0.03em | `text-[32px] font-bold tracking-tight` |
| Metric label | 12px | 500 | 1.3 | 0.03em | `text-xs font-medium uppercase tracking-wide` |

### Spacing Rhythm

Base unit: **4px**. All spacing uses multiples of 4px via Tailwind's default scale.

| Context | Value | Tailwind |
|---------|-------|----------|
| Page horizontal padding | 24px (desktop), 16px (mobile) | `px-6 sm:px-6 lg:px-6` (contained in max-width wrapper) |
| Page top padding | 24px | `pt-6` |
| Card padding | 16px | `p-4` |
| Card gap (between cards) | 12px | `gap-3` |
| Table cell horizontal | 12px | `px-3` |
| Table cell vertical | 8px | `py-2` |
| Section gap | 24px | `gap-6` |
| Inline element gap | 8px | `gap-2` |
| Badge padding | 4px 8px | `px-2 py-1` |

### Page max-width

Content contained in `max-w-[1600px] mx-auto` wrapper. The portfolio grid can break out wider if needed using `max-w-[1920px]`.

### Border & Shadow Treatment

| Element | Border | Shadow | Border radius |
|---------|--------|--------|---------------|
| Card | `border border-zinc-200 dark:border-[#2a2a40]` | None | `rounded-lg` (8px) |
| Table | `border border-zinc-200 dark:border-[#2a2a40]` | None | `rounded-lg overflow-hidden` |
| Badge | None | None | `rounded-md` (6px) |
| Input/Select | `border border-zinc-300 dark:border-[#2a2a40]` | None | `rounded-md` |
| Filter bar | `border border-zinc-200 dark:border-[#2a2a40]` | None | `rounded-lg` |
| Dropdown menu | `border border-zinc-200 dark:border-[#2a2a40]` | `shadow-lg shadow-black/10 dark:shadow-black/40` | `rounded-lg` |
| Toast | `border border-zinc-200 dark:border-[#2a2a40]` | `shadow-lg` | `rounded-lg` |

No box shadows on cards. This is a data tool, not a marketing page. Flatness keeps density high.

### Animation Approach

Minimal, functional animations only. Nothing decorative.

| Interaction | Property | Duration | Easing | Tailwind |
|-------------|----------|----------|--------|----------|
| Row hover | background-color | 100ms | ease-out | `transition-colors duration-100` |
| Badge status change | background-color, color | 150ms | ease-out | `transition-colors duration-150` |
| Dropdown open | opacity, transform | 150ms | ease-out | `transition-all duration-150` (animate from `opacity-0 translate-y-1` to `opacity-100 translate-y-0`) |
| Toast appear | opacity, transform | 200ms | ease-out | Slide in from bottom-right: `translate-y-2 opacity-0` -> `translate-y-0 opacity-100` |
| Toast dismiss | opacity | 150ms | ease-in | Fade out |
| Page transitions | None | N/A | N/A | No page transition animations -- instant navigation |
| Skeleton loading | opacity pulse | 1.5s | ease-in-out | `animate-pulse` on `bg-zinc-200 dark:bg-zinc-800` blocks |
| Collapsible expand | max-height, opacity | 200ms | ease-out | CSS `grid-template-rows: 0fr` -> `1fr` transition |

Toast auto-dismiss after 3 seconds for success, persistent for errors.

---

## 2. Component Library

### `<PhaseBadge>`

Compact status indicator for phase-level status in the portfolio grid.

**Props:**
```typescript
interface PhaseBadgeProps {
  status: 'Not Started' | 'In Progress' | 'Complete' | 'Blocked' | 'N/A'
  abbrev: string // e.g., "SQ", "PWR"
}
```

**Rendering:**

A small rectangular badge. The abbreviation text is always shown. Color-coded by status.

```
Desktop: 40px wide, auto height
Mobile: 32px wide, auto height
```

**Tailwind classes:**
```
Container: inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] font-medium tracking-slight min-w-[40px]
```

Apply status color classes from the semantic status colors table above. For N/A, render as plain text with a dash: `text-zinc-400 dark:text-zinc-600`.

**States:**
- Default: status color background + text
- Hover (on grid row): no change to badge itself, row background changes
- N/A: render `--` in muted text, no background

### `<CheckpointStatusBadge>`

Individual checkpoint status indicator, used on the site detail page.

**Props:**
```typescript
interface CheckpointStatusBadgeProps {
  status: 'Not Started' | 'In Progress' | 'Complete' | 'Blocked' | 'N/A'
  editable?: boolean
  onStatusChange?: (newStatus: CheckpointStatus) => void
}
```

**Rendering:**

Pill-shaped badge with a small dot indicator on the left + status text.

```
[dot] In Progress
```

**Tailwind classes:**
```
Container: inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
Dot: w-1.5 h-1.5 rounded-full
```

Status color mapping for dot:
- Not Started: `bg-zinc-400`
- In Progress: `bg-amber-500`
- Complete: `bg-emerald-500`
- Blocked: `bg-red-500`
- N/A: `bg-zinc-300 dark:bg-zinc-600`

Container background: use the semantic status color table.

**Editable mode:**
When `editable=true`, the badge becomes a dropdown trigger. On click, render a dropdown with the 5 status options. Each option shows the dot + label. Selected option has a checkmark on the right. The dropdown appears below the badge, aligned to the left edge.

Dropdown container: `absolute z-50 mt-1 w-40 py-1 bg-white dark:bg-[#1c1c34] border border-zinc-200 dark:border-[#2a2a40] rounded-lg shadow-lg`

Dropdown item: `flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-zinc-50 dark:hover:bg-[#1a1a30] cursor-pointer transition-colors duration-100`

### `<PriorityIndicator>`

Shows site priority as a colored dot + label.

**Props:**
```typescript
interface PriorityIndicatorProps {
  priority: 'Lead' | 'Active' | 'Pipeline' | 'On Hold' | 'Deprioritized'
  showLabel?: boolean // default true
}
```

**Tailwind classes:**
```
Container: inline-flex items-center gap-1.5
Dot: w-2 h-2 rounded-full
Label: text-[13px] font-medium
```

Use priority color mapping from the palette section.

### `<AmountStatusBadge>`

Financial checkpoint amount status.

**Props:**
```typescript
interface AmountStatusBadgeProps {
  status: 'Estimated' | 'Quoted' | 'Approved' | 'Paid'
}
```

**Tailwind classes:**
```
Container: inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium
```

Use financial status color mapping from palette section.

### `<MetricCard>`

Summary statistic card for the metrics dashboard.

**Props:**
```typescript
interface MetricCardProps {
  label: string
  value: string | number
  unit?: string // e.g., "MW", "sites"
  sublabel?: string
  trend?: 'up' | 'down' | 'neutral'
}
```

**Tailwind classes:**
```
Container: flex flex-col gap-1 p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg
Label: text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400
Value: text-[32px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100
Unit: text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-1
Sublabel: text-xs text-zinc-500 dark:text-zinc-400
```

No shadows, no gradients. Clean and flat.

### `<FilterBar>`

Horizontal filter controls for the portfolio grid.

**Props:**
```typescript
interface FilterBarProps {
  priorities: string[]
  hubs: string[]
  selectedPriority: string | null
  selectedHub: string | null
  showArchived: boolean
  onPriorityChange: (p: string | null) => void
  onHubChange: (h: string | null) => void
  onArchiveToggle: () => void
  siteCount: number
  totalMw: number
}
```

**Layout:** Single horizontal row. Left side: filter controls. Right side: site count summary.

**Tailwind classes:**
```
Container: flex items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg
Left group: flex items-center gap-2
Right group: flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400
```

**Filter buttons (Priority):** Segmented-style inline buttons. Each is a small pill.
```
Button (inactive): px-2.5 py-1 rounded-md text-[12px] font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a30] transition-colors duration-100 cursor-pointer
Button (active): px-2.5 py-1 rounded-md text-[12px] font-medium bg-nodiac-primary text-white cursor-pointer
```

Prefix priority buttons with "Priority:" label in `text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mr-1`.

**Hub dropdown:** Standard select element.
```
select: px-2.5 py-1 rounded-md text-[12px] font-medium bg-transparent border border-zinc-300 dark:border-[#2a2a40] text-zinc-700 dark:text-zinc-300 cursor-pointer
```

**Archive toggle:** Small toggle switch or checkbox.
```
Container: flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 cursor-pointer
Checkbox: w-3.5 h-3.5 rounded border border-zinc-300 dark:border-zinc-600
```

**Right side summary:**
```
"16 sites" and "45.5 MW" in text-xs font-medium, with the number in text-zinc-900 dark:text-zinc-100.
```

### `<SiteRow>`

A single row in the portfolio grid table.

**Props:**
```typescript
interface SiteRowProps {
  site: TrackerSiteOverview
  onClick: () => void
}
```

**Tailwind classes:**
```
Row: cursor-pointer transition-colors duration-100 hover:bg-zinc-50 dark:hover:bg-[#1a1a30] border-b border-zinc-100 dark:border-[#22223a]
Archived row (additional): opacity-50
Cell (name): text-[13px] font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]
Cell (hub): text-[13px] text-zinc-500 dark:text-zinc-400
Cell (mw): text-[13px] font-medium tabular-nums text-right
Cell (next step): text-[13px] text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]
Construction Ready: a small check icon (Lucide Check) in emerald-500 if true, empty if false
```

### `<PhaseCheckpointGroup>`

Grouped checkpoints for a phase on the site detail page.

**Props:**
```typescript
interface PhaseCheckpointGroupProps {
  phase: Phase
  checkpoints: Checkpoint[]
  site: TrackerSiteOverview
  onUpdate: (prefix: string, field: string, value: unknown) => void
}
```

**Layout:** Collapsible section. Phase name as header, checkpoints as rows below.

**Tailwind classes:**
```
Container: border border-zinc-200 dark:border-[#2a2a40] rounded-lg overflow-hidden
Header: flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-[#1a1a2e] cursor-pointer select-none
Header label: flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100
Header phase badge: (PhaseBadge showing aggregated phase status)
Chevron: w-4 h-4 text-zinc-400 transition-transform duration-200 (rotate-90 when open)
Checkpoint row: flex items-center gap-3 px-4 py-2.5 border-t border-zinc-100 dark:border-[#22223a]
Checkpoint label: text-[13px] text-zinc-700 dark:text-zinc-300 w-[200px] shrink-0
Checkpoint fields: flex items-center gap-3 flex-1
```

**Checkpoint row fields (left to right):**
1. Status badge (editable `<CheckpointStatusBadge>`)
2. Forecast date (`<input type="date">` styled as inline text, 100px wide)
3. Completed date (same)
4. Owner (small select dropdown, 80px wide)
5. Amount (if financial checkpoint): `<input type="text">` for dollar amount, 100px wide, right-aligned, with `$` prefix
6. Amount status (if financial): `<AmountStatusBadge>` as editable dropdown

Inline input styles:
```
text-[13px] bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-nodiac-secondary focus:outline-none py-0.5 transition-colors duration-100 tabular-nums
```

Inline select styles:
```
text-[13px] bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-nodiac-secondary focus:outline-none py-0.5 cursor-pointer appearance-none
```

### `<SpeedMetric>`

Speed metric display with running-clock indicator.

**Props:**
```typescript
interface SpeedMetricProps {
  label: string // "Days to IX", "Days to Construction Ready", "Days to COD"
  value: number | null
  isRunning: boolean // true if the clock is still running (in progress)
}
```

**Tailwind classes:**
```
Container: flex flex-col items-center gap-1 p-3
Value: text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100
Running indicator: inline-flex items-center gap-1 after value -- a small animated dot
Running dot: w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse
Label: text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400
Null state: "--" in text-zinc-400 dark:text-zinc-600
```

When `isRunning` is true, append a pulsing amber dot next to the value and render the value in amber: `text-amber-600 dark:text-amber-400`.

### `<DepositRow>`

Row in the deposits table.

**Props:**
```typescript
interface DepositRowProps {
  siteName: string
  siteId: string
  checkpointLabel: string
  amount: number | null
  amountStatus: 'Estimated' | 'Quoted' | 'Approved' | 'Paid'
  checkpointStatus: CheckpointStatus
  providerName: string | null
}
```

**Tailwind classes:**
```
Row: flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-[#22223a] hover:bg-zinc-50 dark:hover:bg-[#1a1a30] transition-colors duration-100
Site name: text-[13px] font-medium text-nodiac-secondary hover:underline cursor-pointer w-[160px] shrink-0 truncate
Checkpoint label: text-[13px] text-zinc-600 dark:text-zinc-400 w-[180px] shrink-0
Amount: text-[13px] font-medium tabular-nums text-right w-[100px] shrink-0
Provider: text-[13px] text-zinc-500 dark:text-zinc-400 w-[140px] shrink-0 truncate
```

### `<ArchiveBanner>`

Shown at the top of site detail when a site is archived.

**Props:**
```typescript
interface ArchiveBannerProps {
  archivedAt: string // ISO date
  archivedReason: string | null
}
```

**Tailwind classes:**
```
Container: flex items-center gap-3 px-4 py-3 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[13px] text-zinc-600 dark:text-zinc-400
Icon: w-4 h-4 text-zinc-400 (Lucide Archive icon)
```

### `<Toast>`

Feedback notification for save operations.

**Props:**
```typescript
interface ToastProps {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}
```

**Position:** Fixed bottom-right, `fixed bottom-4 right-4 z-50`.

**Tailwind classes:**
```
Container: flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg text-[13px] font-medium
Success: bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300
Error: bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300
Dismiss button: ml-2 text-current opacity-50 hover:opacity-100 cursor-pointer
```

### `<SkeletonRow>`

Loading placeholder for table rows.

**Tailwind classes:**
```
Container: flex items-center gap-3 px-3 py-2.5
Bar: h-3 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse
```

Vary widths across cells to mimic data shape: `w-[120px]`, `w-[60px]`, `w-[40px]`, etc.

### `<SubNav>`

Secondary navigation within the tracker section. Tabs for Grid, Deposits, Metrics, Docs.

**Props:**
```typescript
interface SubNavProps {
  currentPath: string
}
```

**Layout:** Horizontal tab bar, sits below the page title.

**Tailwind classes:**
```
Container: flex items-center gap-1 border-b border-zinc-200 dark:border-[#2a2a40]
Tab (inactive): px-3 py-2 text-[13px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border-b-2 border-transparent transition-colors duration-100
Tab (active): px-3 py-2 text-[13px] font-medium text-zinc-900 dark:text-zinc-100 border-b-2 border-nodiac-secondary
```

Tabs: `Portfolio` (`/tracker`), `Deposits` (`/tracker/deposits`), `Metrics` (`/tracker/metrics`), `Docs` (`/tracker/docs`).

### `<SiteHeader>`

Header section for the site detail page.

**Props:**
```typescript
interface SiteHeaderProps {
  site: TrackerSiteOverview
}
```

**Layout:**
```
[Back arrow] Site Name                    [Priority badge] [MW badge]
             Hub Name / Utility / Asset Owner
```

**Tailwind classes:**
```
Container: flex items-start justify-between gap-4
Back link: flex items-center gap-1 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors
Name: text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100
Meta row: flex items-center gap-2 mt-1 text-[13px] text-zinc-500 dark:text-zinc-400
Meta separator: text-zinc-300 dark:text-zinc-600 (a "/" character)
Right group: flex items-center gap-3
MW badge: px-2.5 py-1 rounded-md bg-nodiac-primary-dark/10 dark:bg-nodiac-primary/20 text-[13px] font-semibold text-nodiac-primary dark:text-nodiac-secondary tabular-nums
```

### `<OperationalContext>`

Site notes section: summary, next steps, blockers, waiting on.

**Props:**
```typescript
interface OperationalContextProps {
  notes: SiteNotes | null
}
```

**Layout:** 2-column grid on desktop, single column on mobile.

```
[Summary]               [Next Steps]
[Blockers]              [Waiting On]
```

**Tailwind classes:**
```
Container: grid grid-cols-1 md:grid-cols-2 gap-3
Card: p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg
Card label: text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-2
Card content: text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed
List item: flex items-start gap-2 py-1
List bullet: w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0
Blocker item: text-[13px] text-red-600 dark:text-red-400
Waiting item: text-[13px] text-amber-600 dark:text-amber-400
Empty state: text-[13px] text-zinc-400 dark:text-zinc-600 italic
```

### `<ActivityLog>`

Recent activity entries for a site.

**Props:**
```typescript
interface ActivityLogProps {
  entries: TrackerActivity[]
}
```

**Tailwind classes:**
```
Container: flex flex-col
Entry: flex items-start gap-3 py-3 border-b border-zinc-100 dark:border-[#22223a] last:border-0
Timeline dot: w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 mt-1.5 shrink-0
Title: text-[13px] font-medium text-zinc-900 dark:text-zinc-100
Summary: text-[13px] text-zinc-500 dark:text-zinc-400 mt-0.5
Timestamp: text-xs text-zinc-400 dark:text-zinc-500 mt-0.5
Source badge: text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400
```

---

## 3. Page Layouts

### 3.1 `/tracker` -- Portfolio Grid

The primary view. This is what everyone opens first. Dense, scannable, no wasted space.

#### Component Hierarchy

```
<TrackerPage> (server component -- fetches data)
  <TrackerGridClient> (client component -- interactivity + realtime)
    <SubNav currentPath="/tracker" />
    <FilterBar />
    <PortfolioTable>
      <thead> (fixed column headers)
      <tbody>
        <SiteRow /> (one per site)
      </tbody>
    </PortfolioTable>
```

#### Desktop Layout (1920px)

Full-width table with horizontal overflow only if needed. At 1920px, all columns fit.

```
Page wrapper: max-w-[1920px] mx-auto px-6 pt-6
```

**Table columns (desktop):**

| Column | Width | Align | Sticky |
|--------|-------|-------|--------|
| Site Name | 180px min | left | yes, left |
| Hub | 100px | left | no |
| MW | 60px | right | no |
| Priority | 90px | left | no |
| SQ (Site Qualification) | 44px | center | no |
| SC (Site Control) | 44px | center | no |
| PWR (Power) | 44px | center | no |
| PRM (Permitting) | 44px | center | no |
| FBR (Fiber) | 44px | center | no |
| ENG (Engineering) | 44px | center | no |
| CON (Construction) | 44px | center | no |
| Ready | 50px | center | no |
| Next Step | 200px+ (flex) | left | no |

**Table classes:**
```
Table wrapper: overflow-x-auto
Table: w-full text-left
Thead: bg-zinc-50 dark:bg-[#1a1a2e] sticky top-0 z-10
Th: px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 whitespace-nowrap
Tbody tr: border-b border-zinc-100 dark:border-[#22223a]
Td: px-3 py-2 whitespace-nowrap
Sticky name column: sticky left-0 z-5 bg-white dark:bg-[#16162a] (inherits row hover bg)
```

**Phase column headers:** Show the abbreviation (SQ, SC, PWR, PRM, FBR, ENG, CON) with a tooltip on hover showing the full name.

#### Tablet Layout (768px)

Same table structure, but horizontally scrollable. Site name column stays sticky-left so it's always visible during scroll.

```
Page wrapper: px-4 pt-4
Table wrapper: overflow-x-auto -mx-4 px-4 (bleeds to edges for more room)
```

Hide the "Next Step" column at tablet to save space. Site name column width reduced to 150px.

#### Mobile Layout (390px)

Table becomes a horizontally scrollable grid. Site name remains sticky-left. The user swipes right to see phase columns.

```
Page wrapper: px-3 pt-3
Table wrapper: overflow-x-auto -mx-3
Sticky name column: min-w-[140px] px-3 sticky left-0 z-5
```

Phase columns reduced to 36px wide. Badge text hidden, show only colored rectangles (the color alone conveys status). Tooltip on tap shows full status text.

**Filter bar on mobile:** Wraps to 2 rows. Priority filters become a horizontal scrollable row. Archive toggle moves below.
```
Container: flex flex-col gap-2 px-3 py-2
```

Touch targets: All interactive elements minimum 44px height.

#### Interaction Patterns

- **Row click:** Navigate to `/tracker/[id]`. Entire row is clickable. Cursor: pointer.
- **Column sort:** Click header to sort. Active sort column shows arrow indicator (up/down). Default sort: Priority (Lead first), then name alpha.
- **Filter:** Selecting a priority button filters immediately (client-side). Selecting "All" clears the filter. Hub dropdown filters immediately. Both filters can be active simultaneously.
- **Archive toggle:** Unchecked by default (archived hidden). When checked, archived rows appear at the bottom of the table with `opacity-50`.

#### Dark Mode

- Table background: transparent (page bg shows through)
- Header row: `dark:bg-[#1a1a2e]`
- Row borders: `dark:border-[#22223a]`
- Row hover: `dark:hover:bg-[#1a1a30]`
- Sticky column background matches row state (needs JS to sync hover)
- All text uses `dark:` variants from component specs above

---

### 3.2 `/tracker/[id]` -- Site Detail

Everything about one site. Dense but organized.

#### Component Hierarchy

```
<SiteDetailPage> (server component -- fetches site + activity)
  <SiteDetailClient> (client component -- editing + realtime)
    <SubNav currentPath={`/tracker/${id}`} />
    <SiteHeader />
    <ArchiveBanner /> (if archived)
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <OperationalContext />
        <PhaseCheckpointGroup /> (x7, one per phase)
      </div>
      <div className="flex flex-col gap-6">
        <SpeedMetricsCard />
        <SiteAttributesCard />
        <ActivityLog />
      </div>
    </div>
```

#### Desktop Layout (1920px)

```
Page wrapper: max-w-[1600px] mx-auto px-6 pt-6
Main content: 2/3 width (checkpoints)
Sidebar: 1/3 width (metrics, attributes, activity)
```

The 7 phase groups stack vertically in the main column. Each is collapsible -- all default to expanded except phases where all checkpoints are "Not Started" (those default to collapsed).

#### Tablet Layout (768px)

Sidebar moves below main content. Single column.

```
grid-cols-1 gap-4
```

Speed metrics card becomes a horizontal row of 3 values instead of a vertical stack.

#### Mobile Layout (390px)

```
Page wrapper: px-3 pt-3
```

Phase groups: checkpoint fields stack vertically within each row instead of horizontal.

```
Checkpoint row (mobile): flex flex-col gap-2 px-3 py-3
Label: text-[13px] font-medium
Fields: grid grid-cols-2 gap-2
```

Each field gets a small label above it: "Status", "Forecast", "Owner", etc., in `text-[11px] text-zinc-400`. Minimum touch target 44px for all interactive elements.

#### Interaction Patterns

- **Inline editing:** Click any editable field (status, date, owner, amount) to activate edit mode. Status opens dropdown. Date opens native date picker. Owner opens dropdown. Amount becomes a text input.
- **Optimistic UI:** On change, immediately update the local state and show the new value. Send mutation to Supabase. On success, show brief green checkmark next to the field (150ms fade in, 1s hold, 150ms fade out). On error, revert to previous value and show error toast.
- **Save indicator:** No save button. All changes auto-save on blur or selection. The green checkmark is the confirmation.
- **Back navigation:** Arrow + "Portfolio" text in the header. Clicking navigates to `/tracker`.
- **Collapsible phases:** Click phase header to toggle. Chevron rotates 90 degrees. Content slides open/closed with `grid-template-rows` transition (200ms ease-out).

#### Dark Mode

All components use their dark mode variants. Card backgrounds: `dark:bg-[#16162a]`. Phase group headers: `dark:bg-[#1a1a2e]`.

---

### 3.3 `/tracker/deposits` -- Deposit Dashboard

Financial checkpoint overview grouped by readiness.

#### Component Hierarchy

```
<DepositsPage> (server component)
  <DepositsClient> (client component)
    <SubNav currentPath="/tracker/deposits" />
    <DepositSummary /> (3 summary numbers at top)
    <DepositGroup title="Ready to Send" /> (Quoted + Approved)
    <DepositGroup title="Pending" /> (Estimated + Not Started)
    <DepositGroup title="Paid" />
```

#### Desktop Layout (1920px)

```
Page wrapper: max-w-[1200px] mx-auto px-6 pt-6
```

**Summary strip:** 3 metric cards in a horizontal row at the top.

| Card | Content |
|------|---------|
| Ready to Send | Sum of amounts where amount_status = Quoted or Approved |
| Pending | Sum of amounts where amount_status = Estimated |
| Total Paid | Sum of amounts where amount_status = Paid |

**Group sections:** Each group is a titled section with a table of deposit rows.

```
Group header: flex items-center justify-between mb-3
Group title: text-base font-semibold text-zinc-900 dark:text-zinc-100
Group total: text-sm font-medium tabular-nums text-zinc-500 dark:text-zinc-400
```

Table within each group:

| Column | Width | Align |
|--------|-------|-------|
| Site | 160px | left |
| Checkpoint | 180px | left |
| Amount | 100px | right |
| Status | 90px | center |
| Provider | 140px | left |
| Phase Status | 90px | center |

**Tailwind for group table:**
```
Table: w-full
Thead: border-b border-zinc-200 dark:border-[#2a2a40]
Th: px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-left
Tbody tr: border-b border-zinc-100 dark:border-[#22223a]
Td: px-4 py-3 text-[13px]
```

**Ready to Send group:** highlighted with a subtle left border accent.
```
Group container (Ready): border-l-2 border-nodiac-secondary pl-4
```

**Paid group:** muted.
```
Group container (Paid): opacity-70
```

#### Tablet Layout (768px)

Same layout, table scrolls horizontally if needed.

#### Mobile Layout (390px)

Each deposit becomes a card instead of a table row:

```
Card: p-3 border border-zinc-200 dark:border-[#2a2a40] rounded-lg mb-2
Site name: text-[13px] font-medium text-nodiac-secondary
Checkpoint: text-[13px] text-zinc-600 dark:text-zinc-400
Amount: text-base font-semibold tabular-nums
Status badges: flex items-center gap-2 mt-2
```

Group totals appear as sticky headers.

#### Interaction Patterns

- **Click site name:** Navigate to `/tracker/[id]`
- **No inline editing** on this page. Read-only financial overview.
- **Empty groups:** Show "No deposits in this category" in muted text, don't hide the group.

---

### 3.4 `/tracker/metrics` -- Portfolio Metrics

Leadership dashboard. Aggregated numbers.

#### Component Hierarchy

```
<MetricsPage> (server component)
  <MetricsClient> (client component)
    <SubNav currentPath="/tracker/metrics" />
    <SummaryCards /> (4 metric cards)
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MwByStageChart />
      <SpeedMetricsTable />
      <CapexAnalysis />
      <HubBreakdown />
    </div>
```

#### Desktop Layout (1920px)

```
Page wrapper: max-w-[1400px] mx-auto px-6 pt-6
```

**Summary cards:** 4 cards in a horizontal row.

| Card | Label | Value |
|------|-------|-------|
| Total MW | `TOTAL MW` | Sum of `mw_current` for active sites |
| Active Sites | `ACTIVE SITES` | Count of non-archived sites |
| Construction Ready | `CONSTRUCTION READY` | Count where `construction_ready = true` |
| Total Capex | `TOTAL CAPEX` | Sum of `total_capex`, formatted as currency |

```
Summary row: grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6
```

**MW by Stage:** A horizontal stacked bar or simple table showing MW broken down by the furthest-completed phase of each site.

Implement as a table with a visual bar:
```
Phase row: flex items-center gap-3 py-2
Phase label: w-[160px] text-[13px] text-zinc-600 dark:text-zinc-400
Bar: h-6 rounded bg-gradient-to-r (phase-specific color)
Bar value: text-[13px] font-medium tabular-nums ml-2
```

Phase bar colors (subtle, not garish):
- Site Qualification: `bg-zinc-300 dark:bg-zinc-600`
- Site Control: `bg-zinc-400 dark:bg-zinc-500`
- Power: `bg-amber-400 dark:bg-amber-600`
- Permitting: `bg-sky-400 dark:bg-sky-600`
- Fiber: `bg-violet-400 dark:bg-violet-600`
- Engineering: `bg-nodiac-soft-orchid`
- Construction: `bg-nodiac-secondary dark:bg-nodiac-secondary-dark`

Bar widths are proportional to MW. Max width is the full available width.

**Speed Metrics Table:**

| Column | Content |
|--------|---------|
| Site | Name (link) |
| Days to IX | value or running indicator |
| Days to Ready | value or running indicator |
| Days to COD | value or running indicator |

Bottom row: Portfolio averages in bold.

Running values (clock still ticking) shown in amber with pulsing dot.

```
Table: w-full
Average row: font-semibold bg-zinc-50 dark:bg-[#1a1a2e]
```

**Capex Analysis:** Per-site capex/MW, sorted ascending (most efficient first).

Simple table:
| Site | Total Capex | MW | Capex/MW |
|------|------------|-----|---------|

```
Capex/MW cell: tabular-nums font-medium
Best value: text-emerald-600 dark:text-emerald-400
Worst value: text-red-600 dark:text-red-400
```

Color-code capex/MW on a gradient from green (low) to red (high) relative to portfolio median.

**Hub Breakdown:** One card per hub with aggregated stats.

```
Hub card: p-4 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg
Hub name: text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-3
Stats grid: grid grid-cols-2 gap-3
Stat label: text-xs font-medium uppercase tracking-wide text-zinc-400
Stat value: text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100
```

Stats per hub: Site count, Total MW, Avg days to IX, Avg capex/MW.

#### Tablet Layout (768px)

Summary cards: 2x2 grid. Content sections: single column, stacked.

#### Mobile Layout (390px)

Summary cards: 2x2 grid, smaller padding. All tables scroll horizontally.

```
Summary cards: grid grid-cols-2 gap-2
MetricCard (mobile): p-3
Value (mobile): text-2xl
```

#### Interaction Patterns

- **Click site name:** Navigate to `/tracker/[id]` (anywhere a site name appears)
- **Archive toggle:** Small checkbox in the page header to include/exclude archived sites from all calculations.
- **No inline editing.** Read-only dashboard.

---

### 3.5 `/tracker/docs` -- How It Works

Static reference page. No data fetching.

#### Component Hierarchy

```
<DocsPage> (server component -- static content)
  <SubNav currentPath="/tracker/docs" />
  <div className="flex gap-8">
    <TableOfContents /> (sticky sidebar)
    <DocsContent />
  </div>
```

#### Desktop Layout (1920px)

```
Page wrapper: max-w-[1000px] mx-auto px-6 pt-6
```

Two-column layout: sticky TOC on the left (200px), content on the right.

```
TOC: w-[200px] shrink-0 sticky top-6 self-start
TOC item: block py-1 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors border-l-2 border-transparent pl-3
TOC item (active -- in viewport): border-nodiac-secondary text-zinc-900 dark:text-zinc-100
Content: flex-1 min-w-0
```

**Content structure:**

Sections use `<h2>` with IDs for anchor links. Content is prose.

```
h2: text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3 scroll-mt-6
h3: text-base font-medium text-zinc-900 dark:text-zinc-100 mt-5 mb-2
p: text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3
```

**Collapsible sections for phase/checkpoint definitions:**

Each phase is a collapsible block. Click to expand and see checkpoint definitions.

```
Phase block: border border-zinc-200 dark:border-[#2a2a40] rounded-lg overflow-hidden mb-2
Phase header: flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-[#1a1a30] transition-colors
Phase title: text-sm font-semibold
Checkpoint content: px-4 pb-3
Checkpoint item: py-2 border-t border-zinc-100 dark:border-[#22223a]
Checkpoint name: text-sm font-medium text-zinc-900 dark:text-zinc-100
Checkpoint description: text-[13px] text-zinc-600 dark:text-zinc-400 mt-1
Complete criteria: text-[13px] text-zinc-500 dark:text-zinc-500 mt-1 italic
```

**Status definitions:** Use the actual badge component to show each status visually inline with its definition.

**Glossary:** Simple `<dl>` list.
```
dt: text-sm font-semibold text-zinc-900 dark:text-zinc-100
dd: text-sm text-zinc-600 dark:text-zinc-400 mb-3
```

#### Tablet Layout (768px)

TOC becomes a horizontal scrollable bar at the top instead of a sidebar.

```
TOC (tablet): flex overflow-x-auto gap-1 pb-2 border-b border-zinc-200 dark:border-[#2a2a40] mb-6
TOC item (tablet): whitespace-nowrap px-3 py-1.5 rounded-md text-[12px]
```

Content: full width.

#### Mobile Layout (390px)

TOC: same horizontal bar, smaller padding.

```
Page wrapper: px-3 pt-3
```

Collapsible sections default to collapsed on mobile to reduce scroll depth.

#### Dark Mode

All surfaces and text use dark variants. The docs page is mostly text, so ensure good contrast:
- Body text: `dark:text-zinc-400` (not zinc-500, which is too dim for long reading)
- Headings: `dark:text-zinc-100`
- Code/monospace: `dark:bg-zinc-800 dark:text-zinc-300`

---

## 4. Phase Status Badge Design

The phase status badges are the most critical visual element in the tracker. They must be distinguishable at a glance from color alone -- no reading required.

### Color System

Five statuses, five distinct hues:

| Status | Hue | Light bg | Light text | Dark bg | Dark text |
|--------|-----|----------|-----------|---------|----------|
| Not Started | Neutral | `zinc-100` | `zinc-500` | `zinc-800` | `zinc-500` |
| In Progress | Warm | `amber-50` | `amber-600` | `amber-950/40` | `amber-400` |
| Complete | Green | `emerald-50` | `emerald-600` | `emerald-950/40` | `emerald-400` |
| Blocked | Red | `red-50` | `red-600` | `red-950/40` | `red-400` |
| N/A | None | transparent | `zinc-400` | transparent | `zinc-600` |

### Badge Shape

Rectangular with slight rounding (`rounded-md`, 6px). Not fully rounded pills -- those read as buttons. These are status indicators, not interactive elements in the grid context.

### Grid Badge (compact)

Used in the portfolio grid. Shows only the phase abbreviation, colored by status.

```
min-w-[40px] h-[24px] inline-flex items-center justify-center rounded-md text-[11px] font-medium
```

For N/A: render `--` in muted text, no background.

### Detail Badge (full)

Used on the site detail page. Shows dot + status text.

```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
```

The dot provides redundant encoding (color + shape) for accessibility. The rounded-full shape distinguishes these from the grid badges.

### Colorblind Considerations

The five status colors are chosen to be distinguishable even with common forms of color vision deficiency:
- Not Started (gray) vs In Progress (amber) vs Complete (green) vs Blocked (red): these map to a neutral-warm-cool-warm spectrum that remains distinct under protanopia and deuteranopia.
- N/A is structurally different (no background, dashed text) so it's distinguishable by shape alone.
- The text inside the badge provides a third encoding (abbreviation + color + shape).

---

## 5. Data Density Strategy

16 sites, 21 checkpoints each, 7 phases. The portfolio grid must surface the phase-level rollup (7 columns) without showing all 21 checkpoints. The detail page shows the full 21.

### Grid: Phase-Level Rollup

Each of the 7 phase columns shows a single aggregated status:
- If any checkpoint in the phase is **Blocked** -> phase is Blocked
- If all checkpoints are **Complete** or **N/A** -> phase is Complete
- If any checkpoint is **In Progress** -> phase is In Progress
- Otherwise -> Not Started

This reduces 21 checkpoints to 7 visual indicators per row. Combined with site name, hub, MW, priority, construction-ready, and next step, that's 13 columns. At 1920px this fits comfortably. At 768px it scrolls horizontally with the name pinned.

### Grid: Column Ordering

Left-to-right priority (Evan's mental model: basics -> phases -> outcomes):

1. **Site Name** (sticky) -- the anchor
2. **Hub** -- geographic context
3. **MW** -- scale
4. **Priority** -- importance
5. **SQ -> SC -> PWR -> PRM -> FBR -> ENG -> CON** -- development phases, left-to-right = early-to-late
6. **Ready** -- composite outcome
7. **Next Step** -- what's happening now

### Detail Page: Grouped Checkpoints

21 checkpoints grouped into 7 collapsible phase sections. Each section header shows the phase-level status badge. Expanding reveals individual checkpoint rows with inline editing.

Default expand state:
- Phases with any "In Progress" or "Blocked" checkpoint: **expanded**
- Phases where all checkpoints are "Complete" or "N/A": **collapsed** (done, don't need attention)
- Phases where all checkpoints are "Not Started": **collapsed** (not yet relevant)

This auto-focuses the user on what matters right now.

### Mobile Compression

On mobile (390px), the grid phase badges lose their text labels and become pure color blocks (36px wide, 20px tall). The color alone conveys status. Tapping a badge shows a tooltip with the full phase name and status.

On the detail page mobile, checkpoint fields stack vertically in a 2-column grid within each row, with small field labels.

---

## 6. Animation & Transition Details

### Status Change Animation

When a checkpoint status changes (inline edit):

1. Old badge fades out: `opacity 1 -> 0` over 100ms
2. New badge fades in with new color: `opacity 0 -> 1` over 150ms
3. Simultaneously, a green checkmark icon appears to the right: `opacity 0 -> 1, scale 0.8 -> 1` over 150ms ease-out
4. Checkmark holds for 1000ms
5. Checkmark fades out: `opacity 1 -> 0` over 150ms

Implementation: Use CSS transitions on the badge component + a separate animated checkmark element with `setTimeout`.

### Row Hover

Table row background transitions on hover:

```css
transition: background-color 100ms ease-out;
```

The sticky name column must sync its background with the row hover state. This requires a CSS approach:

```css
tr:hover td { background-color: ... }
/* The sticky td inherits the hover background */
tr:hover td:first-child { background-color: var(--row-hover-bg) }
```

### Dropdown Open/Close

Filter dropdowns and status edit dropdowns:

**Open:** `opacity 0 -> 1, translateY(4px) -> translateY(0)` over 150ms ease-out.
**Close:** `opacity 1 -> 0` over 100ms ease-out. No translateY on close (instant feel).

### Collapsible Phase Sections

Using CSS grid for smooth height animation:

```css
.phase-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms ease-out;
}
.phase-content.open {
  grid-template-rows: 1fr;
}
.phase-content > div {
  overflow: hidden;
}
```

Chevron rotation: `transition: transform 200ms ease-out`. Rotates from `rotate(0)` (collapsed, pointing right) to `rotate(90deg)` (expanded, pointing down).

### Toast Notifications

**Enter:** `translateY(8px) opacity(0)` -> `translateY(0) opacity(1)` over 200ms ease-out.
**Exit:** `opacity(1)` -> `opacity(0)` over 150ms ease-in.

Stack multiple toasts vertically with 8px gap. New toasts push older ones up.

### Skeleton Loading

When data is loading (server component boundary), show skeleton placeholders:

```
Skeleton bar: bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse
```

Pulse animation: `opacity 1 -> 0.4 -> 1` over 1.5s ease-in-out, infinite.

Skeleton layout matches the real layout dimensions so there's no layout shift when data arrives.

### Realtime Update Flash

When a value changes via Supabase Realtime (another user edited it):

1. The changed cell gets a brief highlight: `bg-nodiac-secondary/10` fading to transparent over 1000ms.
2. Implementation: Apply a CSS class that triggers a `@keyframes` animation:

```css
@keyframes realtime-flash {
  0% { background-color: rgba(77, 226, 228, 0.1); }
  100% { background-color: transparent; }
}
.realtime-updated {
  animation: realtime-flash 1000ms ease-out;
}
```

This gives the user a subtle visual cue that the value just changed from an external source.

### No Page Transitions

Navigation between tracker pages is instant. No fade/slide transitions between routes. The SubNav tabs change immediately. Content loads via server components with skeleton fallbacks.

---

## Appendix: File Structure

Recommended file organization for the tracker components:

```
src/
  app/
    tracker/
      page.tsx              (server: portfolio grid)
      layout.tsx            (shared tracker layout with SubNav)
      [id]/
        page.tsx            (server: site detail)
      deposits/
        page.tsx            (server: deposit dashboard)
      metrics/
        page.tsx            (server: metrics dashboard)
      docs/
        page.tsx            (server: static docs)
  components/
    tracker/
      SubNav.tsx
      FilterBar.tsx
      PortfolioTable.tsx    (table shell)
      SiteRow.tsx
      PhaseBadge.tsx
      CheckpointStatusBadge.tsx
      PriorityIndicator.tsx
      AmountStatusBadge.tsx
      MetricCard.tsx
      SpeedMetric.tsx
      SiteHeader.tsx
      OperationalContext.tsx
      PhaseCheckpointGroup.tsx
      DepositRow.tsx
      ArchiveBanner.tsx
      ActivityLog.tsx
      Toast.tsx
      SkeletonRow.tsx
      TrackerGridClient.tsx     (client wrapper for grid page)
      SiteDetailClient.tsx      (client wrapper for detail page)
      DepositsClient.tsx        (client wrapper for deposits page)
      MetricsClient.tsx         (client wrapper for metrics page)
```

The `layout.tsx` in `tracker/` should render the SubNav and provide any shared tracker context. Each `page.tsx` is a server component that fetches data and passes it to the corresponding client wrapper.
