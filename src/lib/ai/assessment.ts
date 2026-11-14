// AI module 1–2: Skill Assessment + Service Recommendations.
import { COMPETENCY_KEYS } from "../competencies";
import { AssessmentResultSchema, GOAL_LABEL, type AssessmentInput, type AssessmentResult } from "../schemas";
import { chatJSON } from "./openai";
import { COACH_RULES } from "./rules";

export const ASSESSMENT_PROMPT_VERSION = "assessment-v2";

const SYSTEM = `You are the Skills2Cash assessment coach. You analyse a structured skill questionnaire from a US adult (25–45) who wants to turn an existing skill into a service.
${COACH_RULES}

Return ONLY a JSON object with exactly this shape:
{
  "summary": string (2–4 sentences, based only on the answers),
  "facts_from_user": string[1..6]  (things the user actually stated; paraphrase, never add),
  "identified_skills": [{ "name": string, "level": 1-5, "basis": "self-reported" | "from-example", "commercial": boolean, "note": string }] (1..6),
  "strengths": string[1..4],
  "gaps": [{ "competency": one of ${JSON.stringify(COMPETENCY_KEYS)}, "note": string }] (1..4),
  "service_directions": [{
     "name": string, "target_customer": string, "problem_solved": string,
     "why_it_may_fit": string (cite the user's own answers),
     "assumptions_to_validate": string[1..5],
     "price_hypothesis": { "low": number, "high": number, "unit": string (e.g. "per project", "per month"), "basis": string (explain as an estimate from effort/scope, NOT market data) }
  }] (1..3, the first one is the recommended direction and should fit the available hours),
  "recommended_next_steps": string[1..4]
}
Use "from-example" only when the work example supports the level; otherwise "self-reported".`;

export async function runAssessment(input: AssessmentInput): Promise<AssessmentResult> {
  const user = `Questionnaire answers:
- Name: ${input.displayName}
- Main skill: ${input.skill} (self-rated level ${input.level}/5)
- Other skills: ${input.otherSkills || "—"}
- Tasks done well: ${input.tasksDoneWell}
- What people ask them for help with: ${input.helpRequests || "—"}
- Experience: ${input.experience}
- Example of work / project: ${input.workExample}
- Confidence selling this skill: ${input.confidence}/5
- Interests: ${input.interests || "—"}
- Hours available per week: ${input.hoursPerWeek}
- Preferred industries / customers: ${input.preferredIndustries || "—"}
- Goal: ${GOAL_LABEL[input.goal]}${input.goalNote ? ` (${input.goalNote})` : ""}
- Self-ratings (1–5): ${Object.entries(input.selfRatings)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ")}`;
  return chatJSON(
    AssessmentResultSchema,
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    { temperature: 0.4, maxTokens: 1600 },
  );
}
