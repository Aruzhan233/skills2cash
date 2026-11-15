"use client";

import Link from "next/link";
import {
  Award,
  BadgeDollarSign,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Compass,
  Flag,
  Flame,
  Hammer,
  Handshake,
  ListChecks,
  Lock,
  MessagesSquare,
  Rocket,
  Search,
  Shield,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { Achievement } from "@/lib/progress";
import { cn, formatDate } from "@/lib/cn";

const ICONS: Record<string, LucideIcon> = {
  assessment: ClipboardCheck,
  "skill-explorer": Compass,
  "first-offer": Hammer,
  "first-mission": Flag,
  "market-researcher": Search,
  pricing: BadgeDollarSign,
  "first-portfolio": Briefcase,
  "first-simulation": MessagesSquare,
  objection: Shield,
  improved: TrendingUp,
  "practice-champion": Trophy,
  "sales-ready": Handshake,
  "all-missions": ListChecks,
  "launch-ready": Rocket,
  "weekly-first": CalendarCheck,
  "weekly-full": CalendarDays,
  "weekly-ten": Flame,
};

export function AchievementsList({ items, compact, grid }: { items: Achievement[]; compact?: boolean; grid?: boolean }) {
  const sorted = [...items].sort((a, b) => Number(b.earned) - Number(a.earned));
  return (
    <ul className={cn(grid ? "grid gap-x-6 gap-y-1 sm:grid-cols-2 xl:grid-cols-3" : "divide-y divide-line", compact && !grid && "divide-y divide-line")}>
      {sorted.map((a) => {
        const Icon = ICONS[a.key] ?? Award;
        return (
          <li key={a.key}>
            <Link
              href={a.href}
              className={cn(
                "-mx-2 flex h-full items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-surface-2",
              )}
            >
              <span
                className={cn(
                  "relative grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                  a.earned ? "bg-[radial-gradient(circle_at_35%_30%,rgb(242_190_106/0.35),rgb(242_190_106/0.08))] text-spark ring-1 ring-inset ring-spark/35 shadow-gold" : "bg-surface-3 text-muted ring-1 ring-inset ring-line",
                )}
                aria-hidden
              >
                <Icon className={cn("h-5 w-5", !a.earned && "opacity-60")} />
                {!a.earned && (
                  <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full border border-line-strong bg-surface-2">
                    <Lock className="h-2.5 w-2.5" />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm font-medium", a.earned ? "text-ink" : "text-ink-2")}>{a.title}</span>
                <span className="block text-xs text-muted">{a.earned ? `Earned ${formatDate(a.earnedAt)}` : a.description}</span>
              </span>
              <span className={cn("shrink-0 text-xs font-medium tabular-nums", a.earned ? "text-spark" : "text-muted")}>
                {a.earned ? "+" : ""}
                {a.xp} XP
              </span>
              <span className="sr-only">{a.earned ? "Unlocked" : "Locked"}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
