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
        "glass-float pointer-events-auto flex w-full animate-toast-in items-start gap-3 rounded-2xl p-3",
        warn ? "border-warn/40" : "border-spark/35",
      )}
    >
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", warn ? "bg-warn/10 text-warn" : "animate-unlock bg-spark/15 text-spark")}>
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
