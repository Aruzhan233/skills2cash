import { runAssignmentEval } from "@/lib/ai/assignment";
import { AssignmentRequestSchema } from "@/lib/schemas";
import { handleAI } from "@/lib/server/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return handleAI(req, AssignmentRequestSchema, runAssignmentEval);
}
