"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { useWorkspace } from "./workspace";
import { cn } from "@/lib/cn";

/** Sub-navigation for the two parts of the Service Builder stage. */
export function ServiceBuilderTabs() {
  const path = usePathname();
  const { state } = useWorkspace();
  if (!state.profile) return null;
  const tabs = [
    { href: "/service-builder", label: "Offer", hint: "Audience, value, scope", done: !!state.offer },
    { href: "/service-builder/pricing", label: "Pricing Builder", hint: "Costs and packages", done: !!state.pricing },
  ];
  return (
    <nav aria-label="Service Builder sections" className="mb-6 grid grid-cols-2 gap-2 sm:inline-grid sm:auto-cols-fr sm:grid-flow-col">
      {tabs.map((t, i) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-colors sm:min-w-[210px]",
              active ? "border-violet/60 bg-violet-tint/60" : "border-line bg-surface hover:border-line-strong",
            )}
          >
            <span
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                t.done ? "bg-good/15 text-good" : active ? "bg-violet text-white" : "bg-surface-3 text-muted",
              )}
            >
              {t.done ? <Check className="h-3.5 w-3.5" aria-label="Saved" /> : i + 1}
            </span>
            <span className="min-w-0">
              <span className={cn("block truncate text-sm font-medium", active ? "text-ink" : "text-ink-2")}>{t.label}</span>
              <span className="hidden truncate text-xs text-muted sm:block">{t.hint}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
