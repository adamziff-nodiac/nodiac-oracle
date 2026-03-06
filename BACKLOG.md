# Nodiac Oracle — Backlog

Items deferred from the Project Tracker Alignment call (Mar 5, 2026) and ongoing development.

## Deferred — Near Term

### Blockers vs. Next Steps Redesign
- **Context:** Ken argued that blockers are just next steps marked as blocked. Combine blockers, next steps, and waiting-on into a single list with status (to-do / blocked / waiting).
- **Fields to add:** Expected date, lead time (as notes initially, not system-enforced).
- **Decision needed:** Merge blockers/waiting-on/next-steps into a unified list? Or keep separate sections in site_notes JSONB?
- **Source:** Ken Fricklas, Project Tracker Alignment call

### Finance / Interconnection Tab
- **Context:** The current "Deposits" tab should evolve into a broader finance/interconnection tab.
- Deposits are a subset of interconnection tracking.
- Expand to full cost tracker per site — budget, spent, remaining by category.
- Pedro has an up-to-date expense categories list (updated frequently).
- Get Sara involved for accounts payable integration.
- **Decision needed:** Scope of finance tab MVP — deposits + IX costs? Or full project budget from Pedro's model?
- **Source:** Evan Koebel, Eric Shannon, Project Tracker Alignment call

### Time-Windowed Critical Path View
- **Context:** Ken suggested showing a 30-day or 60-day window of critical path items by default. Hide 9-month items unless you drill in. Reduces noise for daily use.
- **Decision needed:** Implement time-windowed filtering for next steps/blockers?
- **Source:** Ken Fricklas, Project Tracker Alignment call

### Interconnection-Specific Phase Statuses
- **Context:** Evan wants more granular power/interconnection phase statuses instead of generic "In Progress" / "Blocked". Example statuses: Feasibility, Service Request Submitted, Agreement Secured, Equipment Procurement.
- **Decision needed:** Define the right status labels for the power phase. These would replace or supplement the current checkpoint-based phase rollup.
- **Note:** This requires deeper thought — the current system rolls up checkpoint statuses into phase status automatically. Adding IX-specific statuses would need a different mechanism.
- **Source:** Evan Koebel, Project Tracker Alignment call

## Deferred — Medium Term

### Landgate Integration
- Eric wants lat/long + address fields linked to Landgate portfolios.
- Landgate customer support may help bulk-create portfolios initially.
- **Prerequisite:** Address + coordinates fields (DONE — already in schema, now exposed in UI).

### Sales Team Views
- Ken discussed views for sales team to see sites waiting on off-takers.
- Not building yet — focused on development team first.
- When ready: create filtered views by stakeholder role.

### Automated Call Processing
- Eric advocated for autonomous updates from call transcripts.
- Vision: OpenClaw watches calls, drafts updates, human approves.
- See `OPENCLAW-STRATEGY.md` for full plan.

### Sara / Finance Integration
- Accounts payable workflow integration with the deposit/finance tracking.
- Get Sara's input on what she needs to see.

## Completed

- [x] Partner + Utility columns on Portfolio All tab
- [x] Address + Coordinates on site detail (with copy + Google Maps)
- [x] Fix phase status labels (show status instead of phase abbreviation)
- [x] Add Site button on portfolio page
- [x] Homepage redesign with pipeline/funnel concept
- [x] Nodiac branding (logos, colors)
