"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Lightbulb } from "lucide-react";
import { RequireProfile } from "@/components/require-profile";
import { Badge, Card, LinkButton, PageHeader, Progress, ScorePill } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { ASSIGNMENTS } from "@/lib/assignments";
import { SCORE_BANDS } from "@/lib/config";
import { cn } from "@/lib/cn";
import { currentStage, recommendNext, stageProgress } from "@/lib/progress";
import { SCENARIOS } from "@/lib/scenarios";
import { STAGES } from "@/lib/stages";

export default function PathPage() {
  return (
    <RequireProfile what="Your learning path">
      <PathView />
    </RequireProfile>
  );
}

function PathView() {
  const { state } = useWorkspace();
  const prog = stageProgress(state);
  const cur = currentStage(prog);
  const rec = recommendNext(state);
  return (
    <div>
      <PageHeader
        title="Your learning path"
        sub={`Discover → Build → Price → Practice → Launch, personalised for “${state.offer?.title ?? state.profile!.direction.name}”.`}
      />
      <Card className="mb-6 border-violet/30 bg-violet-tint/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-violet-soft">Adaptive recommendation</p>
            <p className="mt-1 font-semibold">{rec.title}</p>
            <p className="text-sm text-ink-2">{rec.reason}</p>
          </div>
          <LinkButton href={rec.href}>{rec.cta}</LinkButton>
        </div>
        <p className="mt-3 border-t border-violet/20 pt-3 text-xs text-muted">
          How it adapts: below {SCORE_BANDS.remedialBelow} on any demonstrated competency → remedial practice first; otherwise the next unmet
          stage requirement; once all are done, {SCORE_BANDS.remedialBelow}–{SCORE_BANDS.advanceAt - 1} → targeted practice on your weakest area,{" "}
          {SCORE_BANDS.advanceAt}+ → harder scenarios. Thresholds are configurable starting points, not validated cut-offs.
        </p>
      </Card>

      <ol className="space-y-4">
        {STAGES.map((s) => {
          const sp = prog.find((p) => p.key === s.key)!;
          const missions = ASSIGNMENTS.filter((a) => a.stage === s.key);
          const isCur = s.key === cur;
          return (
            <li key={s.key} id={s.key} className="scroll-mt-24">
              <Card className={cn(isCur && "border-violet/50")}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-tint text-sm font-semibold text-violet-soft">{s.number}</span>
                      <h2 className="text-lg font-semibold">{s.title}</h2>
                      {sp.status === "completed" ? (
                        <Badge tone="good">Completed</Badge>
                      ) : isCur ? (
                        <Badge tone="violet">Current stage</Badge>
                      ) : sp.status === "in_progress" ? (
                        <Badge>In progress</Badge>
                      ) : (
                        <Badge>Not started</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">{s.tagline}</p>
                  </div>
                  <div className="w-full sm:w-48">
                    <Progress value={(sp.done / sp.total) * 100} tone={sp.status === "completed" ? "good" : "violet"} label={`${s.title} progress`} />
                    <p className="mt-1 text-right text-xs text-muted">
                      {sp.done}/{sp.total} done
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted">Learning objectives</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-2">
                      {s.objectives.map((o) => (
                        <li key={o}>{o}</li>
                      ))}
                    </ul>
                    <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted">Lesson</p>
                    <p className="mt-2 text-sm text-ink-2">{s.lesson}</p>
                    <div className="mt-3 rounded-xl border border-line bg-surface-2 p-3 text-sm">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-violet-soft">
                        <Lightbulb className="h-3.5 w-3.5" aria-hidden /> Example
                      </p>
                      <p className="mt-1 text-muted line-through decoration-muted/50">{s.example.before}</p>
                      <p className="mt-1 text-ink">{s.example.after}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted">Completion criteria</p>
                    <p className="mt-1 text-xs text-muted">{s.completion}</p>
                    <ul className="mt-2 space-y-2">
                      {sp.requirements.map((r) => (
                        <li key={r.label}>
                          <Link href={r.href} className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 p-2.5 text-sm hover:border-violet/40">
                            {r.done ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-good" aria-label="Done" />
                            ) : (
                              <Circle className="h-4 w-4 shrink-0 text-muted" aria-label="Not done" />
                            )}
                            <span className="flex-1">{r.label}</span>
                            {r.score !== undefined && <ScorePill score={r.score ?? null} />}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {missions.length > 0 && (
                      <p className="mt-3 text-xs text-muted">
                        Missions here get AI feedback with a rubric score. {s.key === "practice" && `Scenarios: ${SCENARIOS.length} in the library.`}
                      </p>
                    )}
                    {s.tool && (
                      <LinkButton href={s.tool.href} variant="secondary" size="sm" className="mt-3">
                        Open {s.tool.label}
                      </LinkButton>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
