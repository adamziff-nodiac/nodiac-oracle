# Nodiac Oracle — Backlog

Items deferred from ongoing development conversations. Updated Mar 6, 2026.

## Next Week Priorities

### Canadian Site Screening

- **Context:** Need to screen Canadian sites against the same methodology used for US sites. Gabrielle is working on adapting the screening methodology for Canada, but if that takes too long Adam will need to step in.
- **Goal:** Bring Canadian capacity maps, utility data, and site screening into the platform. Canada is a major focus for next week.
- **Tasks:**
  - Source Canadian utility territory data (HIFLD is US-only)
  - Source Canadian power capacity / substation data equivalent
  - Adapt screening methodology for Canadian sites (or use existing as starting point)
  - Backfill Canadian site data (44 Powerbank sites in Ontario already have lat/lon but no utility)
- **Owner:** Gabrielle (methodology), Adam (platform/data)
- **Source:** Adam, Mar 6 call with Evan

### Attio CRM Integration (Fix + Rethink)

- **Context:** The Attio integration is broken and needs fixing. But more importantly, the whole CRM approach needs rethinking per the Evan conversation.
- **Current state:** Attio connector exists but is broken. The question is what data lives in Attio vs the tracker.
- **Evan's vision:** Use Attio as a true CRM for relationship/account management. Each site = a deal in Attio. Contacts, notes, and relationship status live there. The tracker holds project/development data (checkpoints, phases, technical details).
- **Key insight from Evan:** Utility account management will have multiple contact layers — engineers for technical design work, account managers for portfolio-level relationship. Different contacts for different things.
- **Decision needed:** Define the boundary — what goes in the tracker vs what goes in Attio. Document this as a skill/prompt so Claude and the team follow the same rules.
- **Note:** Not the top priority this week. Needs more thought. Will evolve over time.
- **Source:** Evan Koebel, Mar 6 call

### Update Claude Skills for Evan/Eric/Josh

- **Context:** Recent schema changes (action items table, utility auto-assignment, new columns) broke the existing skill files. Need to send updated skills to the team.
- **Tasks:**
  - Update `process-call-supabase`, `update-project-supabase`, `project-status-supabase` skills
  - Update schema references to reflect new `tracker_action_items` table, `site_type`, `interconnection_voltage_kv`, etc.
  - Test skills end-to-end before distributing
  - Send updated skill zip files to Evan
- **Source:** Evan/Adam call Mar 6 — Evan confirmed old skills are broken after recent changes

## Deferred — Near Term

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

### Database Backup / Undo Capability

- **Context:** With Claude MCP doing batch updates, the risk of accidental data loss increases. Evan raised this — "if we do have a massive error with a batch site change, how easy is it to undo?"
- **Tasks:** Investigate Supabase point-in-time recovery, or build a lightweight changelog/audit table for tracker_sites edits.
- **Source:** Evan Koebel, Mar 6 call

## Deferred — Medium Term

### Utility Account Management Views

- **Context:** Evan thinks in terms of utilities — "show me everything in one utility" is a primary operating mode. He wants to filter by utility and see all sites, then manage the relationship at that level.
- **Vision:** For each utility, track the specific interconnection process, contacts at different levels (engineers, account managers), and portfolio-level strategy notes.
- **Note:** This is where Attio integration becomes important. The tracker shows the portfolio view (which sites, what stage), Attio manages the relationship (contacts, notes, next touchpoints).
- **Source:** Evan Koebel, Mar 6 call

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

- Utility auto-assignment via HIFLD territory lookup (304 sites assigned, 67 new partners created)
- Powerbank sites backfilled with lat/lon, tech, voltage, utility, county/state (53 sites)
- Rooftop Solar added as site_type enum value
- Blockers/Next Steps redesigned as action items table (`tracker_action_items`) with GTD-inspired /todo page
- Utility territory map layer on tracker (HIFLD polygons, toggle on/off)
- Partner + Utility columns on Portfolio All tab
- Address + Coordinates on site detail (with copy + Google Maps)
- Fix phase status labels (show status instead of phase abbreviation)
- Add Site button on portfolio page
- Homepage redesign with pipeline/funnel concept
- Nodiac branding (logos, colors)

