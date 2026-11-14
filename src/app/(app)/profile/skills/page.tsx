"use client";

import Link from "next/link";
import { ChevronDown, Info, RefreshCw } from "lucide-react";
import { AchievementsList } from "@/components/achievements";
import { RequireProfile } from "@/components/require-profile";
import { SkillRadar } from "@/components/skill-radar";
import { Badge, Card, CardTitle, GeneratedBadge, LinkButton, Progress, SourceBadge } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { COMPETENCIES } from "@/lib/competencies";
import { formatDate } from "@/lib/cn";
import { achievements, competencyScores, recommendNext, type CompetencyScore } from "@/lib/progress";
import { levelLabel } from "@/lib/scoring";

const NEXT_FOR: Record<string, string> = {
  skill_capability: "Mission 5 — write a portfolio case study.",
  service_definition: "Mission 1 — one-sentence offer, then refine the Service Builder.",
  target_customer: "Mission 3 — customer problem and discovery questions.",
  pricing_rationale: "Pricing Builder + Mission 4 — three packages.",
  value_proposition: "Mission 6 — professional pitch.",
  client_communication: "Simulation — “Why should I hire you?”.",
  objection_handling: "Simulation — “Another freelancer offered a lower price”.",
  negotiation: "Simulation — “Can you do it cheaper?”.",
  closing: "Simulation — “I'm not sure I need this”.",
};

