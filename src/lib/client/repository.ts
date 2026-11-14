"use client";
// Persistence layer. Two implementations share one interface:
//  - SupabaseRepository: PostgreSQL with Row Level Security (signed-in users).
//  - LocalRepository: browser storage — used for the isolated /demo workspace,
//    and as a clearly labelled "local mode" when Supabase is not configured.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { StageKey } from "../stages";
import {
  EMPTY_STATE,
  type AssignmentSubmission,
  type PricingWorksheet,
  type ReadinessSnapshot,
  type RoleplaySession,
  type ServiceOffer,
  type SkillProfile,
  type WorkspaceState,
} from "../types";

export interface LearningPathRecord {
  title: string;
  currentStage: StageKey;
  status: "active" | "completed";
  steps: Array<{ key: StageKey; status: string; done: number; total: number }>;
}

export interface Repository {
  kind: "supabase" | "local";
  load(): Promise<WorkspaceState>;
  saveProfile(p: SkillProfile): Promise<void>;
  saveOffer(o: ServiceOffer): Promise<void>;
  savePricing(p: PricingWorksheet): Promise<void>;
  addSubmission(s: AssignmentSubmission): Promise<void>;
  saveSession(s: RoleplaySession): Promise<void>;
  addSnapshot(s: ReadinessSnapshot): Promise<void>;
  saveLearningPath(p: LearningPathRecord): Promise<void>;
  reset(): Promise<void>;
}

// ------------------------------------------------------------------ local
export class LocalRepository implements Repository {
  kind = "local" as const;
  constructor(
    private key: string,
    private storage: Storage,
  ) {}

  private read(): WorkspaceState {
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return { ...EMPTY_STATE };
<<<<<<< HEAD
      return { ...EMPTY_STATE, ...(JSON.parse(raw) as Partial<WorkspaceState>) };
=======
      const parsed = JSON.parse(raw) as Partial<WorkspaceState> & { workspace?: Partial<WorkspaceState> };
      return { ...EMPTY_STATE, ...(parsed.workspace ?? parsed) };
>>>>>>> 12acf10 (feat: implement guest mode and pricing paywall)
    } catch {
      return { ...EMPTY_STATE };
    }
  }

  private write(fn: (s: WorkspaceState) => WorkspaceState) {
    const next = fn(this.read());
    try {
<<<<<<< HEAD
      this.storage.setItem(this.key, JSON.stringify(next));
=======
      if (this.key === "skills2cash_guest_data") {
        const prior = JSON.parse(this.storage.getItem(this.key) || "{}") as Record<string, unknown>;
        this.storage.setItem(this.key, JSON.stringify({ ...prior, workspace: next }));
      } else this.storage.setItem(this.key, JSON.stringify(next));
>>>>>>> 12acf10 (feat: implement guest mode and pricing paywall)
    } catch {
      throw new Error("Could not save to browser storage (it may be full or disabled).");
    }
  }

  async load() {
    return this.read();
  }
  async saveProfile(p: SkillProfile) {
    this.write((s) => ({ ...s, profile: p }));
  }
  async saveOffer(o: ServiceOffer) {
    this.write((s) => ({ ...s, offer: o }));
  }
  async savePricing(p: PricingWorksheet) {
    this.write((s) => ({ ...s, pricing: p }));
  }
  async addSubmission(sub: AssignmentSubmission) {
    this.write((s) => ({ ...s, submissions: [...s.submissions, sub] }));
  }
  async saveSession(sess: RoleplaySession) {
    this.write((s) => ({
      ...s,
      sessions: s.sessions.some((x) => x.id === sess.id)
        ? s.sessions.map((x) => (x.id === sess.id ? sess : x))
        : [...s.sessions, sess],
    }));
  }
  async addSnapshot(snap: ReadinessSnapshot) {
    this.write((s) => ({ ...s, snapshots: [...s.snapshots, snap].slice(-50) }));
  }
  async saveLearningPath() {
    /* derived from state in local mode */
  }
  async reset() {
    this.storage.removeItem(this.key);
  }
}

