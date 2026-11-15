"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { RequireProfile } from "@/components/require-profile";
import { GuestPaywall } from "@/components/guest-paywall";
import { Badge, Card, PageHeader, ScorePill } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { ASSIGNMENTS } from "@/lib/assignments";
import { COMPETENCIES } from "@/lib/competencies";
import { bestScoreByKey, PASS_SCORE, recommendNext } from "@/lib/progress";
import { cn } from "@/lib/cn";
import { STAGE_BY_KEY } from "@/lib/stages";

export default function AssignmentsPage() {
  return (
    <RequireProfile what="Your missions">
      <GuestPaywall feature="All missions"><List /></GuestPaywall>
    </RequireProfile>
  );
}

function List() {
  const { state } = useWorkspace();
  const best = bestScoreByKey(state.submissions);
  const recHref = recommendNext(state).href;
  const recKey = recHref.startsWith("/assignments/") ? recHref.split("/")[2] : null;
  const passed = ASSIGNMENTS.filter((a) => (best[a.key] ?? -1) >= PASS_SCORE).length;
  return (
    <div>
      <PageHeader
        title="Real-world missions"
        sub={`Practical tasks that produce learning evidence. Each gets rubric-based feedback and a score; ${PASS_SCORE}+ marks a mission complete. ${passed} of ${ASSIGNMENTS.length} complete.`}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {ASSIGNMENTS.map((a) => {
          const score = best[a.key];
          const attempts = state.submissions.filter((s) => s.assignmentKey === a.key).length;
          const done = typeof score === "number" && score >= PASS_SCORE;
          return (
            <Link key={a.key} href={`/assignments/${a.key}`} className="group">
              <Card className={cn("glass-hover h-full", recKey === a.key && "border-violet/50 shadow-glow-lg")}>
                <div className="flex items-start gap-3">
                  {done ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-good" aria-label="Completed" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-label="Not completed" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-ink transition-colors duration-150 group-hover:text-violet-soft">
                      {a.number}. {a.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted">{a.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Badge>Stage: {STAGE_BY_KEY[a.stage].title}</Badge>
                      {a.competencies.map((c) => (
                        <Badge key={c}>{COMPETENCIES[c].short}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    {attempts ? <ScorePill score={score ?? null} /> : <Badge>Not started</Badge>}
                    {attempts > 0 && <p className="mt-1 text-xs text-muted">{attempts} attempt{attempts > 1 ? "s" : ""}</p>}
                    {recKey === a.key && <p className="mt-2 text-xs font-medium text-violet-soft">Next step</p>}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
