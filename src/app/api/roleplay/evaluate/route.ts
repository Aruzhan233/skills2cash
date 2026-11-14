import { runEvaluation } from "@/lib/ai/evaluator";
import { EvaluateRequestSchema } from "@/lib/schemas";
import { handleAI } from "@/lib/server/route";

export const runtime = "nodejs";

// Separate evaluator call: receives the transcript after End Session.
export async function POST(req: Request) {
  return handleAI(req, EvaluateRequestSchema, runEvaluation);
}
