"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, ChevronRight, CreditCard, FlaskConical, HardDrive, Home, LogOut, Menu, RotateCcw, Sparkles, TrendingUp, User, X } from "lucide-react";
import { Logo } from "./logo";
import { useWorkspace } from "./workspace";
import { Button, ErrorState, PageLoader } from "./ui";
import { ASSIGNMENT_BY_KEY } from "@/lib/assignments";
import { JOURNEY, journeyProgress, journeyStepForPath, nextAfter, type JourneyKey, type JourneyProgress } from "@/lib/journey";
import { computeReadiness } from "@/lib/progress";
import { journeyPercent, journeyPhases, levelFor, totalXp, type LevelInfo } from "@/lib/retention";
import { SCENARIO_BY_KEY } from "@/lib/scenarios";
import { Toaster } from "./toaster";
import { cn } from "@/lib/cn";

/** Account pages live in the user menu, outside the learning journey. */
const ACCOUNT_PAGES = [{ href: "/subscription", label: "Subscription & billing" }];

function isActive(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

/** Breadcrumb trail for the current page: Dashboard › stage › sub-page. ("Home" is the public site at /.) */
function crumbsFor(path: string): Array<{ label: string; href?: string }> {
  const account = ACCOUNT_PAGES.find((a) => isActive(path, a.href));
  if (account) return [{ label: "Account" }, { label: account.label }];
  if (isActive(path, "/progress")) return [{ label: "Dashboard", href: "/dashboard" }, { label: "Progress tracker" }];
  if (isActive(path, "/dashboard")) return [{ label: "Dashboard" }];
  const step = journeyStepForPath(path);
  if (!step) return [];
  const trail: Array<{ label: string; href?: string }> = [{ label: "Dashboard", href: "/dashboard" }];
  let sub: string | null = null;
  if (path === "/onboarding") sub = "Skill assessment";
  else if (path === "/service-builder/pricing") sub = "Pricing Builder";
  else if (path.startsWith("/practice/session/")) sub = "Session review";
  else if (path.startsWith("/practice/")) sub = SCENARIO_BY_KEY[path.split("/")[2]]?.title ?? "Simulation";
  else if (path === "/assignments/weekly") sub = "Weekly missions";
  else if (path.startsWith("/assignments/")) {
    const m = ASSIGNMENT_BY_KEY[path.split("/")[2]];
    sub = m ? `Mission ${m.number}` : "Mission";
  }
  trail.push(sub ? { label: step.label, href: step.href } : { label: step.label });
  if (sub) trail.push({ label: sub });
  return trail;
}

function Crumbs({ path }: { path: string }) {
  const crumbs = crumbsFor(path);
  const step = journeyStepForPath(path);
  if (!crumbs.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.label} className={cn("flex items-center gap-1.5", last ? "min-w-0" : "hidden shrink-0 sm:flex")}>
              {i > 0 && <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-line-strong sm:block" aria-hidden />}
              {c.href ? (
                <Link href={c.href} className="transition-colors duration-150 hover:text-ink">{c.label}</Link>
              ) : (
                <span className={cn("truncate", last && "font-medium text-ink")} aria-current={last ? "page" : undefined}>{c.label}</span>
              )}
            </li>
          );
        })}
        {step && (
          <li className="ml-2 hidden shrink-0 text-xs text-muted md:block" aria-label={`Journey step ${step.number} of ${JOURNEY.length}`}>
            Step {step.number} of {JOURNEY.length}
          </li>
        )}
      </ol>
    </nav>
  );
}

/** Suggests the following stage. A recommendation only — every stage stays freely accessible. */
function NextStep({ path }: { path: string }) {
  const next = nextAfter(path);
  if (!next) return null;
  return (
    <Link
      href={next.href}
      className="group mt-12 flex items-center justify-between gap-4 border-t border-line pt-6 text-sm"
    >
      <span className="min-w-0">
        <span className="block font-semibold text-ink transition-colors duration-150 group-hover:text-violet-soft">Next: {next.label}</span>
        <span className="mt-0.5 block text-muted">{next.description}</span>
      </span>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-3 text-ink transition-[background-color,transform] duration-200 ease-out-expo group-hover:translate-x-1 group-hover:bg-violet-strong">
        <ArrowRight className="h-4 w-4" aria-hidden />
      </span>
    </Link>
  );
}

/**
 * The signature of the product: the six journey steps as one continuous lit path.
 * Completed stretches of the line are violet; the current page is the lamp.
 */
