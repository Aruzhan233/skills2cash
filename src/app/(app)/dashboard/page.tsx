"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, Sparkles, Target } from "lucide-react";
import { AchievementsList } from "@/components/achievements";
import { JourneyStrip } from "@/components/journey-tracker";
import { LevelCard } from "@/components/level-card";
import { LogoMark } from "@/components/logo";
import { RequireProfile } from "@/components/require-profile";
import { Badge, Card, CardTitle, LinkButton, Progress, ScorePill, SourceBadge } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { ASSIGNMENT_BY_KEY } from "@/lib/assignments";
import { formatDateTime } from "@/lib/cn";
import { currentPhase, daysLeft, journeyPercent, journeyPhases, levelFor, totalXp, weeklyStats } from "@/lib/retention";
import { achievements, competencyScores, completedSessions, computeReadiness, currentStage, recommendNext, stageProgress } from "@/lib/progress";
import { SCENARIO_BY_KEY } from "@/lib/scenarios";
import { STAGE_BY_KEY, STAGES } from "@/lib/stages";
import { PlanUsage } from "@/components/plan-usage";

export default function DashboardPage() {
  return (
    <RequireProfile what="Your dashboard">
      <Dashboard />
    </RequireProfile>
  );
}

function Dashboard() {
  const { state, mode } = useWorkspace();
  const p = state.profile!;
  const readiness = computeReadiness(state);
  const prog = stageProgress(state);
  const stage = STAGE_BY_KEY[currentStage(prog)];
  const rec = recommendNext(state);
  const scores = competencyScores(state);
  const activity = [
    ...state.submissions.map((s) => ({
      at: s.createdAt,
      label: `Mission ${ASSIGNMENT_BY_KEY[s.assignmentKey]?.number}: ${ASSIGNMENT_BY_KEY[s.assignmentKey]?.title}`,
      score: s.score,
      href: `/assignments/${s.assignmentKey}`,
    })),
    ...completedSessions(state.sessions).map((s) => ({
      at: s.endedAt ?? s.startedAt,
      label: `Simulation: ${SCENARIO_BY_KEY[s.scenarioKey]?.title}`,
      score: s.overallScore,
      href: `/practice/session/${s.id}`,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);

  const phases = journeyPhases(state);
  const journey = journeyPercent(phases);
  const phase = currentPhase(phases);
  const level = levelFor(totalXp(state.xp));
  const week = weeklyStats(state);
  const weekLeft = week.missions[0] ? daysLeft(week.missions[0].deadline, new Date()) : 0;
  const allAchievements = achievements(state);
  const earnedCount = allAchievements.filter((a) => a.earned).length;
  const recentAchievements = allAchievements
    .filter((a) => a.earned)
    .sort((a, b) => (b.earnedAt ?? "").localeCompare(a.earnedAt ?? ""))
    .slice(0, 3);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <LogoMark size={56} priority className="hidden drop-shadow-[0_0_18px_rgba(139,92,246,0.45)] sm:block" />
          <div>
            <p className="text-sm text-muted">{mode === "demo" ? "Demo workspace" : "Welcome back"}</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Hi {p.displayName.split(" ")[0]} 👋</h1>
            <p className="mt-1 text-sm text-ink-2">
              Focus: <span className="text-ink">{state.offer?.title ?? p.direction.name}</span>
            </p>
          </div>
        </div>
        <LevelCard level={level} href="/progress#achievements" className="lg:w-[340px]" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-violet/30 bg-gradient-to-br from-violet-tint/70 to-surface">
          <p className="text-xs font-medium uppercase tracking-wider text-violet-soft">Recommended next action</p>
          <h2 className="mt-2 text-xl font-semibold">{rec.title}</h2>
          <p className="mt-1 text-sm text-ink-2">{rec.reason}</p>
          <LinkButton href={rec.href} className="mt-4">
            {rec.cta} <ArrowRight className="h-4 w-4" aria-hidden />
          </LinkButton>
        </Card>
        <Card>
          <CardTitle sub="Learning indicator — not an income prediction">Monetization readiness</CardTitle>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{readiness.overall ?? "—"}</span>
            <span className="pb-1 text-sm text-muted">/100</span>
          </div>
          <Progress value={readiness.overall} className="mt-3" label="Readiness" />
          <p className="mt-2 text-xs text-muted">
            Evidence in {readiness.evidenced} of 7 dimensions{readiness.provisional ? " · provisional" : ""}.
          </p>
          <Link href="/readiness" className="mt-3 inline-block text-sm text-violet-soft hover:underline">
            See details →
          </Link>
        </Card>
      </div>

      <Card className="mt-4">
        <CardTitle
          sub={`You are in phase ${phase.number} of ${phases.length}: ${phase.title} — ${phase.done} of ${phase.total} steps done`}
          right={<Link href="/progress" className="shrink-0 text-sm text-violet-soft hover:underline">Open progress tracker</Link>}
        >
          Your monetization journey · {journey}% complete
        </CardTitle>
        <Progress value={journey} className="mb-4 h-2.5" label="Overall journey progress" />
        <JourneyStrip phases={phases} currentKey={phase.key} />
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardTitle
            sub={
              week.total
                ? `${week.completed} of ${week.total} done · ${week.xpEarned} of ${week.xpAvailable} XP · ${weekLeft} day${weekLeft === 1 ? "" : "s"} left`
                : "Your missions for this week are being prepared"
            }
            right={<Link href="/assignments/weekly" className="shrink-0 text-sm text-violet-soft hover:underline">Open missions</Link>}
          >
            Weekly missions
          </CardTitle>
          {week.total > 0 && <Progress value={week.percent} className="mb-3" tone={week.completed === week.total ? "good" : "violet"} label="Weekly mission progress" />}
          <ul className="space-y-2">
            {week.missions.map((m) => (
              <li key={m.id}>
                <Link href="/assignments/weekly" className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3 text-sm hover:border-violet/40">
                  {m.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-good" aria-label="Completed" />
                  ) : (
                    <Target className="h-4 w-4 shrink-0 text-violet-soft" aria-label="To do" />
                  )}
                  <span className={m.status === "completed" ? "min-w-0 flex-1 truncate text-muted line-through decoration-muted/40" : "min-w-0 flex-1 truncate"}>{m.title}</span>
                  <Badge tone={m.status === "completed" ? "good" : "violet"}>
                    <Sparkles className="h-3 w-3" aria-hidden /> {m.xp} XP
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
          {week.streak > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {week.streak}-week streak
            </p>
          )}
        </Card>
        <Card className="min-w-0">
          <CardTitle
            sub={`${earnedCount} of ${allAchievements.length} unlocked`}
            right={<Link href="/progress#achievements" className="shrink-0 text-sm text-violet-soft hover:underline">View all</Link>}
          >
            Achievements
          </CardTitle>
          {recentAchievements.length ? (
            <AchievementsList items={recentAchievements} compact />
          ) : (
            <p className="text-sm text-muted">No achievements yet. Your first mission or simulation will earn one.</p>
          )}
        </Card>
      </div>

      <PlanUsage />

      <Card className="mt-4">
        <CardTitle sub={`Current stage: ${stage.title} — ${stage.tagline}`} right={<Link href="/path" className="text-sm text-violet-soft hover:underline">Open path</Link>}>Learning path</CardTitle>
        <ol className="grid gap-2 sm:grid-cols-5">
          {STAGES.map((s) => {
            const sp = prog.find((x) => x.key === s.key)!;
            return (
              <li key={s.key}>
                <Link href={`/path#${s.key}`} className="block rounded-xl border border-line bg-surface-2 p-3 hover:border-violet/40">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {s.number}. {s.title}
                    </span>
                    {sp.status === "completed" ? <Badge tone="good">Done</Badge> : s.key === stage.key ? <Badge tone="violet">Now</Badge> : null}
                  </div>
                  <Progress value={(sp.done / sp.total) * 100} className="mt-2" tone={sp.status === "completed" ? "good" : "violet"} label={`${s.title} progress`} />
                  <p className="mt-1 text-xs text-muted">
                    {sp.done}/{sp.total} requirements
                  </p>
                </Link>
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardTitle sub="Top competencies">Skill overview</CardTitle>
          <ul className="space-y-3">
            {scores.slice(0, 9).map((s) => (
              <li key={s.key}>
                <div className="flex items-center justify-between text-sm">
                  <span>{s.label}</span>
                  <span className="font-mono text-xs text-ink-2">{s.display ?? "—"}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={s.display} tone={s.source === "demonstrated" ? "violet" : "muted"} label={s.label} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <SourceBadge source="demonstrated" />
            <SourceBadge source="self-reported" />
          </div>
        </Card>
        <Card className="min-w-0">
          <CardTitle>Recent activity</CardTitle>
          {activity.length ? (
            <ul className="space-y-2">
              {activity.map((a, i) => (
                <li key={i}>
                  <Link href={a.href} className="flex items-center justify-between gap-2 rounded-lg p-2 text-sm hover:bg-surface-2">
                    <span className="min-w-0">
                      <span className="block truncate">{a.label}</span>
                      <span className="text-xs text-muted">{formatDateTime(a.at)}</span>
                    </span>
                    <ScorePill score={a.score} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No missions or simulations yet. Your first one will show up here.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
