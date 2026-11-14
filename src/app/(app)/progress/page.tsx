"use client";

import Link from "next/link";
import { Award, CalendarCheck, CheckCircle2, Circle, ClipboardList, Gauge, MessagesSquare, Sparkles } from "lucide-react";
import { AchievementsList } from "@/components/achievements";
import { LevelCard } from "@/components/level-card";
import { RequireProfile } from "@/components/require-profile";
import { RetentionStorageNotice } from "@/components/retention-notice";
import { Badge, Card, CardTitle, LinkButton, PageHeader, Progress, SourceBadge } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { ASSIGNMENTS } from "@/lib/assignments";
import { cn, formatDateTime } from "@/lib/cn";
import { achievements, bestScoreByKey, competencyScores, completedSessions, computeReadiness, PASS_SCORE, recommendNext } from "@/lib/progress";
import { currentPhase, journeyPercent, journeyPhases, levelFor, totalXp, weeklyActivity, weeklyStats } from "@/lib/retention";

export default function ProgressPage() {
  return (
    <RequireProfile what="Your progress tracker">
      <Tracker />
    </RequireProfile>
  );
}

function Tracker() {
  const { state } = useWorkspace();
  const phases = journeyPhases(state);
  const overall = journeyPercent(phases);
  const cur = currentPhase(phases);
  const level = levelFor(totalXp(state.xp));
  const ach = achievements(state);
  const earned = ach.filter((a) => a.earned).length;
  const readiness = computeReadiness(state);
  const best = bestScoreByKey(state.submissions);
  const missionsPassed = ASSIGNMENTS.filter((a) => (best[a.key] ?? -1) >= PASS_SCORE).length;
  const sims = completedSessions(state.sessions).length;
  const week = weeklyStats(state);
  const activity = weeklyActivity(state, 6);
  const maxActivity = Math.max(1, ...activity.map((a) => a.total));
  const rec = recommendNext(state);
  const scores = competencyScores(state);
  const developed = scores.filter((s) => s.demonstrated !== null && s.demonstrated >= PASS_SCORE).sort((a, b) => (b.demonstrated ?? 0) - (a.demonstrated ?? 0));
  const improve = scores
    .filter((s) => s.demonstrated === null || s.demonstrated < PASS_SCORE)
    .sort((a, b) => (a.demonstrated ?? a.selfReported ?? 0) - (b.demonstrated ?? b.selfReported ?? 0));
  const history = [...state.xp].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12);

  const milestones = [
    { icon: ClipboardList, label: "Skill missions completed", value: `${missionsPassed} / ${ASSIGNMENTS.length}`, href: "/assignments" },
    { icon: CalendarCheck, label: "Weekly missions completed", value: String(week.totalCompleted), href: "/assignments/weekly" },
    { icon: MessagesSquare, label: "Client simulations completed", value: String(sims), href: "/practice#history" },
    { icon: Gauge, label: "Monetization readiness", value: readiness.overall === null ? "—" : `${readiness.overall} / 100`, href: "/readiness" },
    { icon: Award, label: "Achievements unlocked", value: `${earned} / ${ach.length}`, href: "#achievements" },
    { icon: Sparkles, label: "Total XP", value: String(level.xp), href: "#xp-history" },
  ];

  return (
    <div>
      <PageHeader
        title="Progress tracker"
        sub="How far you are on the way from a skill to a paying client. Every number here is calculated from what you have actually done in Skills2Cash."
      />
      <RetentionStorageNotice />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-violet/30 bg-gradient-to-br from-violet-tint/70 to-surface lg:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wider text-violet-soft">Monetization journey</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <p className="text-5xl font-bold">
              {overall}
              <span className="text-xl font-normal text-muted">% complete</span>
            </p>
            <p className="text-sm text-ink-2">
              Now: <span className="font-medium text-ink">Phase {cur.number} — {cur.title}</span>
            </p>
          </div>
          <Progress value={overall} className="mt-3 h-2.5" label="Overall journey progress" />
          <div className="mt-4 flex flex-col gap-3 border-t border-violet/20 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs text-muted">Recommended next action</p>
              <p className="truncate font-medium">{rec.title}</p>
            </div>
            <LinkButton href={rec.href} size="sm">
              {rec.cta}
            </LinkButton>
          </div>
        </Card>
        <LevelCard level={level} className="flex flex-col justify-center" />
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {milestones.map((m) => (
          <li key={m.label}>
            <Link href={m.href} className="block h-full rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-violet/40">
              <m.icon className="h-4 w-4 text-violet-soft" aria-hidden />
              <p className="mt-2 text-xl font-bold">{m.value}</p>
              <p className="text-xs leading-tight text-muted">{m.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardTitle sub="Eight phases. Work on them in any order — nothing is locked.">Journey timeline</CardTitle>
          <ol>
            {phases.map((p, i) => {
              const done = p.percent === 100;
              const isCur = p.key === cur.key;
              return (
                <li key={p.key} id={`phase-${p.key}`} className="relative scroll-mt-24 pb-5 pl-10 last:pb-0">
                  {i < phases.length - 1 && <span className={cn("absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px", done ? "bg-violet/50" : "bg-line-strong")} aria-hidden />}
                  <span
                    className={cn(
                      "absolute left-0 top-0 grid h-7 w-7 place-items-center rounded-full text-xs font-semibold",
                      done ? "bg-violet text-white" : isCur ? "border border-violet bg-violet-tint text-violet-soft" : "bg-surface-3 text-muted",
                    )}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : p.number}
                  </span>
                  <details open={isCur} className="group">
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <span className="flex items-center gap-2">
                          <span className={cn("font-semibold", done || isCur ? "text-ink" : "text-ink-2")}>{p.title}</span>
                          {isCur && <Badge tone="violet">You are here</Badge>}
                        </span>
                        <span className="text-xs text-muted">
                          {p.done} of {p.total} · <span className={done ? "text-good" : "text-ink-2"}>{p.percent}%</span>
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted">{p.description}</p>
                      <Progress value={p.percent} className="mt-2 h-1.5" tone={done ? "good" : "violet"} label={`${p.title} progress`} />
                    </summary>
                    <ul className="mt-3 space-y-1.5">
                      {p.checks.map((c) => (
                        <li key={c.label}>
                          <Link href={c.href} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-surface-2">
                            {c.done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-good" aria-label="Done" /> : <Circle className="h-4 w-4 shrink-0 text-muted" aria-label="Not done" />}
                            <span className={c.done ? "text-ink-2" : "text-ink"}>{c.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ol>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle sub="Skill missions, simulations and weekly missions per week">Weekly activity</CardTitle>
            <div className="flex h-32 items-end gap-2" role="img" aria-label={`Activities per week: ${activity.map((a) => `${a.label} ${a.total}`).join(", ")}`}>
              {activity.map((a) => (
                <div key={a.weekStart} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[11px] text-ink-2">{a.total}</span>
                  <div
                    className={cn("w-full rounded-t-md", a.total ? "bg-gradient-to-t from-violet-strong to-violet" : "bg-surface-3")}
                    style={{ height: `${a.total ? Math.max(8, (a.total / maxActivity) * 100) : 4}%` }}
                    title={`${a.missions} skill missions · ${a.simulations} simulations · ${a.weekly} weekly missions`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex gap-2">
              {activity.map((a) => (
                <span key={a.weekStart} className="flex-1 truncate text-center text-[10px] text-muted">
                  {a.label}
                </span>
              ))}
            </div>
            <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
              This week: {week.completed} of {week.total} weekly missions · streak {week.streak} week{week.streak === 1 ? "" : "s"}
            </p>
          </Card>

          <Card>
            <CardTitle sub={`Demonstrated at ${PASS_SCORE}+ in missions or simulations`}>Skills developed</CardTitle>
            {developed.length ? (
              <ul className="space-y-3">
                {developed.map((s) => (
                  <li key={s.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{s.label}</span>
                      <span className="font-mono text-xs text-ink-2">{s.demonstrated}</span>
                    </div>
                    <Progress value={s.demonstrated} className="mt-1" tone="good" label={s.label} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Nothing demonstrated at {PASS_SCORE}+ yet. Your first passed mission or simulation will appear here.</p>
            )}
          </Card>

          <Card>
            <CardTitle sub="Lowest first">Skills to improve</CardTitle>
            {improve.length ? (
              <ul className="space-y-3">
                {improve.slice(0, 5).map((s) => (
                  <li key={s.key}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span>{s.label}</span>
                      <span className="flex items-center gap-2">
                        <SourceBadge source={s.source} />
                        <span className="font-mono text-xs text-ink-2">{s.display ?? "—"}</span>
                      </span>
                    </div>
                    <Progress value={s.display} className="mt-1" tone={s.source === "demonstrated" ? "violet" : "muted"} label={s.label} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Every competency is demonstrated at {PASS_SCORE}+.</p>
            )}
            <Link href="/profile/skills" className="mt-3 inline-block text-sm text-violet-soft hover:underline">
              Open Skill Profile →
            </Link>
          </Card>
        </div>
      </div>

      <Card className="mt-4 scroll-mt-24">
        <div id="achievements" className="scroll-mt-24">
          <CardTitle sub="Each unlocks once, when the real action is completed">
            Achievements · {earned} of {ach.length}
          </CardTitle>
        </div>
        <AchievementsList items={ach} grid />
      </Card>

      <Card className="mt-4">
        <div id="xp-history" className="scroll-mt-24">
          <CardTitle sub="Every XP award, most recent first">XP history</CardTitle>
        </div>
        {history.length ? (
          <ul className="divide-y divide-line">
            {history.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">{t.label}</span>
                  <span className="text-xs text-muted">
                    {t.source === "achievement" ? "Achievement" : "Weekly mission"} · {formatDateTime(t.createdAt)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-violet-soft">+{t.amount} XP</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No XP yet. Complete a weekly mission or unlock an achievement to earn your first.</p>
        )}
      </Card>
    </div>
  );
}
