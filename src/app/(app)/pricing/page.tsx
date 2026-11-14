import { redirect } from "next/navigation";

// Legacy URL. The Pricing Builder now lives inside the Service Builder and
// subscription plans live on the Subscription page; old Stripe return links
// (?checkout=…) are forwarded to Subscription.
export default async function LegacyPricingPage({ searchParams }: { searchParams: Promise<{ checkout?: string | string[] }> }) {
  const { checkout } = await searchParams;
  const value = Array.isArray(checkout) ? checkout[0] : checkout;
  if (value) redirect(`/subscription?checkout=${encodeURIComponent(value)}`);
  redirect("/service-builder/pricing");
}
