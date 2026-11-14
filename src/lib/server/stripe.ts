import "server-only";
import Stripe from "stripe";

let stripe: Stripe | null = null;
export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID on the server.");
  if (!stripe) stripe = new Stripe(secret);
  return stripe;
}

export function billingConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") && process.env.STRIPE_PRICE_ID && process.env.STRIPE_WEBHOOK_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
