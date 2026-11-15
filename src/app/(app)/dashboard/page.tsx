"use client";

import Link from "next/link";
import { Orb } from "@/components/orb";
import { ArrowRight, CalendarClock, CheckCircle2, Circle, Sparkles, Target } from "lucide-react";
import { AchievementsList } from "@/components/achievements";
import { JourneyStrip } from "@/components/journey-tracker";
import { RequireProfile } from "@/components/require-profile";
import { Card, CardTitle, LinkButton, Progress, ScorePill, SourceBadge } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { ASSIGNMENT_BY_KEY } from "@/lib/assignments";
import { cn, formatDateTime } from "@/lib/cn";
import { currentPhase, daysLeft, journeyPercent, journeyPhases, levelFor, totalXp, weeklyStats } from "@/lib/retention";
import { achievements, competencyScores, completedSessions, computeReadiness, currentStage, recommendNext, stageProgress } from "@/lib/progress";
import { SCENARIO_BY_KEY } from "@/lib/scenarios";
import { STAGE_BY_KEY } from "@/lib/stages";

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

  const firstName = p.displayName.split(" ")[0];
  const openWeekly = week.missions.find((m) => m.status !== "completed");

  return (
    <div>
      <header className="mb-8 animate-rise">
        <h1 className="text-3xl font-semibold leading-tight text-ink sm:text-[2.5rem]">
          {mode === "demo" ? (
            <>
              This is <span className="text-gradient">{firstName}&apos;s</span> workspace
            </>
          ) : (
            <>
              Welcome back, <span className="text-gradient">{firstName}</span>
            </>
          )}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Working on <Link href="/service-builder" className="text-ink-2 underline decoration-line-strong hover:text-ink hover:decoration-violet-soft">{state.offer?.title ?? p.direction.name}</Link>
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="glass-lit flex min-w-0 animate-rise flex-col rounded-2xl p-5 sm:p-7" aria-labelledby="next-action">
          <Orb size={260} className="-bottom-28 -right-20 opacity-80 sm:-bottom-24 sm:-right-10" />
          <span aria-hidden className="pointer-events-none absolute -bottom-40 -right-36 h-[420px] w-[420px] rounded-full border border-violet-soft/15" />
          <div className="relative">
            <h2 id="next-action" className="text-xl font-semibold leading-snug text-ink sm:text-2xl">
              <span className="text-violet-soft">Next step: </span>
              {rec.title}
            </h2>
            <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-2">{rec.reason}</p>
          </div>
          <div className="relative mb-6 mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <LinkButton href={rec.href} size="lg">
              {rec.cta} <ArrowRight className="h-4 w-4" aria-hidden />
            </LinkButton>
            <Link href="/path" className="text-sm text-ink-2 hover:text-ink">See the whole learning path</Link>
          </div>
          {openWeekly && (
            <Link href="/assignments/weekly" className="group relative mt-auto flex items-center gap-3 border-t border-violet-soft/20 pt-4 text-sm text-ink-2 hover:text-ink sm:mr-44">
              <Target className="h-4 w-4 shrink-0 text-violet-soft" aria-hidden />
              <span className="min-w-0 flex-1 truncate">
                Also this week: <span className="text-ink">{openWeekly.title}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                <Sparkles className="h-3 w-3" aria-hidden /> {openWeekly.xp} XP
              </span>
            </Link>
          )}
        </section>

        <dl className="grid grid-cols-1 divide-y divide-line glass rounded-2xl sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
          <Figure href="/progress" label="Journey" value={`${journey}%`} note={`Phase ${phase.number} of ${phases.length}: ${phase.title}`}>
            <Progress value={journey} className="mt-2.5" label="Overall journey progress" />
          </Figure>
          <Figure href="/readiness" label="Readiness" value={readiness.overall === null ? "—" : String(readiness.overall)} unit="/100" note={`Evidence in ${readiness.evidenced} of 7 dimensions${readiness.provisional ? " · provisional" : ""}`} />
          <Figure href="/progress#achievements" label={`Level ${level.level} · ${level.title}`} value={String(level.xp)} unit="XP" spark note={`${level.toNext} XP to level ${level.level + 1}`}>
            <Progress value={level.percent} tone="spark" className="mt-2.5" label="Progress to next level" />
          </Figure>
        </dl>
      </div>

      <Card className="mt-4">
        <CardTitle
          sub={`Phase ${phase.number} of ${phases.length}: ${phase.title} · ${phase.done} of ${phase.total} steps done. Every phase stays open.`}
          right={<Link href="/progress" className="shrink-0 text-sm text-violet-soft hover:underline">Progress tracker</Link>}
        >
          Your monetization journey
        </CardTitle>
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
            This week&apos;s missions
          </CardTitle>
          {week.total > 0 && <Progress value={week.percent} className="mb-3" tone={week.completed === week.total ? "good" : "violet"} label="Weekly mission progress" />}
          <ul className="divide-y divide-line">
            {week.missions.map((m) => (
              <li key={m.id}>
                <Link href="/assignments/weekly" className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors duration-150 hover:bg-surface-2">
                  {m.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-good" aria-label="Completed" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted" aria-label="To do" />
                  )}
                  <span className={m.status === "completed" ? "min-w-0 flex-1 truncate text-muted line-through decoration-muted/40" : "min-w-0 flex-1 truncate text-ink"}>{m.title}</span>
                  <span className={cn("flex shrink-0 items-center gap-1 text-xs font-medium", m.status === "completed" ? "text-spark" : "text-muted")}>
                    <Sparkles className="h-3 w-3" aria-hidden /> {m.xp} XP
                  </span>
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

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardTitle
            sub={`Current learning stage: ${stage.title}. Scores come from your assessment and your work.`}
            right={<Link href="/profile/skills" className="shrink-0 text-sm text-violet-soft hover:underline">Skill Profile</Link>}
          >
            Your skills
          </CardTitle>
          <ul className="space-y-3">
            {scores.slice(0, 9).map((s) => (
              <li key={s.key}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink-2">{s.label}</span>
                  <span className="text-xs font-medium text-ink-2">{s.display ?? "—"}</span>
                </div>
                <Progress value={s.display} className="mt-1.5" tone={s.source === "demonstrated" ? "violet" : "muted"} label={s.label} />
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <SourceBadge source="demonstrated" />
            <SourceBadge source="self-reported" />
          </div>
        </Card>
        <Card className="min-w-0">
          <CardTitle sub="Missions and simulations, newest first">Recent activity</CardTitle>
          {activity.length ? (
            <ul className="divide-y divide-line">
              {activity.map((a, i) => (
                <li key={i}>
                  <Link href={a.href} className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors duration-150 hover:bg-surface-2">
                    <span className="min-w-0">
                      <span className="block truncate text-ink">{a.label}</span>
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

function Figure({
  href,
  label,
  value,
  unit,
  note,
  spark,
  children,
}: {
  href: string;
  label: string;
  value: string;
  unit?: string;
  note: string;
  spark?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Link href={href} className="group block px-5 py-3.5 transition-colors duration-150 first:rounded-t-2xl last:rounded-b-2xl hover:bg-surface-2">
      <dt className="flex items-center justify-between text-sm text-muted">
        {label}
        <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100" aria-hidden />
      </dt>
      <dd>
        <span className={cn("text-[1.75rem] font-semibold leading-9 tracking-tight", spark ? "text-spark" : "text-ink")}>{value}</span>
        {unit && <span className="ml-1 text-sm text-muted">{unit}</span>}
        {children}
        <span className="mt-1.5 block text-xs text-muted">{note}</span>
      </dd>
    </Link>
  );
}
