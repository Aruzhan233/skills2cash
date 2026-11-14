import { runAssessment } from "@/lib/ai/assessment";
import { AssessmentInputSchema } from "@/lib/schemas";
import { handleAI } from "@/lib/server/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return handleAI(req, AssessmentInputSchema, runAssessment);
}
