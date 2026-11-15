"use client";


import Link from "next/link";
import { Orb } from "@/components/orb";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART, chartTick, chartTooltipStyle } from "@/lib/chart-theme";
import { AlertTriangle } from "lucide-react";
import { RequireProfile } from "@/components/require-profile";
import { GuestPaywall } from "@/components/guest-paywall";
import { JourneyList } from "@/components/journey-list";
import { Badge, Card, CardTitle, LinkButton, PageHeader, Progress, ScorePill } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { ASSIGNMENTS } from "@/lib/assignments";
import { formatDate } from "@/lib/cn";
import { journeyProgress } from "@/lib/journey";
import { bestScoreByKey, collectEvidence, computeReadiness, PASS_SCORE, READINESS_DEFS, READINESS_MIN_DIMENSIONS, recommendNext } from "@/lib/progress";
import { READINESS_KEYS } from "@/lib/types";

/** Plain-language meaning of each readiness dimension (display copy only; scoring lives in lib/progress). */
const MEANING: Record<(typeof READINESS_KEYS)[number], string> = {
  service_clarity: "Can you say exactly what you sell, to whom, and what is included?",
  target_customer: "Do you know who buys this and what problem it solves for them?",
  pricing_rationale: "Can you explain your price through scope, effort and value?",
  portfolio: "Can you show honest proof of the work, such as a sample project?",
  communication: "Do your messages and pitch make the value clear and easy to act on?",
  objection_handling: "Can you handle “too expensive” or “someone is cheaper” without blind discounts?",
  closing: "Do you end conversations with a concrete next step?",
};

export default function ReadinessPage() {
  return (
    <RequireProfile what="Your readiness dashboard">
      <GuestPaywall feature="Full Readiness"><Readiness /></GuestPaywall>
    </RequireProfile>
  );
}

