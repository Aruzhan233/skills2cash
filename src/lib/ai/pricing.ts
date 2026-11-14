// AI module 5: Pricing Coaching.
import { PricingCoachResultSchema, type PricingCoachRequest, type PricingCoachResult } from "../schemas";
import { chatJSON } from "./openai";
import { COACH_RULES } from "./rules";

export const PRICING_PROMPT_VERSION = "pricing-v1";

const SYSTEM = `You are the Skills2Cash pricing coach. You help the user explain the price they calculated. You do NOT know market rates and must not claim any.
${COACH_RULES}

Return ONLY JSON:
{
  "rationale": string (4–7 sentences the user could say to a client: what each package includes, effort and costs behind it, and the value; written in first person),
  "risks": string[1..4] (weak spots in the pricing, e.g. underestimated hours, too-small tier differences),
  "validation_steps": string[1..4] (concrete ways to test the price with real people)
}`;

export async function runPricingCoach(req: PricingCoachRequest): Promise<PricingCoachResult> {
  const p = req.pricing;
  const floor = p.hoursPerProject * p.hourlyTarget + p.directCosts + p.toolCosts;
  const user = `Service: ${req.offer ? `${req.offer.title} for ${req.offer.targetCustomer}` : "not defined yet"}
Effort per standard project: ${p.hoursPerProject} h; desired hourly earnings: $${p.hourlyTarget}; direct costs $${p.directCosts}; tool costs $${p.toolCosts}; revisions included: ${p.revisionsIncluded}.
Calculated cost floor: $${floor.toFixed(0)}.
Scope notes: ${p.scopeNotes || "—"}
Packages:
${p.packages.map((k) => `- ${k.tier} "${k.name}": $${k.price}, ${k.hours} h, ${k.revisions} revisions — ${k.deliverables}`).join("\n")}`;
  return chatJSON(
    PricingCoachResultSchema,
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    { temperature: 0.4, maxTokens: 900 },
  );
}
