"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, Flag, MessagesSquare, Send, Target } from "lucide-react";
import { RequireProfile } from "@/components/require-profile";
import { Badge, Button, Card, CardTitle, EmptyState, ErrorState, LinkButton, Notice, Progress, Spinner, Textarea } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { callAI, offlineAI, type ApiError } from "@/lib/client/ai";
import { MAX_USER_TURNS } from "@/lib/config";
import { buildEvaluation } from "@/lib/evaluation";
import { newId } from "@/lib/id";
import { cn } from "@/lib/cn";
import { SCENARIO_BY_KEY } from "@/lib/scenarios";
import type { ClientTurnRequest, ServiceOfferInput } from "@/lib/schemas";
import type { RoleplayMessage, RoleplaySession } from "@/lib/types";

export default function SessionPage() {
  return (
    <RequireProfile what="The AI Client Simulator">
      <Simulator />
    </RequireProfile>
  );
}

function offerInput(o: NonNullable<ReturnType<typeof useWorkspace>["state"]["offer"]>): ServiceOfferInput {
  const { id: _i, updatedAt: _u, ...rest } = o;
  void _i;
  void _u;
  return rest;
}

function msg(role: RoleplayMessage["role"], content: string): RoleplayMessage {
  return { id: newId(), role, content, createdAt: new Date().toISOString() };
}

