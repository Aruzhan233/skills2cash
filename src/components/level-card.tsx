"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Progress } from "./ui";
import { cn } from "@/lib/cn";
import type { LevelInfo } from "@/lib/retention";

/** Current level, total XP and progress toward the next level. */
export function LevelCard({ level, href, className }: { level: LevelInfo; href?: string; className?: string }) {
  const body = (
    <>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet to-violet-strong text-lg font-bold text-white shadow-[0_0_18px_rgba(139,92,246,0.4)]">
          {level.level}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">Level {level.level}</p>
          <p className="truncate font-semibold text-ink">{level.title}</p>
        </div>
        <p className="flex items-center gap-1 text-sm font-semibold text-violet-soft">
          <Sparkles className="h-3.5 w-3.5" aria-hidden /> {level.xp} XP
        </p>
      </div>
      <Progress value={level.percent} className="mt-3" label="Progress to next level" />
      <p className="mt-1.5 text-xs text-muted">
        {level.into} / {level.span} XP · {level.toNext} XP to level {level.level + 1}
      </p>
    </>
  );
  const cls = cn("block rounded-2xl border border-line bg-surface p-4", href && "transition-colors hover:border-violet/40", className);
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}
