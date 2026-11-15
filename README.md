# Skills2Cash

**Turn what you know into what you can confidently offer and sell.**

Skills2Cash is an AI-powered, practice-based learning platform (Business Cup 2.0 · Track 03: Skills) that teaches US adults (25–45) to turn an existing skill into a clearly defined, priced service — and to practise selling it with realistic AI clients. It is a learning product: no marketplace, no lead generation, no income promises. Prices are always shown as hypotheses to validate.

Full product spec: [`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md) · Build status: [`DEVELOPMENT_STATUS.md`](DEVELOPMENT_STATUS.md)

## Core journey

| Step | Route | What happens |
| --- | --- | --- |
| Landing | `/` | Value proposition, five stages, simulator preview. CTAs: **Discover My Skills**, **Try Demo** |
| Skill assessment | `/onboarding` | 4-step structured questionnaire → AI Skill Profile (facts vs. assumptions, identified skills, strengths, gaps, 1–3 service directions with price hypothesis). User can remove strengths, pick/edit the direction or reject it and write their own |
| Skill Profile | `/profile/skills` | Reference-style dashboard: skills tracker (left), radar chart (centre), achievements (right). Self-reported vs. demonstrated scores are labelled; exact values and evidence are in text |
| Dashboard | `/dashboard` | Next recommended action, readiness, stage progress, recent activity |
| Learning Path | `/path` | Discover → Build → Price → Practice → Launch: objectives, lesson, example, completion criteria, adaptive recommendation |
| Service Builder | `/service-builder` | Skill, name, customer, problem, outcome, deliverables, scope, timeline, revisions, UVP, exclusions, pricing model, price + rationale. **Improve with AI** suggests per-field edits. Saved offer feeds the simulator |
| Pricing Builder | `/service-builder/pricing` | Hours × $/hour + costs → cost floor; Basic/Standard/Premium packages (all editable); AI pricing coach (rationale, risks, validation steps) |
| Weekly Missions | `/assignments/weekly` | 2–4 personalised real-world tasks per week (chosen from weakest competencies, current stage, skill level and hours available); details, deadline, self-reported completion with a note, XP reward, weekly statistics, history; a completed mission is not issued again while new ones remain |
| Progress Tracker | `/progress` | Eight-phase monetization journey with percentages calculated from saved activity, milestone cards, weekly activity, skills developed / to improve, achievements (locked/unlocked, XP), level and XP history |
| AI Client Simulator | `/practice`, `/practice/[scenarioId]` | 7 scenarios (Beginner → Advanced). Multi-turn chat with an in-character AI client. **End Session** triggers a separate evaluator call |
| Results | `/practice/session/[id]` | 8 rubric scores with quotes from your messages, strengths, mistakes, improvements with example lines, next exercise, transcript |
| Missions | `/assignments`, `/assignments/[id]` | 8 practical missions with rubric, AI feedback, score, attempts history |
| Readiness | `/readiness` | 7 readiness dimensions from demonstrated evidence only, history chart, next step |
| Auth | `/login`, `/signup` | Supabase email/password; app routes redirect to login when Supabase is configured and the user is signed out |
| Demo | `/demo` | No sign-up. Alex's pre-written, labelled profile; real simulator; isolated per visitor |

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn-style primitives (`src/components/ui.tsx`) · Lucide icons · Zod · Recharts · Supabase (Postgres + Auth + RLS) · OpenAI Chat Completions (JSON mode, server-only) · Vercel.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in what you have (all optional for a first run)
npm run dev                  # http://localhost:3000
```

Checks:

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test        # unit tests (scoring, evaluation, progress, fallbacks, demo data)
npm run build       # production build
npm run check       # all of the above
```

### Environment variables

| Variable | Where | Needed for |
| --- | --- | --- |
| `OPENAI_API_KEY` | server only | Live AI in all 6 AI routes. Missing → routes return `503 not_configured`; UI shows an error with **Retry** and a labelled offline option |
| `OPENAI_MODEL` | server only | Optional, default `gpt-4o-mini` |
| `OPENAI_BASE_URL` | server only | Optional OpenAI-compatible API base URL; defaults to `https://api.openai.com/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Accounts + cloud persistence |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Accounts + cloud persistence (anon key is safe: every table has RLS) |
| `STRIPE_SECRET_KEY` | server only, TEST MODE (`sk_test_...`) | Hosted subscription checkout and Stripe API |
| `STRIPE_PUBLISHABLE_KEY` | public, TEST MODE (`pk_test_...`) | Reserved for Stripe.js integrations; hosted Checkout currently redirects directly |
| `STRIPE_WEBHOOK_SECRET` | server only | Verifies Stripe webhook signatures |
| `STRIPE_PRICE_ID` | server only | Stripe TEST price; checkout verifies it is exactly $19 USD/month |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Lets verified Stripe webhooks update subscription access; never expose it to the browser |

The Supabase service-role key is used only by the server-side Stripe webhook to write verified subscription state. `GET /api/health` reports the existing AI and Supabase client configuration (booleans only).

**Guest mode and billing**

- Landing → **Continue as Guest** opens an isolated local workspace in `skills2cash_guest_data`. Guest progress and free usage counters remain in this browser. After signing in, use the guest banner to transfer records; existing account records are preserved and guest storage is cleared only after the transfer succeeds.
- Apply `supabase/migrations/20261114000200_billing.sql` before enabling billing. It creates an owner-readable subscription table with no client write policies.
- Apply `supabase/migrations/20261114000300_grants.sql` after billing when the Supabase project needs explicit Data API table grants. RLS policies remain responsible for row-level access.
- In Stripe TEST mode, create a recurring USD $19 monthly Price and configure the five Stripe/Supabase environment variables above. Configure the webhook endpoint as `/api/billing/webhook` for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`.
- Checkout is available only to signed-in users. Guests retain their browser data and must create/sign into an account before checkout. Pro access is recorded only after signature-verified Stripe webhook processing.
- Check plan and usage under Dashboard or **Subscription**. Stripe credentials and webhook processing require configured test credentials and a deployed Supabase migration.

**Modes**

- **Account mode** (Supabase configured): sign up / log in; all progress is stored in Postgres under RLS.
- **Local mode** (Supabase not configured): the full app works and saves to the browser; a banner says so.
- **Demo mode** (`/demo`): Alex's labelled sample data in a per-visitor browser namespace (`s2c:demo:<random visitor id>`), so visitors never see each other's progress. If an AI call fails, demo mode falls back automatically to labelled offline samples; **Scripted mode (no AI)** forces them.

### Supabase setup

1. Create a project at supabase.com → copy *Project URL* and *anon public key* into `.env.local`.
2. SQL editor → run, in order:
   - `supabase/migrations/20261114000000_init.sql` — 11 tables, indexes, constraints, triggers, RLS policies
   - `supabase/migrations/20261114000100_seed.sql` — mission and scenario catalog (generated from `src/lib` by `npm run db:seed-sql`)
   - `supabase/migrations/20261114000200_billing.sql` — subscription status, read-only for authenticated clients
   - `supabase/migrations/20261115000000_retention.sql` — weekly missions and the XP ledger (owner-only RLS; unique constraints prevent duplicate missions and duplicate rewards). Until it is applied, weekly missions and XP are stored in the browser and the UI says so.
   - `supabase/migrations/20261114000300_grants.sql` — explicit Data API grants, still subject to RLS

   or with the CLI: `supabase link --project-ref <ref> && supabase db push`.
3. Authentication → Providers → Email: enabled. For a hackathon demo you may disable *Confirm email* so sign-up logs in immediately.
4. Authentication → URL configuration: add your Vercel URL.

Tables: `profiles`, `skill_profiles`, `learning_paths`, `service_offers`, `pricing_worksheets`, `assignments` (catalog), `assignment_submissions`, `roleplay_scenarios` (catalog), `roleplay_sessions`, `roleplay_messages`, `readiness_snapshots`. Owner-only policies on every user table; catalogs are read-only; evidence (submissions, messages, snapshots) is insert/read/delete only; a session can be updated only while `active`, and messages can only be added to your own active session. These policies were tested against PostgreSQL with a stubbed `auth` schema (user B cannot read or write user A's rows; completed sessions cannot be altered).

## Architecture

```
src/
  app/                    routes (landing, auth, demo) and (app)/… route group with the app shell
  app/api/*/route.ts      server-only AI endpoints (Zod-validated input → AI → Zod-validated output)
  components/             UI primitives, app shell, workspace provider, charts, evaluation view
  lib/ai/                 one module per AI responsibility, prompts in version control:
                          assessment.ts (assessment + service recommendations), offer.ts, pricing.ts,
                          client.ts (customer roleplay — persona only), evaluator.ts (rubric scoring),
                          assignment.ts (mission feedback), openai.ts (JSON mode, timeout, 1 repair retry)
  lib/                    competencies, rubric, scenarios, missions, stages, scoring, evaluation,
                          progress (readiness, adaptive path, achievements), fallback (labelled offline samples),
                          demo data, schemas (Zod)
  lib/client/             browser: API caller, Supabase client, repositories (Supabase / local)
supabase/migrations/      SQL schema + generated seed
tests/                    node:test unit tests
```

**Separation of AI roles.** The customer prompt (`lib/ai/client.ts`) contains only the persona, budget, objection and hidden priorities. The rubric lives only in `lib/ai/evaluator.ts`, which runs as a separate request after **End Session**. The customer is instructed never to coach or mention scores.

**Adaptive learning and readiness are deterministic** (not AI calls) so they are transparent and reproducible; the "Adaptive Learning" and "Readiness Evaluation" modules are `lib/progress.ts`.

**Error handling.** Every AI route: rate limit (30 req/min/IP, best-effort), input validation (400), 30 s timeout, 429/401/5xx mapping, invalid/empty output → one repair retry → `invalid_output`. The UI shows loading, empty and error states with **Retry**; offline samples are offered only as an explicit, labelled choice (or automatically in demo mode).

## Scoring formulas

All thresholds live in `src/lib/config.ts` and are initial product settings, not validated cut-offs.

1. **Criterion → percent:** each rubric criterion is scored 1–5 (or `null` = not enough evidence). `percent = (score − 1) / 4 × 100` (1→0, 2→25, 3→50, 4→75, 5→100).
2. **Overall score (simulation or mission):** `round(mean(percent of scored criteria))`. `null` criteria are excluded, not counted as zero. If nothing is scored → "Not enough data". Low confidence is flagged when fewer than 60 % of criteria are scored, or a simulation has fewer than 3 user messages.
3. **Evidence quotes** returned by the evaluator are kept only if they appear verbatim (normalised) in the user's own messages.
4. **Self-reported competency** = `(rating − 1) × 25` from the assessment.
5. **Demonstrated competency** = mean percent of all evidence items mapped to that competency, from the **latest attempt of each mission** and the **3 most recent completed simulations**. Displayed score = demonstrated if available, else self-reported (always labelled).
6. **Readiness** (7 dimensions) = mean of demonstrated evidence for the competencies each dimension covers (e.g. *Objection handling & negotiation* = objection_handling + negotiation). Overall = mean of dimensions with evidence; marked *provisional* when fewer than 4 dimensions have evidence. Self-reported ratings are never included. A snapshot is stored whenever the result changes.
7. **Bands / adaptive path:** `< 60` remedial, `60–79` targeted, `≥ 80` advance. Recommendation order: no assessment → assessment; any demonstrated competency `< 60` → remedial activity for the weakest; next unmet stage requirement; weakest `< 80` → targeted practice; else a harder scenario not yet passed. A mission or simulation counts as passed at `≥ 60`.
8. **Achievements** are awarded only from stored actions (assessment saved, offer saved, mission ≥ 60, pricing worksheet + Mission 4 ≥ 60, completed simulation, objection handling ≥ 4/5, beating a previous score on the same scenario, all missions ≥ 60, readiness ≥ 70 non-provisional).

## Deploy

### GitHub

Create an **empty public** repository named `skills2cash` on GitHub (no README, no .gitignore), then from the project folder:

```bash
git remote add origin https://github.com/<your-account>/skills2cash.git
git branch -M main
git push -u origin main
```

Teammates then clone it and run `npm install`. Never commit `.env*` files (they are git-ignored).

### Vercel

1. vercel.com → **Add New… → Project** → import your `skills2cash` repository (framework auto-detected: Next.js; build `npm run build`).
2. **Settings → Environment Variables** (Production + Preview): `OPENAI_API_KEY`, optionally `OPENAI_MODEL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Deploy, then open `/api/health` — it should return `{"ai":true,"supabase":true}`.
4. Add the production URL to Supabase → Authentication → URL configuration.

CLI alternative: `npm i -g vercel && vercel link && vercel env add OPENAI_API_KEY && vercel --prod`.

## Judge walkthrough (2–3 minutes)

1. Open the site → **Try Demo** (no sign-up). Banner reads *DEMO MODE*.
2. **Open Alex's profile**: tracker with *Self-reported* vs *Demonstrated* badges, radar, achievements earned from real actions, recommended next action ("pricing is 25/100 → remedial practice").
3. **Learning Path** → show stage requirements and the adaptive rule text.
4. **Service Builder / Pricing** → Alex's offer and three packages; prices labelled as hypotheses.
5. **Practice → “Another freelancer offered a lower price”** → write 3–4 replies; the client pushes back in character.
6. **End Session** → rubric scores with quotes, mistakes, example lines, next exercise; open **Readiness** to see it reflected; reload to show it persisted.
7. If the network or AI fails: tick **Scripted mode (no AI)** in the banner — every sample is labelled *Offline sample — not AI*.

## Responsible AI

AI feedback can be imperfect and is labelled as AI-generated. The app never invents user experience, testimonials or market statistics, never guarantees income or customers, never contacts anyone on the user's behalf, and labels the simulated client as AI.
