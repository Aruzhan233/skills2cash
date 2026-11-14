"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWorkspace } from "./workspace";
import { Card, CardTitle } from "./ui";
import { getSupabase } from "@/lib/client/supabase";
import { completedSessions } from "@/lib/progress";

/** Current subscription plan, read from the owner-readable Supabase `subscriptions` table. */
export function usePlan(): { plan: "free" | "pro"; subscriptionStatus: string } {
  const ws = useWorkspace();
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [subscriptionStatus, setSubscriptionStatus] = useState("free");
  useEffect(() => {
    if (ws.auth.status !== "signed_in") return;
    let alive = true;
    void (async () => {
      const { data } = await getSupabase()?.from("subscriptions").select("plan,status").maybeSingle() ?? { data: null };
      if (!alive || !data) return;
      const active = data.status === "active" && data.plan === "pro";
      setPlan(active ? "pro" : "free");
      setSubscriptionStatus(String(data.status));
    })();
    return () => { alive = false; };
  }, [ws.auth.status]);
  return { plan: ws.guest ? "free" : plan, subscriptionStatus };
}

export function PlanUsage({ showPlansLink = true, className = "mt-4" }: { showPlansLink?: boolean; className?: string }) {
  const ws = useWorkspace();
  const { plan: actualPlan, subscriptionStatus } = usePlan();
  const usage = ws.guest ? ws.guestUsage : {
    assessments_used: ws.state.profile ? 1 : 0,
    offers_created: ws.state.offer ? 1 : 0,
    simulations_completed: completedSessions(ws.state.sessions).length,
  };
  return (
    <Card className={className}>
      <CardTitle
        sub={actualPlan === "pro" ? `Subscription status: ${subscriptionStatus}` : "Your Free plan usage"}
        right={showPlansLink ? <Link href="/subscription" className="text-sm text-violet-soft hover:underline">View plans</Link> : undefined}
      >
        Current plan: {actualPlan === "pro" ? "Pro" : "Free"}
      </CardTitle>
      {actualPlan === "pro" ? <p className="text-sm text-ink-2">Unlimited assessments, offers, scenarios and missions.</p> : (
        <div className="grid gap-2 text-sm text-ink-2 sm:grid-cols-3">
          <p>Assessments: {usage.assessments_used}/1</p><p>Offers: {usage.offers_created}/1</p><p>Simulations: {Math.min(usage.simulations_completed, 1)}/1</p>
        </div>
      )}
    </Card>
  );
}
