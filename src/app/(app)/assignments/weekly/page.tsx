"use client";

import { useState } from "react";
import { CalendarClock, CheckCircle2, ChevronDown, Flame, Sparkles, Target } from "lucide-react";
import { RequireProfile } from "@/components/require-profile";
import { RetentionStorageNotice } from "@/components/retention-notice";
import { Badge, Button, Card, CardTitle, EmptyState, ErrorState, Field, PageHeader, Progress, Textarea } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { cn, formatDate } from "@/lib/cn";
import { addWeeks, CompletionNoteSchema, daysLeft, formatWeekRange, WEEKLY_CATEGORY_LABEL, weeklyStats } from "@/lib/retention";
import type { WeeklyMission } from "@/lib/types";

const DIFF_TONE = { Easy: "good", Medium: "violet", Hard: "warn" } as const;

export default function WeeklyMissionsPage() {
  return (
    <RequireProfile what="Your weekly missions">
      <Weekly />
    </RequireProfile>
  );
}

function MissionCard({ m }: { m: WeeklyMission }) {
  const ws = useWorkspace();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = m.status === "completed";
  const noteCheck = CompletionNoteSchema.safeParse(note);

  async function complete() {
    setBusy(true);
    setError(null);
    try {
      await ws.completeWeeklyMission(m.id, note);
      setConfirming(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card as="article" className={cn("transition-colors", done ? "border-good/25" : open && "border-violet/40")}>
      <button className="flex w-full items-start gap-3 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {done ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-good" aria-label="Completed" />
        ) : (
          <Target className="mt-0.5 h-5 w-5 shrink-0 text-violet-soft" aria-label="Not completed" />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge>{WEEKLY_CATEGORY_LABEL[m.category]}</Badge>
            <Badge tone={DIFF_TONE[m.difficulty]}>{m.difficulty}</Badge>
          </span>
          <span className={cn("mt-1.5 block font-semibold", done ? "text-ink-2" : "text-ink")}>{m.title}</span>
          <span className="mt-0.5 block text-sm text-muted">{m.description}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-2">
          <Badge tone={done ? "good" : "violet"}>
            <Sparkles className="h-3 w-3" aria-hidden /> {done ? "+" : ""}
            {m.xp} XP
          </Badge>
          <ChevronDown className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-180")} aria-hidden />
        </span>
      </button>

      {open && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">How to do it</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-2">
                {m.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-muted">Why this mission</dt>
                <dd className="text-ink-2">{m.reason}</dd>
              </div>
              <div>
                <dt className="text-muted">Deadline</dt>
                <dd className="text-ink-2">{formatDate(m.deadline)}</dd>
              </div>
              {done && (
                <div>
                  <dt className="text-muted">Completed</dt>
                  <dd className="text-ink-2">{formatDate(m.completedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {done ? (
            <div className="mt-4 rounded-xl border border-line bg-surface-2 p-3 text-sm">
              <p className="text-xs text-muted">What you did</p>
              <p className="mt-1 whitespace-pre-wrap text-ink-2">{m.completionNote}</p>
            </div>
          ) : confirming ? (
            <div className="mt-4 rounded-xl border border-violet/30 bg-violet-tint/40 p-4">
              <Field label="Confirm completion — what did you do?" htmlFor={`note-${m.id}`} hint="A sentence or two is enough. Completion is self-reported, so be honest with yourself: this note is your record." error={note && !noteCheck.success ? noteCheck.error.issues[0]?.message : null}>
                <Textarea id={`note-${m.id}`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Found five studios on Instagram; three post irregularly and two pay a freelancer already." />
              </Field>
              {error && (
                <div className="mt-3">
                  <ErrorState title="Not saved" message={error} onRetry={complete} />
                </div>
              )}
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={busy}>
                  Cancel
                </Button>
                <Button size="sm" onClick={complete} loading={busy} disabled={!noteCheck.success}>
                  Confirm and earn {m.xp} XP
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={() => setConfirming(true)}>
                <CheckCircle2 className="h-4 w-4" aria-hidden /> Mark as completed
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function Weekly() {
  const { state } = useWorkspace();
  const now = new Date();
  const week = weeklyStats(state, now);
  const past = state.weeklyMissions.filter((m) => m.weekStart < week.weekStart);
  const pastWeeks = [...new Set(past.map((m) => m.weekStart))].sort().reverse().slice(0, 8);
  const left = week.missions[0] ? daysLeft(week.missions[0].deadline, now) : 0;
  const allDone = week.total > 0 && week.completed === week.total;

  return (
    <div>
      <PageHeader
        title="Weekly missions"
        sub="A small set of real-world tasks each week, chosen from your skill profile, weakest scores and current stage. Each one moves you closer to a paying client."
        eyebrow={<Badge tone="violet">Week of {formatWeekRange(week.weekStart)}</Badge>}
      />
      <RetentionStorageNotice />

      <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="border-violet/30 bg-gradient-to-br from-violet-tint/60 to-surface">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted">This week</p>
              <p className="text-3xl font-bold">
                {week.completed}
                <span className="text-lg font-normal text-muted"> / {week.total} missions</span>
              </p>
            </div>
            <p className="text-right text-sm text-ink-2">
              <span className="font-semibold text-violet-soft">{week.xpEarned}</span> of {week.xpAvailable} XP
            </p>
          </div>
          <Progress value={week.percent} className="mt-3" tone={allDone ? "good" : "violet"} label="Weekly mission progress" />
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            {allDone
              ? `All done. Your next set arrives on ${formatDate(addWeeks(week.weekStart, 1))}.`
              : `${left} day${left === 1 ? "" : "s"} left · new missions on ${formatDate(addWeeks(week.weekStart, 1))}`}
          </p>
        </Card>
        <Card>
          <CardTitle sub="From your saved mission history">Weekly statistics</CardTitle>
          <dl className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Week streak", value: week.streak, icon: Flame },
              { label: "Completed in total", value: week.totalCompleted, icon: CheckCircle2 },
              { label: "XP from weekly missions", value: state.xp.filter((t) => t.source === "weekly_mission").reduce((a, t) => a + t.amount, 0), icon: Sparkles },
            ].map((x) => (
              <div key={x.label} className="rounded-xl border border-line bg-surface-2 p-3">
                <x.icon className="mx-auto h-4 w-4 text-violet-soft" aria-hidden />
                <dd className="mt-1 text-xl font-bold">{x.value}</dd>
                <dt className="text-[11px] leading-tight text-muted">{x.label}</dt>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      {week.missions.length ? (
        <div className="space-y-3">
          {week.missions.map((m) => (
            <MissionCard key={m.id} m={m} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Target className="h-8 w-8" />} title="Preparing this week's missions" text="Your missions for this week are being generated from your profile. If nothing appears, reload the page." />
      )}

      {pastWeeks.length > 0 && (
        <Card className="mt-6">
          <CardTitle sub="Missions you did not finish can return in a later week">Previous weeks</CardTitle>
          <ul className="divide-y divide-line">
            {pastWeeks.map((w) => {
              const ms = past.filter((m) => m.weekStart === w);
              const d = ms.filter((m) => m.status === "completed");
              return (
                <li key={w} className="py-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{formatWeekRange(w)}</span>
                    <span className="text-xs text-muted">
                      {d.length} of {ms.length} completed · {d.reduce((a, m) => a + m.xp, 0)} XP
                    </span>
                  </div>
                  <ul className="mt-1.5 space-y-0.5 text-sm text-ink-2">
                    {ms.map((m) => (
                      <li key={m.id} className="flex items-center gap-2">
                        {m.status === "completed" ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-good" aria-label="Completed" /> : <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-line-strong" aria-label="Expired" />}
                        <span className={m.status === "completed" ? undefined : "text-muted"}>{m.title}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
