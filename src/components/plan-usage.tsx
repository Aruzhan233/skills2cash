"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWorkspace } from "./workspace";
import { Card, CardTitle, Progress } from "./ui";
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
        <ul className="grid gap-5 sm:grid-cols-3">
          {[
            { label: "Skill assessments", used: usage.assessments_used },
            { label: "Service offers", used: usage.offers_created },
            { label: "AI simulations", used: Math.min(usage.simulations_completed, 1) },
          ].map((u) => (
            <li key={u.label}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-ink-2">{u.label}</span>
                <span className={u.used >= 1 ? "font-medium text-warn" : "font-medium text-ink"}>{u.used} of 1</span>
              </div>
              <Progress value={Math.min(u.used, 1) * 100} tone={u.used >= 1 ? "muted" : "violet"} className="mt-2" label={`${u.label} used`} />
              {u.used >= 1 && <p className="mt-1.5 text-xs text-muted">Free limit reached</p>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
