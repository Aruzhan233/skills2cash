// AI module 7: Conversation Evaluation. Runs as a separate server call after
// the session ends; the customer persona prompt never sees this rubric.
import { ROLEPLAY_RUBRIC } from "../rubric";
import { SCENARIO_BY_KEY } from "../scenarios";
import { EvaluationAISchema, RUBRIC_KEYS, type ClientTurnRequest, type EvaluationAI } from "../schemas";
import { AIError, chatJSON } from "./openai";

export const EVALUATOR_PROMPT_VERSION = "evaluator-v2";

export async function runEvaluation(req: ClientTurnRequest): Promise<EvaluationAI> {
  const scenario = SCENARIO_BY_KEY[req.scenarioKey];
  if (!scenario) throw new AIError("invalid_output", "Unknown scenario.", 400);
  const rubric = ROLEPLAY_RUBRIC.map(
    (d) => `- ${d.key} (${d.label}): ${d.question}\n    1 = ${d.anchors[1]}\n    3 = ${d.anchors[3]}\n    5 = ${d.anchors[5]}`,
  ).join("\n");
  const system = `You are an impartial sales-communication evaluator for Skills2Cash. You assess ONLY the SELLER's observable behaviour in a practice conversation with a simulated customer. Do not score personality traits.

Scenario: ${scenario.title}. Seller's goal: ${scenario.goal}

Rubric (score each 1–5; use null when the seller's messages contain no evidence for that criterion):
${rubric}

Evidence rules: each "evidence" item must be an EXACT quote copied from the SELLER's messages (max 2 per criterion). Never quote the customer. Do not invent quotes.

Return ONLY JSON:
{
  "dimensions": { ${RUBRIC_KEYS.map((k) => `"${k}": {"score": 1-5 | null, "evidence": string[], "comment": string}`).join(", ")} },
  "strengths": string[0..3] (what the seller did well, referring to specific messages),
  "mistakes": string[0..3] (specific missteps),
  "improvements": [{"text": string, "example": string (a better line the seller could have said)}] (1..3)
}`;
  const transcript = req.messages
    .map((m, i) => `${i + 1}. ${m.role === "user" ? "SELLER" : "CUSTOMER"}: ${m.content}`)
    .join("\n");
  return chatJSON(
    EvaluationAISchema,
    [
      { role: "system", content: system },
      {
        role: "user",
        content: `Service: ${req.offer.title} at $${req.offer.priceAmount} ${req.offer.priceUnit}.\n\nTranscript:\n${transcript}`,
      },
    ],
    { temperature: 0.1, maxTokens: 1600 },
  );
}
