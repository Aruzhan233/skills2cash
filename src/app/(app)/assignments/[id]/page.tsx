"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, Lightbulb } from "lucide-react";
import { RequireProfile } from "@/components/require-profile";
import { Badge, Button, Card, CardTitle, EmptyState, ErrorState, GeneratedBadge, LinkButton, Notice, PageHeader, Progress, ScorePill, Spinner, Textarea } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { ASSIGNMENT_BY_KEY } from "@/lib/assignments";
import { callAI, offlineAI, type ApiError } from "@/lib/client/ai";
import { COMPETENCIES } from "@/lib/competencies";
import { buildAssignmentFeedback } from "@/lib/evaluation";
import { formatDateTime } from "@/lib/cn";
import { newId } from "@/lib/id";
import { PASS_SCORE } from "@/lib/progress";
import { levelToPercent } from "@/lib/scoring";
import type { AssignmentRequest } from "@/lib/schemas";
import type { AssignmentSubmission } from "@/lib/types";

export default function AssignmentPage() {
  return (
    <RequireProfile what="This mission">
      <Mission />
    </RequireProfile>
  );
}

function Mission() {
  const ws = useWorkspace();
  const { id } = useParams<{ id: string }>();
  const def = ASSIGNMENT_BY_KEY[id];
  const history = ws.state.submissions.filter((s) => s.assignmentKey === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const [text, setText] = useState(history[0]?.text ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(history[0]?.id ?? null);

  if (!def) {
    return <EmptyState title="Mission not found" text="This mission does not exist." action={<LinkButton href="/assignments">All missions</LinkButton>} />;
  }

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const offer = ws.state.offer
    ? (({ id: _i, updatedAt: _u, ...o }) => {
        void _i;
        void _u;
        return o;
      })(ws.state.offer)
    : null;
  const req = (): AssignmentRequest => ({ assignmentKey: def.key, text: text.trim(), context: { skill: ws.state.profile!.assessment.skill, offer } });

  async function submit(forceOffline = false) {
    if (text.trim().length < 10) {
      setError(new Error("Please write at least 10 characters before submitting."));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = forceOffline ? offlineAI("assignments/evaluate", req()) : await callAI("assignments/evaluate", req(), ws.aiOpts);
      setNotice(r.notice ?? null);
      const feedback = buildAssignmentFeedback(def, r.data, r.generatedBy);
      const sub: AssignmentSubmission = { id: newId(), assignmentKey: def.key, text: text.trim(), feedback, score: feedback.overallScore, createdAt: new Date().toISOString() };
      await ws.addSubmission(sub);
      setSelected(sub.id);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  }

  const current = ws.state.submissions.find((s) => s.id === selected) ?? null;
  const fb = current?.feedback;

  return (
    <div>
      <PageHeader
        eyebrow={
          <LinkButton href="/assignments" variant="ghost" size="sm" className="-ml-3">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All missions
          </LinkButton>
        }
        title={`Mission ${def.number}: ${def.title}`}
        sub={def.description}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Card>
            <CardTitle>Instructions</CardTitle>
            <p className="text-sm text-ink-2">{def.prompt}</p>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {def.tips.map((t) => (
                <li key={t} className="flex gap-2">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-violet-soft" aria-hidden /> {t}
                </li>
              ))}
            </ul>
            <label htmlFor="submission" className="mt-5 block text-sm font-medium text-ink-2">
              Your submission
            </label>
            <Textarea id="submission" rows={8} className="mt-1.5" value={text} onChange={(e) => setText(e.target.value)} placeholder={def.placeholder} maxLength={3000} />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted">
                {words} words · aim for {def.minWords}+
              </span>
              <Button onClick={() => submit()} loading={busy}>
                {history.length ? "Resubmit for feedback" : "Submit for feedback"}
              </Button>
            </div>
            {busy && (
              <div className="mt-3">
                <Spinner label="Reviewing your submission against the rubric…" />
              </div>
            )}
            {error && (
              <div className="mt-3">
                <ErrorState title="Feedback unavailable" message={error.message} onRetry={text.trim().length >= 10 ? () => submit() : undefined}>
                  {text.trim().length >= 10 && (
                    <Button size="sm" variant="ghost" onClick={() => submit(true)}>
                      Use offline sample feedback (labelled, not AI)
                    </Button>
                  )}
                </ErrorState>
              </div>
            )}
          </Card>

          {fb && current && (
            <Card>
              <CardTitle
                sub={`Submitted ${formatDateTime(current.createdAt)}`}
                right={
                  <div className="flex flex-wrap items-center gap-2">
                    <GeneratedBadge by={fb.generatedBy} />
                    <ScorePill score={fb.overallScore} />
                  </div>
                }
              >
                Feedback
              </CardTitle>
              {notice && current.id === history[0]?.id && <Notice tone="warn" className="mb-3">{notice}</Notice>}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {fb.overallScore !== null && fb.overallScore >= PASS_SCORE ? <Badge tone="good">Completed ({PASS_SCORE}+)</Badge> : <Badge tone="warn">Not yet complete — revise and resubmit</Badge>}
              </div>
              {fb.lowConfidence && (
                <p className="mb-3 flex gap-2 text-sm text-warn">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Only {fb.scoredCount} of {fb.totalCount} criteria could be scored — the result is low-confidence.
                </p>
              )}
              <ul className="divide-y divide-line">
                {def.criteria.map((c) => {
                  const r = fb.criteria[c.key];
                  return (
                    <li key={c.key} className="py-3">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium">
                          {c.label} <span className="text-xs font-normal text-muted">· {COMPETENCIES[c.competency].label}</span>
                        </span>
                        <span className="font-medium tabular-nums">{r?.score == null ? "n/a" : `${r.score}/5`}</span>
                      </div>
                      <Progress value={r?.score == null ? null : levelToPercent(r.score)} className="mt-1.5" label={c.label} />
                      <p className="mt-1.5 text-sm text-ink-2">{r?.comment}</p>
                      {r?.score == null && <p className="text-xs text-warn">Not enough data to score this criterion.</p>}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold">Strengths</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-ink-2">
                    {fb.strengths.length ? fb.strengths.map((s) => <li key={s}>{s}</li>) : <li>—</li>}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold">Improve</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-ink-2">
                    {fb.improvements.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-good/20 bg-good/5 p-3">
                <p className="text-xs font-medium text-good">Improved example</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-2">{fb.improvedExample}</p>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardTitle sub="Each criterion is scored 1–5">Rubric</CardTitle>
            <ul className="space-y-2 text-sm">
              {def.criteria.map((c) => (
                <li key={c.key}>
                  <p className="font-medium">{c.label}</p>
                  <p className="text-muted">{c.description}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">Score = mean of (criterion − 1) / 4 × 100 over scored criteria. {PASS_SCORE}+ completes the mission.</p>
          </Card>
          <Card>
            <CardTitle>Attempts</CardTitle>
            {history.length ? (
              <ul className="space-y-1">
                {history.map((h) => (
                  <li key={h.id}>
                    <button
                      onClick={() => setSelected(h.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-2 ${h.id === selected ? "bg-surface-2" : ""}`}
                    >
                      <span>{formatDateTime(h.createdAt)}</span>
                      <ScorePill score={h.score} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No attempts yet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