function SkillRow({ s }: { s: CompetencyScore }) {
  return (
    <details className="group rounded-lg px-2 py-2 hover:bg-surface-2 open:bg-surface-2">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-ink">
            {s.label}
            <ChevronDown className="h-3.5 w-3.5 text-muted transition-transform group-open:rotate-180" aria-hidden />
          </span>
          <span className="font-mono text-xs text-ink-2">{s.display === null ? "—" : `${s.display}/100`}</span>
        </div>
        <Progress value={s.display} tone={s.source === "demonstrated" ? "violet" : "muted"} className="mt-2" label={`${s.label} score`} />
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <SourceBadge source={s.source} />
          {s.display !== null && <span className="text-[11px] text-muted">{levelLabel(s.display)}</span>}
        </div>
      </summary>
      <div className="mt-3 space-y-2 border-t border-line pt-3 text-xs text-ink-2">
        <p>{COMPETENCIES[s.key].description}</p>
        <p>
          Self-reported: <strong className="text-ink">{s.selfReported ?? "—"}</strong> · Demonstrated:{" "}
          <strong className="text-ink">{s.demonstrated ?? "not yet"}</strong>
        </p>
        {s.evidence.length > 0 ? (
          <div>
            <p className="text-muted">Evidence ({s.evidence.length}):</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {s.evidence.slice(0, 5).map((e, i) => (
                <li key={i}>
                  {e.source} — {e.percent}/100
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-muted">No demonstrated evidence yet.</p>
        )}
        <p>
          <span className="text-muted">Next: </span>
          {NEXT_FOR[s.key]}
        </p>
      </div>
    </details>
  );
}

export default function SkillProfilePage() {
  return (
    <RequireProfile what="Your Skill Profile">
      <ProfileView />
    </RequireProfile>
  );
}

function ProfileView() {
    const { state } = useWorkspace();
    const p = state.profile!;
    const scores = competencyScores(state);
    const ach = achievements(state);
    const rec = recommendNext(state);
    const demonstrated = scores.filter((s) => s.demonstrated !== null);
    const sorted = [...demonstrated].sort((a, b) => (b.demonstrated ?? 0) - (a.demonstrated ?? 0));
    const kept = p.result.strengths.filter((s) => !p.rejectedStrengths.includes(s));
    return (
      <div>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <GeneratedBadge by={p.generatedBy} />
              <Badge>Assessment completed {formatDate(p.createdAt)}</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your Skill Profile</h1>
            <p className="mt-2 max-w-3xl text-sm text-ink-2">{p.result.summary}</p>
          </div>
          <LinkButton href="/onboarding" variant="secondary" size="sm">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Retake assessment
          </LinkButton>
        </div>

        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_280px]">
          <Card className="p-4">
            <CardTitle sub="Click a skill for details and evidence">Monetization Skills Tracker</CardTitle>
            <div className="-mx-2 space-y-0.5">
              {scores.map((s) => (
                <SkillRow key={s.key} s={s} />
              ))}
            </div>
            <Link href="/path" className="mt-4 block rounded-lg border border-line-strong px-3 py-2 text-center text-sm text-ink-2 hover:border-violet/50 hover:text-ink">
              View learning path
            </Link>
          </Card>

          <Card className="flex flex-col">
            <CardTitle sub="0–100 per competency. Dashed = self-reported, filled = demonstrated in missions and simulations.">
              Skill visualization
            </CardTitle>
            <SkillRadar scores={scores} />
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-surface-2 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-good">Strongest (demonstrated)</p>
                {sorted.length ? (
                  <ul className="mt-1.5 space-y-0.5 text-sm">
                    {sorted.slice(0, 3).map((s) => (
                      <li key={s.key}>
                        {s.label} — {s.demonstrated}/100
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-sm text-muted">Complete a mission or simulation to see demonstrated scores.</p>
                )}
              </div>
              <div className="rounded-xl border border-line bg-surface-2 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-warn">Development areas</p>
                {sorted.length ? (
                  <ul className="mt-1.5 space-y-0.5 text-sm">
                    {[...sorted]
                      .reverse()
                      .slice(0, 3)
                      .map((s) => (
                        <li key={s.key}>
                          {s.label} — {s.demonstrated}/100
                        </li>
                      ))}
                  </ul>
                ) : (
                  <ul className="mt-1.5 space-y-0.5 text-sm">
                    {p.result.gaps.map((g) => (
                      <li key={g.competency}>{COMPETENCIES[g.competency].label} (from assessment)</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-violet/30 bg-violet-tint/50 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-violet-soft">Recommended next action</p>
              <p className="mt-1 text-sm font-medium">{rec.title}</p>
              <p className="text-xs text-muted">{rec.reason}</p>
              <LinkButton href={rec.href} size="sm" className="mt-2">
                {rec.cta}
              </LinkButton>
            </div>
          </Card>

          <Card className="p-4" as="div">
            <div id="achievements" className="scroll-mt-24">
              <CardTitle sub={`${ach.filter((a) => a.earned).length} of ${ach.length} earned from real actions`}>Achievements</CardTitle>
              <AchievementsList items={ach} compact />
            </div>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card>
            <CardTitle>Service direction</CardTitle>
            <p className="font-medium">{p.direction.name}</p>
            <p className="mt-1 text-sm text-muted">For {p.direction.target_customer}</p>
            {p.directionEdited && <Badge className="mt-2">Edited by you</Badge>}
            <p className="mt-3 text-xs font-medium text-warn">Assumptions to validate</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-ink-2">
              {p.direction.assumptions_to_validate.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardTitle>Strengths from your assessment</CardTitle>
            <ul className="list-disc space-y-1 pl-4 text-sm text-ink-2">
              {kept.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs font-medium text-muted">Identified skills</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {p.result.identified_skills.map((s) => (
                <Badge key={s.name} tone={s.commercial ? "violet" : "neutral"}>
                  {s.name} · {s.level}/5
                </Badge>
              ))}
            </div>
          </Card>
          <Card>
            <CardTitle right={<Info className="h-4 w-4 text-muted" aria-hidden />}>How scores work</CardTitle>
            <ul className="space-y-1.5 text-sm text-ink-2">
              <li>
                <strong className="text-ink">Self-reported</strong> = your 1–5 rating from the assessment, shown as (rating − 1) × 25.
              </li>
              <li>
                <strong className="text-ink">Demonstrated</strong> = average of rubric scores from your latest attempt at each mission and your 3
                most recent simulations, same formula.
              </li>
              <li>Scores are learning indicators, not predictions of income.</li>
            </ul>
          </Card>
        </div>
      </div>
    );
  }
