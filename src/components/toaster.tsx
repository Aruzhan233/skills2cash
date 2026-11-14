"use client";

import { useEffect } from "react";
import { AlertTriangle, Award, Sparkles, TrendingUp, X } from "lucide-react";
import { useWorkspace, type Toast } from "./workspace";
import { cn } from "@/lib/cn";

const ICON = { achievement: Award, xp: Sparkles, level: TrendingUp, warn: AlertTriangle } as const;

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, toast.kind === "warn" ? 10_000 : 6_500);
    return () => clearTimeout(t);
  }, [toast.kind, onClose]);
  const Icon = ICON[toast.kind];
  const warn = toast.kind === "warn";
  return (
    <div
      role={warn ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-surface-2 p-3 shadow-2xl",
        warn ? "border-warn/40" : "border-violet/40 shadow-[0_0_30px_rgba(139,92,246,0.18)]",
      )}
    >
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", warn ? "bg-warn/10 text-warn" : "bg-gradient-to-br from-violet to-violet-strong text-white")}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{toast.title}</p>
        {toast.body && <p className="mt-0.5 text-xs text-ink-2">{toast.body}</p>}
      </div>
      <button onClick={onClose} className="rounded p-1 text-muted hover:text-ink" aria-label="Dismiss notification">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Achievement, XP and level-up notifications. */
export function Toaster() {
  const { toasts, dismissToast } = useWorkspace();
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:left-auto sm:right-6 sm:w-[360px]">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onClose={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}
