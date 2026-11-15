"use client";

import { useEffect, useState } from "react";
import { PlanCards } from "@/components/plan-cards";
import { PlanUsage } from "@/components/plan-usage";
import { Notice, PageHeader } from "@/components/ui";

export default function SubscriptionPage() {
  // Stripe Checkout returns here with ?checkout=complete|cancelled.
  const [checkout, setCheckout] = useState<string | null>(null);
  useEffect(() => {
    setCheckout(new URLSearchParams(window.location.search).get("checkout"));
  }, []);
  return (
    <div>
      <PageHeader title="Subscription & billing" sub="Your Skills2Cash plan, usage and upgrade options. This is your account billing — to price your own services, use the Pricing Builder in the Service Builder." />
      {checkout === "complete" && (
        <Notice tone="good" className="mb-4">Checkout complete. Your plan updates as soon as Stripe confirms the payment — refresh this page in a moment if it still shows Free.</Notice>
      )}
      {checkout === "cancelled" && (
        <Notice tone="neutral" className="mb-4">Checkout was cancelled. You have not been charged and your plan is unchanged.</Notice>
      )}
      <PlanUsage showPlansLink={false} className="mb-8" />
      <PlanCards />
    </div>
  );
}
