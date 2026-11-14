import assert from "node:assert/strict";
import { test } from "node:test";
import { ASSIGNMENTS } from "../src/lib/assignments";
import { buildAssignmentFeedback, buildEvaluation } from "../src/lib/evaluation";
import { buildDemoState, DEMO_OFFER_INPUT } from "../src/lib/demo";
import { sampleAssessment, sampleAssignmentEval, sampleEvaluation, scriptedClientTurn } from "../src/lib/fallback";
import { achievements, competencyScores, computeReadiness, recommendNext, stageProgress } from "../src/lib/progress";
import { SCENARIOS } from "../src/lib/scenarios";
import {
  AssessmentInputSchema,
  AssessmentResultSchema,
  EvaluationAISchema,
  RUBRIC_KEYS,
  ServiceOfferInputSchema,
  assignmentAIResultSchema,
} from "../src/lib/schemas";
import { computeOverall, filterVerifiedQuotes, levelToPercent, scoreBand } from "../src/lib/scoring";
import { EMPTY_STATE } from "../src/lib/types";

test("levelToPercent maps 1..5 to 0..100", () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(levelToPercent), [0, 25, 50, 75, 100]);
});

test("computeOverall excludes null criteria and is deterministic", () => {
  assert.deepEqual(computeOverall([5, 3, null, 1]), { overall: 50, scored: 3, total: 4, lowCoverage: false });
  assert.deepEqual(computeOverall([null, null]), { overall: null, scored: 0, total: 2, lowCoverage: true });
  assert.equal(computeOverall([4, null, null, null]).lowCoverage, true);
});

test("score bands follow configured thresholds", () => {
  assert.equal(scoreBand(59), "remedial");
  assert.equal(scoreBand(60), "targeted");
  assert.equal(scoreBand(79), "targeted");
  assert.equal(scoreBand(80), "advance");
});

test("evidence quotes must appear in the user's own messages", () => {
  const q = filterVerifiedQuotes(["I can send a sample", "invented quote"], ["Sure — I can send a sample by Friday."]);
  assert.deepEqual(q, ["I can send a sample"]);
});

test("buildEvaluation flags low confidence for short conversations", () => {
  const ai = EvaluationAISchema.parse({
    dimensions: Object.fromEntries(RUBRIC_KEYS.map((k) => [k, { score: 4, evidence: ["fake"], comment: "ok" }])),
    strengths: [],
    improvements: [{ text: "Ask more questions", example: "" }],
  });
  const ev = buildEvaluation(ai, [{ role: "client", content: "hi" }, { role: "user", content: "hello there" }], "cheaper-freelancer", "ai");
  assert.equal(ev.overallScore, 75);
  assert.equal(ev.lowConfidence, true);
  assert.equal(ev.dimensions.discovery.evidence.length, 0, "unverifiable quotes are dropped");
  assert.ok(ev.nextPractice.title.length > 0);
});

test("demo dataset is valid and produces progress", () => {
  const s = buildDemoState();
  assert.ok(AssessmentInputSchema.safeParse(s.profile!.assessment).success);
  assert.ok(AssessmentResultSchema.safeParse(s.profile!.result).success);
  assert.ok(ServiceOfferInputSchema.safeParse(DEMO_OFFER_INPUT).success);
  const r = computeReadiness(s);
  assert.ok(r.overall !== null && r.overall > 0 && r.overall < 100);
  assert.equal(s.snapshots.length, 1);
  const earned = achievements(s).filter((a) => a.earned).map((a) => a.key);
  assert.ok(earned.includes("assessment") && earned.includes("first-offer") && earned.includes("first-simulation"));
  assert.ok(!earned.includes("launch-ready"));
  const scores = competencyScores(s);
  assert.equal(scores.find((c) => c.key === "negotiation")?.source, "demonstrated");
  assert.equal(stageProgress(s).length, 5);
});

test("recommendation: no profile → assessment; weak demonstrated score → remedial", () => {
  assert.equal(recommendNext(EMPTY_STATE).href, "/onboarding");
  const s = buildDemoState();
  const rec = recommendNext(s);
  assert.match(rec.reason, /below 60|requirement/);
});

test("offline fallbacks produce schema-valid output", () => {
  const input = buildDemoState().profile!.assessment;
  assert.ok(AssessmentResultSchema.safeParse(sampleAssessment(input)).success);
  for (const sc of SCENARIOS) {
    const turn = scriptedClientTurn({ scenarioKey: sc.key, offer: DEMO_OFFER_INPUT, messages: [{ role: "client", content: "hi" }, { role: "user", content: "hello" }] });
    assert.ok(turn.reply.length > 0);
  }
  const ev = sampleEvaluation({
    scenarioKey: "cheaper-freelancer",
    offer: DEMO_OFFER_INPUT,
    messages: [
      { role: "client", content: "Why should I pay more?" },
      { role: "user", content: "That makes sense. What matters most to you — price or getting all 10 on time?" },
      { role: "user", content: "If budget is tight, a 5-Reel starter package could be a good option. Shall I send a sample by Friday?" },
    ],
  });
  assert.ok(EvaluationAISchema.safeParse(ev).success);
  assert.ok((ev.dimensions.negotiation.score ?? 0) >= 2);
  for (const a of ASSIGNMENTS) {
    const r = sampleAssignmentEval({ assignmentKey: a.key, text: a.placeholder + " some extra words to test", context: { skill: "x", offer: null } });
    const schema = assignmentAIResultSchema(a.criteria.map((c) => c.key) as [string, ...string[]]);
    assert.ok(schema.safeParse(r).success, a.key);
    const fb = buildAssignmentFeedback(a, r, "sample");
    assert.equal(fb.totalCount, a.criteria.length);
  }
});
