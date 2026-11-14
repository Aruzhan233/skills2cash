# Development status

_Last updated: 2026-11-14_

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
