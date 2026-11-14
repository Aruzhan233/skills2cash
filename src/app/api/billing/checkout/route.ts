import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { billingConfigured, getStripe } from "@/lib/server/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!billingConfigured()) return NextResponse.json({ error: "Stripe billing is not configured on this server." }, { status: 503 });
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return NextResponse.json({ error: "Sign in to start a subscription." }, { status: 401 });
  const supabase = createClient(url, anon, { auth: { persistSession: false } });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Your session is invalid. Sign in again." }, { status: 401 });
  const stripe = getStripe();
  try {
    const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID!);
    if (!price.active || price.unit_amount !== 1900 || price.currency !== "usd" || price.recurring?.interval !== "month") {
      return NextResponse.json({ error: "STRIPE_PRICE_ID must be an active $19 USD monthly recurring TEST price." }, { status: 503 });
    }
    const origin = new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email,
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${origin}/pricing?checkout=complete`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[billing-checkout]", e);
    return NextResponse.json({ error: "Stripe could not create checkout. Check server configuration." }, { status: 502 });
  }
}
