import { runPricingCoach } from "@/lib/ai/pricing";
import { PricingCoachRequestSchema } from "@/lib/schemas";
import { handleAI } from "@/lib/server/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return handleAI(req, PricingCoachRequestSchema, runPricingCoach);
}
