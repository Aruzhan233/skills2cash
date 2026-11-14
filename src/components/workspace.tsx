"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/client/supabase";
import { LocalRepository, SupabaseRepository, type Repository } from "@/lib/client/repository";
import { buildDemoState } from "@/lib/demo";
import { newId } from "@/lib/id";
import { achievements, computeReadiness, currentStage, stageProgress } from "@/lib/progress";
import { CompletionNoteSchema, generateWeeklyMissions, levelFor, totalXp, weekStartOf } from "@/lib/retention";
import {
  EMPTY_STATE,
  READINESS_KEYS,
  type AssignmentSubmission,
  type Mode,
  type PricingWorksheet,
  type ReadinessSnapshot,
  type RoleplaySession,
  type ServiceOffer,
  type SkillProfile,
  type WeeklyMission,
  type WorkspaceState,
  type XpTransaction,
} from "@/lib/types";

type AuthStatus = "loading" | "signed_in" | "signed_out" | "disabled";
export type LoadStatus = "loading" | "ready" | "error" | "needs_auth";

export interface GuestUsage { assessments_used: number; offers_created: number; simulations_completed: number }
export interface GuestData { sessionId: string; createdAt: string; usage: GuestUsage }
const GUEST_MODE_KEY = "skills2cash_guest_session";
const GUEST_DATA_KEY = "skills2cash_guest_data";
const EMPTY_USAGE: GuestUsage = { assessments_used: 0, offers_created: 0, simulations_completed: 0 };

function persistGuestUsage(usage: GuestUsage) {
  try {
    const previous = JSON.parse(localStorage.getItem(GUEST_DATA_KEY) || "null") as Partial<GuestData> | null;
    localStorage.setItem(GUEST_DATA_KEY, JSON.stringify({
      ...previous,
      sessionId: previous?.sessionId ?? newId(),
      createdAt: previous?.createdAt ?? new Date().toISOString(),
      usage,
    } satisfies GuestData));
  } catch { throw new Error("Could not save guest plan usage in browser storage."); }
}

export interface Toast {
  id: string;
  kind: "achievement" | "xp" | "level" | "warn";
  title: string;
  body?: string;
}

interface WorkspaceCtx {
  /** Marks a weekly mission as done (self-reported, with a short note) and awards its XP once. */
  completeWeeklyMission: (id: string, note: string) => Promise<void>;
  /** "browser" when weekly missions and XP cannot be stored in the database yet. */
  retentionStorage: "database" | "browser";
  toasts: Toast[];
  dismissToast: (id: string) => void;
  mode: Mode;
  guest: boolean;
  guestUsage: GuestUsage;
  beginGuest: () => void;
  clearGuest: () => void;
  migrateGuestData: () => Promise<void>;
  scripted: boolean;
  setScripted: (v: boolean) => void;
  auth: { status: AuthStatus; email: string | null };
  storage: "supabase" | "local" | "demo" | null;
  state: WorkspaceState;
  status: LoadStatus;
  error: string | null;
  reload: () => void;
  saveProfile: (p: SkillProfile) => Promise<void>;
  saveOffer: (o: ServiceOffer) => Promise<void>;
  savePricing: (p: PricingWorksheet) => Promise<void>;
  addSubmission: (s: AssignmentSubmission) => Promise<void>;
  saveSession: (s: RoleplaySession) => Promise<void>;
  resetWorkspace: () => Promise<void>;
  startDemo: (opts?: { fresh?: boolean; scripted?: boolean }) => Promise<void>;
  exitDemo: () => void;
  signOut: () => Promise<void>;
  /** Options to pass to callAI for the current mode. */
  aiOpts: { offline: boolean; fallbackOnError: boolean };
}

const Ctx = createContext<WorkspaceCtx | null>(null);

const MODE_KEY = "s2c:mode";
const SCRIPTED_KEY = "s2c:scripted";
const VISITOR_KEY = "s2c:visitor";

function visitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = newId();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

/** Demo progress is isolated per visitor (random id per browser). */
function demoRepo(): LocalRepository {
  return new LocalRepository(`s2c:demo:${visitorId()}`, localStorage);
}

