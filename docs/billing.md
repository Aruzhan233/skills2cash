# Plans and billing (Stripe test mode)

> **Status: partially implemented.** Checkout and webhook processing exist, but they run in **Stripe test mode** only. Free-plan limits are enforced in Guest Mode only. Signed-in accounts can see their plan and usage, but their features are not yet restricted by plan.

## What exists

| Part | Where | Notes |
| --- | --- | --- |
| Plan comparison and upgrade button | [`src/components/plan-cards.tsx`](../src/components/plan-cards.tsx), `/pricing`, `/subscription` | Free and Pro ($19/month) |
| Guest Mode limits | [`src/components/workspace.tsx`](../src/components/workspace.tsx), [`guest-paywall.tsx`](../src/components/guest-paywall.tsx) | 1 assessment, 1 service offer and 1 simulation. Missions and Readiness are locked |
| Checkout | [`src/app/api/billing/checkout/route.ts`](../src/app/api/billing/checkout/route.ts) | Signed-in users only. Checks that the price is exactly USD $19/month |
| Webhook | [`src/app/api/billing/webhook/route.ts`](../src/app/api/billing/webhook/route.ts) | Checks the Stripe signature, then writes the subscription state with the service-role key (server only) |
| Plan status | [`src/app/api/billing/status/route.ts`](../src/app/api/billing/status/route.ts) | Read by the Subscription page |
| Subscriptions table | [`20261114000200_billing.sql`](../supabase/migrations/20261114000200_billing.sql) | The owner can read it. Clients have no write policies |

Pro access is recorded only after a signature-verified webhook. The app never marks a payment as successful on the client side.

## Setup

1. Apply `supabase/migrations/20261114000200_billing.sql`, and `20261114000300_grants.sql` if your project needs explicit Data API grants. RLS still controls which rows each user can access.
2. In Stripe **test mode**, create a recurring **USD $19 / month** Price.
3. Set these server-side variables (see [`.env.example`](../.env.example)):
   - `STRIPE_SECRET_KEY` (`sk_test_…`)
   - `STRIPE_PRICE_ID`
   - `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY`, which must never be exposed to the browser

   `STRIPE_PUBLISHABLE_KEY` is reserved for future Stripe.js use. Hosted Checkout currently redirects directly.
4. Add a webhook endpoint at `/api/billing/webhook` for these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Guests keep their browser data and must create an account, or sign in, before checkout.
