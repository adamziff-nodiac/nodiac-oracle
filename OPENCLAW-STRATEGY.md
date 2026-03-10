# OpenClaw Strategy for Nodiac Oracle

## Vision

Minimize Adam's manual involvement in maintaining and improving Nodiac Oracle. OpenClaw becomes the first line of defense — monitoring, fixing, building, and proposing changes autonomously, with Adam reviewing and approving.

**Morning ritual:** Adam wakes up to a single Slack message with a Vercel preview link showing the night's changes, a summary of what was done, and any decisions that need his input — all reviewable with checkboxes before coffee.

## Automation Layers

### Layer 1: Monitoring & Alerting

**Goal:** Know immediately when something breaks.

- **Uptime monitoring:** OpenClaw checks the Vercel deployment periodically. If the site is down or returning errors, it pings Adam on Slack.
- **Build health:** Watch for failed Vercel deployments. If a push breaks the build, OpenClaw opens a PR to fix it.
- **Error tracking:** If we add Sentry or similar, OpenClaw can triage errors — is this a real bug or noise?

**Implementation:**

- Set up a scheduled OpenClaw task (cron-style) that hits the deployed URL and checks for 200 status.
- Connect to Vercel CLI to watch deployment status.
- On failure: post to a dedicated Slack channel (#oracle-ops) with context.

### Layer 2: Code Quality, Security & Decision Flagging

**Goal:** Keep the codebase healthy, secure, and well-maintained — flag anything that needs a human call.

- **Dependency updates:** OpenClaw periodically checks for outdated dependencies, creates a branch, runs the build, and opens a PR if it passes.
- **Dead code removal:** Periodically scan for unused exports, components, or imports.
- **Security scanning:** Check for known vulnerabilities in dependencies (`bun audit`), review for OWASP top 10 issues (XSS, injection, auth bypasses), flag any hardcoded secrets or exposed API keys.
- **Code quality:** Flag overly complex functions, missing error handling at system boundaries, and inconsistent patterns.
- **Decision flagging:** When OpenClaw encounters something ambiguous — a dependency with a breaking change, a pattern that could go two ways, a security tradeoff — it flags it as a **Decision Required** item in its Slack summary rather than guessing.

**Implementation:**

- Weekly OpenClaw job: `bun outdated` → create PR with updates if build passes.
- Pre-push hook or CI step for type checking.
- Security scan integrated into the weekly job — output goes to Slack summary.
- Decision items collected and batched into the daily Slack message (not individual pings).

### Layer 3: Feature Development from Call Transcripts

**Goal:** Turn team feedback into implemented features without Adam writing code.

**Workflow:**

1. OpenClaw runs nightly:
  - Query Granola for calls involving Eric, Evan, Josh, Stratton, Ken
  - Extract feature requests, bug reports, and friction points
  - Score each item: Is this actionable? Is it noise? Does it align with the product direction?
2. For high-signal items:
  - Create a GitHub issue with context from the call
  - If it's a small change (<30 min of work), implement it on a feature branch
  - Merge all night's work into a single **release branch** → one Vercel preview link
  - Include GitHub PR checkboxes for each change (makes testing easy)
3. **Morning 9am Slack message** to Adam (one message, one link):
  - "Here's what I did last night: [preview link]"
  - Checkboxes summary of each change
  - **Decisions needed:** Any items where the implementation path wasn't clear
  - "Approve all / approve individually / provide feedback"
4. Adam reviews the preview, approves or provides feedback.
5. OpenClaw merges or iterates.

**Guardrails:**

- Never push to main — branch protection enforced programmatically (see GitHub Setup below).
- Never modify database schema without explicit approval.
- Never delete data or remove features without approval.
- Always include a Vercel preview link for visual review.
- Flag anything that touches auth, payments, or sensitive data for manual review.
- If a feature request is ambiguous, **ask in the Slack message** rather than guessing.

### Layer 4: Automatic Data Updates

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
- **Ideal target:** After every call, the tracker reflects what was discussed within hours — Adam just confirms.

**Phase 3 — Autonomous (Long-term):**

- Low-risk updates (e.g., "call happened, notes updated") applied automatically.
- High-risk updates (status changes, financial data) still require approval.
- Confidence scoring: OpenClaw rates its own confidence in each proposed change.
- If confidence > 90%, auto-apply. If 70-90%, propose. If <70%, flag for discussion.

## GitHub Setup: Preventing OpenClaw from Pushing to Main

**Goal:** OpenClaw can never push to main, but Adam can.

**Branch protection ruleset (recommended):**

Go to **GitHub → repo → Settings → Rules → Rulesets → New ruleset**:

1. **Ruleset name:** "Protect main"
2. **Enforcement status:** Active
3. **Target branches:** Add target → Include default branch (`main`)
4. **Rules to enable:**
  - "Restrict pushes" — Only bypass actors can push
  - "Require a pull request before merging" — OpenClaw must use PRs
  - "Require status checks to pass" — Vercel build must succeed

## Technical Setup

### What OpenClaw Needs Access To

1. **GitHub repo** — push branches, create PRs, read code (fine-grained PAT, no main push)
2. **Vercel CLI** — check deployments, get preview URLs
3. **Granola MCP** — read call transcripts
4. **Nodiac Tracker MCP** — read/write site data
5. **Slack API** — post updates, receive approvals
6. **Supabase** — read-only access for data validation (not direct writes — use MCP)

### Slack Channels

- `#oracle-ops` — Monitoring alerts, build failures, automated updates
- `#oracle-features` — Feature proposals from call analysis, PR links for review

### Scheduling


| Task                         | Frequency           | Priority |
| ---------------------------- | ------------------- | -------- |
| Uptime check                 | Every 15 min        | P0       |
| Build health                 | On every push       | P0       |
| Call transcript processing   | Nightly at 11 PM ET | P1       |
| Morning summary to Adam      | Daily at 7 AM ET    | P1       |
| Dependency updates           | Weekly (Sunday)     | P2       |
| Code quality + security scan | Weekly (Sunday)     | P2       |
| Dead code analysis           | Monthly             | P3       |


### Daily Slack Message Format

```
Good morning! Here's what I worked on overnight:

Preview: https://release-nightly-0305.vercel.app

Changes:
☐ Added utility filter dropdown to portfolio view
☐ Fixed phase badge showing "Active" instead of "In Progress"
☐ Populated coordinates for Jump River sites from Fleet CIR data

Decisions needed:
⚠️ The Flambeau site has conflicting MW values between Fleet CIR (1.0) and the call transcript (1.5) — which should I use?
⚠️ Should the "Add Site" modal require a hub selection or keep it optional?

Approve all? Reply "approve" or click through individual items.
```

## Getting Started

### Immediate (This Week)

1. Set up GitHub branch protection ruleset (see above)
2. Fix Supabase redirect URLs for preview deployments (see above)
3. Set up OpenClaw with access to the nodiac-nora GitHub repo
4. Configure it to watch for build failures
5. Create `#nora-ops` Slack channel

### Short Term (Next 2 Weeks)

1. Set up nightly call transcript processing
2. Enable dependency update PRs
3. First autonomous feature PR from call feedback
4. Morning Slack summary working end-to-end

### Medium Term (Month 2)

1. Supervised automation for tracker updates (Layer 4, Phase 2)
2. Weekly code quality + security reports
3. Decision flagging system refined based on what Adam actually needs to decide

## Risks & Mitigations


| Risk                                 | Mitigation                                                            |
| ------------------------------------ | --------------------------------------------------------------------- |
| OpenClaw makes breaking changes      | Branch protection: can never push to main; always PR with preview     |
| Noisy/irrelevant feature suggestions | Scoring system; batch into single daily message                       |
| Security (repo access, data access)  | Fine-grained PAT, branch ruleset, read-only where possible, audit log |
| Cost (API calls, compute)            | Rate limits, batch processing, cost monitoring                        |
| Stale PRs pile up                    | Auto-close PRs older than 7 days if not reviewed                      |
| Ambiguous features implemented wrong | Decision flagging in Slack message; ask, don't guess                  |


