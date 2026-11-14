"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Award, FlaskConical, HardDrive, LogOut, Menu, RotateCcw, User, X } from "lucide-react";
import { Logo } from "./logo";
import { useWorkspace } from "./workspace";
import { Button, ErrorState, PageLoader } from "./ui";
import { achievements, computeReadiness } from "@/lib/progress";
import { cn } from "@/lib/cn";

export const NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/profile/skills", label: "My Skills" },
  { href: "/path", label: "Learning Path" },
  { href: "/service-builder", label: "Service Builder" },
  { href: "/pricing", label: "Pricing" },
  { href: "/subscription", label: "Subscription" },
  { href: "/practice", label: "Practice" },
  { href: "/assignments", label: "Missions" },
  { href: "/readiness", label: "Readiness" },
];

function isActive(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

function UserMenu() {
  const ws = useWorkspace();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const name = ws.state.profile?.displayName || ws.auth.email || "You";
  const initials = name
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-line-strong bg-surface-2 py-1 pl-1 pr-3 text-sm hover:border-violet/50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-violet-tint text-xs font-semibold text-violet-soft">{initials || "U"}</span>
        <span className="hidden max-w-[120px] truncate text-ink-2 lg:block">{name}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-line-strong bg-surface-2 p-1.5 shadow-2xl">
          <div className="px-3 py-2 text-xs text-muted">
            {ws.mode === "demo" ? "Demo workspace (Alex)" : ws.auth.email ? `Signed in as ${ws.auth.email}` : "Local workspace"}
          </div>
          <Link role="menuitem" href="/profile/skills" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-surface-3">
            <User className="h-4 w-4" aria-hidden /> Profile
          </Link>
          {ws.mode === "demo" ? (
            <button
              role="menuitem"
              onClick={() => {
                ws.exitDemo();
                setOpen(false);
                router.push("/");
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-surface-3"
            >
              <LogOut className="h-4 w-4" aria-hidden /> Exit demo
            </button>
          ) : ws.auth.status === "signed_in" ? (
            <button
              role="menuitem"
              onClick={async () => {
                await ws.signOut();
                setOpen(false);
                router.push("/login");
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-surface-3"
            >
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ModeBanner() {
  const ws = useWorkspace();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [transferError, setTransferError] = useState("");
  if (ws.mode === "demo") {
    return (
      <div className="border-b border-warn/20 bg-warn/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-xs text-ink-2 sm:px-6">
          <span className="flex items-center gap-1.5 font-semibold text-warn">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden /> DEMO MODE
          </span>
          <span className="min-w-0 basis-full sm:basis-auto sm:flex-1">
            Alex&apos;s profile is pre-written sample data. Your demo progress is saved only in this browser and isolated from other visitors.
          </span>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" className="accent-violet" checked={ws.scripted} onChange={(e) => ws.setScripted(e.target.checked)} />
            Scripted mode (no AI)
          </label>
          <button
            className="flex items-center gap-1 underline-offset-2 hover:underline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await ws.startDemo({ fresh: true });
              setBusy(false);
              router.push("/dashboard");
            }}
          >
            <RotateCcw className="h-3 w-3" aria-hidden /> Reset demo
          </button>
          <button
            className="underline-offset-2 hover:underline"
            onClick={() => {
              ws.exitDemo();
              router.push("/");
            }}
          >
            Exit demo
          </button>
        </div>
      </div>
    );
  }
  if (ws.guest) {
    return (
      <div className="border-b border-violet/20 bg-violet-tint/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2 text-xs text-ink-2 sm:px-6">
          Guest workspace — progress is saved in this browser. {ws.auth.status === "signed_in" ? (
            <button disabled={busy} onClick={async () => { setBusy(true); setTransferError(""); try { await ws.migrateGuestData(); } catch (e) { setTransferError((e as Error).message); } finally { setBusy(false); } }} className="font-semibold text-violet-soft underline">{busy ? "Transferring…" : "Transfer progress to my account"}</button>
          ) : <Link href="/signup?next=%2Fdashboard" className="font-semibold text-violet-soft underline">Create an account to keep it</Link>}
          {transferError && <span role="alert" className="basis-full text-danger">Transfer failed: {transferError} Your guest data is still saved here.</span>}
        </div>
      </div>
    );
  }
  if (ws.storage === "local") {
    return (
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-xs text-muted sm:px-6">
          <HardDrive className="h-3.5 w-3.5" aria-hidden />
          Local mode — cloud sync (Supabase) is not configured on this deployment, so progress is saved in this browser.
        </div>
      </div>
    );
  }
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const ws = useWorkspace();
  const path = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (ws.status === "needs_auth") router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [ws.status, path, router]);
  useEffect(() => setMobileOpen(false), [path]);

  const readiness = ws.status === "ready" ? computeReadiness(ws.state) : null;
  const earned = ws.status === "ready" ? achievements(ws.state).filter((a) => a.earned).length : 0;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Logo href="/dashboard" />
          <nav className="scrollbar-none hidden flex-1 items-center gap-1 overflow-x-auto lg:flex" aria-label="Main">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  isActive(path, n.href) ? "bg-surface-3 text-ink" : "text-muted hover:text-ink",
                )}
                aria-current={isActive(path, n.href) ? "page" : undefined}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/readiness"
              className="hidden items-center gap-1.5 rounded-full border border-line-strong px-2.5 py-1 text-xs text-ink-2 hover:border-violet/50 sm:flex"
              title="Monetization readiness (learning indicator, not an income prediction)"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-violet" aria-hidden />
              Readiness {readiness?.overall ?? "—"}
            </Link>
            <Link
              href="/profile/skills#achievements"
              className="hidden items-center gap-1 rounded-full border border-line-strong px-2.5 py-1 text-xs text-ink-2 hover:border-violet/50 sm:flex"
              title="Achievements earned"
            >
              <Award className="h-3.5 w-3.5 text-violet-soft" aria-hidden /> {earned}
            </Link>
            <UserMenu />
            <button className="rounded-lg p-2 text-ink-2 hover:bg-surface-3 lg:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Open menu" aria-expanded={mobileOpen}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="grid grid-cols-2 gap-1 border-t border-line px-4 py-3 lg:hidden" aria-label="Mobile">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn("rounded-lg px-3 py-2 text-sm", isActive(path, n.href) ? "bg-surface-3 text-ink" : "text-ink-2 hover:bg-surface-2")}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <ModeBanner />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {ws.status === "loading" || ws.status === "needs_auth" ? (
          <PageLoader label={ws.status === "needs_auth" ? "Redirecting to sign in…" : "Loading your workspace…"} />
        ) : ws.status === "error" ? (
          <ErrorState title="Could not load your data" message={ws.error ?? "Unknown error"} onRetry={ws.reload}>
            {ws.mode === "live" && (
              <Button size="sm" variant="ghost" onClick={() => router.push("/demo")}>
                Open the demo instead
              </Button>
            )}
          </ErrorState>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
