// Moves progress made in Guest Mode (browser storage) into a signed-in account.
//
// Merge rules (account data is never overwritten):
//  - Skill profile, service offer, pricing worksheet: one per account. The account's own copy wins;
//    the guest copy is used only when the account has none.
//  - Assignment submissions, simulations (with messages): added by id; ones already present are skipped.
//  - Readiness history: added only when it describes the profile being kept (the account had no profile,
//    or it is the same profile), so the account's own history is not mixed with another profile's.
//  - Weekly missions: added unless the account already has the same mission (same id, or same week +
//    template). Completed ones are completed in the account, which records their XP exactly once.
//  - Achievements: recorded once per achievement (unique per user in the database).
//
// Every step is idempotent (stable ids + unique constraints), so a transfer interrupted part-way is
// completed by retrying it; the caller keeps the guest copy until this function returns successfully.

import type { Repository } from "./repository";
import type { WeeklyMission, WorkspaceState, XpTransaction } from "../types";

export type TransferTarget = Repository & { importRetention(missions: WeeklyMission[], xp: XpTransaction[]): Promise<void> };

export interface TransferSummary {
  profile: boolean;
  offer: boolean;
  pricing: boolean;
  submissions: number;
  sessions: number;
  snapshots: number;
  missions: number;
  achievements: number;
  /** Items the account already had its own version of; the account's version was kept. */
  keptFromAccount: string[];
  /** Malformed records found in browser storage and left out. */
  skippedInvalid: number;
  /** Weekly missions and XP are held for this account in this browser until the database tables exist. */
  retentionInBrowser: boolean;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => typeof v === "string" && v.length > 0;
const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);

const VALID = {
  profile: (p: unknown) => isObj(p) && str(p.id) && isObj(p.assessment) && isObj(p.result) && isObj(p.direction),
  offer: (o: unknown) => isObj(o) && str(o.id) && typeof o.title === "string",
  pricing: (p: unknown) => isObj(p) && str(p.id),
  submission: (s: unknown) => isObj(s) && str(s.id) && str(s.assignmentKey) && typeof s.text === "string" && str(s.createdAt),
  session: (s: unknown) =>
    isObj(s) &&
    str(s.id) &&
    str(s.scenarioKey) &&
    str(s.startedAt) &&
    (s.status === "active" || s.status === "completed") &&
    Array.isArray(s.messages) &&
    s.messages.every((m) => isObj(m) && str(m.id) && (m.role === "user" || m.role === "client") && typeof m.content === "string"),
  snapshot: (s: unknown) => isObj(s) && str(s.id) && isObj(s.dimensions) && str(s.createdAt),
  mission: (m: unknown) =>
    isObj(m) && str(m.id) && str(m.weekStart) && str(m.templateKey) && num(m.xp) && (m.status === "active" || m.status === "completed"),
  xp: (t: unknown) =>
    isObj(t) && str(t.id) && (t.source === "achievement" || t.source === "weekly_mission") && str(t.refKey) && num(t.amount) && (t.amount as number) > 0,
};

/** Drops malformed records (e.g. hand-edited or truncated storage) instead of sending them to the database. */
export function sanitizeGuestState(s: WorkspaceState): { state: WorkspaceState; invalid: number } {
  let invalid = 0;
  const one = <T,>(v: T | null, ok: (x: unknown) => boolean): T | null => {
    if (v === null || v === undefined) return null;
    if (ok(v)) return v;
    invalid++;
    return null;
  };
  const many = <T,>(v: T[] | undefined, ok: (x: unknown) => boolean): T[] => {
    if (!Array.isArray(v)) return [];
    const good = v.filter(ok);
    invalid += v.length - good.length;
    return good;
  };
  const state: WorkspaceState = {
    ...s,
    profile: one(s.profile, VALID.profile),
    offer: one(s.offer, VALID.offer),
    pricing: one(s.pricing, VALID.pricing),
    submissions: many(s.submissions, VALID.submission),
    sessions: many(s.sessions, VALID.session),
    snapshots: many(s.snapshots, VALID.snapshot),
    weeklyMissions: many(s.weeklyMissions, VALID.mission),
    xp: many(s.xp, VALID.xp),
  };
  return { state, invalid };
}

/** True when browser storage holds guest progress worth transferring. */
export function hasGuestProgress(s: WorkspaceState): boolean {
  return Boolean(s.profile || s.offer || s.pricing || s.submissions.length || s.sessions.length || s.weeklyMissions.length || s.xp.length);
}

export async function transferGuestProgress(raw: WorkspaceState, target: TransferTarget): Promise<TransferSummary> {
  const { state: guest, invalid } = sanitizeGuestState(raw);
  const account = await target.load();
  const out: TransferSummary = {
    profile: false,
    offer: false,
    pricing: false,
    submissions: 0,
    sessions: 0,
    snapshots: 0,
    missions: 0,
    achievements: 0,
    keptFromAccount: [],
    skippedInvalid: invalid,
    retentionInBrowser: target.retentionStorage() === "browser",
  };

  // 1) One-per-account records: the account's own version wins.
  if (guest.profile) {
    if (!account.profile) {
      await target.saveProfile(guest.profile);
      out.profile = true;
    } else if (account.profile.id !== guest.profile.id) out.keptFromAccount.push("skill profile");
  }
  if (guest.offer) {
    if (!account.offer) {
      await target.saveOffer(guest.offer);
      out.offer = true;
    } else if (account.offer.id !== guest.offer.id) out.keptFromAccount.push("service offer");
  }
  if (guest.pricing) {
    if (!account.pricing) {
      await target.savePricing(guest.pricing);
      out.pricing = true;
    } else if (account.pricing.id !== guest.pricing.id) out.keptFromAccount.push("pricing worksheet");
  }

  // 2) History: added by id, never duplicated.
  const subIds = new Set(account.submissions.map((x) => x.id));
  for (const s of guest.submissions) {
    if (subIds.has(s.id)) continue;
    await target.addSubmission(s);
    out.submissions++;
  }
  const sesIds = new Set(account.sessions.map((x) => x.id));
  for (const s of guest.sessions) {
    if (sesIds.has(s.id)) continue;
    await target.saveSession(s);
    out.sessions++;
  }
  const sameProfile = !account.profile || account.profile.id === guest.profile?.id;
  if (sameProfile) {
    const snapIds = new Set(account.snapshots.map((x) => x.id));
    for (const s of guest.snapshots) {
      if (snapIds.has(s.id)) continue;
      await target.addSnapshot(s);
      out.snapshots++;
    }
  }

  // 3) Weekly missions and XP.
  const duplicateOfAccount = (m: WeeklyMission) =>
    account.weeklyMissions.some((t) => t.id !== m.id && t.weekStart === m.weekStart && t.templateKey === m.templateKey);
  const missions = guest.weeklyMissions.filter((m) => !duplicateOfAccount(m));
  out.missions = missions.filter((m) => !account.weeklyMissions.some((t) => t.id === m.id)).length;
  out.achievements = guest.xp.filter(
    (t) => t.source === "achievement" && !account.xp.some((x) => x.source === "achievement" && x.refKey === t.refKey),
  ).length;
  await target.importRetention(missions, guest.xp);
  return out;
}
