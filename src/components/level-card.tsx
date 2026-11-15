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
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[radial-gradient(circle_at_35%_30%,rgb(242_190_106/0.4),rgb(242_190_106/0.08))] font-display text-xl font-semibold text-spark shadow-gold ring-1 ring-inset ring-spark/35">
          {level.level}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">
            Level {level.level} · {level.title}
          </p>
        </div>
        <p className="flex items-center gap-1 text-sm font-semibold text-spark">
          <Sparkles className="h-3.5 w-3.5" aria-hidden /> {level.xp} XP
        </p>
      </div>
      <Progress value={level.percent} tone="spark" className="mt-3" label="Progress to next level" />
      <p className="mt-1.5 text-xs text-muted">
        {level.into} / {level.span} XP · {level.toNext} XP to level {level.level + 1}
      </p>
    </>
  );
  const cls = cn("relative isolate block overflow-hidden glass rounded-2xl p-5 before:pointer-events-none before:absolute before:-bottom-16 before:-right-16 before:-z-10 before:h-48 before:w-48 before:rounded-full before:bg-spark/10 before:blur-3xl", href && "transition-colors hover:border-violet/40", className);
  return href ? <Link href={href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}