function JourneyRail({
  path,
  progress,
  readiness,
  level,
  earned,
  homeHref,
  onNavigate,
}: {
  path: string;
  progress: Record<JourneyKey, JourneyProgress> | null;
  readiness: number | null;
  level: LevelInfo | null;
  earned: number;
  homeHref: string;
  onNavigate?: () => void;
}) {
  const activeStep = journeyStepForPath(path);
  const nextKey = progress ? JOURNEY.find((s) => progress[s.key].status !== "done")?.key : undefined;
  const item = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
      active ? "bg-[linear-gradient(90deg,rgb(120_43_255/0.3),rgb(120_43_255/0.05))] font-medium text-ink ring-1 ring-inset ring-violet/30" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
    );
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center px-5">
        <Logo href="/" size={28} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-2" aria-label="Main">
        {/* Home is the user's workspace; the logo above is the way back to the public site. */}
        <Link href={homeHref} onClick={onNavigate} className={item(isActive(path, "/dashboard"))} aria-current={isActive(path, "/dashboard") ? "page" : undefined}>
          <Home className="h-4 w-4 shrink-0 text-muted" aria-hidden /> Home
        </Link>

        <h2 className="mb-1 mt-6 px-3 text-xs font-medium text-muted">Your journey</h2>
        <ol>
          {JOURNEY.map((s, i) => {
            const st = progress?.[s.key].status ?? "todo";
            const active = activeStep?.key === s.key;
            const done = st === "done";
            return (
              <li key={s.key} className="relative">
                {/* the path: violet where the step above it is complete */}
                {i < JOURNEY.length - 1 && (
                  <span
                    className={cn(
                      "absolute left-[23px] top-[34px] h-[calc(100%-22px)] w-px transition-colors duration-500",
                      done ? "bg-[linear-gradient(180deg,#c5a7ff,#782bff)] shadow-[0_0_8px_rgb(150_63_255/0.8)]" : "bg-line-strong",
                    )}
                    aria-hidden
                  />
                )}
                <Link
                  href={s.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  title={`Step ${s.number}: ${s.phase}`}
                  className={cn(
                    "relative flex items-start gap-3 rounded-lg px-3 py-2 transition-colors duration-150",
                    active ? "bg-[linear-gradient(90deg,rgb(120_43_255/0.3),rgb(120_43_255/0.05))] ring-1 ring-inset ring-violet/30" : "hover:bg-surface-2",
                  )}
                >
                  <span
                    className={cn(
                      "relative z-10 mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full text-xs font-semibold",
                      done
                        ? "bg-[linear-gradient(180deg,#a45cff,#782bff)] text-white shadow-[0_2px_10px_rgb(150_63_255/0.6)]"
                        : active
                          ? "bg-violet-strong text-white ring-4 ring-violet/25 shadow-[0_2px_12px_rgb(150_63_255/0.7)]"
                          : s.key === nextKey
                            ? "border border-violet bg-violet-tint text-violet-soft ring-4 ring-violet/15"
                            : st === "in_progress"
                            ? "border border-violet/70 bg-rail text-violet-soft"
                            : "border border-line-strong bg-rail text-muted",
                    )}
                  >
                    {done ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : s.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("text-sm", active ? "font-medium text-ink" : done || st === "in_progress" ? "text-ink-2" : "text-muted")}>
                        {s.label}
                        {s.key === nextKey && !active && <span className="ml-1.5 text-xs font-medium text-violet-soft">Next</span>}
                      </span>
                      {s.key === "readiness" && readiness !== null && <span className="text-xs font-medium text-ink-2">{readiness}</span>}
                    </span>
                    {progress && <span className="block truncate text-xs text-muted">{progress[s.key].detail}</span>}
                    <span className="sr-only">{done ? "Complete" : st === "in_progress" ? "In progress" : "Not started"}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <Link
          href="/progress"
          onClick={onNavigate}
          aria-current={isActive(path, "/progress") ? "page" : undefined}
          className={cn("glass block rounded-xl px-3 py-3 transition-colors duration-150", isActive(path, "/progress") ? "ring-1 ring-inset ring-spark/30" : "hover:border-spark/30")}
        >
          {level ? (
            <>
              <span className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-ink">Level {level.level} · {level.title}</span>
                <span className="flex items-center gap-1 text-xs font-medium text-spark">
                  <Sparkles className="h-3 w-3" aria-hidden /> {level.xp} XP
                </span>
              </span>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={level.percent} aria-label="Progress to next level">
                <span className="block h-full rounded-full bg-[linear-gradient(90deg,#d99a3c,#f2be6a)] shadow-[0_0_10px_rgb(242_190_106/0.5)] transition-[width] duration-700 ease-out-expo" style={{ width: `${level.percent}%` }} />
              </span>
              <span className="mt-1.5 block text-xs text-muted">
                {level.toNext} XP to level {level.level + 1} · {earned} achievement{earned === 1 ? "" : "s"}
              </span>
            </>
          ) : (
            <span className="flex items-center gap-3 text-sm text-ink-2">
              <TrendingUp className="h-4 w-4 text-muted" aria-hidden /> Progress &amp; achievements
            </span>
          )}
        </Link>
      </div>
    </div>
  );
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
        className="flex items-center gap-2 rounded-full border border-line-strong bg-surface-2 py-1 pl-1 pr-1 text-sm backdrop-blur-md transition-colors duration-150 hover:bg-surface-3 xl:pr-3"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[linear-gradient(135deg,#963fff,#321078)] text-xs font-semibold text-white">{initials || "U"}</span>
        <span className="hidden max-w-[120px] truncate text-ink-2 xl:block">{name}</span>
      </button>
      {open && (
        <div role="menu" className="glass-float absolute right-0 z-50 mt-2 w-64 animate-fade-in rounded-2xl p-1.5">
          <div className="px-3 py-2 text-xs text-muted">
            {ws.mode === "demo" ? "Demo workspace (Alex)" : ws.auth.email ? `Signed in as ${ws.auth.email}` : "Local workspace"}
          </div>
          <Link role="menuitem" href="/profile/skills" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-surface-3">
            <User className="h-4 w-4" aria-hidden /> Skill Profile
          </Link>
          <Link role="menuitem" href="/progress" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-surface-3">
            <TrendingUp className="h-4 w-4" aria-hidden /> Progress &amp; achievements
          </Link>
          <Link role="menuitem" href="/subscription" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-surface-3">
            <CreditCard className="h-4 w-4" aria-hidden /> Subscription &amp; billing
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
      <div className="border-b border-line bg-warn/[0.06]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-xs text-ink-2 sm:px-6 lg:px-10">
          <span className="flex items-center gap-1.5 font-semibold text-warn">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden /> Demo mode
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
      <div className="border-b border-line bg-violet-tint/50">
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 text-xs text-ink-2 sm:px-6 lg:px-10">
          Guest workspace — progress is saved in this browser. {ws.auth.status === "signed_in" ? (
            <button disabled={busy} onClick={async () => { setBusy(true); setTransferError(""); try { await ws.migrateGuestData(); } catch (e) { setTransferError((e as Error).message); } finally { setBusy(false); } }} className="font-semibold text-violet-soft underline">{busy ? "Transferring…" : "Transfer progress to my account"}</button>
          ) : <Link href="/signup?next=%2Fdashboard" className="font-semibold text-violet-soft underline">Create an account to keep it</Link>}
          {transferError && <span role="alert" className="basis-full text-bad">Transfer failed: {transferError} Your guest data is still saved here.</span>}
        </div>
      </div>
    );
  }
  if (ws.storage === "local") {
    return (
      <div className="border-b border-line bg-surface">
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted sm:px-6 lg:px-10">
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
  const [mobileTop, setMobileTop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setMobileTop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (ws.status === "needs_auth") router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [ws.status, path, router]);
  useEffect(() => setMobileOpen(false), [path]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const ready = ws.status === "ready";
  const readiness = ready ? computeReadiness(ws.state).overall : null;
  const progress = ready ? journeyProgress(ws.state) : null;
  const level = ready && ws.state.profile ? levelFor(totalXp(ws.state.xp)) : null;
  // Home goes to the workspace when there is one (account, guest, demo or local mode); otherwise to the public site.
  const hasWorkspace = ws.auth.status === "signed_in" || ws.guest || ws.mode === "demo" || ws.storage === "local";
  const homeHref = hasWorkspace ? "/dashboard" : "/";
  // The horizon rises and brightens as the journey advances (0–100).
  const lit = ready && ws.state.profile ? journeyPercent(journeyPhases(ws.state)) : 0;
  const earned = ready ? new Set(ws.state.xp.filter((t) => t.source === "achievement").map((t) => t.refKey)).size : 0;
  const rail = (onNavigate?: () => void) => <JourneyRail path={path} progress={progress} readiness={readiness} level={level} earned={earned} homeHref={homeHref} onNavigate={onNavigate} />;

  return (
    <div className="relative min-h-screen lg:pl-[264px]">
      <div className="sky" aria-hidden />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-line bg-[linear-gradient(180deg,rgb(30_14_64/0.75),rgb(16_10_28/0.8)_40%)] backdrop-blur-xl lg:block">{rail()}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <aside className="glass-float absolute inset-y-0 left-0 w-[min(288px,86vw)] animate-fade-in rounded-none border-y-0 border-l-0" aria-label="Navigation">
            <button className="absolute right-3 top-3 z-10 rounded-lg p-2 text-ink-2 hover:bg-surface-3" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {rail(() => setMobileOpen(false))}
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-[rgb(8_6_13/0.55)] px-4 backdrop-blur-xl sm:px-6 lg:px-10">
        <button className="-ml-2 rounded-lg p-2 text-ink-2 hover:bg-surface-3 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu" aria-expanded={mobileOpen}>
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <Crumbs path={path} />
        </div>
        <UserMenu />
      </header>
      <div className="relative z-10">
        <ModeBanner />
      </div>
      {/* the horizon: a planet-edge of light rising behind the top of every page */}
      <div className="pointer-events-none absolute inset-x-0 top-14 z-0 h-[680px] overflow-hidden lg:left-[264px] [mask-image:linear-gradient(180deg,#000_420px,transparent_520px)] md:[mask-image:linear-gradient(180deg,#000_330px,transparent_420px)]" aria-hidden>
        <div
          className="horizon w-[max(150%,1100px)] transition-[top,opacity] duration-[1600ms] ease-out-expo"
          style={{ top: `${(mobileTop ? 430 : 340) - lit * 0.25}px`, opacity: 0.45 + (lit / 100) * 0.55 }}
        />
      </div>
      <main className="relative z-10 mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
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
          <>
            {children}
            {ws.state.profile && <NextStep path={path} />}
          </>
        )}
      </main>
      <Toaster />
    </div>
  );
}
