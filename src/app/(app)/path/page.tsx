"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Check, CheckCircle2, ChevronDown, Circle, Lightbulb } from "lucide-react";
import { RequireProfile } from "@/components/require-profile";
import { Badge, LinkButton, PageHeader, Progress, ScorePill } from "@/components/ui";
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
  const listRef = useRef<HTMLOListElement>(null);

  // Deep links such as /path#price open that stage.
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const el = id ? listRef.current?.querySelector<HTMLDetailsElement>(`details[data-stage="${CSS.escape(id)}"]`) : null;
      if (el) el.open = true;
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);

  return (
    <div>
      <PageHeader
        title="Your learning path"
        sub={`Five stages from skill to first client, personalised for “${state.offer?.title ?? state.profile!.direction.name}”. Every stage stays open; the path recommends, it does not lock.`}
      />

      <section className="mb-8 glass-lit rounded-2xl p-5 sm:p-6" aria-labelledby="path-next">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 id="path-next" className="text-lg font-semibold leading-snug text-ink">
              <span className="text-violet-soft">Next step: </span>
              {rec.title}
            </h2>
            <p className="mt-1.5 text-sm text-ink-2">{rec.reason}</p>
          </div>
          <LinkButton href={rec.href} className="shrink-0">
            {rec.cta} <ArrowRight className="h-4 w-4" aria-hidden />
          </LinkButton>
        </div>
        <details className="group mt-4 border-t border-violet/20 pt-3 text-xs text-ink-2">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-violet-soft hover:text-ink">
            <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-180" aria-hidden /> How the path adapts to you
          </summary>
          <p className="mt-2 max-w-[80ch] leading-relaxed">
            Below {SCORE_BANDS.remedialBelow} on any demonstrated competency → remedial practice first; otherwise the next unmet stage
            requirement; once all are done, {SCORE_BANDS.remedialBelow}–{SCORE_BANDS.advanceAt - 1} → targeted practice on your weakest area,{" "}
            {SCORE_BANDS.advanceAt}+ → harder scenarios. Thresholds are configurable starting points, not validated cut-offs.
          </p>
        </details>
      </section>

      <ol ref={listRef} className="relative">
        {STAGES.map((s, i) => {
          const sp = prog.find((p) => p.key === s.key)!;
          const missions = ASSIGNMENTS.filter((a) => a.stage === s.key);
          const isCur = s.key === cur;
          const done = sp.status === "completed";
          const last = i === STAGES.length - 1;
          return (
            <li key={s.key} id={s.key} className="relative scroll-mt-24 pb-4 pl-11 sm:pl-14">
              {!last && <span className={cn("absolute left-[15px] top-9 bottom-0 w-px sm:left-[19px]", done ? "bg-[linear-gradient(180deg,#c5a7ff,#782bff)] shadow-[0_0_8px_rgb(150_63_255/0.7)]" : "bg-line-strong")} aria-hidden />}
              <span
                className={cn(
                  "absolute left-0 top-3 grid h-8 w-8 place-items-center rounded-full text-sm font-semibold sm:h-10 sm:w-10",
                  done ? "bg-[linear-gradient(180deg,#a45cff,#782bff)] text-white shadow-[0_2px_10px_rgb(150_63_255/0.6)]" : isCur ? "bg-violet-strong text-white ring-4 ring-violet/20" : sp.status === "in_progress" ? "border border-violet/70 bg-bg text-violet-soft" : "border border-line-strong bg-bg text-muted",
                )}
                aria-hidden
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : s.number}
              </span>
              <details data-stage={s.key} open={isCur} className={cn("glass group rounded-2xl", isCur && "border-violet/45 shadow-glow-lg")}>
                <summary className="flex cursor-pointer list-none flex-col gap-3 rounded-2xl p-4 transition-colors duration-150 hover:bg-surface-2 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-ink">
                        <span className="sr-only">Stage {s.number}: </span>
                        {s.title}
                      </h2>
                      {done ? (
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
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="w-36">
                      <Progress value={(sp.done / sp.total) * 100} tone={done ? "good" : "violet"} label={`${s.title} progress`} />
                      <p className="mt-1 text-xs text-muted">
                        {sp.done} of {sp.total} requirements
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted transition-transform duration-200 group-open:rotate-180" aria-hidden />
                  </div>
                </summary>

                <div className="grid gap-6 border-t border-line p-4 sm:p-5 lg:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-ink">What you will be able to do</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-2 marker:text-muted">
                      {s.objectives.map((o) => (
                        <li key={o}>{o}</li>
                      ))}
                    </ul>
                    <h3 className="mt-5 text-sm font-medium text-ink">Lesson</h3>
                    <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-ink-2">{s.lesson}</p>
                    <div className="mt-4 rounded-xl bg-surface-2 p-3.5 text-sm">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-ink-2">
                        <Lightbulb className="h-3.5 w-3.5 text-spark" aria-hidden /> Before and after
                      </p>
                      <p className="mt-1.5 text-muted line-through decoration-muted/50">{s.example.before}</p>
                      <p className="mt-1 text-ink">{s.example.after}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-ink">To complete this stage</h3>
                    <p className="mt-1 text-xs text-muted">{s.completion}</p>
                    <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
                      {sp.requirements.map((r) => (
                        <li key={r.label}>
                          <Link href={r.href} className="flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl hover:bg-surface-2">
                            {r.done ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-good" aria-label="Done" />
                            ) : (
                              <Circle className="h-4 w-4 shrink-0 text-muted" aria-label="Not done" />
                            )}
                            <span className={cn("flex-1", r.done ? "text-ink-2" : "text-ink")}>{r.label}</span>
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
                      <LinkButton href={s.tool.href} variant="secondary" size="sm" className="mt-4">
                        Open {s.tool.label} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </LinkButton>
                    )}
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
