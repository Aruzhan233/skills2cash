import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { billingConfigured, getStripe } from "@/lib/server/stripe";

export const runtime = "nodejs";

function statusFor(status: Stripe.Subscription.Status) {
  if (status === "active") return { plan: "pro", status: "active" } as const;
  if (status === "past_due" || status === "unpaid") return { plan: "free", status: "past_due" } as const;
  return { plan: "free", status: "canceled" } as const;
}

async function storeSubscription(subscription: Stripe.Subscription, userId?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase service role is not configured.");
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const owner = userId ?? subscription.metadata.user_id;
  if (!owner) throw new Error("Subscription has no associated user.");
  const access = statusFor(subscription.status);
  const { error } = await db.from("subscriptions").upsert({
    user_id: owner,
    plan: access.plan,
    status: access.status,
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    stripe_subscription_id: subscription.id,
    current_period_end: new Date((subscription.items.data[0]?.current_period_end ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) throw error;
}

export async function POST(req: Request) {
  if (!billingConfigured()) return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (subscriptionId) await storeSubscription(await stripe.subscriptions.retrieve(subscriptionId), session.client_reference_id ?? undefined);
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await storeSubscription(event.data.object);
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const subscription = invoice.parent?.type === "subscription_details" ? invoice.parent.subscription_details?.subscription : null;
      const subscriptionId = typeof subscription === "string" ? subscription : subscription?.id;
      if (subscriptionId) await storeSubscription(await stripe.subscriptions.retrieve(subscriptionId));
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[stripe-webhook]", e);
    return NextResponse.json({ error: "Subscription update failed." }, { status: 500 });
  }
}
