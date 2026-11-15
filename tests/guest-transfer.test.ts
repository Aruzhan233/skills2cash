import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LocalRepository, SupabaseRepository } from "../src/lib/client/repository";
import { hasGuestProgress, sanitizeGuestState, transferGuestProgress, type TransferTarget } from "../src/lib/client/guest-transfer";
import { EMPTY_STATE, type WeeklyMission, type WorkspaceState, type XpTransaction } from "../src/lib/types";

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
beforeEach(() => storage.clear());

const USER = "22222222-2222-4222-8222-222222222222";
const NOTE = "Compared three local editors on price, scope and turnaround.";

const mission = (over: Partial<WeeklyMission> = {}): WeeklyMission => ({
  id: "gm-1", weekStart: "2026-11-09", templateKey: "competitor-scan", title: "Analyze three competitors", description: "Compare three offers",
  steps: [], reason: "", category: "research", difficulty: "Easy", xp: 50, deadline: "2026-11-15T23:59:59.000Z",
  status: "completed", completionNote: NOTE, completedAt: "2026-11-11T08:00:00.000Z", createdAt: "2026-11-09T09:00:00.000Z", ...over,
});
const ach: XpTransaction = { id: "gx-1", source: "achievement", refKey: "first-mission", amount: 75, label: "First Mission", createdAt: "2026-11-11T08:00:00.000Z" };
const wmXp: XpTransaction = { id: "gx-2", source: "weekly_mission", refKey: "gm-1", amount: 50, label: "Analyze three competitors", createdAt: "2026-11-11T08:00:00.000Z" };

function guestState(): WorkspaceState {
  return {
    ...EMPTY_STATE,
    profile: { id: "gp-1", displayName: "Guest", assessment: { skill: "Editing", hoursPerWeek: 5 }, result: { strengths: [] }, direction: { name: "Video editing" }, directionEdited: false, rejectedStrengths: [], generatedBy: "sample", createdAt: "2026-11-10T08:00:00.000Z", updatedAt: "2026-11-10T08:00:00.000Z" } as unknown as WorkspaceState["profile"],
    offer: { id: "go-1", title: "Short-form edits", priceAmount: 120, updatedAt: "2026-11-10T08:00:00.000Z" } as unknown as WorkspaceState["offer"],
    submissions: [{ id: "gs-1", assignmentKey: "pitch", text: "My pitch", feedback: null, score: 70, createdAt: "2026-11-10T09:00:00.000Z" } as unknown as WorkspaceState["submissions"][number]],
    sessions: [{ id: "gr-1", scenarioKey: "budget", offerSnapshot: null, status: "completed", scripted: false, startedAt: "2026-11-10T10:00:00.000Z", endedAt: "2026-11-10T10:10:00.000Z", evaluation: null, overallScore: 64, messages: [{ id: "gmsg-1", role: "user", content: "Hi", createdAt: "2026-11-10T10:00:00.000Z" }] } as unknown as WorkspaceState["sessions"][number]],
    snapshots: [{ id: "gsn-1", overall: 40, dimensions: {}, createdAt: "2026-11-10T11:00:00.000Z" } as unknown as WorkspaceState["snapshots"][number]],
    weeklyMissions: [mission()],
    xp: [ach, wmXp],
  };
}

/** A stateful account store that records writes (stands in for the database to check the merge rules). */
class AccountStore extends LocalRepository implements TransferTarget {
  writes: string[] = [];
  constructor(initial?: Partial<WorkspaceState>) {
    super("account", storage as unknown as Storage);
    if (initial) storage.setItem("account", JSON.stringify({ ...EMPTY_STATE, ...initial }));
  }
  override async saveProfile(p: Parameters<LocalRepository["saveProfile"]>[0]) { this.writes.push("profile"); return super.saveProfile(p); }
  override async saveOffer(o: Parameters<LocalRepository["saveOffer"]>[0]) { this.writes.push("offer"); return super.saveOffer(o); }
  override async addSubmission(s: Parameters<LocalRepository["addSubmission"]>[0]) { this.writes.push(`submission:${s.id}`); return super.addSubmission(s); }
  override async saveSession(s: Parameters<LocalRepository["saveSession"]>[0]) { this.writes.push(`session:${s.id}`); return super.saveSession(s); }
  override async addSnapshot(s: Parameters<LocalRepository["addSnapshot"]>[0]) { this.writes.push(`snapshot:${s.id}`); return super.addSnapshot(s); }
  async importRetention(missions: WeeklyMission[], xp: XpTransaction[]) {
    await this.saveWeeklyMissions(missions.map((m) => ({ ...m, status: "active" as const, completionNote: null, completedAt: null })));
    for (const m of missions) if (m.status === "completed") await this.completeWeeklyMission(m, m.completionNote!, m.completedAt!);
    for (const t of xp) if (t.source === "achievement") await this.addXp(t);
  }
}

