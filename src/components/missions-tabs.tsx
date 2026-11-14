"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "./workspace";
import { cn } from "@/lib/cn";
import { ASSIGNMENTS } from "@/lib/assignments";
import { bestScoreByKey, PASS_SCORE } from "@/lib/progress";
import { weeklyStats } from "@/lib/retention";

/** Switches between the two kinds of missions. Hidden on individual mission pages. */
export function MissionsTabs() {
  const path = usePathname();
  const { state } = useWorkspace();
  if (!state.profile || (path !== "/assignments" && path !== "/assignments/weekly")) return null;
  const week = weeklyStats(state);
  const best = bestScoreByKey(state.submissions);
  const passed = ASSIGNMENTS.filter((a) => (best[a.key] ?? -1) >= PASS_SCORE).length;
  const tabs = [
    { href: "/assignments/weekly", label: "Weekly missions", hint: `${week.completed} of ${week.total} done this week` },
    { href: "/assignments", label: "Skill missions", hint: `${passed} of ${ASSIGNMENTS.length} complete · AI feedback` },
  ];
  return (
    <nav aria-label="Mission types" className="mb-6 grid grid-cols-2 gap-2 sm:inline-grid sm:auto-cols-fr sm:grid-flow-col">
      {tabs.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-xl border px-3.5 py-2 transition-colors sm:min-w-[230px]",
              active ? "border-violet/60 bg-violet-tint/60" : "border-line bg-surface hover:border-line-strong",
            )}
          >
            <span className={cn("block text-sm font-medium", active ? "text-ink" : "text-ink-2")}>{t.label}</span>
            <span className="block truncate text-xs text-muted">{t.hint}</span>
          </Link>
        );
      })}
    </nav>
  );
}
