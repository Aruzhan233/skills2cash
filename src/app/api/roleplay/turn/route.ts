import { runClientTurn } from "@/lib/ai/client";
import { MAX_USER_TURNS } from "@/lib/config";
import { ClientTurnRequestSchema } from "@/lib/schemas";
import { handleAI } from "@/lib/server/route";

export const runtime = "nodejs";

// Customer roleplay: persona-only context, no rubric.
export async function POST(req: Request) {
  return handleAI(
    req,
    ClientTurnRequestSchema.refine((r) => r.messages.filter((m) => m.role === "user").length <= MAX_USER_TURNS, {
      message: `A session can have at most ${MAX_USER_TURNS} of your messages.`,
    }),
    runClientTurn,
  );
}
