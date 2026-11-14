"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Quote } from "lucide-react";
import { Badge, Card, CardTitle, GeneratedBadge, LinkButton, Progress, ScorePill } from "./ui";
import { ROLEPLAY_RUBRIC } from "@/lib/rubric";
import { levelToPercent } from "@/lib/scoring";
import type { Evaluation } from "@/lib/types";

export function EvaluationView({ ev, retryHref }: { ev: Evaluation; retryHref: string }) {
  const nextHref = ev.nextPractice.kind === "scenario" ? `/practice/${ev.nextPractice.key}` : `/assignments/${ev.nextPractice.key}`;
  return (
    <div className="space-y-4">
      <Card className="border-violet/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <GeneratedBadge by={ev.generatedBy} />
              <Badge>
                {ev.scoredCount} of {ev.totalCount} criteria scored
              </Badge>
            </div>
            <p className="text-sm text-muted">Overall score</p>
            <p className="text-5xl font-bold">
              {ev.overallScore ?? "—"}
              <span className="text-lg font-normal text-muted">/100</span>
            </p>
          </div>
          <div className="max-w-sm text-xs text-muted">
            Formula ({ev.formulaVersion}): each criterion 1–5 → (score − 1) / 4 × 100; overall = mean of scored criteria. Criteria without evidence are
            excluded, not counted as zero.
          </div>
        </div>
        {ev.lowConfidence && (
          <div className="mt-4 flex gap-2 rounded-lg border border-warn/30 bg-warn/10 p-3 text-sm text-warn">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">Low confidence — limited evidence</p>
              <ul className="mt-0.5 list-disc pl-4 text-ink-2">
                {ev.lowConfidenceReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle sub="Observable behaviours, scored 1–5 with quotes from your own messages">Rubric scores</CardTitle>
        <ul className="divide-y divide-line">
          {ROLEPLAY_RUBRIC.map((d) => {
            const r = ev.dimensions[d.key];
            return (
              <li key={d.key} className="grid gap-2 py-3 sm:grid-cols-[220px_minmax(0,1fr)]">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{d.label}</span>
                    <span className="font-mono text-sm">{r.score === null ? "n/a" : `${r.score}/5`}</span>
                  </div>
                  <Progress value={r.score === null ? null : levelToPercent(r.score)} className="mt-1.5" label={d.label} />
                  {r.score === null && <p className="mt-1 text-xs text-warn">Not enough data to score</p>}
                </div>
                <div className="text-sm">
                  <p className="text-ink-2">{r.comment}</p>
                  {r.evidence.map((q) => (
                    <p key={q} className="mt-1.5 flex gap-1.5 rounded-md bg-surface-2 px-2 py-1 text-xs text-ink">
                      <Quote className="mt-0.5 h-3 w-3 shrink-0 text-violet-soft" aria-hidden /> {q}
                    </p>
                  ))}
                  <p className="mt-1 text-xs text-muted">{d.question}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardTitle>What went well</CardTitle>
          {ev.strengths.length ? (
            <ul className="list-disc space-y-1 pl-4 text-sm text-ink-2">
              {ev.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No clear strengths identified this time.</p>
          )}
          {ev.mistakes.length > 0 && (
            <>
              <p className="mt-4 text-sm font-semibold">Mistakes</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-ink-2">
                {ev.mistakes.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </>
          )}
        </Card>
        <Card>
          <CardTitle>What to improve</CardTitle>
          <ul className="space-y-3 text-sm">
            {ev.improvements.map((i) => (
              <li key={i.text}>
                <p className="text-ink">{i.text}</p>
                {i.example && <p className="mt-1 rounded-md border border-good/20 bg-good/5 px-2 py-1 text-xs text-ink-2">Try: “{i.example}”</p>}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="border-violet/30 bg-violet-tint/40">
          <CardTitle>Next exercise</CardTitle>
          <p className="font-medium">{ev.nextPractice.title}</p>
          <p className="mt-1 text-sm text-ink-2">{ev.nextPractice.reason}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <LinkButton href={nextHref} size="sm">
              Start <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </LinkButton>
            <LinkButton href={retryHref} size="sm" variant="secondary">
              Retry this scenario
            </LinkButton>
          </div>
          <Link href="/readiness" className="mt-3 block text-xs text-violet-soft hover:underline">
            See how this changed your readiness →
          </Link>
        </Card>
      </div>
    </div>
  );
}

export { ScorePill };