function Readiness() {
  const { state } = useWorkspace();
  const r = computeReadiness(state);
  const evidence = collectEvidence(state);
  const best = bestScoreByKey(state.submissions);
  const rec = recommendNext(state);
  const scored = READINESS_KEYS.filter((k) => r.dimensions[k].score !== null).sort((a, b) => (r.dimensions[b].score ?? 0) - (r.dimensions[a].score ?? 0));
  const missing = READINESS_KEYS.filter((k) => r.dimensions[k].score === null);
  const history = state.snapshots.map((s, i) => ({ n: i + 1, overall: s.overall, date: formatDate(s.createdAt) }));

  return (
    <div>
      <PageHeader
        title="Monetization readiness"
        sub="A transparent summary of skills you have demonstrated in missions and simulations. It is a learning indicator — not a prediction of income or a professional certification."
      />
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="relative isolate overflow-hidden">
          <Orb size={210} className="-right-20 -top-20 -z-10 opacity-55" />
          <h2 className="text-sm text-muted">Overall readiness</h2>
          <p className="mt-1 text-6xl font-semibold tracking-tight text-ink [text-shadow:0_4px_30px_rgb(150_63_255/0.55)]">
            {r.overall ?? "—"}
            <span className="text-xl font-normal text-muted">/100</span>
          </p>
          <Progress value={r.overall} className="mt-3" label="Overall readiness" />
          <p className="mt-2 text-sm text-ink-2">
            Evidence in {r.evidenced} of {READINESS_KEYS.length} dimensions.
          </p>
          {r.provisional && (
            <p className="mt-2 flex gap-1.5 text-sm text-warn">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Provisional: fewer than {READINESS_MIN_DIMENSIONS} dimensions have evidence.
            </p>
          )}
          <div className="mt-4 rounded-lg border border-line bg-surface-2 p-3 text-xs text-muted">
            <p className="font-medium text-ink-2">Formula</p>
            <p className="mt-1">
              Each dimension = mean of demonstrated evidence (rubric 1–5 → 0–100) from your latest attempt at each mission and your last 3 simulations.
              Overall = mean of dimensions that have evidence. Self-reported ratings are never included.
            </p>
          </div>
        </Card>

        <Card>
          <CardTitle sub="Seven skills a client notices when you sell. Each score comes only from missions and simulations.">What the score is made of</CardTitle>
          <ul className="space-y-4">
            {READINESS_KEYS.map((k) => {
              const d = r.dimensions[k];
              return (
                <li key={k}>
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block font-medium text-ink">{READINESS_DEFS[k].label}</span>
                      <span className="mt-0.5 block text-xs text-muted">{MEANING[k]}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="hidden text-xs text-muted sm:inline">
                        {d.evidenceCount} evidence
                      </span>
                      <ScorePill score={d.score} />
                    </span>
                  </div>
                  <Progress value={d.score} className="mt-2" label={READINESS_DEFS[k].label} />
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardTitle>Strengths</CardTitle>
          {scored.length ? (
            <ul className="space-y-1 text-sm">
              {scored.slice(0, 3).map((k) => (
                <li key={k} className="flex justify-between">
                  <span className="text-ink-2">{READINESS_DEFS[k].label}</span>
                  <span className="font-medium tabular-nums text-ink">{r.dimensions[k].score}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No demonstrated evidence yet.</p>
          )}
        </Card>
        <Card>
          <CardTitle>Gaps to close</CardTitle>
          <ul className="space-y-1 text-sm">
            {[...scored]
              .reverse()
              .slice(0, 3)
              .filter((k) => (r.dimensions[k].score ?? 100) < 80)
              .map((k) => (
                <li key={k} className="flex justify-between">
                  <span className="text-ink-2">{READINESS_DEFS[k].label}</span>
                  <span className="font-medium tabular-nums text-ink">{r.dimensions[k].score}</span>
                </li>
              ))}
            {missing.map((k) => (
              <li key={k} className="flex justify-between text-muted">
                <span>{READINESS_DEFS[k].label}</span>
                <span>no evidence</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="glass-lit">
          <CardTitle>Next learning step</CardTitle>
          <p className="font-medium text-ink">{rec.title}</p>
          <p className="mt-1 text-sm text-ink-2">{rec.reason}</p>
          <LinkButton href={rec.href} size="sm" className="mt-3">
            {rec.cta}
          </LinkButton>
        </Card>
      </div>

      <Card className="mt-4">
        <CardTitle sub="What stands between you and approaching real clients. Nothing here is locked — work on steps in any order.">Launch checklist</CardTitle>
        <JourneyList progress={journeyProgress(state)} />
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle sub={`${ASSIGNMENTS.filter((a) => (best[a.key] ?? -1) >= PASS_SCORE).length} of ${ASSIGNMENTS.length} complete`}>Missions</CardTitle>
          <ul className="space-y-1.5">
            {ASSIGNMENTS.map((a) => (
              <li key={a.key}>
                <Link href={`/assignments/${a.key}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm hover:bg-surface-2">
                  <span>
                    {a.number}. {a.title}
                  </span>
                  {best[a.key] === undefined ? <Badge>Not started</Badge> : <ScorePill score={best[a.key] ?? null} />}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle sub="Saved each time your evidence changes">Readiness over time</CardTitle>
          {history.length >= 1 ? (
            <div style={{ width: "100%", height: 220 }} role="img" aria-label={`Readiness history: ${history.map((h) => h.overall ?? "n/a").join(", ")}`}>
              <ResponsiveContainer>
                <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="n" tick={chartTick} tickLine={false} axisLine={{ stroke: CHART.axis }} />
                  <YAxis domain={[0, 100]} tick={chartTick} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(_, p) => (p?.[0]?.payload as { date?: string } | undefined)?.date ?? ""} />
                  <Line type="monotone" dataKey="overall" stroke={CHART.seriesSoft} strokeWidth={2} dot={{ r: 3, fill: CHART.series, stroke: CHART.surface, strokeWidth: 2 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted">Complete a mission or simulation to record your first snapshot.</p>
          )}
          <p className="mt-2 text-xs text-muted">{evidence.length} evidence items currently count towards readiness.</p>
        </Card>
      </div>
    </div>
  );
}
