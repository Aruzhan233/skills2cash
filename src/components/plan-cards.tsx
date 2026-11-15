"use client";

import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { usePlan } from "./plan-usage";
import { Badge, Button, Card, CardTitle } from "./ui";
import { useWorkspace } from "./workspace";

const FREE_FEATURES = ["1 skill assessment", "1 service offer", "1 simulation", "Basic access"];
const PRO_FEATURES = ["All 7 scenarios", "All missions", "Full Readiness", "Extended recommendations", "Unlimited product access"];

const COMPARISON: Array<{ feature: string; free: string | false; pro: string }> = [
  { feature: "Skill assessments", free: "1", pro: "Unlimited" },
  { feature: "Service offers", free: "1", pro: "Unlimited" },
  { feature: "AI client simulations", free: "1", pro: "All 7 scenarios" },
  { feature: "Real-world missions", free: false, pro: "All missions" },
  { feature: "Readiness dashboard", free: false, pro: "Full Readiness" },
  { feature: "Recommendations", free: "Basic", pro: "Extended" },
];

/** Skills2Cash subscription plans (platform billing — unrelated to the Pricing Builder). */
export function PlanCards() {
  const ws = useWorkspace();
  const { plan } = usePlan();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upgrade() {
    if (ws.guest || ws.auth.status !== "signed_in") {
      window.location.assign("/signup?next=%2Fsubscription");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { getSupabase } = await import("@/lib/client/supabase");
      const { data } = await getSupabase()?.auth.getSession() ?? { data: { session: null } };
      const token = data.session?.access_token;
      if (!token) throw new Error("Please sign in again to continue to checkout.");
      const res = await fetch("/api/billing/checkout", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error || "Checkout could not be started.");
      window.location.assign(json.url);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  const pro = plan === "pro";
  return (
    <section aria-labelledby="plans-heading">
      <h2 id="plans-heading" className="text-lg font-semibold text-ink">Plans</h2>
      <p className="mb-4 mt-1 text-sm text-muted">Start with the free plan. Upgrade when you need the full Skills2Cash journey.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-ink">Free</h3>
            {!pro && <Badge tone="good">Current plan</Badge>}
          </div>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-ink">$0<span className="text-sm font-normal text-muted"> / month</span></p>
          <ul className="my-5 space-y-2 text-sm text-ink-2">{FREE_FEATURES.map((x) => <li key={x} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-good" aria-hidden />{x}</li>)}</ul>
          <Button variant="secondary" disabled className="mt-auto w-full">{pro ? "Included in Pro" : "Your current plan"}</Button>
        </Card>
        <Card className="glass-lit flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <h3 className="relative text-base font-semibold text-ink">Pro</h3>
            {pro && <Badge tone="good">Current plan</Badge>}
          </div>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-ink"><span className="relative">$19</span><span className="text-sm font-normal text-muted"> / month</span></p>
          <ul className="my-5 space-y-2 text-sm text-ink-2">{PRO_FEATURES.map((x) => <li key={x} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-white" aria-hidden />{x}</li>)}</ul>
          {pro ? (
            <Button variant="secondary" disabled className="mt-auto w-full">Your current plan</Button>
          ) : (
            <Button className="mt-auto w-full" onClick={upgrade} loading={busy}>{busy ? "Opening checkout…" : "Upgrade to Pro"}</Button>
          )}
          {ws.guest && <p className="mt-2 text-xs text-muted">Create an account first. Your guest progress stays in this browser.</p>}
          {error && <p role="alert" className="mt-2 text-sm text-bad">{error}</p>}
        </Card>
      </div>

      <Card className="mt-4">
        <CardTitle sub="What each plan includes">Feature comparison</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-sm text-muted">
                <th scope="col" className="py-2 pr-4 font-medium">Feature</th>
                <th scope="col" className="py-2 pr-4 font-medium">Free</th>
                <th scope="col" className="py-2 font-medium text-ink">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {COMPARISON.map((r) => (
                <tr key={r.feature}>
                  <th scope="row" className="py-2.5 pr-4 font-normal text-ink">{r.feature}</th>
                  <td className="py-2.5 pr-4 text-ink-2">{r.free === false ? <Minus className="h-4 w-4 text-muted" aria-label="Not included" /> : r.free}</td>
                  <td className="py-2.5 text-ink">{r.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
