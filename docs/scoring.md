# Scoring, readiness and achievements

How Skills2Cash turns evidence into scores. Everything on this page is deterministic code, not an AI call, so results are transparent and reproducible. The rules live in [`src/lib/scoring.ts`](../src/lib/scoring.ts), [`src/lib/evaluation.ts`](../src/lib/evaluation.ts) and [`src/lib/progress.ts`](../src/lib/progress.ts). All thresholds live in [`src/lib/config.ts`](../src/lib/config.ts). They are initial product settings, not validated cut-offs.

## Formulas

1. **Criterion → percent.** The AI scores each rubric criterion from 1 to 5, or `null` when there isn't enough evidence. `percent = (score − 1) / 4 × 100`, so 1 → 0, 2 → 25, 3 → 50, 4 → 75 and 5 → 100.
2. **Overall score (simulation or mission).** `round(mean(percent of scored criteria))`.
   - `null` criteria are excluded, not counted as zero.
   - If nothing is scored, the result is "Not enough data".
   - Confidence is flagged as low when fewer than 60% of criteria are scored, or when a simulation has fewer than 3 user messages.
3. **Evidence quotes.** A quote returned by the evaluator is kept only if it appears verbatim (after normalisation) in the user's own messages.
4. **Self-reported competency** = `(rating − 1) × 25`, from the assessment.
5. **Demonstrated competency** = the mean percent of all evidence items mapped to that competency.
   - It uses the latest attempt of each mission and the 3 most recent completed simulations.
   - The score shown is the demonstrated one when it exists, otherwise the self-reported one, and it's always labelled.
6. **Readiness** has 7 dimensions.
   - Each dimension is the mean of demonstrated evidence for the competencies it covers. For example, *Objection handling & negotiation* = objection_handling + negotiation.
   - Overall readiness is the mean of the dimensions that have evidence. It's marked *provisional* when fewer than 4 dimensions have evidence.
   - Self-reported ratings are never included.
   - A snapshot is stored whenever the result changes.
7. **Bands and the adaptive path.** The bands are `< 60` remedial, `60–79` targeted and `≥ 80` advance. The next recommendation is picked in this order:
   1. No assessment yet → the assessment.
   2. Any demonstrated competency `< 60` → remedial activity for the weakest one.
   3. The next unmet stage requirement.
   4. The weakest competency `< 80` → targeted practice.
   5. Otherwise, a harder scenario not yet passed.

   A mission or simulation counts as passed at `≥ 60`.
8. **Achievements** are awarded only from stored actions, for example:
   - an assessment is saved
   - an offer is saved
   - a mission scores ≥ 60
   - a pricing worksheet is saved and Mission 4 scores ≥ 60
   - a simulation is completed
   - objection handling scores ≥ 4/5
   - a previous score on the same scenario is beaten
   - all missions score ≥ 60
   - readiness reaches ≥ 70 and is not provisional

## XP and levels

- **Ledger:** XP is a record of individual awards (`xp_transactions`), never a counter that is edited.
- **Total and level:** the total XP and the level are calculated from that record ([`src/lib/retention.ts`](../src/lib/retention.ts)).
- **Sources:** XP comes only from achievements and completed weekly missions. A unique key per user, source and reference stops the same reward being paid twice.

## Separation of AI roles

- **AI client:** the prompt in [`src/lib/ai/client.ts`](../src/lib/ai/client.ts) contains only the persona, budget, objection and hidden priorities. The client is instructed never to coach or mention scores.
- **Evaluator:** the rubric lives only in [`src/lib/ai/evaluator.ts`](../src/lib/ai/evaluator.ts). It runs as a separate request after **End Session**.
