// AI module 8: Assignment Evaluation.
import { ASSIGNMENT_BY_KEY } from "../assignments";
import type { AssignmentAIResult } from "../evaluation";
import { assignmentAIResultSchema, type AssignmentRequest } from "../schemas";
import { AIError, chatJSON } from "./openai";
import { COACH_RULES } from "./rules";

export const ASSIGNMENT_PROMPT_VERSION = "assignment-v2";

export async function runAssignmentEval(req: AssignmentRequest): Promise<AssignmentAIResult> {
  const def = ASSIGNMENT_BY_KEY[req.assignmentKey];
  if (!def) throw new AIError("invalid_output", "Unknown mission.", 400);
  const keys = def.criteria.map((c) => c.key) as [string, ...string[]];
  const system = `You are the Skills2Cash mission reviewer. Evaluate the learner's submission against the rubric. Be specific and kind, and quote short parts of the submission when useful.
${COACH_RULES}

Mission: ${def.title}
Instructions given to the learner: ${def.prompt}
Rubric (score each 1–5; 1 = missing, 3 = partly there, 5 = clearly and specifically done; use null only if the submission is off-topic for that criterion):
${def.criteria.map((c) => `- ${c.key} (${c.label}): ${c.description}`).join("\n")}

Return ONLY JSON:
{"criteria": { ${keys.map((k) => `"${k}": {"score": 1-5 | null, "comment": string}`).join(", ")} },
 "strengths": string[0..3], "improvements": string[1..3],
 "improved_example": string (a rewritten, better version of the submission that keeps the learner's own facts and does not invent achievements)}`;
  const user = `Learner's skill: ${req.context.skill}
Learner's service offer: ${req.context.offer ? `${req.context.offer.title} for ${req.context.offer.targetCustomer} at $${req.context.offer.priceAmount} ${req.context.offer.priceUnit}` : "not defined yet"}

Submission:
"""
${req.text}
"""`;
  return chatJSON(
    assignmentAIResultSchema(keys),
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.2, maxTokens: 1200 },
  ) as Promise<AssignmentAIResult>;
}
