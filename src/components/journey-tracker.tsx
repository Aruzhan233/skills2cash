"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Progress } from "./ui";
import { cn } from "@/lib/cn";
import type { JourneyPhase } from "@/lib/retention";

/** Compact eight-phase journey strip: each phase with its real completion percentage. */
export function JourneyStrip({ phases, currentKey }: { phases: JourneyPhase[]; currentKey: string }) {
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
      {phases.map((p) => {
        const done = p.percent === 100;
        const cur = p.key === currentKey;
        return (
          <li key={p.key}>
            <Link
              href={`/progress#phase-${p.key}`}
              title={`${p.title}: ${p.done} of ${p.total} steps`}
              className={cn(
                "flex h-full flex-col rounded-xl border p-2.5 transition-colors hover:border-violet/50",
                cur ? "border-violet/60 bg-violet-tint/50" : "border-line bg-surface-2",
              )}
            >
              <span className="flex items-center justify-between gap-1">
                <span className={cn("grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold", done ? "bg-violet text-white" : cur ? "border border-violet text-violet-soft" : "bg-surface-3 text-muted")}>
                  {done ? <Check className="h-3 w-3" aria-hidden /> : p.number}
                </span>
                <span className={cn("text-[11px] font-medium", done ? "text-good" : cur ? "text-violet-soft" : "text-muted")}>{p.percent}%</span>
              </span>
              <span className={cn("mt-1.5 flex-1 text-xs font-medium leading-tight", done || cur ? "text-ink" : "text-ink-2")}>{p.title}</span>
              <Progress value={p.percent} className="mt-2 h-1" tone={done ? "good" : "violet"} label={`${p.title} progress`} />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
