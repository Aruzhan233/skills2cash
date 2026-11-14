import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return NextResponse.json({ plan: "free", status: "free" });
  const db = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await db.from("subscriptions").select("plan,status,current_period_end").eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not load subscription status." }, { status: 500 });
  return NextResponse.json(data ?? { plan: "free", status: "free", current_period_end: null });
}
