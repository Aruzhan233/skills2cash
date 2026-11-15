# Development status

_Last updated: 2026-11-15_

## Guest sign-in and progress transfer fix (2026-11-15)

- Bug A (signed in but still in the Guest workspace): the workspace picked its store with the stored Guest Mode flag
  (`skills2cash_guest_session`) checked *before* the Supabase session, and nothing cleared that flag on sign-in. Now the
  session wins: signing in clears the flag, the account store opens, and guest data (kept in `skills2cash_guest_data`) is only
  offered for transfer. The workspace waits for the session check before opening any store (no guest flash), and data loaded
  from one store is never shown or written under another while the next one loads. `/guest-start` sends signed-in users to
  `/dashboard`.
- Bug B ("Could not find the table 'public.weekly_missions'" on transfer): `importRetention` queried `weekly_missions`
  directly and ignored the browser fallback set when the tables are missing. The retention migrations are still **not applied**
  on the configured project (re-checked: PGRST205 for both tables, PGRST202 for the function). Transfer now succeeds: core
  progress goes to the database, and missions/XP wait for the account in this browser (labelled) and move into the database
  automatically once the migrations are applied.
- Transfer (`src/lib/client/guest-transfer.ts`): session re-verified with `auth.getUser()`, records validated, account data never
  overwritten (account's profile/offer/pricing win; history added by id; readiness history only for the same profile; missions
  deduplicated by id or week + template; achievements once). Each step is idempotent, so a retry completes an interrupted
  transfer without duplicates; guest data is removed only after every step succeeds (unmerged guest copies are archived in
  `skills2cash_guest_archive`).
- Tests: `npm test` 29/29; PGlite (all six migrations) 37/37 including cross-user checks on every transfer table; browser
  scenarios on a production build with a stateful Supabase stand-in 27/27; regressions: flow 44/44 checks, navigation 35/35,
  auth 19/19; no page exceptions. Not run against the real Supabase project.

## Redesign pass 3 — "Rising Horizon" premium purple identity (2026-11-15)

Owner brief: complete premium redesign from four reference images (fifth never arrived; owner chose to proceed), pinned palette
#08060D / #100A1C / #321078 / #782BFF / #963FFF / #C5A7FF / #F8F6FF / #A69BB8, glowing spheres, glass, luminous borders.
Owner answers: gold stays for earned rewards; full glow/glass atmosphere everywhere. Replaces the "Night Workshop" look of pass 2.
Direction contract: `.impeccable/surfaces/src-components-app-shell-tsx.md`.

- [x] Design system (`globals.css`): same token names, new values (translucent surfaces so the sky reads through); utilities
      `glass`, `glass-float`, `glass-lit` (next-action panel, re-tints secondary text for contrast), `glass-hover`, `text-gradient`;
      `.sky` (fixed atmosphere: drifting light pools + faint masked grid), `.horizon` (planet-edge light arc); Sora display font
- [x] Shared components: buttons (lit gradient / glass), Card (glass; lit when `glass-lit`), badges, inputs, progress (glowing fills,
      gold for XP), empty/error/loader states, toaster (gold unlock pulse), level card, achievements (gold glow), plan cards (lit Pro)
- [x] New `src/components/orb.tsx`: CSS glass Orb + canvas ParticleSphere (rotates, leans to pointer, pauses off-screen, static
      under reduced motion)
- [x] Landing rebuilt: glass nav, particle dome hero, sample workspace preview, transformation, six-step path, service/skill/pricing
      bento, five stages, simulator preview, weekly missions + progress, principles, lit close. Sample content comes only from the
      labelled demo dataset; no invented stats or testimonials
- [x] App shell: sky + horizon behind every page (horizon md+), glass rail with glowing path, translucent header; next-step panels
      lit on Dashboard, Skill Profile, Path, Readiness, Progress, evaluation; chat bubbles, tabs, journey markers, charts restyled
- [x] Login / signup / demo: sky + dome atmosphere
- [x] QA: typecheck, lint clean; `npm test` 16/16; production build OK (isolated copy); 22/22 flow checks + 35/35 navigation
      checks on the production build, no console errors; captures at 1440 and 390 with no horizontal overflow