function Simulator() {
  const ws = useWorkspace();
  const router = useRouter();
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const scenario = SCENARIO_BY_KEY[scenarioId];
  const existing = ws.state.sessions.find((s) => s.scenarioKey === scenarioId && s.status === "active");
  const [session, setSession] = useState<RoleplaySession | null>(existing ?? null);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"idle" | "client" | "evaluating">("idle");
  const [error, setError] = useState<{ kind: "turn" | "eval" | "save"; err: ApiError | Error } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [session?.messages.length, phase]);

  if (!scenario) {
    return <EmptyState title="Scenario not found" text="This scenario does not exist." action={<LinkButton href="/practice">Back to scenarios</LinkButton>} />;
  }
  if (!ws.state.offer) {
    return (
      <EmptyState
        title="Save a service offer first"
        text="The AI client reacts to your saved offer."
        action={<LinkButton href="/service-builder">Open Service Builder</LinkButton>}
      />
    );
  }
  const offer = session?.offerSnapshot ?? offerInput(ws.state.offer);
  const persona = scenario.persona(offer);
  const userTurns = session?.messages.filter((m) => m.role === "user").length ?? 0;

  async function persist(s: RoleplaySession) {
    setSession(s);
    try {
      await ws.saveSession(s);
    } catch (e) {
      setError({ kind: "save", err: e as Error });
      throw e;
    }
  }

  async function start() {
    setStarting(true);
    setError(null);
    const s: RoleplaySession = {
      id: newId(),
      scenarioKey: scenario.key,
      offerSnapshot: offerInput(ws.state.offer!),
      status: "active",
      scripted: ws.aiOpts.offline,
      startedAt: new Date().toISOString(),
      endedAt: null,
      messages: [msg("client", scenario.opening(offerInput(ws.state.offer!)))],
      evaluation: null,
      overallScore: null,
    };
    try {
      await persist(s);
    } catch {
      /* error shown */
    } finally {
      setStarting(false);
    }
  }

  const reqFor = (s: RoleplaySession): ClientTurnRequest => ({
    scenarioKey: s.scenarioKey,
    offer: s.offerSnapshot,
    messages: s.messages.map((m) => ({ role: m.role, content: m.content })),
  });

  async function requestReply(s: RoleplaySession, forceOffline = false) {
    setPhase("client");
    setError(null);
    try {
      const r = forceOffline ? offlineAI("roleplay/turn", reqFor(s)) : await callAI("roleplay/turn", reqFor(s), ws.aiOpts);
      if (r.notice) setNotice(r.notice);
      const next: RoleplaySession = {
        ...s,
        scripted: s.scripted || r.generatedBy === "sample",
        messages: [...s.messages, msg("client", r.data.reply)],
      };
      await persist(next);
    } catch (e) {
      setError({ kind: "turn", err: e as ApiError });
    } finally {
      setPhase("idle");
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!session || !text || phase !== "idle") return;
    if (text.length > 2000) {
      setError({ kind: "turn", err: new Error("Messages can be at most 2000 characters.") });
      return;
    }
    const next = { ...session, messages: [...session.messages, msg("user", text)] };
    setInput("");
    try {
      await persist(next);
    } catch {
      return;
    }
    await requestReply(next);
  }

  async function end(forceOffline = false) {
    if (!session) return;
    setPhase("evaluating");
    setError(null);
    try {
      const req = reqFor(session);
      const r = forceOffline ? offlineAI("roleplay/evaluate", req) : await callAI("roleplay/evaluate", req, ws.aiOpts);
      const evaluation = buildEvaluation(r.data, req.messages, session.scenarioKey, r.generatedBy);
      const done: RoleplaySession = {
        ...session,
        status: "completed",
        endedAt: new Date().toISOString(),
        evaluation,
        overallScore: evaluation.overallScore,
      };
      await persist(done);
      router.push(`/practice/session/${done.id}`);
    } catch (e) {
      setError({ kind: "eval", err: e as ApiError });
      setPhase("idle");
    }
  }

  const lastIsUser = session?.messages[session.messages.length - 1]?.role === "user";
  const initials = persona.name.split(" ").map((x) => x[0]).join("");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="flex min-h-[30rem] min-w-0 flex-col p-0 sm:p-0 lg:h-[calc(100dvh-10.5rem)] lg:min-h-[560px]">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-3 text-sm font-semibold text-ink">{initials}</span>
            <div>
              <p className="text-sm font-semibold text-ink">{persona.name}</p>
              <p className="flex items-center gap-1 text-xs text-muted">
                <Bot className="h-3 w-3" aria-hidden /> AI-simulated client{session?.scripted ? " · scripted replies (offline, not AI)" : ""}
              </p>
            </div>
          </div>
          {session && (
            <Button size="sm" variant="secondary" onClick={() => end()} disabled={userTurns === 0 || phase !== "idle"} loading={phase === "evaluating"}>
              <Flag className="h-3.5 w-3.5" aria-hidden /> End Session
            </Button>
          )}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" aria-live="polite">
          {!session ? (
            <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center py-10 text-center">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-surface-3 text-base font-semibold text-ink" aria-hidden>
                {initials}
              </span>
              <p className="text-sm text-ink-2">
                You are selling <strong className="text-ink">{offer.title}</strong> for{" "}
                <strong className="text-ink">
                  ${offer.priceAmount} {offer.priceUnit}
                </strong>
                . {persona.name} will open the conversation.
              </p>
              <Button className="mt-5" size="lg" onClick={start} loading={starting}>
                <MessagesSquare className="h-4 w-4" aria-hidden /> Start conversation
              </Button>
              <p className="mt-3 text-xs text-muted">The client stays in character. Feedback comes after you end the session.</p>
            </div>
          ) : (
            session.messages.map((m) => (
              <div key={m.id} className={cn("flex animate-fade-in items-end gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role !== "user" && (
                  <span className="mb-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-semibold text-ink-2" aria-hidden>
                    {initials}
                  </span>
                )}
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user" ? "rounded-br-md bg-[linear-gradient(135deg,#8a3dff,#5a1fd0)] text-white shadow-[0_10px_28px_-12px_rgb(150_63_255/0.9)]" : "rounded-bl-md border border-line bg-surface-2 text-ink backdrop-blur-md",
                  )}
                >
                  <span className="sr-only">{m.role === "user" ? "You: " : `${persona.name}: `}</span>
                  {m.content}
                </div>
              </div>
            ))
          )}
          {phase === "client" && (
            <div className="flex items-end gap-2" role="status">
              <span className="mb-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-semibold text-ink-2" aria-hidden>
                {initials}
              </span>
              <span className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-surface-2 px-4 py-3.5">
                <span className="sr-only">{persona.name.split(" ")[0]} is typing…</span>
                {[0, 150, 300].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" style={{ animationDelay: `${d}ms` }} aria-hidden />
                ))}
              </span>
            </div>
          )}
          {phase === "evaluating" && <Spinner label="Evaluating your conversation against the rubric…" />}
          <div ref={endRef} />
        </div>

        {session && (
          <div className="border-t border-line p-4">
            {notice && <Notice tone="warn" className="mb-3">{notice}</Notice>}
            {error && (
              <div className="mb-3">
                {error.kind === "turn" && (
                  <ErrorState title="The client couldn't reply" message={error.err.message} onRetry={lastIsUser ? () => requestReply(session) : undefined}>
                    {lastIsUser && (
                      <Button size="sm" variant="ghost" onClick={() => requestReply(session, true)}>
                        Continue with scripted client (offline, not AI)
                      </Button>
                    )}
                  </ErrorState>
                )}
                {error.kind === "eval" && (
                  <ErrorState title="Evaluation failed" message={error.err.message} onRetry={() => end()}>
                    <Button size="sm" variant="ghost" onClick={() => end(true)}>
                      Use offline sample evaluation (labelled, not AI)
                    </Button>
                  </ErrorState>
                )}
                {error.kind === "save" && <ErrorState title="Could not save the conversation" message={error.err.message} onRetry={() => persist(session).catch(() => undefined)} />}
              </div>
            )}
            {userTurns >= MAX_USER_TURNS ? (
              <Notice>You reached {MAX_USER_TURNS} messages. End the session to get your evaluation.</Notice>
            ) : (
              <form onSubmit={send} className="flex items-end gap-2">
                <Textarea
                  aria-label="Your reply"
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      (e.currentTarget.form as HTMLFormElement).requestSubmit();
                    }
                  }}
                  placeholder="Write your reply as the seller… (Enter to send, Shift+Enter for a new line)"
                  disabled={phase !== "idle"}
                  maxLength={2000}
                />
                <Button type="submit" disabled={!input.trim() || phase !== "idle" || lastIsUser} aria-label="Send">
                  <Send className="h-4 w-4" aria-hidden />
                </Button>
              </form>
            )}
            <div className="mt-3 flex items-center gap-3">
              <Progress value={(userTurns / MAX_USER_TURNS) * 100} tone={userTurns >= 3 ? "violet" : "muted"} className="h-1 w-24 shrink-0" label="Messages used" />
              <p className="text-xs text-muted">
                {userTurns} of {MAX_USER_TURNS} messages · 3+ recommended for a confident evaluation · saved automatically
              </p>
            </div>
          </div>
        )}
      </Card>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardTitle right={<Badge tone="violet">{scenario.difficulty}</Badge>}>Scenario briefing</CardTitle>
          <p className="font-medium text-ink">{scenario.title}</p>
          <p className="mt-2 flex gap-2 text-sm text-ink-2">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-violet-soft" aria-hidden /> {scenario.goal}
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted">Client</dt>
              <dd>
                {persona.name}, {persona.role}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Known objection</dt>
              <dd>{scenario.objectionLabel}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Session ends when</dt>
              <dd>{scenario.completion} You can press End Session at any time.</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <CardTitle>Your offer (snapshot)</CardTitle>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted">Service</dt>
              <dd>{offer.title}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Deliverables</dt>
              <dd className="text-ink-2">{offer.deliverables}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Price (hypothesis)</dt>
              <dd>
                ${offer.priceAmount} {offer.priceUnit}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Revisions / timeline</dt>
              <dd className="text-ink-2">
                {offer.revisionPolicy} · {offer.timeline}
              </dd>
            </div>
          </dl>
        </Card>
        <Notice tone="neutral">The client is an AI simulation. It will not coach you during the conversation — feedback comes after you end the session.</Notice>
      </div>
    </div>
  );
}
