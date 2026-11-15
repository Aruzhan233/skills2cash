import assert from "node:assert/strict";
import { test } from "node:test";
import { LocalRepository } from "../src/lib/client/repository";
import { buildDemoState } from "../src/lib/demo";
import { achievements } from "../src/lib/progress";
import {
  CompletionNoteSchema,
  generateWeeklyMissions,
  journeyPercent,
  journeyPhases,
  levelFor,
  levelStart,
  totalXp,
  WEEKLY_TEMPLATES,
  weekDeadline,
  weeklyMissionCount,
  weeklyStats,
  weekStartOf,
  addWeeks,
} from "../src/lib/retention";
import { EMPTY_STATE, type WeeklyMission, type WorkspaceState, type XpTransaction } from "../src/lib/types";

let n = 0;
const id = () => `id-${++n}`;

class MemoryStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.get(k) ?? null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

test("week helpers: Monday start and Sunday deadline", () => {
  assert.equal(weekStartOf(new Date(2026, 10, 15)), "2026-11-09"); // Sunday → previous Monday
  assert.equal(weekStartOf(new Date(2026, 10, 16)), "2026-11-16"); // Monday
  assert.equal(addWeeks("2026-11-09", 1), "2026-11-16");
  const d = new Date(weekDeadline("2026-11-09"));
  assert.equal(d.getDay(), 0);
  assert.equal(d.getDate(), 15);
});

test("levels: thresholds, progress and no negative values", () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(levelStart), [0, 100, 300, 600, 1000]);
  assert.equal(levelFor(0).level, 1);
  assert.equal(levelFor(99).level, 1);
  assert.equal(levelFor(100).level, 2);
  const l = levelFor(250);
  assert.deepEqual([l.level, l.into, l.span, l.toNext, l.percent], [2, 150, 200, 50, 75]);
  assert.equal(totalXp([]), 0);
});

test("weekly missions: personalised, no duplicates, nothing without a profile", () => {
  assert.equal(generateWeeklyMissions(EMPTY_STATE, "2026-11-09", id).length, 0);
  const s = buildDemoState();
  const first = generateWeeklyMissions(s, "2026-11-09", id);
  assert.equal(first.length, weeklyMissionCount(s));
  assert.equal(new Set(first.map((m) => m.templateKey)).size, first.length);
  for (const m of first) {
    assert.ok(m.title && m.description && m.category && m.difficulty && m.xp > 0 && m.reason);
    assert.ok(!m.description.includes("{"), "placeholders are filled with the user's own data");
    assert.equal(m.status, "active");
  }
  // the demo user already has an offer and pricing, so those "create" missions are never issued
  assert.ok(!first.some((m) => m.templateKey === "create-offer" || m.templateKey === "pricing-packages"));
  // asking again for the same week adds nothing
  assert.equal(generateWeeklyMissions({ ...s, weeklyMissions: first }, "2026-11-09", id).length, 0);
  // completed missions do not come back the next week while new ones remain
  const done = first.map<WeeklyMission>((m) => ({ ...m, status: "completed", completionNote: "Did the task as described.", completedAt: "2026-11-12T10:00:00.000Z" }));
  const next = generateWeeklyMissions({ ...s, weeklyMissions: done }, "2026-11-16", id);
  assert.equal(next.length, first.length);
  assert.ok(next.every((m) => !done.some((d) => d.templateKey === m.templateKey)));
});

test("weekly missions: unfinished ones can return, and the catalog never runs dry", () => {
  const s = buildDemoState();
  let state: WorkspaceState = s;
  let week = "2026-01-05";
  for (let i = 0; i < 12; i++) {
    const ms = generateWeeklyMissions(state, week, id);
    assert.ok(ms.length > 0, `week ${i} has missions`);
    assert.equal(new Set(ms.map((m) => m.templateKey)).size, ms.length);
    state = { ...state, weeklyMissions: [...state.weeklyMissions, ...ms.map<WeeklyMission>((m) => ({ ...m, status: "completed", completionNote: "Completed for the test.", completedAt: `${week}T10:00:00.000Z` }))] };
    week = addWeeks(week, 1);
  }
  assert.ok(WEEKLY_TEMPLATES.length >= 15);
});

test("weekly stats and completion note validation", () => {
  const s = buildDemoState();
  const now = new Date(2026, 10, 11);
  const ms = generateWeeklyMissions(s, weekStartOf(now), id, now);
  ms[0] = { ...ms[0], status: "completed", completionNote: "Listed five local studios.", completedAt: now.toISOString() };
  const st = weeklyStats({ ...s, weeklyMissions: ms }, now);
  assert.equal(st.completed, 1);
  assert.equal(st.total, ms.length);
  assert.equal(st.xpEarned, ms[0].xp);
  assert.equal(st.streak, 1);
  assert.ok(!CompletionNoteSchema.safeParse("done").success);
  assert.ok(CompletionNoteSchema.safeParse("Found five studios and noted their prices.").success);
});

test("achievements unlock only from real activity and carry XP", () => {
  const empty = achievements(EMPTY_STATE);
  assert.ok(empty.every((a) => !a.earned && a.xp > 0));
  assert.equal(new Set(empty.map((a) => a.key)).size, empty.length);
  const s = buildDemoState();
  const earned = achievements(s).filter((a) => a.earned).map((a) => a.key);
  assert.ok(!earned.includes("weekly-first") && !earned.includes("practice-champion"));
  const ms = generateWeeklyMissions(s, "2026-11-09", id).map<WeeklyMission>((m) => ({ ...m, status: "completed", completionNote: "Completed for the test.", completedAt: "2026-11-12T10:00:00.000Z" }));
  const after = achievements({ ...s, weeklyMissions: ms }).filter((a) => a.earned).map((a) => a.key);
  assert.ok(after.includes("weekly-first") && after.includes("weekly-full"));
});

test("journey tracker: eight phases, 0% when empty, real percentages otherwise", () => {
  const empty = journeyPhases(EMPTY_STATE);
  assert.equal(empty.length, 8);
  assert.equal(journeyPercent(empty), 0);
  const demo = journeyPhases(buildDemoState());
  const pct = journeyPercent(demo);
  assert.ok(pct > 0 && pct < 100);
  assert.equal(demo[0].percent, 100);
  for (const p of demo) assert.equal(p.percent, Math.round((p.done / p.total) * 100));
});

test("local repository: XP awards are idempotent and missions are not duplicated", async () => {
  const repo = new LocalRepository("t", new MemoryStorage() as unknown as Storage);
  const tx: XpTransaction = { id: "a", source: "achievement", refKey: "assessment", amount: 50, label: "Assessment Completed", createdAt: "2026-11-10T00:00:00.000Z" };
  assert.equal(await repo.addXp(tx), true);
  assert.equal(await repo.addXp({ ...tx, id: "b" }), false);
  const ms = generateWeeklyMissions(buildDemoState(), "2026-11-09", id);
  await repo.saveWeeklyMissions(ms);
  await repo.saveWeeklyMissions([{ ...ms[0], id: "other-id" }]); // same week + template under a new id
  await repo.saveWeeklyMissions([{ ...ms[1], status: "completed", completionNote: "Completed for the test.", completedAt: "2026-11-12T10:00:00.000Z" }]);
  const s = await repo.load();
  assert.equal(totalXp(s.xp), 50);
  assert.equal(s.weeklyMissions.length, ms.length);
  assert.equal(s.weeklyMissions.find((m) => m.id === ms[1].id)?.status, "completed");
});