- [x] Finish review (impeccable-finish-reviewer): round 1 "fix" (8 items), round 2 scored 7 resolved + 2 regressions, round 3
      resolved those; last item (horizon crossing the Subscription "Plans" subtitle) fixed and verified by recapture, not re-scored.
      Root-cause bug found in review: Lightning CSS dropped unprefixed `backdrop-filter` when both forms were declared, so glass
      never blurred — now unprefixed only.
- [x] DESIGN.md + `.impeccable/design.json` overwritten from shipped code (impeccable-documenter, owner chose overwrite)
- Fixed (2026-11-15): "Could not find the module …orb.tsx#ParticleSphere / #Orb in the React Client Manifest". Code was correct;
  cause was a leftover second `next dev -p 3100` writing to the same `.next` as `npm run dev` on :3000 (corrupt client manifest
  and chunks). Both stopped, `.next` deleted, one dev server restarted; `/`, `/dashboard`, `/readiness`, Pricing Builder verified.

## Redesign pass 2 — application-wide consistency (branch `feature/skills2cash-redesign-retention`)

Direction: the owner-approved Impeccable surface brief `.impeccable/surfaces/src-components-app-shell-tsx.md`
("The Night Workshop": left journey rail, violet = the one lamp, gold spark = earned, no eyebrows, no gradient fills, no glows).
Commit bd41609 shipped the tokens (`globals.css`), Geist, and the rail shell. The pages still carried the previous look.

### Audit findings (2026-11-15, demo workspace, 1440px screenshots)
- Shell/rail: matches the contract. Bug: `text-danger` (undefined token) in the guest transfer error.
- Every page: uppercase eyebrow labels, violet gradient "featured" cards, glows on achievement/level tiles (earned should be spark gold), charts on the old palette hex values.
- Dashboard: 8 panels; two journey strips (8 phases + 5 stages), level card duplicated from the rail, subscription usage mixed into the journey, emoji greeting, glowing logo.
- Skill Profile: 17-item achievements column stretches the 3-column grid to ~2000px; the other columns are mostly empty.
- Learning Path: all five stages fully expanded (~2900px).
- Service Builder: 14 fields in one undivided list; preview canvas not sticky.
- Practice: seven identical full-width violet "Start" buttons (violates One Lamp).
- Progress: six hero-metric tiles; earned achievements and XP in violet instead of spark.
- Subscription: uppercase plan chips and table header; plan usage shown as bare "1/1" text.
- Demo page uses an undefined `bg-grid` class.
- Landing page: owner constraint says landing copy and claims unchanged; only token-level fixes allowed.

### Checklist
- [x] Phase 1 — audit (above)
- [x] Phase 2 — design system: `src/lib/chart-theme.ts` (charts read token values); earned = spark in achievements, level card, toasts, XP;
      gradients/glows/eyebrows removed; `text-danger`→`text-bad`, `bg-grid`→`lamp`; `font-mono` on scores → tabular sans
- [x] Phase 3 — shell kept (already matched the contract); checklist label "You are here" → "Next up" (it marks the first unfinished step)
- [x] Phase 4 — Dashboard (next-step panel + 3 figures + 8-phase strip; removed duplicate 5-stage strip, level card, plan usage),
      Skill Profile (2-column, achievements as compact section), Assessment (stepper with done/current states), Learning Path (collapsible timeline, deep links open stages)
- [x] Phase 5 — Service Builder (4 guided sections with completion checks, sticky canvas), Practice (one recommended primary button,
      segmented filter), Simulator (viewport-height chat, avatars, typing bubble, turn meter, sticky briefing), Session review, Readiness (meaning per dimension + band)
- [x] Phase 6 — Missions (neutral badges), Weekly (single summary panel, spark XP), Progress (milestone strip, spark XP, no gradients),
      Subscription (sentence-case plans, usage meters), Guest paywall (fixed `<button>` inside `<a>`)
- [x] Phase 7 — polish + mobile pass: 15 changed screens captured at 1440 and 390, all overflowX=0 (fixed dashboard, progress,
      and a pre-existing Pricing Builder overflow); micro text raised to the 12px floor (incl. chart ticks)
