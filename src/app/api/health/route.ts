import { NextResponse } from "next/server";
import { aiConfigured } from "@/lib/ai/openai";

export const dynamic = "force-dynamic";

/** Reports which integrations are configured (never their values). */
export async function GET() {
  return NextResponse.json({
    ai: aiConfigured(),
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });
}
