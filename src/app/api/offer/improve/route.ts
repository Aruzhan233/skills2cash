import { runOfferImprove } from "@/lib/ai/offer";
import { OfferImproveRequestSchema } from "@/lib/schemas";
import { handleAI } from "@/lib/server/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return handleAI(req, OfferImproveRequestSchema, runOfferImprove);
}
