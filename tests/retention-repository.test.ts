import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LocalRepository, SupabaseRepository } from "../src/lib/client/repository";
import type { WeeklyMission, XpTransaction } from "../src/lib/types";

// --- minimal browser storage ------------------------------------------------------------
class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
  key() { return null; }
  get length() { return this.m.size; }
}
const storage = new MemoryStorage();
(globalThis as unknown as { localStorage: Storage }).localStorage = storage as unknown as Storage;

// --- a fake Supabase client that records every call ----------------------------------------
type Res = { data: unknown; error: { message: string; code?: string } | null };
type Call = { table?: string; op: string; payload?: unknown; opts?: unknown; fn?: string; args?: unknown };

function fakeDb(opts: { tables?: Record<string, Res>; rpc?: Res }) {
  const calls: Call[] = [];
  const respond = (table: string): Res => opts.tables?.[table] ?? { data: [], error: null };
  const builder = (table: string, op: string, payload?: unknown, o?: unknown) => {
    calls.push({ table, op, payload, opts: o });
    const res: Res = op === "select" ? respond(table) : { data: Array.isArray(payload) ? payload : payload ? [payload] : [], error: null };
    const chain: Record<string, unknown> = {
      then: (ok: (r: Res) => unknown, bad?: (e: unknown) => unknown) => Promise.resolve(res).then(ok, bad),
    };
    for (const m of ["select", "order", "eq", "maybeSingle"]) chain[m] = () => chain;
    return chain;
  };
  const db = {
    from: (table: string) => ({
      select: () => {
        const b = builder(table, "select");
        return b;
      },
      upsert: (payload: unknown, o?: unknown) => builder(table, "upsert", payload, o),
      insert: (payload: unknown) => builder(table, "insert", payload),
      delete: () => builder(table, "delete"),
    }),
    rpc: async (fn: string, args: unknown) => {
      calls.push({ op: "rpc", fn, args });
      return opts.rpc ?? { data: [{ awarded: true, completed_at: (args as { p_completed_at: string }).p_completed_at, xp_amount: 50 }], error: null };
    },
  };
  return { db: db as unknown as SupabaseClient, calls };
}

const USER = "11111111-1111-4111-8111-111111111111";
const mission = (over: Partial<WeeklyMission> = {}): WeeklyMission => ({
  id: "m-1",
  weekStart: "2026-11-09",
  templateKey: "competitor-scan",
  title: "Analyze three competitors",
  description: "Compare three offers",
  steps: [],
  reason: "",
  category: "research",
  difficulty: "Easy",
  xp: 50,
  deadline: "2026-11-15T23:59:59.000Z",
  status: "active",
  completionNote: null,
  completedAt: null,
  createdAt: "2026-11-09T09:00:00.000Z",
  ...over,
});
const NOTE = "Compared three local editors on price, scope and turnaround.";

beforeEach(() => storage.clear());

test("missing retention tables fall back to this browser (labelled), nothing else does", async () => {
  const missing = { data: null, error: { message: "Could not find the table", code: "PGRST205" } };
  const { db } = fakeDb({ tables: { weekly_missions: missing, xp_transactions: missing } });
  const repo = new SupabaseRepository(db, USER);
  await repo.load();
  assert.equal(repo.retentionStorage(), "browser");
});

test("any other database error is raised instead of silently saving to the browser", async () => {
  const down = { data: null, error: { message: "connection refused", code: "08006" } };
  const { db } = fakeDb({ tables: { weekly_missions: down } });
  const repo = new SupabaseRepository(db, USER);
  await assert.rejects(repo.load(), /Database error: connection refused/);
});

test("with the tables present, data is read from the database", async () => {
  const { db } = fakeDb({});
  const repo = new SupabaseRepository(db, USER);
  const s = await repo.load();
  assert.equal(repo.retentionStorage(), "database");
  assert.deepEqual(s.weeklyMissions, []);
});

test("completing a mission uses the atomic database function and reports the award once", async () => {
  const { db, calls } = fakeDb({});
  const repo = new SupabaseRepository(db, USER);
  await repo.load();
  const res = await repo.completeWeeklyMission(mission(), NOTE, "2026-11-12T10:00:00.000Z");
  assert.equal(res.awarded, true);
  const rpc = calls.filter((c) => c.op === "rpc");
  assert.equal(rpc.length, 1);
  assert.equal(rpc[0].fn, "complete_weekly_mission");
  assert.deepEqual(rpc[0].args, { p_mission_id: "m-1", p_note: NOTE, p_completed_at: "2026-11-12T10:00:00.000Z" });
  // no separate client-side XP write
  assert.equal(calls.filter((c) => c.table === "xp_transactions" && c.op === "upsert").length, 0);
});

