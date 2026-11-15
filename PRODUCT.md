# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

US adults aged 25–45 who already have a skill (video editing, Excel and reporting, operations, design and similar) but have never sold it as a service. They typically work full-time, have a few hours a week, and are unsure what exactly to offer, who would pay, how much to charge and how to handle a sales conversation. *(Confirmed by the owner, 2026-11-15.)*

## Product Purpose

Skills2Cash is an AI-powered, practice-based learning platform that takes a person from "I have a skill" to "I have a defined, priced service and I have rehearsed selling it". Success for a user is demonstrated readiness: a saved service offer, pricing packages, completed missions and scored sales simulations — not content consumed.

## Positioning

A single guided journey from skill to first paying client, with sales practice against realistic AI clients at its centre. It is neither a course library nor a marketplace: the user builds their own service inside the product and rehearses the real conversation, receiving rubric-based scores with quotes from their own messages. *(Owner confirmed both halves: the step-by-step journey and the AI client practice.)*

## Operating Context

The journey as implemented in the app:

1. **My Skills** — skill assessment (`/onboarding`) and Skill Profile (`/profile/skills`).
2. **Learning Path** — five stages: Discover, Build, Price, Practice, Launch (`/path`).
3. **Service Builder** — the offer (`/service-builder`) and the Pricing Builder (`/service-builder/pricing`).
4. **Practice** — AI Client Simulator with seven scenarios and evaluated sessions (`/practice`).
5. **Missions** — eight AI-evaluated skill missions (`/assignments`) and personalised weekly missions (`/assignments/weekly`).
6. **Readiness** — Monetization Readiness score across seven dimensions (`/readiness`).

Around the journey: Home dashboard (`/dashboard`), Progress tracker with achievements, XP and levels (`/progress`), and account billing (`/subscription`, Free and Pro at $19/month via Stripe).

Users work in three modes: signed-in (Supabase), guest (browser storage, limited free usage) and a pre-filled demo workspace ("Alex").

## Capabilities and Constraints

- **Stack:** Next.js 15 (App Router), React 19, Tailwind CSS 4, Supabase (auth and Postgres with Row Level Security), Stripe, Google GenAI. Charts use Recharts; icons use lucide-react.
- **Terminology in the UI:** Skill Profile, Service Builder, Pricing Builder, AI Client Simulator, Missions, Weekly missions, Readiness, XP, Level.
- **Two different "pricing" concepts must never be mixed:** the Pricing Builder prices the *user's own service*; Subscription is the *platform's* billing.
- **Existing product behaviour (from the codebase and README):** the product makes no income promises; prices are labelled as hypotheses to validate; readiness is described as a learning indicator, not an income prediction; AI-generated content and offline samples are labelled as such; the product never contacts anyone on the user's behalf. The owner did not select this as a binding commitment during init, so treat it as current product behaviour and confirm before changing it.
- **Progress is always derived from real activity.** No hardcoded percentages, scores or achievements.
- **Undecided:** whether the audience will expand beyond the US.

## Brand Commitments

Confirmed as binding by the owner:

- **Official logo** — `public/brand/skills2cash-logo.png` (transparent) and `public/brand/skills2cash-logo-original.jpg` (source). Used as is: no recolouring, distortion or replacement.
- **Dark theme with a violet accent** remains the basis of the visual identity.
- **English interface.**

Name: Skills2Cash, written as one word with the "2" accented.

## Evidence on Hand

- Product spec: `PROJECT_DOCUMENTATION.md`; build status: `DEVELOPMENT_STATUS.md`; overview: `README.md`.
- Reference image for the Skill Profile screen: `docs/skill-profile-reference.jpg`.
- A complete demo dataset (`src/lib/demo.ts`) with a sample profile, offer, pricing, missions and a scored simulation.
- There are **no** real testimonials, customer logos, usage numbers, press or case studies. Future work must not invent them.

## Product Principles

1. **One connected journey, not a set of tools.** Every screen should make clear where the user is and what comes next.
2. **Practice over content.** The product's value is what the user does and demonstrates.
3. **Evidence before claims.** Scores, progress and rewards come only from real activity.
4. **Guide, do not gate.** Recommend the next step; keep every stage reachable.
5. **The next action comes first.** The most useful next step is always the most prominent thing on the page.
