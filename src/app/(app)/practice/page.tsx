"use client";

import Link from "next/link";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Hammer, MessagesSquare } from "lucide-react";
import { RequireProfile } from "@/components/require-profile";
import { Badge, Card, CardTitle, EmptyState, LinkButton, PageHeader, ScorePill } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { cn, formatDate, formatDateTime } from "@/lib/cn";
import { completedSessions } from "@/lib/progress";
import { SCENARIOS, SCENARIO_BY_KEY, type Difficulty } from "@/lib/scenarios";
import { COMPETENCIES } from "@/lib/competencies";

const DIFF_TONE: Record<Difficulty, "good" | "violet" | "warn"> = { Beginner: "good", Intermediate: "violet", Advanced: "warn" };

export default function PracticePage() {
  return (
    <RequireProfile what="The AI Client Simulator">
      <Library />
    </RequireProfile>
  );
}

function Library() {
  const ws = useWorkspace();
  const { state } = ws;
  const [filter, setFilter] = useState<Difficulty | "All">("All");
  const done = completedSessions(state.sessions);
  const active = state.sessions.filter((s) => s.status === "active" && s.messages.some((m) => m.role === "user"));
  const chart = done.map((s, i) => ({ n: i + 1, score: s.overallScore, label: `${SCENARIO_BY_KEY[s.scenarioKey]?.title} · ${formatDate(s.endedAt)}` }));
  const bestBy: Record<string, number> = {};
  for (const s of done) if (s.overallScore !== null) bestBy[s.scenarioKey] = Math.max(bestBy[s.scenarioKey] ?? 0, s.overallScore);

  if (!state.offer) {
    return (
      <div>
        <PageHeader title="AI Client Simulator" />
        <EmptyState
          icon={<Hammer className="h-8 w-8" />}
          title="Save a service offer first"
          text="AI clients react to your actual offer — its price, deliverables and exclusions. Build it in the Service Builder, then come back."
          action={<LinkButton href="/service-builder">Open Service Builder</LinkButton>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="AI Client Simulator"
        sub={`Practise selling “${state.offer.title}” at $${state.offer.priceAmount} ${state.offer.priceUnit}. The client is an AI and stays in character; a separate evaluator scores you when you end the session.`}
      />

      {active.length > 0 && (
        <Card className="mb-4 border-violet/40">
          <CardTitle sub="Saved automatically — pick up where you left off">Unfinished conversations</CardTitle>
          <ul className="space-y-2">
            {active.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {SCENARIO_BY_KEY[s.scenarioKey]?.title} · {s.messages.filter((m) => m.role === "user").length} messages · {formatDateTime(s.startedAt)}
                </span>
                <LinkButton href={`/practice/${s.scenarioKey}`} size="sm" variant="secondary">
                  Resume
                </LinkButton>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by difficulty">
        {(["All", "Beginner", "Intermediate", "Advanced"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setFilter(d)}
            aria-pressed={filter === d}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              filter === d ? "border-violet bg-violet-tint text-violet-soft" : "border-line-strong text-muted hover:text-ink",
            )}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SCENARIOS.filter((s) => filter === "All" || s.difficulty === filter).map((s) => (
          <Card key={s.key} className="flex flex-col">
            <div className="flex items-center justify-between gap-2">
              <Badge tone={DIFF_TONE[s.difficulty]}>{s.difficulty}</Badge>
              {bestBy[s.key] !== undefined && <span className="text-xs text-muted">Best: {bestBy[s.key]}/100</span>}
            </div>
            <h2 className="mt-3 font-semibold">{s.objectionLabel}</h2>
            <p className="mt-1 text-sm text-muted">{s.goal}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {s.competencies.map((c) => (
                <Badge key={c}>{COMPETENCIES[c].short}</Badge>
              ))}
            </div>
            <div className="mt-auto pt-4">
              {ws.guest && ws.guestUsage.simulations_completed >= 1 ? (
                <LinkButton href="/pricing" variant="secondary" className="w-full">Free simulation used · View Pro</LinkButton>
              ) : (
                <LinkButton href={`/practice/${s.key}`} className="w-full">
                  <MessagesSquare className="h-4 w-4" aria-hidden /> Start
                </LinkButton>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div id="history" className="mt-8 grid scroll-mt-24 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardTitle sub="Every completed, evaluated session is saved">Simulation history</CardTitle>
          {done.length ? (
            <ul className="divide-y divide-line">
              {[...done].reverse().map((s) => (
                <li key={s.id}>
                  <Link href={`/practice/session/${s.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-violet-soft">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{SCENARIO_BY_KEY[s.scenarioKey]?.title}</span>
                      <span className="text-xs text-muted">
                        {formatDateTime(s.endedAt)} · {s.messages.filter((m) => m.role === "user").length} of your messages
                        {s.evaluation?.generatedBy === "sample" ? " · offline sample" : ""}
                      </span>
                    </span>
                    <ScorePill score={s.overallScore} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No completed simulations yet. Start one above — your scores will appear here.</p>
          )}
        </Card>
        <Card>
          <CardTitle sub="Overall score per completed session">Improvement over time</CardTitle>
          {chart.length >= 1 ? (
            <div style={{ width: "100%", height: 220 }} role="img" aria-label={`Scores: ${chart.map((c) => c.score ?? "n/a").join(", ")}`}>
              <ResponsiveContainer>
                <LineChart data={chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="#262633" vertical={false} />
                  <XAxis dataKey="n" tick={{ fill: "#9a9ab0", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#34344a" }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#9a9ab0", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#14141d", border: "1px solid #34344a", borderRadius: 10, fontSize: 12 }}
                    labelFormatter={(_, p) => (p?.[0]?.payload as { label?: string } | undefined)?.label ?? ""}
                  />
                  <Line type="monotone" dataKey="score" stroke="#a78bfa" strokeWidth={2} dot={{ r: 4, fill: "#8b5cf6" }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted">Complete two or more sessions to see a trend.</p>
          )}
          <p className="mt-2 text-xs text-muted">Session scores: {chart.map((c) => c.score ?? "n/a").join(" → ") || "—"}</p>
        </Card>
      </div>
    </div>
  );
}
