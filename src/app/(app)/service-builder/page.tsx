"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, MessagesSquare, Sparkles } from "lucide-react";
import { RequireProfile } from "@/components/require-profile";
import {
  Badge,
  Button,
  Card,
  CardTitle,
  ErrorState,
  Field,
  GeneratedBadge,
  Input,
  LinkButton,
  Notice,
  PageHeader,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { callAI, offlineAI, type ApiError } from "@/lib/client/ai";
import { newId } from "@/lib/id";
import { formatDateTime } from "@/lib/cn";
import {
  OFFER_TEXT_FIELDS,
  PRICING_MODELS,
  PRICING_MODEL_LABEL,
  ServiceOfferInputSchema,
  type OfferImproveResult,
  type OfferTextField,
  type ServiceOfferInput,
} from "@/lib/schemas";
import type { Generator } from "@/lib/types";

type Draft = Omit<ServiceOfferInput, "priceAmount"> & { priceAmount: string };

const LABELS: Record<OfferTextField, { label: string; hint?: string; rows?: number }> = {
  title: { label: "Service name", hint: "Specific: who + what. E.g. “Starter brand kits for independent coffee shops”." },
  targetCustomer: { label: "Target customer", hint: "One narrow segment you could name real examples of." },
  customerProblem: { label: "Customer problem", hint: "In their words — what is hard or costly for them today?", rows: 2 },
  outcome: { label: "Service outcome", hint: "The result the client gets, not your tasks.", rows: 2 },
  deliverables: { label: "Deliverables", hint: "Countable: what, how many, what format.", rows: 2 },
  scope: { label: "Scope (what's included)", rows: 2 },
  timeline: { label: "Timeline" },
  revisionPolicy: { label: "Revision policy" },
  uvp: { label: "Unique value proposition", hint: "Why you, honestly — no invented credentials.", rows: 2 },
  exclusions: { label: "Not included", hint: "Explicit boundaries protect you and the client.", rows: 2 },
  priceRationale: { label: "Price rationale", hint: "Explain the price through scope, effort and value.", rows: 3 },
};

function initial(ws: ReturnType<typeof useWorkspace>): Draft {
  const o = ws.state.offer;
  if (o) return { ...o, priceAmount: String(o.priceAmount) };
  const p = ws.state.profile!;
  const d = p.direction;
  return {
    skill: p.assessment.skill,
    title: d.name,
    targetCustomer: d.target_customer,
    customerProblem: d.problem_solved,
    outcome: "",
    deliverables: "",
    scope: "",
    timeline: "",
    revisionPolicy: "",
    uvp: "",
    exclusions: "",
    pricingModel: "fixed",
    priceAmount: String(Math.round((d.price_hypothesis.low + d.price_hypothesis.high) / 2)),
    priceUnit: d.price_hypothesis.unit,
    priceRationale: "",
  };
}

export default function ServiceBuilderPage() {
  return (
    <RequireProfile what="The Service Builder">
      <Builder />
    </RequireProfile>
  );
}

function Builder() {
  const ws = useWorkspace();
  const [draft, setDraft] = useState<Draft>(() => initial(ws));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ai, setAi] = useState<{ result: OfferImproveResult; by: Generator; notice?: string } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(ws.state.offer?.updatedAt ?? null);
  const [dirty, setDirty] = useState(false);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setDirty(true);
  };

  const improveBody = () => ({
    draft: Object.fromEntries([["skill", draft.skill], ...OFFER_TEXT_FIELDS.map((f) => [f, draft[f]])]) as never,
    direction: ws.state.profile?.direction ?? null,
  });

  async function improve() {
    setAiBusy(true);
    setAiError(null);
    try {
      const r = await callAI("offer/improve", improveBody(), ws.aiOpts);
      setAi({ result: r.data, by: r.generatedBy, notice: r.notice });
    } catch (e) {
      setAiError(e as ApiError);
    } finally {
      setAiBusy(false);
    }
  }

  function applyAll() {
    if (!ai) return;
    const next = { ...draft };
    for (const f of OFFER_TEXT_FIELDS) if (ai.result.suggestions[f]) next[f] = ai.result.suggestions[f];
    setDraft(next);
    setDirty(true);
  }

  async function save() {
    const parsed = ServiceOfferInputSchema.safeParse({ ...draft, priceAmount: Number(draft.priceAmount) });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const i of parsed.error.issues) {
        const f = String(i.path[0]);
        if (!errs[f]) errs[f] = i.code === "too_small" && i.type === "string" ? `Please write at least ${i.minimum} characters.` : i.message;
      }
      setErrors(errs);
      setSaveError("Some fields need attention.");
      return;
    }
    setErrors({});
    setSaving(true);
    setSaveError(null);
    try {
      const now = new Date().toISOString();
      await ws.saveOffer({ ...parsed.data, id: ws.state.offer?.id ?? newId(), updatedAt: now });
      setSavedAt(now);
      setDirty(false);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const standard = ws.state.pricing?.packages.find((p) => p.tier === "standard");

  return (
    <div>
      <PageHeader
        title="Service Builder"
        sub="Turn your skill into a specific offer. The saved offer is what AI clients react to in the simulator."
        right={
          <Button variant="secondary" onClick={improve} loading={aiBusy}>
            <Sparkles className="h-4 w-4" aria-hidden /> Improve with AI
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Skill" htmlFor="skill" error={errors.skill}>
              <Input id="skill" value={draft.skill} onChange={(e) => set("skill", e.target.value)} />
            </Field>
            {OFFER_TEXT_FIELDS.filter((f) => f !== "priceRationale").map((f) => {
              const meta = LABELS[f];
              const sug = ai?.result.suggestions[f];
              const wide = (meta.rows ?? 1) > 1 || f === "title";
              return (
                <Field key={f} label={meta.label} hint={meta.hint} htmlFor={f} error={errors[f]} className={wide ? "sm:col-span-2" : undefined}>
                  {(meta.rows ?? 1) > 1 ? (
                    <Textarea id={f} rows={meta.rows} value={draft[f]} onChange={(e) => set(f, e.target.value)} />
                  ) : (
                    <Input id={f} value={draft[f]} onChange={(e) => set(f, e.target.value)} />
                  )}
                  {sug && sug !== draft[f] && (
                    <div className="mt-2 rounded-lg border border-violet/30 bg-violet-tint/50 p-2.5 text-sm">
                      <p className="text-ink-2">{sug}</p>
                      <button className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-violet-soft hover:underline" onClick={() => set(f, sug)}>
                        <Check className="h-3 w-3" aria-hidden /> Use suggestion
                      </button>
                    </div>
                  )}
                </Field>
              );
            })}
            <div className="sm:col-span-2 rounded-xl border border-line bg-surface-2 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Pricing</p>
                <Badge tone="warn">Price hypothesis — validate with real clients</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Pricing model" htmlFor="model">
                  <Select id="model" value={draft.pricingModel} onChange={(e) => set("pricingModel", e.target.value as Draft["pricingModel"])}>
                    {PRICING_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {PRICING_MODEL_LABEL[m]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Price (USD)" htmlFor="price" error={errors.priceAmount}>
                  <Input id="price" type="number" min={1} value={draft.priceAmount} onChange={(e) => set("priceAmount", e.target.value)} />
                </Field>
                <Field label="Unit" htmlFor="unit" error={errors.priceUnit}>
                  <Input id="unit" value={draft.priceUnit} onChange={(e) => set("priceUnit", e.target.value)} placeholder="per project" />
                </Field>
              </div>
              {standard && Number(draft.priceAmount) !== standard.price && (
                <button className="mt-2 text-xs text-violet-soft hover:underline" onClick={() => set("priceAmount", String(standard.price))}>
                  Use Standard package price from Pricing Builder (${standard.price})
                </button>
              )}
              {!standard && (
                <p className="mt-2 text-xs text-muted">
                  Not sure what to charge?{" "}
                  <Link href="/service-builder/pricing" className="font-medium text-violet-soft hover:underline">
                    Work it out in the Pricing Builder
                  </Link>{" "}
                  — save your offer first so your edits are kept.
                </p>
              )}
              <Field label={LABELS.priceRationale.label} hint={LABELS.priceRationale.hint} htmlFor="priceRationale" error={errors.priceRationale} className="mt-3">
                <Textarea id="priceRationale" rows={3} value={draft.priceRationale} onChange={(e) => set("priceRationale", e.target.value)} />
                {ai?.result.suggestions.priceRationale && ai.result.suggestions.priceRationale !== draft.priceRationale && (
                  <div className="mt-2 rounded-lg border border-violet/30 bg-violet-tint/50 p-2.5 text-sm">
                    <p className="text-ink-2">{ai.result.suggestions.priceRationale}</p>
                    <button
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-violet-soft hover:underline"
                      onClick={() => set("priceRationale", ai.result.suggestions.priceRationale)}
                    >
                      <Check className="h-3 w-3" aria-hidden /> Use suggestion
                    </button>
                  </div>
                )}
              </Field>
            </div>
          </div>
          {saveError && (
            <div className="mt-4">
              <ErrorState title="Not saved" message={saveError} onRetry={Object.keys(errors).length ? undefined : save} />
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {savedAt ? `Saved ${formatDateTime(savedAt)}` : "Not saved yet"}
              {dirty && " · unsaved changes"}
            </p>
            <div className="flex gap-2">
              {ws.state.offer && !dirty && (
                <LinkButton href="/practice" variant="secondary">
                  <MessagesSquare className="h-4 w-4" aria-hidden /> Practise selling it
                </LinkButton>
              )}
              <Button onClick={save} loading={saving}>
                Save offer
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {aiBusy && (
            <Card>
              <Spinner label="Improving your offer…" />
            </Card>
          )}
          {aiError && (
            <ErrorState title="AI suggestions unavailable" message={aiError.message} onRetry={improve}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const r = offlineAI("offer/improve", improveBody());
                  setAi({ result: r.data, by: "sample", notice: r.notice });
                  setAiError(null);
                }}
              >
                Use offline template
              </Button>
            </ErrorState>
          )}
          {ai && (
            <Card>
              <CardTitle right={<GeneratedBadge by={ai.by} />}>Coach notes</CardTitle>
              {ai.notice && <Notice tone="warn" className="mb-3">{ai.notice}</Notice>}
              <ul className="list-disc space-y-1 pl-4 text-sm text-ink-2">
                {ai.result.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-medium text-warn">Assumptions to validate</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-ink-2">
                {ai.result.assumptions_to_validate.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              <Button size="sm" className="mt-4" onClick={applyAll}>
                Apply all suggestions
              </Button>
            </Card>
          )}
          <Card>
            <CardTitle sub="Live preview of what you're building">Service Offer Canvas</CardTitle>
            <dl className="space-y-2.5 text-sm">
              <div>
                <dt className="text-xs text-muted">Offer</dt>
                <dd className="font-semibold">{draft.title || "—"}</dd>
              </div>
              {(
                [
                  ["For", draft.targetCustomer],
                  ["Problem", draft.customerProblem],
                  ["Outcome", draft.outcome],
                  ["Deliverables", draft.deliverables],
                  ["Timeline", draft.timeline],
                  ["Revisions", draft.revisionPolicy],
                  ["Not included", draft.exclusions],
                  ["Why me", draft.uvp],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="text-ink-2">{v || "—"}</dd>
                </div>
              ))}
              <div>
                <dt className="text-xs text-muted">Price (hypothesis)</dt>
                <dd className="text-ink">
                  ${draft.priceAmount || "—"} {draft.priceUnit} · {PRICING_MODEL_LABEL[draft.pricingModel]}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
