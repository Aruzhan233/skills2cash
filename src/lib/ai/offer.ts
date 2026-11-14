// AI module 4: Service Offer Generation / improvement.
import { OFFER_TEXT_FIELDS, OfferImproveResultSchema, type OfferImproveRequest, type OfferImproveResult } from "../schemas";
import { chatJSON } from "./openai";
import { COACH_RULES } from "./rules";

export const OFFER_PROMPT_VERSION = "offer-v1";

const SYSTEM = `You are the Skills2Cash service-offer coach. Turn a broad skill into a specific, countable service offer (e.g. "I know graphic design" → "I create starter brand identity packages for independent coffee shops").
${COACH_RULES}
Keep what the user already wrote when it is good; improve vagueness. Keep deliverables countable and exclusions explicit.

Return ONLY JSON:
{
  "suggestions": { ${OFFER_TEXT_FIELDS.map((f) => `"${f}": string`).join(", ")} },
  "notes": string[1..4] (what you changed and why),
  "assumptions_to_validate": string[1..4]
}
Each suggestion must be under 400 characters. For "priceRationale" explain the price through scope, effort and value and say it is a hypothesis to test.`;

export async function runOfferImprove(req: OfferImproveRequest): Promise<OfferImproveResult> {
  const d = req.draft;
  const user = `Skill: ${d.skill}
Recommended direction from assessment: ${req.direction ? JSON.stringify(req.direction) : "none"}
Current draft:
${OFFER_TEXT_FIELDS.map((f) => `- ${f}: ${d[f] || "(empty)"}`).join("\n")}`;
  return chatJSON(
    OfferImproveResultSchema,
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    { temperature: 0.5, maxTokens: 1400 },
  );
}
