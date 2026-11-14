"use client";

import { useParams } from "next/navigation";
import { EvaluationView } from "@/components/evaluation-view";
import { Card, CardTitle, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { cn, formatDateTime } from "@/lib/cn";
import { SCENARIO_BY_KEY } from "@/lib/scenarios";

export default function SessionResultPage() {
  const { state } = useWorkspace();
  const { sessionId } = useParams<{ sessionId: string }>();
  const s = state.sessions.find((x) => x.id === sessionId);
  if (!s) {
    return (
      <EmptyState
        title="Session not found"
        text="It may belong to another workspace (demo vs. your account)."
        action={<LinkButton href="/practice#history">Simulation history</LinkButton>}
      />
    );
  }
  const scenario = SCENARIO_BY_KEY[s.scenarioKey];
  if (!s.evaluation) {
    return (
      <EmptyState
        title="This session has not been evaluated yet"
        text="Open the conversation and press End Session to get your scores."
        action={<LinkButton href={`/practice/${s.scenarioKey}`}>Resume conversation</LinkButton>}
      />
    );
  }
  return (
    <div>
      <PageHeader
        title="Simulation results"
        sub={`${scenario?.title ?? s.scenarioKey} · ${formatDateTime(s.endedAt)} · offer: ${s.offerSnapshot.title} at $${s.offerSnapshot.priceAmount}`}
        right={<LinkButton href="/practice#history" variant="secondary" size="sm">All sessions</LinkButton>}
      />
      <EvaluationView ev={s.evaluation} retryHref={`/practice/${s.scenarioKey}`} />
      <Card className="mt-4">
        <CardTitle sub={s.scripted ? "Client replies in this session were scripted (offline, not AI)." : "AI-simulated client"}>Transcript</CardTitle>
        <div className="space-y-2">
          {s.messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] rounded-2xl px-4 py-2 text-sm", m.role === "user" ? "bg-violet/90 text-white" : "bg-surface-3 text-ink")}>
                <span className="mb-0.5 block text-[10px] uppercase tracking-wider opacity-70">{m.role === "user" ? "You" : "Client"}</span>
                {m.content}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
