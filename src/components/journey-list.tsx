"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { JOURNEY, type JourneyKey, type JourneyProgress } from "@/lib/journey";

/** The six journey steps as a connected vertical stepper with live status. */
export function JourneyList({ progress }: { progress: Record<JourneyKey, JourneyProgress> }) {
  const current = JOURNEY.find((s) => progress[s.key].status !== "done")?.key;
  return (
    <ol>
      {JOURNEY.map((s, i) => {
        const p = progress[s.key];
        const done = p.status === "done";
        const isCurrent = s.key === current;
        return (
          <li key={s.key} className="relative">
            {i < JOURNEY.length - 1 && <span className={cn("absolute left-[19px] top-9 h-[calc(100%-1.5rem)] w-px", done ? "bg-[linear-gradient(180deg,#c5a7ff,#782bff)] shadow-[0_0_8px_rgb(150_63_255/0.7)]" : "bg-line-strong")} aria-hidden />}
            <Link href={s.href} className="flex items-start gap-3 rounded-lg p-2 hover:bg-surface-2">
              <span
                className={cn(
                  "relative grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  done ? "bg-[linear-gradient(180deg,#a45cff,#782bff)] text-white shadow-[0_2px_10px_rgb(150_63_255/0.6)]" : isCurrent ? "border border-violet bg-violet-tint text-violet-soft" : "bg-surface-3 text-muted",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : s.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className={cn("text-sm font-medium", done || isCurrent ? "text-ink" : "text-ink-2")}>{s.label}</span>
                  {isCurrent && <span className="rounded-md bg-violet-tint px-1.5 py-0.5 text-xs font-medium text-violet-soft">Next up</span>}
                </span>
                <span className="block text-xs text-muted">{p.detail}</span>
                <span className="sr-only">{done ? "Complete" : p.status === "in_progress" ? "In progress" : "Not started"}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