// --------------------------------------------------------------- supabase
type Row = Record<string, unknown>;

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Database error: ${res.error.message}`);
  return res.data;
}

export class SupabaseRepository implements Repository {
  kind = "supabase" as const;
  constructor(
    private db: SupabaseClient,
    private userId: string,
  ) {}

  async load(): Promise<WorkspaceState> {
    const [sp, offer, pricing, subs, sessions, messages, snaps] = await Promise.all([
      this.db.from("skill_profiles").select("*").maybeSingle(),
      this.db.from("service_offers").select("*").maybeSingle(),
      this.db.from("pricing_worksheets").select("*").maybeSingle(),
      this.db.from("assignment_submissions").select("*").order("created_at"),
      this.db.from("roleplay_sessions").select("*").order("started_at"),
      this.db.from("roleplay_messages").select("*").order("created_at"),
      this.db.from("readiness_snapshots").select("*").order("created_at"),
    ]);
    const spRow = check(sp) as Row | null;
    const offerRow = check(offer) as Row | null;
    const pricingRow = check(pricing) as Row | null;
    const msgRows = check(messages) as Row[];
    const profileRow = check(await this.db.from("profiles").select("display_name").maybeSingle()) as Row | null;

    return {
      profile: spRow
        ? {
            id: spRow.id as string,
            displayName: (profileRow?.display_name as string) || "",
            assessment: spRow.assessment as SkillProfile["assessment"],
            result: spRow.result as SkillProfile["result"],
            direction: spRow.selected_service_direction as SkillProfile["direction"],
            directionEdited: Boolean(spRow.direction_edited),
            rejectedStrengths: (spRow.rejected_strengths as string[]) ?? [],
            generatedBy: spRow.generated_by === "ai" ? "ai" : "sample",
            createdAt: spRow.created_at as string,
            updatedAt: spRow.updated_at as string,
          }
        : null,
      offer: offerRow ? { ...(offerRow.data as ServiceOffer), id: offerRow.id as string, updatedAt: offerRow.updated_at as string } : null,
      pricing: pricingRow
        ? { ...(pricingRow.data as PricingWorksheet), id: pricingRow.id as string, updatedAt: pricingRow.updated_at as string }
        : null,
      submissions: (check(subs) as Row[]).map((r) => ({
        id: r.id as string,
        assignmentKey: r.assignment_key as string,
        text: r.submission_text as string,
        feedback: r.ai_feedback as AssignmentSubmission["feedback"],
        score: (r.score as number | null) ?? null,
        createdAt: r.created_at as string,
      })),
      sessions: (check(sessions) as Row[]).map((r) => ({
        id: r.id as string,
        scenarioKey: r.scenario_key as string,
        offerSnapshot: r.service_offer_snapshot as RoleplaySession["offerSnapshot"],
        status: r.status as RoleplaySession["status"],
        scripted: Boolean(r.is_scripted),
        startedAt: r.started_at as string,
        endedAt: (r.ended_at as string | null) ?? null,
        evaluation: (r.evaluation as RoleplaySession["evaluation"]) ?? null,
        overallScore: (r.overall_score as number | null) ?? null,
        messages: msgRows
          .filter((m) => m.session_id === r.id)
          .map((m) => ({
            id: m.id as string,
            role: m.role as "user" | "client",
            content: m.content as string,
            createdAt: m.created_at as string,
          })),
      })),
      snapshots: (check(snaps) as Row[]).map((r) => ({
        id: r.id as string,
        overall: (r.overall_score as number | null) ?? null,
        dimensions: r.dimension_scores as ReadinessSnapshot["dimensions"],
        createdAt: r.created_at as string,
      })),
    };
  }

  async saveProfile(p: SkillProfile) {
    check(
      await this.db.from("profiles").upsert({
        id: this.userId,
        display_name: p.displayName,
        weekly_time_available: p.assessment.hoursPerWeek,
        experience_summary: p.assessment.experience,
      }),
    );
    check(
      await this.db.from("skill_profiles").upsert(
        {
          id: p.id,
          user_id: this.userId,
          assessment: p.assessment,
          result: p.result,
          selected_skill: p.assessment.skill,
          selected_service_direction: p.direction,
          direction_edited: p.directionEdited,
          rejected_strengths: p.rejectedStrengths,
          generated_by: p.generatedBy,
        },
        { onConflict: "user_id" },
      ),
    );
  }

  async saveOffer(o: ServiceOffer) {
    const { id, updatedAt: _u, ...data } = o;
    void _u;
    check(
      await this.db
        .from("service_offers")
        .upsert({ id, user_id: this.userId, title: data.title, price_amount: data.priceAmount, data }, { onConflict: "user_id" }),
    );
  }

  async savePricing(p: PricingWorksheet) {
    const { id, updatedAt: _u, ...data } = p;
    void _u;
    check(await this.db.from("pricing_worksheets").upsert({ id, user_id: this.userId, data }, { onConflict: "user_id" }));
  }

  async addSubmission(s: AssignmentSubmission) {
    check(
      await this.db.from("assignment_submissions").insert({
        id: s.id,
        user_id: this.userId,
        assignment_key: s.assignmentKey,
        submission_text: s.text,
        ai_feedback: s.feedback,
        score: s.score,
        created_at: s.createdAt,
      }),
    );
  }

  async saveSession(s: RoleplaySession) {
    // 1) ensure the session row exists while it is still active
    check(
      await this.db.from("roleplay_sessions").upsert(
        {
          id: s.id,
          user_id: this.userId,
          scenario_key: s.scenarioKey,
          service_offer_snapshot: s.offerSnapshot,
          status: "active",
          is_scripted: s.scripted,
          started_at: s.startedAt,
        },
        { onConflict: "id", ignoreDuplicates: true },
      ),
    );
    // 2) add any new messages (idempotent on message id)
    if (s.messages.length) {
      check(
        await this.db.from("roleplay_messages").upsert(
          s.messages.map((m) => ({
            id: m.id,
            session_id: s.id,
            user_id: this.userId,
            role: m.role,
            content: m.content,
            created_at: m.createdAt,
          })),
          { onConflict: "id", ignoreDuplicates: true },
        ),
      );
    }
    // 3) finalise
    check(
      await this.db
        .from("roleplay_sessions")
        .update({
          is_scripted: s.scripted,
          status: s.status,
          ended_at: s.endedAt,
          evaluation: s.evaluation,
          overall_score: s.overallScore,
        })
        .eq("id", s.id),
    );
  }

  async addSnapshot(s: ReadinessSnapshot) {
    check(
      await this.db.from("readiness_snapshots").insert({
        id: s.id,
        user_id: this.userId,
        overall_score: s.overall,
        dimension_scores: s.dimensions,
        created_at: s.createdAt,
      }),
    );
  }

  async saveLearningPath(p: LearningPathRecord) {
    check(
      await this.db.from("learning_paths").upsert(
        {
          user_id: this.userId,
          title: p.title,
          status: p.status,
          current_stage: p.currentStage,
          steps: p.steps,
        },
        { onConflict: "user_id" },
      ),
    );
  }

  async reset() {
    for (const t of [
      "roleplay_messages",
      "roleplay_sessions",
      "assignment_submissions",
      "readiness_snapshots",
      "learning_paths",
      "pricing_worksheets",
      "service_offers",
      "skill_profiles",
    ]) {
      check(await this.db.from(t).delete().eq("user_id", this.userId));
    }
  }
}