test("reported bug: transfer no longer fails when weekly_missions is missing; missions and XP wait in this browser for the account", async () => {
  const missing = { data: null, error: { message: "Could not find the table 'public.weekly_missions' in the schema cache", code: "PGRST205" } };
  const calls: string[] = [];
  const res = (table: string, op: string) => {
    if (table === "weekly_missions" || table === "xp_transactions") return missing;
    return { data: op === "single" ? null : [], error: null };
  };
  const chain = (table: string, op: string, payload?: unknown) => {
    calls.push(`${op}:${table}`);
    let single = false;
    const c: Record<string, unknown> = {
      then: (ok: (r: unknown) => unknown, bad?: (e: unknown) => unknown) =>
        Promise.resolve(op === "select" ? res(table, single ? "single" : "many") : { data: payload ?? [], error: null }).then(ok, bad),
    };
    for (const m of ["select", "order", "eq"]) c[m] = () => c;
    c.maybeSingle = () => ((single = true), c);
    return c;
  };
  const db = {
    from: (t: string) => ({ select: () => chain(t, "select"), upsert: (p: unknown) => chain(t, "upsert", p), insert: (p: unknown) => chain(t, "insert", p), update: () => chain(t, "update") }),
    rpc: async () => ({ data: null, error: { message: "not found", code: "PGRST202" } }),
  } as unknown as SupabaseClient;

  const summary = await transferGuestProgress(guestState(), new SupabaseRepository(db, USER));
  assert.equal(summary.retentionInBrowser, true);
  assert.equal(summary.profile, true);
  assert.equal(summary.missions, 1);
  assert.ok(calls.includes("upsert:skill_profiles"), "core progress goes to the database");
  assert.ok(!calls.includes("upsert:weekly_missions"), "no write to the missing table");
  const held = JSON.parse(storage.getItem(`s2c:retention:${USER}`)!);
  assert.equal(held.weeklyMissions[0].status, "completed");
  assert.equal(held.xp.length, 2, "achievement + mission XP kept for the account");
});

test("into an empty account everything moves once, with timestamps and scores preserved", async () => {
  const account = new AccountStore();
  const summary = await transferGuestProgress(guestState(), account);
  assert.deepEqual(
    { p: summary.profile, o: summary.offer, sub: summary.submissions, ses: summary.sessions, snap: summary.snapshots, m: summary.missions, a: summary.achievements },
    { p: true, o: true, sub: 1, ses: 1, snap: 1, m: 1, a: 1 },
  );
  const s = await account.load();
  assert.equal(s.submissions[0].score, 70);
  assert.equal(s.sessions[0].messages.length, 1);
  assert.equal(s.weeklyMissions[0].completedAt, "2026-11-11T08:00:00.000Z");
  assert.equal(s.xp.reduce((n, t) => n + t.amount, 0), 125);
});

test("retrying the transfer creates no duplicate missions, XP, achievements or history", async () => {
  const account = new AccountStore();
  await transferGuestProgress(guestState(), account);
  account.writes = [];
  const again = await transferGuestProgress(guestState(), account);
  assert.deepEqual(account.writes, [], "nothing is written twice");
  assert.equal(again.missions + again.achievements + again.submissions + again.sessions, 0);
  const s = await account.load();
  assert.equal(s.weeklyMissions.length, 1);
  assert.equal(s.xp.filter((t) => t.source === "weekly_mission").length, 1);
  assert.equal(s.xp.filter((t) => t.source === "achievement").length, 1);
});

test("an account with its own progress keeps it; guest history is added, nothing is overwritten", async () => {
  const own = guestState();
  const account = new AccountStore({
    profile: { ...own.profile!, id: "ap-1", displayName: "Account" },
    offer: { ...own.offer!, id: "ao-1", title: "Account offer" },
    snapshots: [{ ...own.snapshots[0], id: "asn-1", overall: 80 }],
    weeklyMissions: [mission({ id: "am-1", status: "completed" })], // same week + template as the guest mission
    xp: [{ ...wmXp, id: "ax-1", refKey: "am-1" }, { ...ach, id: "ax-2" }],
  });
  const summary = await transferGuestProgress(guestState(), account);
  const s = await account.load();
  assert.equal(s.profile!.id, "ap-1");
  assert.equal(s.offer!.title, "Account offer");
  assert.deepEqual(summary.keptFromAccount, ["skill profile", "service offer"]);
  assert.deepEqual(s.snapshots.map((x) => x.id), ["asn-1"], "another profile's readiness history is not mixed in");
  assert.equal(s.submissions.length, 1, "guest work is still added");
  assert.equal(s.weeklyMissions.length, 1, "the same weekly mission is not added twice");
  assert.equal(s.xp.reduce((n, t) => n + t.amount, 0), 125, "no extra XP for the duplicate mission or achievement");
  assert.equal(summary.missions + summary.achievements, 0);
});

test("malformed browser records are left out instead of being sent to the database", () => {
  const raw = guestState();
  raw.xp = [...raw.xp, { id: "bad", source: "hack", refKey: "x", amount: 99999 } as unknown as XpTransaction, { ...ach, id: "neg", amount: -5 }];
  raw.weeklyMissions = [...raw.weeklyMissions, { id: "m-bad" } as unknown as WeeklyMission];
  const { state, invalid } = sanitizeGuestState(raw);
  assert.equal(invalid, 3);
  assert.equal(state.xp.length, 2);
  assert.equal(state.weeklyMissions.length, 1);
  assert.equal(hasGuestProgress(EMPTY_STATE), false);
  assert.equal(hasGuestProgress(raw), true);
});
