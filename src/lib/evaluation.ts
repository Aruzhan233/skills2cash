import { ASSIGNMENT_BY_KEY, type AssignmentDef } from "./assignments";
import { MIN_USER_TURNS_FOR_CONFIDENCE, SCORING_FORMULA_VERSION } from "./config";
import { ROLEPLAY_RUBRIC } from "./rubric";
import { DIFFICULTY_ORDER, SCENARIO_BY_KEY, SCENARIOS } from "./scenarios";
import type { ChatMessage, EvaluationAI, RubricKey } from "./schemas";
import { RUBRIC_KEYS } from "./schemas";
import { computeOverall, filterVerifiedQuotes, levelToPercent, scoreBand } from "./scoring";
import type {
  AssignmentFeedback,
  DimensionResult,
  Evaluation,
  Generator,
  NextPractice,
} from "./types";

type Recommendation = { kind: "scenario" | "assignment"; key: string };

const RECOMMENDATION_BY_DIMENSION: Record<RubricKey, Recommendation> = {
  discovery: { kind: "scenario", key: "not-sure" },
  value_proposition: { kind: "assignment", key: "pitch" },
  clarity: { kind: "assignment", key: "offer-sentence" },
  pricing_rationale: { kind: "assignment", key: "pricing-packages" },
  objection_handling: { kind: "scenario", key: "cheaper-freelancer" },
  negotiation: { kind: "scenario", key: "discount" },
  professional_communication: { kind: "scenario", key: "free-extras" },
  next_step: { kind: "scenario", key: "not-sure" },
};

function titleOf(rec: Recommendation): string {
  if (rec.kind === "assignment") return ASSIGNMENT_BY_KEY[rec.key]?.title ?? rec.key;
  return SCENARIO_BY_KEY[rec.key]?.title ?? rec.key;
}

/** Deterministic next exercise from the weakest scored dimension and the score band. */
export function pickNextPractice(
  dimensions: Record<RubricKey, DimensionResult>,
  overall: number | null,
  currentScenarioKey: string,
): NextPractice {
  if (overall === null) {
    return {
      kind: "scenario",
      key: currentScenarioKey,
      title: SCENARIO_BY_KEY[currentScenarioKey]?.title ?? "Repeat this scenario",
      reason: "Not enough evidence was collected. Repeat the scenario with a longer conversation.",
    };
  }

  const band = scoreBand(overall);
  if (band === "advance") {
    const current = SCENARIO_BY_KEY[currentScenarioKey];
    const currentLevel = current ? DIFFICULTY_ORDER[current.difficulty] : 0;
    const harder =
      SCENARIOS.find((s) => s.key !== currentScenarioKey && DIFFICULTY_ORDER[s.difficulty] > currentLevel) ??
      SCENARIOS.find((s) => s.key !== currentScenarioKey);
    if (harder) {
      return {
        kind: "scenario",
        key: harder.key,
        title: harder.title,
        reason: `Score ${overall}/100 is in the “advance” band (80+). Move on to a ${harder.difficulty.toLowerCase()} scenario.`,
      };
    }
  }

  let weakest: RubricKey | null = null;
  for (const key of RUBRIC_KEYS) {
    const s = dimensions[key].score;
    if (s === null) continue;
    if (weakest === null || s < (dimensions[weakest].score ?? 6)) weakest = key;
  }
  const dimKey: RubricKey = weakest ?? "objection_handling";
  let rec = RECOMMENDATION_BY_DIMENSION[dimKey];
  // Do not recommend the identical scenario for targeted practice; pick a sibling.
  if (rec.kind === "scenario" && rec.key === currentScenarioKey && band === "targeted") {
    const sibling = SCENARIOS.find((s) => s.key !== currentScenarioKey && s.focusDimensions.includes(dimKey));
    if (sibling) rec = { kind: "scenario", key: sibling.key };
  }
  const label = ROLEPLAY_RUBRIC.find((d) => d.key === dimKey)?.label ?? dimKey;
  const bandText =
    band === "remedial"
      ? `Score ${overall}/100 is below 60, so the next step is remedial practice`
      : `Score ${overall}/100 is in the 60–79 band, so the next step is targeted practice`;
  return {
    kind: rec.kind,
    key: rec.key,
    title: titleOf(rec),
    reason: `${bandText} on your weakest area: ${label}.`,
  };
}

/** Converts validated evaluator output into a stored Evaluation with a deterministic score. */
export function buildEvaluation(
  ai: EvaluationAI,
  messages: ChatMessage[],
  scenarioKey: string,
  generatedBy: Generator,
): Evaluation {
  const userTexts = messages.filter((m) => m.role === "user").map((m) => m.content);
  const dimensions = {} as Record<RubricKey, DimensionResult>;
  for (const key of RUBRIC_KEYS) {
    const d = ai.dimensions[key];
    const evidence = filterVerifiedQuotes(d.evidence, userTexts).slice(0, 2);
    dimensions[key] = { score: d.score, evidence, comment: d.comment };
  }
  const { overall, scored, total, lowCoverage } = computeOverall(
    RUBRIC_KEYS.map((k) => dimensions[k].score),
  );
  const reasons: string[] = [];
  if (userTexts.length < MIN_USER_TURNS_FOR_CONFIDENCE) {
    reasons.push(
      `Only ${userTexts.length} of your message${userTexts.length === 1 ? "" : "s"} (at least ${MIN_USER_TURNS_FOR_CONFIDENCE} recommended).`,
    );
  }
  if (lowCoverage) reasons.push(`Only ${scored} of ${total} criteria had enough evidence to score.`);

  return {
    dimensions,
    strengths: ai.strengths,
    mistakes: ai.mistakes,
    improvements: ai.improvements,
    overallScore: overall,
    scoredCount: scored,
    totalCount: total,
    userTurns: userTexts.length,
    lowConfidence: reasons.length > 0,
    lowConfidenceReasons: reasons,
    nextPractice: pickNextPractice(dimensions, overall, scenarioKey),
    generatedBy,
    formulaVersion: SCORING_FORMULA_VERSION,
  };
}

export interface AssignmentAIResult {
  criteria: Record<string, { score: number | null; comment: string }>;
  strengths: string[];
  improvements: string[];
  improved_example: string;
}

export function buildAssignmentFeedback(
  def: AssignmentDef,
  ai: AssignmentAIResult,
  generatedBy: Generator,
): AssignmentFeedback {
  const criteria: AssignmentFeedback["criteria"] = {};
  for (const c of def.criteria) {
    const r = ai.criteria[c.key];
    criteria[c.key] = { score: r?.score ?? null, comment: r?.comment ?? "Not evaluated." };
  }
  const { overall, scored, total, lowCoverage } = computeOverall(
    def.criteria.map((c) => criteria[c.key].score),
  );
  return {
    criteria,
    strengths: ai.strengths,
    improvements: ai.improvements,
    improvedExample: ai.improved_example,
    overallScore: overall,
    scoredCount: scored,
    totalCount: total,
    lowConfidence: lowCoverage,
    generatedBy,
    formulaVersion: SCORING_FORMULA_VERSION,
  };
}

export { levelToPercent };
