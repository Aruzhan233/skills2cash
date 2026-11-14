"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/client/supabase";
import { LocalRepository, SupabaseRepository, type Repository } from "@/lib/client/repository";
import { buildDemoState } from "@/lib/demo";
import { newId } from "@/lib/id";
import { computeReadiness, currentStage, stageProgress } from "@/lib/progress";
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
  type WorkspaceState,
} from "@/lib/types";

type AuthStatus = "loading" | "signed_in" | "signed_out" | "disabled";
export type LoadStatus = "loading" | "ready" | "error" | "needs_auth";

interface WorkspaceCtx {
  mode: Mode;
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
    if (!supabaseConfigured) return new LocalRepository("s2c:local", localStorage);
    const sb = getSupabase();
    if (sb && auth.status === "signed_in" && auth.userId) return new SupabaseRepository(sb, auth.userId);
    return null;
  }, [mode, auth.status, auth.userId]);

  const storage: WorkspaceCtx["storage"] = mode === "demo" ? "demo" : repo?.kind ?? null;

  useEffect(() => {
    if (mode === null) return;
    if (!repo) {
      if (mode === "live" && auth.status === "signed_out") {
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
  }, [repo, mode, auth.status, nonce]);

  const requireRepo = useCallback((): Repository => {
    if (!repo) throw new Error("Please sign in to save your progress.");
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
    mode: mode ?? "live",
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
      await requireRepo().saveProfile(p);
      const next = { ...stateRef.current, profile: p };
      setState(await afterEvidence(next));
    },
    saveOffer: async (o) => {
      await requireRepo().saveOffer(o);
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
      await requireRepo().saveSession(s);
      const cur = stateRef.current;
      const sessions = cur.sessions.some((x) => x.id === s.id) ? cur.sessions.map((x) => (x.id === s.id ? s : x)) : [...cur.sessions, s];
      const next = { ...cur, sessions };
      setState(s.status === "completed" ? await afterEvidence(next) : next);
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