function snapshotChanged(prev: ReadinessSnapshot | undefined, next: Omit<ReadinessSnapshot, "id" | "createdAt">) {
  if (!prev) return next.overall !== null;
  return prev.overall !== next.overall || READINESS_KEYS.some((k) => prev.dimensions[k] !== next.dimensions[k]);
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [guest, setGuest] = useState(false);
  const [guestUsage, setGuestUsage] = useState<GuestUsage>(EMPTY_USAGE);
  const [scripted, setScriptedState] = useState(false);
  const [auth, setAuth] = useState<{ status: AuthStatus; email: string | null; userId: string | null }>({
    status: supabaseConfigured ? "loading" : "disabled",
    email: null,
    userId: null,
  });
  const [state, setState] = useState<WorkspaceState>(EMPTY_STATE);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  // mode + scripted flag from storage
  useEffect(() => {
    setMode(localStorage.getItem(MODE_KEY) === "demo" ? "demo" : "live");
    setGuest(localStorage.getItem(GUEST_MODE_KEY) === "1");
    try {
      const stored = JSON.parse(localStorage.getItem(GUEST_DATA_KEY) || "null") as GuestData | null;
      if (stored?.usage) setGuestUsage({ ...EMPTY_USAGE, ...stored.usage });
    } catch { /* malformed guest counters reset safely */ }
    setScriptedState(localStorage.getItem(SCRIPTED_KEY) === "1");
  }, []);

  // auth session
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setAuth({ status: u ? "signed_in" : "signed_out", email: u?.email ?? null, userId: u?.id ?? null });
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      setAuth({ status: u ? "signed_in" : "signed_out", email: u?.email ?? null, userId: u?.id ?? null });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const repo: Repository | null = useMemo(() => {
    if (mode === null || typeof window === "undefined") return null;
    if (mode === "demo") return demoRepo();
    if (guest) return new LocalRepository(GUEST_DATA_KEY, localStorage);
    if (!supabaseConfigured) return new LocalRepository("s2c:local", localStorage);
    const sb = getSupabase();
    if (sb && auth.status === "signed_in" && auth.userId) return new SupabaseRepository(sb, auth.userId);
    return null;
  }, [mode, guest, auth.status, auth.userId]);

  const storage: WorkspaceCtx["storage"] = mode === "demo" ? "demo" : repo?.kind ?? null;

  useEffect(() => {
    if (mode === null) return;
    if (!repo) {
      if (mode === "live" && auth.status === "signed_out" && !guest) {
        setState(EMPTY_STATE);
        setStatus("needs_auth");
      }
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    repo
      .load()
      .then(async (s) => {
        if (cancelled) return;
        if (mode === "demo" && !s.profile) {
          const seeded = buildDemoState();
          for (const fn of [
            () => repo.saveProfile(seeded.profile!),
            () => repo.saveOffer(seeded.offer!),
            () => repo.savePricing(seeded.pricing!),
          ])
            await fn();
          for (const sub of seeded.submissions) await repo.addSubmission(sub);
          for (const ses of seeded.sessions) await repo.saveSession(ses);
          for (const snap of seeded.snapshots) await repo.addSnapshot(snap);
          s = await repo.load();
        }
        if (!cancelled) {
          setState(s);
          setStatus("ready");
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message || "Could not load your data.");
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [repo, mode, auth.status, guest, nonce]);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const pushToasts = useCallback((ts: Array<Omit<Toast, "id">>) => {
    if (ts.length) setToasts((cur) => [...cur, ...ts.map((t) => ({ ...t, id: newId() }))].slice(-4));
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((cur) => cur.filter((t) => t.id !== id)), []);

  // Weekly missions: issue this week's personalised set the first time the workspace is opened in a new week.
  const issuing = useRef<string | null>(null);
  useEffect(() => {
    if (status !== "ready" || !repo || !state.profile) return;
    const week = weekStartOf(new Date());
    const tag = `${week}:${state.profile.id}`;
    if (issuing.current === tag) return;
    const fresh = generateWeeklyMissions(state, week, newId);
    if (!fresh.length) return;
    issuing.current = tag;
    repo
      .saveWeeklyMissions(fresh)
      .then(() => setState((cur) => ({ ...cur, weeklyMissions: [...cur.weeklyMissions.filter((m) => !fresh.some((f) => f.id === m.id)), ...fresh] })))
      .catch((e: Error) => pushToasts([{ kind: "warn", title: "Weekly missions could not be saved", body: e.message }]));
  }, [status, repo, state, pushToasts]);

  // Achievements: when real activity unlocks one, record its XP exactly once and notify.
  const awarding = useRef(false);
  const failedAwards = useRef(new Set<string>());
  useEffect(() => {
    if (status !== "ready" || !repo || awarding.current) return;
    const pending = achievements(state).filter(
      (a) => a.earned && !state.xp.some((t) => t.source === "achievement" && t.refKey === a.key) && !failedAwards.current.has(a.key),
    );
    if (!pending.length) return;
    awarding.current = true;
    void (async () => {
      const before = levelFor(totalXp(stateRef.current.xp)).level;
      const added: XpTransaction[] = [];
      let failure: string | null = null;
      for (const a of pending) {
        const tx: XpTransaction = { id: newId(), source: "achievement", refKey: a.key, amount: a.xp, label: a.title, createdAt: a.earnedAt ?? new Date().toISOString() };
        try {
          await repo.addXp(tx); // false = already recorded elsewhere; still reflect it locally
          added.push(tx);
        } catch (e) {
          failedAwards.current.add(a.key);
          failure = (e as Error).message;
        }
      }
      if (added.length) {
        setState((cur) => ({ ...cur, xp: [...cur.xp, ...added.filter((t) => !cur.xp.some((x) => x.source === t.source && x.refKey === t.refKey))] }));
        const gained = added.reduce((n, t) => n + t.amount, 0);
        const after = levelFor(totalXp(stateRef.current.xp) + gained);
        pushToasts([
          added.length === 1
            ? { kind: "achievement", title: `Achievement unlocked: ${added[0].label}`, body: `+${added[0].amount} XP` }
            : { kind: "achievement", title: `${added.length} achievements unlocked`, body: `${added.map((t) => t.label).join(", ")} · +${gained} XP` },
          ...(after.level > before ? [{ kind: "level" as const, title: `Level ${after.level} — ${after.title}`, body: `${after.toNext} XP to the next level` }] : []),
        ]);
      }
      if (failure) pushToasts([{ kind: "warn", title: "Some XP could not be saved", body: failure }]);
      awarding.current = false;
    })();
  }, [status, repo, state, pushToasts]);

  const requireRepo = useCallback((): Repository => {
    if (!repo) throw new Error("Choose Continue as Guest or sign in to save your progress.");
    return repo;
  }, [repo]);

  /** After evidence changes: record a readiness snapshot and the learning-path status. */
  const afterEvidence = useCallback(
    async (next: WorkspaceState) => {
      const r = requireRepo();
      const readiness = computeReadiness(next);
      const dims = Object.fromEntries(READINESS_KEYS.map((k) => [k, readiness.dimensions[k].score])) as ReadinessSnapshot["dimensions"];
      const last = next.snapshots[next.snapshots.length - 1];
      let snapshots = next.snapshots;
      if (snapshotChanged(last, { overall: readiness.overall, dimensions: dims })) {
        const snap: ReadinessSnapshot = { id: newId(), overall: readiness.overall, dimensions: dims, createdAt: new Date().toISOString() };
        await r.addSnapshot(snap);
        snapshots = [...snapshots, snap];
      }
      const prog = stageProgress(next);
      await r
        .saveLearningPath({
          title: next.offer?.title ?? next.profile?.direction.name ?? "Skills2Cash learning path",
          currentStage: currentStage(prog),
          status: prog.every((p) => p.status === "completed") ? "completed" : "active",
          steps: prog.map((p) => ({ key: p.key, status: p.status, done: p.done, total: p.total })),
        })
        .catch(() => undefined);
      return { ...next, snapshots };
    },
    [requireRepo],
  );

  const ctx: WorkspaceCtx = {
    toasts,
    dismissToast,
    retentionStorage: repo?.retentionStorage() ?? "browser",
    completeWeeklyMission: async (id, note) => {
      const r = requireRepo();
      const mission = stateRef.current.weeklyMissions.find((m) => m.id === id);
      if (!mission) throw new Error("This mission no longer exists. Reload the page.");
      if (mission.status === "completed") throw new Error("This mission is already completed.");
      if (new Date(mission.deadline).getTime() < Date.now()) throw new Error("This mission's deadline has passed. It may come back in a future week.");
      const parsed = CompletionNoteSchema.safeParse(note);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Add a short note about what you did.");
      const now = new Date().toISOString();
      const done: WeeklyMission = { ...mission, status: "completed", completionNote: parsed.data, completedAt: now };
      await r.saveWeeklyMissions([done]);
      const tx: XpTransaction = { id: newId(), source: "weekly_mission", refKey: mission.id, amount: mission.xp, label: mission.title, createdAt: now };
      const before = levelFor(totalXp(stateRef.current.xp));
      const isNew = await r.addXp(tx);
      setState((cur) => ({
        ...cur,
        weeklyMissions: cur.weeklyMissions.map((m) => (m.id === id ? done : m)),
        xp: isNew && !cur.xp.some((x) => x.source === tx.source && x.refKey === tx.refKey) ? [...cur.xp, tx] : cur.xp,
      }));
      if (isNew) {
        const after = levelFor(before.xp + tx.amount);
        pushToasts([
          { kind: "xp", title: "Mission completed", body: `${mission.title} · +${mission.xp} XP` },
          ...(after.level > before.level ? [{ kind: "level" as const, title: `Level ${after.level} — ${after.title}`, body: `${after.toNext} XP to the next level` }] : []),
        ]);
      }
    },
    mode: mode ?? "live",
    guest,
    guestUsage,
    beginGuest: () => {
      const current = (() => { try { return JSON.parse(localStorage.getItem(GUEST_DATA_KEY) || "null") as GuestData | null; } catch { return null; } })();
      const data: GuestData = current ?? { sessionId: newId(), createdAt: new Date().toISOString(), usage: EMPTY_USAGE };
      localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(data));
      localStorage.setItem(GUEST_MODE_KEY, "1");
      setGuest(true);
      setGuestUsage(data.usage);
      setNonce((n) => n + 1);
    },
    clearGuest: () => { localStorage.removeItem(GUEST_MODE_KEY); localStorage.removeItem(GUEST_DATA_KEY); setGuest(false); setGuestUsage(EMPTY_USAGE); setNonce((n) => n + 1); },
    migrateGuestData: async () => {
      if (!guest || auth.status !== "signed_in" || !auth.userId) throw new Error("Sign in before transferring guest progress.");
      const target = new SupabaseRepository(getSupabase()!, auth.userId);
      const [sourceState, targetState] = await Promise.all([new LocalRepository(GUEST_DATA_KEY, localStorage).load(), target.load()]);
      if (sourceState.profile && targetState.profile && sourceState.profile.id !== targetState.profile.id) {
        throw new Error("This account already has a different skill profile. Guest data is preserved here; resolve the profile conflict before transferring.");
      }
      if (sourceState.offer && targetState.offer && sourceState.offer.id !== targetState.offer.id) {
        throw new Error("This account already has a different service offer. Guest data is preserved here; resolve the offer conflict before transferring.");
      }
      if (sourceState.pricing && targetState.pricing && sourceState.pricing.id !== targetState.pricing.id) {
        throw new Error("This account already has a different pricing worksheet. Guest data is preserved here; resolve the conflict before transferring.");
      }
      if (!targetState.profile && sourceState.profile) await target.saveProfile(sourceState.profile);
      if (!targetState.offer && sourceState.offer) await target.saveOffer(sourceState.offer);
      if (!targetState.pricing && sourceState.pricing) await target.savePricing(sourceState.pricing);
      const targetSubmissionIds = new Set(targetState.submissions.map((item) => item.id));
      for (const item of sourceState.submissions) if (!targetSubmissionIds.has(item.id)) await target.addSubmission(item);
      const targetSessions = new Map(targetState.sessions.map((item) => [item.id, item]));
      for (const item of sourceState.sessions) if (!targetSessions.has(item.id)) await target.saveSession(item);
      const targetSnapshotIds = new Set(targetState.snapshots.map((item) => item.id));
      for (const item of sourceState.snapshots) if (!targetSnapshotIds.has(item.id)) await target.addSnapshot(item);
      // Weekly missions and XP: skip anything the account already has (same week + mission, or same award).
      const hasMission = (m: WeeklyMission) => targetState.weeklyMissions.some((t) => t.id === m.id || (t.weekStart === m.weekStart && t.templateKey === m.templateKey));
      const movedMissions = sourceState.weeklyMissions.filter((m) => !hasMission(m));
      await target.saveWeeklyMissions(movedMissions);
      for (const t of sourceState.xp) {
        if (t.source === "weekly_mission" && !movedMissions.some((m) => m.id === t.refKey)) continue;
        await target.addXp(t);
      }
      localStorage.removeItem(GUEST_MODE_KEY);
      localStorage.removeItem(GUEST_DATA_KEY);
      setGuest(false);
      setGuestUsage(EMPTY_USAGE);
      setNonce((n) => n + 1);
    },
    scripted,
    setScripted: (v) => {
      localStorage.setItem(SCRIPTED_KEY, v ? "1" : "0");
      setScriptedState(v);
    },
    auth: { status: auth.status, email: auth.email },
    storage,
    state,
    status,
    error,
    reload: () => setNonce((n) => n + 1),
    saveProfile: async (p) => {
      if (guest && !stateRef.current.profile && guestUsage.assessments_used >= 1) throw new Error("You have used your free skill assessment. View Pricing to unlock Pro.");
      await requireRepo().saveProfile(p);
      if (guest && !stateRef.current.profile) { const nextUsage = { ...guestUsage, assessments_used: guestUsage.assessments_used + 1 }; persistGuestUsage(nextUsage); setGuestUsage(nextUsage); }
      const next = { ...stateRef.current, profile: p };
      setState(await afterEvidence(next));
    },
    saveOffer: async (o) => {
      if (guest && !stateRef.current.offer && guestUsage.offers_created >= 1) throw new Error("You have used your free service offer. View Pricing to unlock Pro.");
      await requireRepo().saveOffer(o);
      if (guest && !stateRef.current.offer) { const nextUsage = { ...guestUsage, offers_created: guestUsage.offers_created + 1 }; persistGuestUsage(nextUsage); setGuestUsage(nextUsage); }
      setState(await afterEvidence({ ...stateRef.current, offer: o }));
    },
    savePricing: async (p) => {
      await requireRepo().savePricing(p);
      setState(await afterEvidence({ ...stateRef.current, pricing: p }));
    },
    addSubmission: async (s) => {
      await requireRepo().addSubmission(s);
      setState(await afterEvidence({ ...stateRef.current, submissions: [...stateRef.current.submissions, s] }));
    },
    saveSession: async (s) => {
      const prior = stateRef.current.sessions.find((x) => x.id === s.id);
      if (guest && s.status === "active" && !prior && guestUsage.simulations_completed >= 1) throw new Error("You have used your free simulation. View Pricing to unlock Pro.");
      await requireRepo().saveSession(s);
      const cur = stateRef.current;
      const sessions = cur.sessions.some((x) => x.id === s.id) ? cur.sessions.map((x) => (x.id === s.id ? s : x)) : [...cur.sessions, s];
      const next = { ...cur, sessions };
      setState(s.status === "completed" ? await afterEvidence(next) : next);
      if (guest && s.status === "completed" && prior?.status !== "completed") {
        const nextUsage = { ...guestUsage, simulations_completed: guestUsage.simulations_completed + 1 };
        persistGuestUsage(nextUsage);
        setGuestUsage(nextUsage);
      }
    },
    resetWorkspace: async () => {
      await requireRepo().reset();
      setState(EMPTY_STATE);
      setNonce((n) => n + 1);
    },
    startDemo: async (opts) => {
      localStorage.setItem(MODE_KEY, "demo");
      if (opts?.scripted !== undefined) {
        localStorage.setItem(SCRIPTED_KEY, opts.scripted ? "1" : "0");
        setScriptedState(opts.scripted);
      }
      if (opts?.fresh) await demoRepo().reset();
      setMode("demo");
      setNonce((n) => n + 1);
    },
    exitDemo: () => {
      localStorage.setItem(MODE_KEY, "live");
      localStorage.setItem(SCRIPTED_KEY, "0");
      setScriptedState(false);
      setMode("live");
    },
    
    signOut: async () => {
      await getSupabase()?.auth.signOut();
    },
    aiOpts: { offline: (mode ?? "live") === "demo" && scripted, fallbackOnError: (mode ?? "live") === "demo" },
  };

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function useWorkspace(): WorkspaceCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return c;
}