- [x] Phase 8 — QA (2026-11-15):
  - `npm run lint` clean · `npm run typecheck` clean · `npm test` 16/16 pass · `next build` succeeds (built from an isolated copy
    because a dev server was running on `.next`)
  - Browser flow checks (headless Chrome, demo workspace, scripted mode) 22/22 pass, no console errors: Learning Path disclosure +
    `#price` deep link; Service Builder edit → save → reload persistence → validation; weekly mission confirm → +100 XP + toast;
    simulator start → 3 turns → End Session → evaluation page; mobile drawer open / Escape; no horizontal overflow
  - Impeccable: `detect` (advisories only, resolved), finish review (impeccable-finish-reviewer, 2 rounds), DESIGN.md +
    `.impeccable/design.json` rewritten from shipped code (impeccable-documenter)
  - Review fixes applied: user chat bubbles tonal; 60–79 score chips, Demonstrated/AI and difficulty chips neutral; unearned XP muted;
    card kicker labels moved below titles; text arrows → icons; achievement tiles and phase strip unboxed; rail and checklist mark "Next";
    next mission highlighted on /assignments

### Open decisions / remaining issues
- Owner decision: the finish review asks to lift the ground (`--color-bg #0a0910`) to a violet-tinted charcoal and make the rail darker
  than the ground. Not applied — the brief asks for deep dark backgrounds. Also not applied: neutral (non-violet) data bars.
- Three numbering schemes coexist (6 journey steps, 8 progress phases, 5 learning stages). Unifying them is a product/data decision.
- Not verified here: live AI responses (the run used scripted/offline paths), Supabase sign-up/login, Stripe checkout.
- Public pages (landing, demo) still carry kicker pills above headings; landing copy is frozen by the owner.
- Nothing is committed. Next step: owner review of the diff, then commit on this branch.

### Retention persistence: weekly missions, XP, achievements (2026-11-15)
- Root cause of the "saved in this browser only" warning: the configured Supabase project has never had
  `20261115000000_retention.sql` applied. A read-only probe returned PGRST205 ("table not found") for `weekly_missions` and
  `xp_transactions`, while existing tables respond. The app correctly fell back to browser storage.
- **NOT APPLIED YET — owner action needed.** No DB password, service-role key or Supabase CLI is available here, so the
  migrations could not be applied. Apply, in order: `20261115000000_retention.sql`, then `20261115000100_retention_integrity.sql`
  (Dashboard → SQL Editor, paste each file and run; or CLI `supabase db push` — see the note on migration history first).
- New migration `20261115000100_retention_integrity.sql` (forward-only, idempotent, no drops):
  - atomic `complete_weekly_mission()`: completes and pays the stored reward once
  - guard trigger: no client-side completing, reopening or editing completed missions, and no changing the reward
  - clients may insert achievement XP only
  - `user_xp_summary` view (security_invoker)
- Frontend:
  - completion goes through the function
  - browser fallback only when the tables are missing (other DB errors now show the error state)
  - progress kept in the browser while tables were missing moves to the account once they exist
  - guest-to-account transfer uses the same path
  - a double click sends one completion request
- Tests:
  - PGlite (real PostgreSQL, Supabase auth stub), all 6 migrations: 29/29 RLS/integrity checks
  - unit tests 24/24 (8 new in `tests/retention-repository.test.ts`)
  - browser end-to-end on a production build with a stateful Supabase stand-in: 18/18
  - regressions: flows 22/22, navigation 35/35, auth 19/19
  - not yet run against the real project (tables do not exist there yet)

### Home / logo / session fix (2026-11-15, supersedes the "Home → /" change below)
- Logo → `/` always. Home (rail) → `/dashboard` when a workspace exists (account, guest, demo or local mode), otherwise `/`.
  The separate "Dashboard" rail item was removed because it duplicated Home.
- Cause of "asked to log in again": sessions were never lost (Supabase persists them in localStorage `s2c-auth`), but `/login`
  and `/signup` always showed the form, and the landing page (where the logo leads) only offered Log in. Now `/login` and
  `/signup` send a signed-in user straight to `next` (same-site paths only) or `/dashboard`, and the landing header shows
  "Dashboard" instead of "Log in" when signed in (`src/components/landing-account-link.tsx`).