test("a repeated completion that the database refuses to pay reports awarded = false", async () => {
  const { db } = fakeDb({ rpc: { data: [{ awarded: false, completed_at: "2026-11-12T10:00:00.000Z", xp_amount: 0 }], error: null } });
  const repo = new SupabaseRepository(db, USER);
  await repo.load();
  const res = await repo.completeWeeklyMission(mission(), NOTE, "2026-11-13T10:00:00.000Z");
  assert.equal(res.awarded, false);
  assert.equal(res.completedAt, "2026-11-12T10:00:00.000Z");
});

test("without the integrity migration it falls back to idempotent writes; other RPC errors are raised", async () => {
  const legacy = fakeDb({ rpc: { data: null, error: { message: "function not found", code: "PGRST202" } } });
  const repo = new SupabaseRepository(legacy.db, USER);
  await repo.load();
  await repo.completeWeeklyMission(mission(), NOTE, "2026-11-12T10:00:00.000Z");
  const xpWrite = legacy.calls.find((c) => c.table === "xp_transactions" && c.op === "upsert");
  assert.ok(xpWrite, "XP is written");
  assert.deepEqual(xpWrite!.opts, { onConflict: "user_id,source,ref_key", ignoreDuplicates: true });

  const broken = fakeDb({ rpc: { data: null, error: { message: "deadline has passed", code: "22023" } } });
  const repo2 = new SupabaseRepository(broken.db, USER);
  await repo2.load();
  await assert.rejects(repo2.completeWeeklyMission(mission(), NOTE, "2026-11-12T10:00:00.000Z"), /deadline has passed/);
});

test("progress kept in this browser while the tables were missing moves into the account once", async () => {
  const done = mission({ status: "completed", completionNote: NOTE, completedAt: "2026-11-11T08:00:00.000Z" });
  const ach: XpTransaction = { id: "x-1", source: "achievement", refKey: "first-mission", amount: 75, label: "First Mission", createdAt: "2026-11-10T08:00:00.000Z" };
  const wmXp: XpTransaction = { id: "x-2", source: "weekly_mission", refKey: "m-1", amount: 50, label: "Analyze three competitors", createdAt: "2026-11-11T08:00:00.000Z" };
  storage.setItem(`s2c:retention:${USER}`, JSON.stringify({ weeklyMissions: [done], xp: [ach, wmXp] }));
  const { db, calls } = fakeDb({});
  const repo = new SupabaseRepository(db, USER);
  await repo.load();
  const missionWrite = calls.find((c) => c.table === "weekly_missions" && c.op === "upsert");
  assert.ok(missionWrite);
  assert.equal((missionWrite!.payload as Array<{ status: string }>)[0].status, "active", "created active, then completed by the function");
  const rpc = calls.find((c) => c.op === "rpc");
  assert.deepEqual(rpc?.args, { p_mission_id: "m-1", p_note: NOTE, p_completed_at: "2026-11-11T08:00:00.000Z" }, "original completion time kept");
  const xpWrites = calls.filter((c) => c.table === "xp_transactions" && c.op === "upsert");
  assert.equal(xpWrites.length, 1, "only the achievement is written directly; mission XP comes from the function");
  assert.equal((xpWrites[0].payload as { source: string }).source, "achievement");
  assert.equal(storage.getItem(`s2c:retention:${USER}`), null, "browser copy removed after the move");
});

test("browser stores (guest, demo, local) complete a mission once and pay once", async () => {
  const repo = new LocalRepository("s2c:test", storage as unknown as Storage);
  await repo.saveWeeklyMissions([mission()]);
  const first = await repo.completeWeeklyMission(mission(), NOTE, "2026-11-12T10:00:00.000Z");
  const second = await repo.completeWeeklyMission(mission(), NOTE, "2026-11-12T11:00:00.000Z");
  const s = await repo.load();
  assert.equal(first.awarded, true);
  assert.equal(second.awarded, false);
  assert.equal(second.completedAt, "2026-11-12T10:00:00.000Z");
  assert.equal(s.xp.filter((t) => t.source === "weekly_mission").length, 1);
  assert.equal(s.weeklyMissions[0].status, "completed");
});
