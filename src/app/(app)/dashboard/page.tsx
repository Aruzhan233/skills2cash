"use client";

import Link from "next/link";
import { ArrowRight, BadgeDollarSign, ClipboardList, Hammer, MessagesSquare } from "lucide-react";
import { RequireProfile } from "@/components/require-profile";
import { Badge, Card, CardTitle, LinkButton, Progress, ScorePill, SourceBadge } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { ASSIGNMENT_BY_KEY } from "@/lib/assignments";
import { formatDateTime } from "@/lib/cn";
import { competencyScores, completedSessions, computeReadiness, currentStage, recommendNext, stageProgress } from "@/lib/progress";
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

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-muted">{mode === "demo" ? "Demo workspace" : "Welcome back"}</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Hi {p.displayName.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-sm text-ink-2">
          Focus: <span className="text-ink">{state.offer?.title ?? p.direction.name}</span>
        </p>
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

      <PlanUsage />

      <Card className="mt-4">
        <CardTitle sub={`Current stage: ${stage.title} — ${stage.tagline}`}>Learning path</CardTitle>
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

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
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
        <Card>
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
        <Card>
          <CardTitle>Tools</CardTitle>
          <div className="grid gap-2">
            {[
              { href: "/service-builder", icon: Hammer, label: "Service Builder", done: !!state.offer },
              { href: "/pricing", icon: BadgeDollarSign, label: "Pricing Builder", done: !!state.pricing },
              { href: "/practice", icon: MessagesSquare, label: "AI Client Simulator", done: completedSessions(state.sessions).length > 0 },
              { href: "/assignments", icon: ClipboardList, label: "Missions", done: state.submissions.length > 0 },
            ].map((t) => (
              <Link key={t.href} href={t.href} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3 text-sm hover:border-violet/40">
                <t.icon className="h-4 w-4 text-violet-soft" aria-hidden />
                <span className="flex-1">{t.label}</span>
                {t.done ? <Badge tone="good">Started</Badge> : <Badge>Not started</Badge>}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
