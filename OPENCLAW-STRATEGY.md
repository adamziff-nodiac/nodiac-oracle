# OpenClaw Strategy for Nodiac Oracle

## Vision

Minimize Adam's manual involvement in maintaining and improving Nodiac Oracle. OpenClaw becomes the first line of defense — monitoring, fixing, building, and proposing changes autonomously, with Adam reviewing and approving.

## Automation Layers

### Layer 1: Monitoring & Alerting
**Goal:** Know immediately when something breaks.

- **Uptime monitoring:** OpenClaw checks the Vercel deployment periodically. If the site is down or returning errors, it pings Adam on Slack.
- **Build health:** Watch for failed Vercel deployments. If a push breaks the build, OpenClaw opens a PR to fix it.
- **Error tracking:** If we add Sentry or similar, OpenClaw can triage errors — is this a real bug or noise?

**Implementation:**
- Set up a scheduled OpenClaw task (cron-style) that hits the deployed URL and checks for 200 status.
- Connect to Vercel API to watch deployment status.
- On failure: post to a dedicated Slack channel (#oracle-ops) with context.

### Layer 2: Code Quality & Maintenance
**Goal:** Keep the codebase healthy without Adam touching it.

- **Dependency updates:** OpenClaw periodically checks for outdated dependencies, creates a branch, runs the build, and opens a PR if it passes.
- **Type checking:** Run `bunx tsc --noEmit` on a schedule, fix any new type errors.
- **Lint enforcement:** Run linting, auto-fix what's possible, flag what isn't.
- **Dead code removal:** Periodically scan for unused exports, components, or imports.

**Implementation:**
- Weekly OpenClaw job: `bun outdated` → create PR with updates if build passes.
- Pre-push hook or CI step for type checking.

### Layer 3: Feature Development from Call Transcripts
**Goal:** Turn team feedback into implemented features without Adam writing code.

**Workflow:**
1. OpenClaw runs daily (or after each call with the dev team):
   - Query Granola for calls involving Eric, Evan, Josh, Stratton, Ken
   - Extract feature requests, bug reports, and friction points
   - Score each item: Is this actionable? Is it noise? Does it align with the product direction?
2. For high-signal items:
   - Create a GitHub issue with context from the call
   - If it's a small change (<30 min of work), implement it on a feature branch
   - Open a PR with a Vercel preview link
   - Post to Slack: "Based on [call], I implemented [change]. Preview: [link]. Approve?"
3. Adam reviews the preview, approves or provides feedback.
4. OpenClaw merges or iterates.

**Guardrails:**
- Never push to main without approval.
- Never modify database schema without explicit approval.
- Never delete data or remove features without approval.
- Always include a Vercel preview link for visual review.
- Flag anything that touches auth, payments, or sensitive data for manual review.

### Layer 4: Automatic Data Updates (Future)
**Goal:** Keep the tracker current without anyone manually entering data.

**Phase 1 — Proposed Updates (Current):**
- After a call, OpenClaw reads the Granola transcript via MCP.
- Proposes updates to specific sites (status changes, next steps, blockers).
- Human reviews and approves via Claude UI.
- This is already working via the Nodiac Tracker MCP connector.

**Phase 2 — Supervised Automation:**
- OpenClaw processes all calls automatically (not just when asked).
- Posts proposed updates to a Slack channel for approval.
- If approved within X hours, applies them. If not, discards.
- Weekly digest of all changes made and proposed.

**Phase 3 — Autonomous (Eventually):**
- Low-risk updates (e.g., "call happened, notes updated") applied automatically.
- High-risk updates (status changes, financial data) still require approval.
- Confidence scoring: OpenClaw rates its own confidence in each proposed change.
- If confidence > 90%, auto-apply. If 70-90%, propose. If <70%, flag for discussion.

## Technical Setup

### What OpenClaw Needs Access To
1. **GitHub repo** — push branches, create PRs, read code
2. **Vercel API** — check deployments, get preview URLs
3. **Granola MCP** — read call transcripts
4. **Nodiac Tracker MCP** — read/write site data
5. **Slack API** — post updates, receive approvals
6. **Supabase** — read-only access for data validation (not direct writes — use MCP)

### Slack Channels
- `#oracle-ops` — Monitoring alerts, build failures, automated updates
- `#oracle-features` — Feature proposals from call analysis, PR links for review

### Scheduling
| Task | Frequency | Priority |
|------|-----------|----------|
| Uptime check | Every 15 min | P0 |
| Build health | On every push | P0 |
| Call transcript processing | Daily at 7 PM ET | P1 |
| Dependency updates | Weekly (Sunday) | P2 |
| Code quality scan | Weekly (Sunday) | P2 |
| Dead code analysis | Monthly | P3 |

## Getting Started

### Immediate (This Week)
1. Set up OpenClaw with access to the nodiac-oracle GitHub repo
2. Configure it to watch for build failures
3. Create `#oracle-ops` Slack channel
4. First test: have OpenClaw process today's Project Tracker Alignment call and propose a feature

### Short Term (Next 2 Weeks)
1. Set up daily call transcript processing
2. Enable dependency update PRs
3. First autonomous feature PR from call feedback

### Medium Term (Month 2)
1. Supervised automation for tracker updates
2. Weekly code quality reports
3. Confidence scoring for proposed changes

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| OpenClaw makes breaking changes | Never push to main; always PR with preview |
| Noisy/irrelevant feature suggestions | Scoring system; daily digest instead of per-item |
| Security (repo access, data access) | Scoped tokens, read-only where possible, audit log |
| Cost (API calls, compute) | Rate limits, batch processing, cost monitoring |
| Stale PRs pile up | Auto-close PRs older than 7 days if not reviewed |
