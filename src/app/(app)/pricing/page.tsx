"use client";

import { useState } from "react";
import { Calculator, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { RequireProfile } from "@/components/require-profile";
import { Badge, Button, Card, CardTitle, ErrorState, Field, GeneratedBadge, Input, LinkButton, Notice, PageHeader, Spinner, Textarea } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { ApiError, callAI, offlineAI } from "@/lib/client/ai";
import { formatDateTime } from "@/lib/cn";
import { newId } from "@/lib/id";
import { PricingInputSchema, TIERS, type PricePackage, type PricingCoachResult, type PricingInput } from "@/lib/schemas";
import type { Generator, PricingWorksheet } from "@/lib/types";

const TIER_LABEL = { basic: "Basic", standard: "Standard", premium: "Premium" } as const;
const MULT = { basic: 0.55, standard: 1, premium: 1.7 } as const;

function round5(n: number) {
  return Math.max(5, Math.round(n / 5) * 5);
}

function defaults(ws: ReturnType<typeof useWorkspace>): PricingInput {
  const existing = ws.state.pricing;
  if (existing) {
    const { id: _i, updatedAt: _u, coach: _c, coachGeneratedBy: _g, ...rest } = existing;
    void _i;
    void _u;
    void _c;
    void _g;
    return rest;
  }
  const hours = 5;
  const rate = 30;
  const base = hours * rate + 10;
  const deliver = ws.state.offer?.deliverables ?? "Core deliverables";
  return {
    hoursPerProject: hours,
    hourlyTarget: rate,
    directCosts: 0,
    toolCosts: 10,
    revisionsIncluded: 2,
    scopeNotes: ws.state.offer?.scope ?? "",
    packages: TIERS.map<PricePackage>((t) => ({
      tier: t,
      name: TIER_LABEL[t],
      deliverables: t === "standard" ? deliver : t === "basic" ? "Smaller version of the standard package" : "Standard package plus extras",
      hours: Math.round(hours * MULT[t] * 10) / 10,
      revisions: t === "basic" ? 1 : 2,
      price: round5(base * MULT[t]),
    })),
    rationale: "",
  };
}

export default function PricingPage() {
  return (
    <>
      <PlanCards />
      <RequireProfile what="The Pricing Builder"><PricingBuilder /></RequireProfile>
    </>
  );
}

function PlanCards() {
  const ws = useWorkspace();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upgrade() {
    if (ws.guest || ws.auth.status !== "signed_in") {
      window.location.assign("/signup?next=%2Fpricing");
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
  return (
    <section className="mb-8">
      <PageHeader title="Plans" sub="Start with the free plan. Upgrade when you need the full Skills2Cash journey." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <Badge>FREE</Badge><p className="mt-3 text-3xl font-bold">$0<span className="text-sm font-normal text-muted"> / month</span></p>
          <ul className="my-5 space-y-2 text-sm text-ink-2">{["1 skill assessment", "1 service offer", "1 simulation", "Basic access"].map((x) => <li key={x} className="flex gap-2"><Check className="h-4 w-4 text-good" />{x}</li>)}</ul>
          <Button variant="secondary" disabled className="w-full">Current Free Plan</Button>
        </Card>
        <Card className="border-violet/50 bg-violet-tint/20">
          <Badge tone="violet">PRO</Badge><p className="mt-3 text-3xl font-bold">$19<span className="text-sm font-normal text-muted"> / month</span></p>
          <ul className="my-5 space-y-2 text-sm text-ink-2">{["All 7 scenarios", "All missions", "Full Readiness", "Extended recommendations", "Unlimited product access"].map((x) => <li key={x} className="flex gap-2"><Check className="h-4 w-4 text-violet-soft" />{x}</li>)}</ul>
          <Button className="w-full" onClick={upgrade} disabled={busy}>{busy ? <Spinner /> : null}{busy ? "Opening checkout…" : "Upgrade to Pro"}</Button>
          {ws.guest && <p className="mt-2 text-xs text-muted">Create an account first. Your guest progress stays in this browser.</p>}
          {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
          <Link href="/dashboard" className="mt-3 block text-center text-sm text-muted hover:text-ink">Back to Dashboard</Link>
        </Card>
      </div>
    </section>
  );
}

function NumberField({ id, label, value, onChange, step = 1, prefix }: { id: string; label: string; value: number; onChange: (n: number) => void; step?: number; prefix?: string }) {
  return (
    <Field label={label} htmlFor={id}>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{prefix}</span>}
        <Input
          id={id}
          type="number"
          min={0}
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className={prefix ? "pl-7" : undefined}
        />
      </div>
    </Field>
  );
}

function PricingBuilder() {
  const ws = useWorkspace();
  const [p, setP] = useState<PricingInput>(() => defaults(ws));
  const [coach, setCoach] = useState<{ data: PricingCoachResult; by: Generator; notice?: string } | null>(
    ws.state.pricing?.coach ? { data: ws.state.pricing.coach, by: ws.state.pricing.coachGeneratedBy ?? "sample" } : null,
  );
  const [busy, setBusy] = useState(false);
  const [aiError, setAiError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(ws.state.pricing?.updatedAt ?? null);

  const floor = p.hoursPerProject * p.hourlyTarget + p.directCosts + p.toolCosts;
  const setPkg = (i: number, patch: Partial<PricePackage>) => setP((x) => ({ ...x, packages: x.packages.map((k, j) => (j === i ? { ...k, ...patch } : k)) }));

  function recalc() {
    setP((x) => ({
      ...x,
      packages: x.packages.map((k) => {
        const hrs = Math.round(x.hoursPerProject * MULT[k.tier] * 10) / 10;
        return { ...k, hours: hrs, price: round5(hrs * x.hourlyTarget + (x.directCosts + x.toolCosts) * MULT[k.tier]) };
      }),
    }));
  }

  const body = () => ({ pricing: p, offer: ws.state.offer ? (({ id: _i, updatedAt: _u, ...o }) => (void _i, void _u, o))(ws.state.offer) : null });

  async function runCoach() {
    const v = PricingInputSchema.safeParse(p);
    if (!v.success) {
      setAiError(new ApiError("bad_request", "Please fill in every package name and deliverables first."));
      return;
    }
    setBusy(true);
    setAiError(null);
    try {
      const r = await callAI("pricing/coach", body(), ws.aiOpts);
      setCoach({ data: r.data, by: r.generatedBy, notice: r.notice });
      if (!p.rationale) setP((x) => ({ ...x, rationale: r.data.rationale }));
    } catch (e) {
      setAiError(e as ApiError);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const v = PricingInputSchema.safeParse(p);
    if (!v.success) {
      setSaveError(`Check your inputs: ${v.error.issues[0]?.path.join(".")} — ${v.error.issues[0]?.message}`);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const now = new Date().toISOString();
      const ws_: PricingWorksheet = { ...v.data, id: ws.state.pricing?.id ?? newId(), coach: coach?.data ?? null, coachGeneratedBy: coach?.by ?? null, updatedAt: now };
      await ws.savePricing(ws_);
      setSavedAt(now);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Pricing Builder"
        sub="Estimate effort and costs, design three packages, and write a rationale you can say to a client."
        eyebrow={<Badge tone="warn">All prices are your hypotheses — not verified market rates</Badge>}
      />
      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardTitle right={<Calculator className="h-4 w-4 text-muted" aria-hidden />} sub="For one standard project or month">
            Effort & costs
          </CardTitle>
          <div className="grid grid-cols-2 gap-3">
            <NumberField id="hours" label="Estimated hours" value={p.hoursPerProject} step={0.5} onChange={(n) => setP({ ...p, hoursPerProject: n })} />
            <NumberField id="rate" label="Desired $/hour" prefix="$" value={p.hourlyTarget} onChange={(n) => setP({ ...p, hourlyTarget: n })} />
            <NumberField id="direct" label="Direct costs" prefix="$" value={p.directCosts} onChange={(n) => setP({ ...p, directCosts: n })} />
            <NumberField id="tools" label="Tool expenses" prefix="$" value={p.toolCosts} onChange={(n) => setP({ ...p, toolCosts: n })} />
            <NumberField id="rev" label="Revisions included" value={p.revisionsIncluded} onChange={(n) => setP({ ...p, revisionsIncluded: Math.round(n) })} />
          </div>
          <Field label="Scope notes" htmlFor="scope" className="mt-3">
            <Textarea id="scope" rows={2} value={p.scopeNotes} onChange={(e) => setP({ ...p, scopeNotes: e.target.value })} />
          </Field>
          <div className="mt-4 rounded-xl border border-violet/30 bg-violet-tint/50 p-3">
            <p className="text-xs text-muted">Cost floor = hours × $/hour + direct costs + tools</p>
            <p className="mt-1 text-2xl font-bold">${Math.round(floor).toLocaleString("en-US")}</p>
            <p className="text-xs text-muted">
              {p.hoursPerProject} × ${p.hourlyTarget} + ${p.directCosts} + ${p.toolCosts}
            </p>
          </div>
          <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={recalc}>
            Recalculate packages from these numbers
          </Button>
        </Card>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {p.packages.map((k, i) => (
              <Card key={k.tier} className={k.tier === "standard" ? "border-violet/50" : undefined}>
                <div className="mb-3 flex items-center justify-between">
                  <Badge tone={k.tier === "standard" ? "violet" : "neutral"}>{TIER_LABEL[k.tier]}</Badge>
                  {k.price < k.hours * p.hourlyTarget && <Badge tone="warn">Below your hourly target</Badge>}
                </div>
                <div className="space-y-3">
                  <Field label="Name" htmlFor={`n-${k.tier}`}>
                    <Input id={`n-${k.tier}`} value={k.name} onChange={(e) => setPkg(i, { name: e.target.value })} />
                  </Field>
                  <Field label="Deliverables" htmlFor={`d-${k.tier}`}>
                    <Textarea id={`d-${k.tier}`} rows={3} value={k.deliverables} onChange={(e) => setPkg(i, { deliverables: e.target.value })} />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField id={`h-${k.tier}`} label="Hours" step={0.5} value={k.hours} onChange={(n) => setPkg(i, { hours: n })} />
                    <NumberField id={`r-${k.tier}`} label="Revisions" value={k.revisions} onChange={(n) => setPkg(i, { revisions: Math.round(n) })} />
                  </div>
                  <NumberField id={`p-${k.tier}`} label="Price" prefix="$" value={k.price} onChange={(n) => setPkg(i, { price: n })} />
                  <p className="text-xs text-muted">≈ ${k.hours > 0 ? Math.round(k.price / k.hours) : "—"}/hour effective</p>
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <CardTitle
              sub="What you would say to a client"
              right={
                <Button size="sm" variant="secondary" onClick={runCoach} loading={busy}>
                  <Sparkles className="h-3.5 w-3.5" aria-hidden /> {coach ? "Regenerate" : "Generate"} rationale
                </Button>
              }
            >
              Pricing rationale
            </CardTitle>
            <Textarea
              id="rationale"
              aria-label="Pricing rationale"
              rows={5}
              value={p.rationale}
              onChange={(e) => setP({ ...p, rationale: e.target.value })}
              placeholder="Write your own, or generate a draft with the AI coach and edit it."
            />
            {busy && <div className="mt-3"><Spinner label="The pricing coach is reviewing your numbers…" /></div>}
            {aiError && (
              <div className="mt-3">
                <ErrorState title="Pricing coach unavailable" message={aiError.message} onRetry={aiError.code === "bad_request" ? undefined : runCoach}>
                  {aiError.code !== "bad_request" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const r = offlineAI("pricing/coach", body());
                        setCoach({ data: r.data, by: "sample", notice: r.notice });
                        if (!p.rationale) setP((x) => ({ ...x, rationale: r.data.rationale }));
                        setAiError(null);
                      }}
                    >
                      Use offline template
                    </Button>
                  )}
                </ErrorState>
              </div>
            )}
            {coach && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <GeneratedBadge by={coach.by} />
                  {coach.notice && <span className="text-xs text-warn">{coach.notice}</span>}
                </div>
                {coach.data.rationale !== p.rationale && (
                  <div className="rounded-lg border border-violet/30 bg-violet-tint/50 p-3 text-sm text-ink-2">
                    {coach.data.rationale}
                    <button className="mt-1.5 block text-xs font-medium text-violet-soft hover:underline" onClick={() => setP({ ...p, rationale: coach.data.rationale })}>
                      Use this draft
                    </button>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-warn">Risks in this pricing</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-ink-2">
                      {coach.data.risks.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-good">How to validate</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-ink-2">
                      {coach.data.validation_steps.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {saveError && <ErrorState title="Not saved" message={saveError} onRetry={save} />}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">{savedAt ? `Saved ${formatDateTime(savedAt)}` : "Not saved yet"}</p>
            <div className="flex gap-2">
              {savedAt && (
                <LinkButton href="/assignments/pricing-packages" variant="secondary">
                  Mission 4: submit your packages
                </LinkButton>
              )}
              <Button onClick={save} loading={saving}>
                Save pricing worksheet
              </Button>
            </div>
          </div>
          <Notice tone="neutral">
            Tip: in the Service Builder you can apply the Standard price to your offer, so AI clients react to it in the simulator.
          </Notice>
        </div>
      </div>
    </div>
  );
}
