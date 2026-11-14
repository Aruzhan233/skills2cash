"use client";

import Link from "next/link";
import { Award, Lock } from "lucide-react";
import type { Achievement } from "@/lib/progress";
import { cn, formatDate } from "@/lib/cn";

export function AchievementsList({ items, compact }: { items: Achievement[]; compact?: boolean }) {
  const sorted = [...items].sort((a, b) => Number(b.earned) - Number(a.earned));
  return (
    <ul className={cn("space-y-2.5", compact && "space-y-2")}>
      {sorted.map((a) => (
        <li key={a.key}>
          <Link
            href={a.href}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3 transition-colors",
              a.earned ? "border-violet/30 bg-violet-tint/60 hover:border-violet/60" : "border-line bg-surface-2/50 hover:border-line-strong",
            )}
          >
            <span
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                a.earned ? "bg-gradient-to-br from-violet to-violet-strong text-white" : "bg-surface-3 text-muted",
              )}
              aria-hidden
            >
              {a.earned ? <Award className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
            </span>
            <span className="min-w-0">
              <span className={cn("block text-sm font-medium", a.earned ? "text-ink" : "text-ink-2")}>{a.title}</span>
              <span className="block text-xs text-muted">
                {a.earned ? `Earned ${formatDate(a.earnedAt)}` : a.description}
              </span>
            </span>
            <span className="sr-only">{a.earned ? "Earned" : "Locked"}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