- Verified on a production build with Supabase intercepted in the browser (no request reached the real project): 19/19 auth
  checks, plus 35/35 navigation and 22/22 flow checks for guest/demo.

### Homepage / logo navigation fix (2026-11-15)
- Cause: in the app shell the logo and the "Home" rail item both linked to `/dashboard`, so nothing inside the app reached the
  public landing page at `/`. No middleware or redirect exists; `/` itself was fine.
- Fix (`app-shell.tsx`, `logo.tsx`): logo → `/`; rail has separate "Home" (`/`) and "Dashboard" (`/dashboard`) items; breadcrumb
  root renamed "Dashboard"; logo link gets hover/focus states. No auth, guest or route logic changed.
- Verified: 35/35 browser navigation checks (production build and dev server): logo from 11 app pages, Home, mobile drawer,
  guest and demo state preserved on `/`, no redirects, landing CTAs point to existing routes. Lint, typecheck, 16/16 tests, build pass.

Note for contributors: do not run a second `next dev` against the same `.next` folder while another is running —
it corrupts the webpack cache (random 404/500s).

---

## Completed

- [x] Repository inspected; existing `src/lib` scaffold and migration extended rather than replaced
- [x] Next.js 15 App Router + TypeScript strict + Tailwind v4 + Zod + Recharts + Lucide; shadcn-style UI primitives
- [x] Landing page (hero, value proposition, how it works, 5 stages, simulator preview, benefits, CTA, footer)
- [x] Auth: Supabase email sign up / log in / log out, session persistence, protected app routes (redirect to `/login?next=…`)
- [x] Local mode when Supabase is not configured (clearly labelled)
- [x] Skill assessment (4 steps, validation) → AI Skill Profile with edit / reject / regenerate
- [x] Skill Profile dashboard per reference (tracker, radar, achievements; responsive; text values; source labels)
- [x] Dashboard, adaptive Learning Path (5 stages, objectives, lessons, examples, completion criteria, transparent rules)
- [x] Service Builder with per-field AI suggestions and Service Offer Canvas
- [x] Pricing Builder (cost floor, 3 editable packages, AI pricing coach with risks and validation steps)
- [x] AI Client Simulator: 7 scenarios (Beginner/Intermediate/Advanced), multi-turn, resumable after reload, separate evaluator, results page, history, improvement chart
- [x] 8 missions with rubric, AI feedback, score, status, attempts
- [x] Readiness dashboard (7 dimensions, provisional flag, snapshots over time)
- [x] Achievements from real actions
- [x] Supabase schema (11 tables), RLS, catalog seed generated from source; migrations + RLS verified on local PostgreSQL
- [x] Demo mode (`/demo`): Alex's labelled data, per-visitor isolation, automatic labelled fallback, scripted mode
- [x] Loading / empty / error + retry states everywhere AI or storage is involved
- [x] Unit tests (8), ESLint, typecheck, production build — all passing
- [x] Browser E2E (Playwright, production build): live local flow incl. reload persistence, demo flow, demo isolation, mobile layout

## Blockers / not verified here

- **No `OPENAI_API_KEY` in the build environment** → live AI responses were not exercised end-to-end. Error paths (503) and labelled fallbacks were tested. Verify with a key: assessment, offer improve, pricing coach, client turn, evaluation, mission feedback.
- **No Supabase project credentials** → account sign-up/login and `SupabaseRepository` were not tested against a real Supabase instance (SQL and RLS were tested on plain PostgreSQL with a stubbed `auth` schema).
- **Vercel not connected** in this environment → no deployment URL yet.

## Next steps before the demo

1. Create the Supabase project, run both migrations, put URL + anon key into Vercel.
2. Import the GitHub repo in Vercel, add env vars, deploy; check `/api/health`.
3. Run the judge walkthrough on the production URL with real AI (desktop + phone); then once with *Scripted mode*.
4. Sign up a test account, complete one simulation, log out/in → confirm data persisted.
5. Prepare the ≤10-slide pitch deck.

## Known limitations

- Rate limiting is in-memory per server instance (best effort on serverless).
- Offline samples are keyword heuristics, clearly labelled — not a substitute for AI evaluation.
- Demo data lives in browser storage (isolated per visitor); clearing site data resets it.
