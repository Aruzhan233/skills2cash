// Deterministic progress calculations: competency scores, readiness,
// learning-path stage status, adaptive recommendation and achievements.
// All formulas are documented in README → "Scoring formulas".

import { ASSIGNMENTS, ASSIGNMENT_BY_KEY } from "./assignments";
import { COMPETENCY_KEYS, COMPETENCIES, type CompetencyKey } from "./competencies";
import { SCORE_BANDS } from "./config";
import { RUBRIC_BY_KEY } from "./rubric";
import { DIFFICULTY_ORDER, SCENARIO_BY_KEY, SCENARIOS } from "./scenarios";
import { RUBRIC_KEYS } from "./schemas";
import { levelToPercent } from "./scoring";
import { STAGES, type StageKey } from "./stages";
import {
  READINESS_KEYS,
  type AssignmentSubmission,
  type ReadinessKey,
  type RoleplaySession,
  type WorkspaceState,
} from "./types";

/** Number of most recent completed simulations that count as evidence. */
export const RECENT_SESSIONS = 3;
/** A mission or simulation counts as "passed" at or above this score. */
export const PASS_SCORE = SCORE_BANDS.remedialBelow;

export interface EvidenceItem {
  competency: CompetencyKey;
  percent: number;
  source: string;
  kind: "assignment" | "simulation";
  at: string;
}

export function latestSubmissionByKey(subs: AssignmentSubmission[]): Record<string, AssignmentSubmission> {
  const out: Record<string, AssignmentSubmission> = {};
  for (const s of subs) {
    const cur = out[s.assignmentKey];
    if (!cur || cur.createdAt < s.createdAt) out[s.assignmentKey] = s;
  }
  return out;
}

export function bestScoreByKey(subs: AssignmentSubmission[]): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const s of subs) {
    const prev = out[s.assignmentKey];
    if (prev === undefined || (s.score ?? -1) > (prev ?? -1)) out[s.assignmentKey] = s.score;
  }
  return out;
}

export function completedSessions(sessions: RoleplaySession[]): RoleplaySession[] {
  return sessions
    .filter((s) => s.status === "completed" && s.evaluation)
    .sort((a, b) => (a.endedAt ?? a.startedAt).localeCompare(b.endedAt ?? b.startedAt));
}

/** Evidence = latest submission of each mission + the most recent completed simulations. */
export function collectEvidence(state: WorkspaceState): EvidenceItem[] {
  const items: EvidenceItem[] = [];
  const latest = latestSubmissionByKey(state.submissions);
  for (const sub of Object.values(latest)) {
    const def = ASSIGNMENT_BY_KEY[sub.assignmentKey];
    if (!def) continue;
    for (const c of def.criteria) {
      const r = sub.feedback.criteria[c.key];
      if (r && typeof r.score === "number") {
        items.push({
          competency: c.competency,
          percent: levelToPercent(r.score),
          source: `Mission ${def.number}: ${c.label}`,
          kind: "assignment",
          at: sub.createdAt,
        });
      }
    }
  }
  const recent = completedSessions(state.sessions).slice(-RECENT_SESSIONS);
  for (const s of recent) {
    const title = SCENARIO_BY_KEY[s.scenarioKey]?.title ?? s.scenarioKey;
    for (const k of RUBRIC_KEYS) {
      const d = s.evaluation?.dimensions[k];
      if (d && typeof d.score === "number") {
        items.push({
          competency: RUBRIC_BY_KEY[k].competency,
          percent: levelToPercent(d.score),
          source: `Simulation “${title}”: ${RUBRIC_BY_KEY[k].label}`,
          kind: "simulation",
          at: s.endedAt ?? s.startedAt,
        });
      }
    }
  }
  return items;
}

const mean = (xs: number[]): number | null =>
  xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;

export interface CompetencyScore {
  key: CompetencyKey;
  label: string;
  description: string;
  selfReported: number | null;
  demonstrated: number | null;
  evidence: EvidenceItem[];
  /** Score to display: demonstrated when available, else self-reported. */
  display: number | null;
  source: "demonstrated" | "self-reported" | "none";
}

export function competencyScores(state: WorkspaceState): CompetencyScore[] {
  const evidence = collectEvidence(state);
  const ratings = state.profile?.assessment.selfRatings;
  return COMPETENCY_KEYS.map((key) => {
    const ev = evidence.filter((e) => e.competency === key);
    const demonstrated = mean(ev.map((e) => e.percent));
    const selfReported = ratings ? levelToPercent(ratings[key]) : null;
    const display = demonstrated ?? selfReported;
    return {
      key,
      label: COMPETENCIES[key].label,
      description: COMPETENCIES[key].description,
      selfReported,
      demonstrated,
      evidence: ev,
      display,
      source: demonstrated !== null ? "demonstrated" : selfReported !== null ? "self-reported" : "none",
    };
  });
}

// --------------------------------------------------------------- readiness
export const READINESS_DEFS: Record<ReadinessKey, { label: string; competencies: CompetencyKey[] }> = {
  service_clarity: { label: "Service clarity", competencies: ["service_definition"] },
  target_customer: { label: "Target-customer understanding", competencies: ["target_customer"] },
  pricing_rationale: { label: "Pricing rationale", competencies: ["pricing_rationale"] },
  portfolio: { label: "Portfolio / proof quality", competencies: ["skill_capability"] },
  communication: { label: "Communication", competencies: ["client_communication", "value_proposition"] },
  objection_handling: { label: "Objection handling & negotiation", competencies: ["objection_handling", "negotiation"] },
  closing: { label: "Closing & next steps", competencies: ["closing"] },
};
/** Fewer evidenced dimensions than this → readiness marked provisional. */
export const READINESS_MIN_DIMENSIONS = 4;

export interface Readiness {
  overall: number | null;
  dimensions: Record<ReadinessKey, { score: number | null; evidenceCount: number }>;
  evidenced: number;
  provisional: boolean;
}

/** Readiness uses demonstrated evidence only — never self-reported levels. */
export function computeReadiness(state: WorkspaceState): Readiness {
  const evidence = collectEvidence(state);
  const dimensions = {} as Readiness["dimensions"];
  const scored: number[] = [];
  for (const k of READINESS_KEYS) {
    const ev = evidence.filter((e) => READINESS_DEFS[k].competencies.includes(e.competency));
    const score = mean(ev.map((e) => e.percent));
    dimensions[k] = { score, evidenceCount: ev.length };
    if (score !== null) scored.push(score);
  }
  return {
    overall: mean(scored),
    dimensions,
    evidenced: scored.length,
    provisional: scored.length < READINESS_MIN_DIMENSIONS,
  };
}

// ----------------------------------------------------------- learning path
export type StageStatus = "completed" | "in_progress" | "not_started";

export interface Requirement {
  label: string;
  done: boolean;
  href: string;
  score?: number | null;
}

export interface StageProgress {
  key: StageKey;
  status: StageStatus;
  requirements: Requirement[];
  done: number;
  total: number;
}

function missionReq(key: string, best: Record<string, number | null>): Requirement {
  const def = ASSIGNMENT_BY_KEY[key];
  const score = best[key];
  return {
    label: `Mission ${def?.number}: ${def?.title}`,
    done: typeof score === "number" && score >= PASS_SCORE,
    href: `/assignments/${key}`,
    score: score ?? null,
  };
}

export function stageProgress(state: WorkspaceState): StageProgress[] {
  const best = bestScoreByKey(state.submissions);
  const bestSim = completedSessions(state.sessions).reduce<number | null>(
    (acc, s) => (s.overallScore !== null && (acc === null || s.overallScore > acc) ? s.overallScore : acc),
    null,
  );
  const reqs: Record<StageKey, Requirement[]> = {
    discover: [
      { label: "Complete the skill assessment", done: !!state.profile, href: "/onboarding" },
      missionReq("target-customer", best),
      missionReq("customer-problem", best),
    ],
    build: [
      { label: "Save your service offer", done: !!state.offer, href: "/service-builder" },
      missionReq("offer-sentence", best),
      missionReq("portfolio-case", best),
    ],
    price: [
      { label: "Save a pricing worksheet", done: !!state.pricing, href: "/service-builder/pricing" },
      missionReq("pricing-packages", best),
    ],
    practice: [
      {
        label: `Score ${PASS_SCORE}+ in an AI client simulation`,
        done: bestSim !== null && bestSim >= PASS_SCORE,
        href: "/practice",
        score: bestSim,
      },
      missionReq("objection-reply", best),
    ],
    launch: [missionReq("pitch", best), missionReq("outreach", best)],
  };
  return STAGES.map((s) => {
    const r = reqs[s.key];
    const done = r.filter((x) => x.done).length;
    const started =
      done > 0 || r.some((x) => x.score !== undefined && x.score !== null);
    return {
      key: s.key,
      requirements: r,
      done,
      total: r.length,
      status: done === r.length ? "completed" : started ? "in_progress" : "not_started",
    };
  });
}

export function currentStage(progress: StageProgress[]): StageKey {
  return (progress.find((p) => p.status !== "completed") ?? progress[progress.length - 1]).key;
}

// ------------------------------------------------------- recommendation
export interface Recommendation {
  title: string;
  href: string;
  reason: string;
  cta: string;
}

const ACTIVITY_FOR: Record<CompetencyKey, { kind: "assignment" | "scenario"; key: string }> = {
  skill_capability: { kind: "assignment", key: "portfolio-case" },
  service_definition: { kind: "assignment", key: "offer-sentence" },
  target_customer: { kind: "assignment", key: "customer-problem" },
  pricing_rationale: { kind: "assignment", key: "pricing-packages" },
  value_proposition: { kind: "assignment", key: "pitch" },
  client_communication: { kind: "scenario", key: "experience" },
  objection_handling: { kind: "scenario", key: "cheaper-freelancer" },
  negotiation: { kind: "scenario", key: "discount" },
  closing: { kind: "scenario", key: "not-sure" },
};

function activity(k: CompetencyKey): { title: string; href: string; cta: string } {
  const a = ACTIVITY_FOR[k];
  if (a.kind === "assignment") {
    const d = ASSIGNMENT_BY_KEY[a.key];
    return { title: `Mission ${d.number}: ${d.title}`, href: `/assignments/${a.key}`, cta: "Open mission" };
  }
  return { title: `Simulation: ${SCENARIO_BY_KEY[a.key].title}`, href: `/practice/${a.key}`, cta: "Start simulation" };
}

/**
 * Transparent rule order:
 * 1. No assessment → assessment.
 * 2. Weakest demonstrated competency below 60 → remedial activity for it.
 * 3. First unmet learning-path requirement.
 * 4. Weakest demonstrated competency below 80 → targeted practice.
 * 5. Otherwise → a harder simulation not yet passed.
 */
export function recommendNext(state: WorkspaceState): Recommendation {
  if (!state.profile) {
    return {
      title: "Complete your skill assessment",
      href: "/onboarding",
      cta: "Start assessment",
      reason: "Everything else is personalised from your assessment.",
    };
  }
  const scores = competencyScores(state).filter((c) => c.demonstrated !== null);
  const weakest = scores.sort((a, b) => (a.demonstrated ?? 0) - (b.demonstrated ?? 0))[0];
  if (weakest && (weakest.demonstrated ?? 0) < SCORE_BANDS.remedialBelow) {
    return {
      ...activity(weakest.key),
      reason: `Your demonstrated ${weakest.label.toLowerCase()} score is ${weakest.demonstrated}/100 (below ${SCORE_BANDS.remedialBelow}), so remedial practice comes first.`,
    };
  }
  for (const p of stageProgress(state)) {
    const req = p.requirements.find((r) => !r.done);
    if (req) {
      return {
        title: req.label,
        href: req.href,
        cta: "Continue",
        reason: `Next unmet requirement of the ${p.key.charAt(0).toUpperCase() + p.key.slice(1)} stage.`,
      };
    }
  }
  if (weakest && (weakest.demonstrated ?? 0) < SCORE_BANDS.advanceAt) {
    return {
      ...activity(weakest.key),
      reason: `All stages are complete. Your weakest area is ${weakest.label.toLowerCase()} at ${weakest.demonstrated}/100 (60–79 band) — targeted practice.`,
    };
  }
  const passed = new Set(
    completedSessions(state.sessions)
      .filter((s) => (s.overallScore ?? 0) >= SCORE_BANDS.advanceAt)
      .map((s) => s.scenarioKey),
  );
  const next =
    [...SCENARIOS]
      .sort((a, b) => DIFFICULTY_ORDER[b.difficulty] - DIFFICULTY_ORDER[a.difficulty])
      .find((s) => !passed.has(s.key)) ?? SCENARIOS[0];
  return {
    title: `Simulation: ${next.title}`,
    href: `/practice/${next.key}`,
    cta: "Start simulation",
    reason: `All demonstrated competencies are 80+. Challenge yourself with a ${next.difficulty.toLowerCase()} scenario.`,
  };
}

// ------------------------------------------------------------ achievements
export interface Achievement {
  key: string;
  title: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
  href: string;
  /** XP granted once, when the achievement is first unlocked. */
  xp: number;
}

export function achievements(state: WorkspaceState): Achievement[] {
  const sessions = completedSessions(state.sessions);
  const passedSubs = [...state.submissions]
    .filter((s) => (s.score ?? 0) >= PASS_SCORE)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const pricingSub = passedSubs.find((s) => s.assignmentKey === "pricing-packages");
  const objectionSession = sessions.find((s) => (s.evaluation?.dimensions.objection_handling.score ?? 0) >= 4);
  let improved: string | null = null;
  const byScenario: Record<string, number> = {};
  for (const s of sessions) {
    const prev = byScenario[s.scenarioKey];
    if (prev !== undefined && s.overallScore !== null && s.overallScore > prev && !improved) {
      improved = s.endedAt ?? s.startedAt;
    }
    if (s.overallScore !== null) byScenario[s.scenarioKey] = Math.max(prev ?? 0, s.overallScore);
  }
  const readiness = computeReadiness(state);
  const launchReady = readiness.overall !== null && readiness.overall >= 70 && !readiness.provisional;
  const lastSnap = state.snapshots[state.snapshots.length - 1];
  const allMissions = ASSIGNMENTS.every((a) => passedSubs.some((s) => s.assignmentKey === a.key));

  const passedAt = (key: string) => passedSubs.find((s) => s.assignmentKey === key)?.createdAt ?? null;
  const latest = (...xs: Array<string | null | undefined>) => (xs.every(Boolean) ? (xs as string[]).sort().at(-1)! : null);
  const commercialSkills = state.profile?.result.identified_skills.filter((k) => k.commercial).length ?? 0;
  const passedSim = sessions.find((s) => (s.overallScore ?? 0) >= PASS_SCORE);
  const weeklyDone = (state.weeklyMissions ?? [])
    .filter((m) => m.status === "completed" && m.completedAt)
    .sort((a, b) => a.completedAt!.localeCompare(b.completedAt!));
  const byWeek = new Map<string, typeof weeklyDone>();
  for (const m of state.weeklyMissions ?? []) byWeek.set(m.weekStart, [...(byWeek.get(m.weekStart) ?? []), m]);
  const fullWeeks = [...byWeek.values()]
    .filter((ms) => ms.length > 0 && ms.every((m) => m.status === "completed" && m.completedAt))
    .map((ms) => ms.map((m) => m.completedAt!).sort().at(-1)!)
    .sort();

  const list: Array<Omit<Achievement, "earned">> = [
    {
      key: "assessment",
      title: "Assessment Completed",
      description: "Finished the skill assessment.",
      earnedAt: state.profile?.createdAt ?? null,
      href: "/onboarding",
      xp: 50,
    },
    {
      key: "first-offer",
      title: "First Service Offer",
      description: "Saved a service offer in the Service Builder.",
      earnedAt: state.offer?.updatedAt ?? null,
      href: "/service-builder",
      xp: 75,
    },
    {
      key: "first-mission",
      title: "First Mission",
      description: `Scored ${PASS_SCORE}+ on any mission.`,
      earnedAt: passedSubs[0]?.createdAt ?? null,
      href: "/assignments",
      xp: 75,
    },
    {
      key: "pricing",
      title: "Pricing Practice",
      description: `Saved a pricing worksheet and scored ${PASS_SCORE}+ on Mission 4.`,
      earnedAt: state.pricing && pricingSub ? pricingSub.createdAt : null,
      href: "/service-builder/pricing",
      xp: 100,
    },
    {
      key: "first-simulation",
      title: "First Client Simulation",
      description: "Completed and evaluated an AI client conversation.",
      earnedAt: sessions[0]?.endedAt ?? null,
      href: "/practice",
      xp: 75,
    },
    {
      key: "objection",
      title: "Objection Handler",
      description: "Scored 4/5 or higher on objection handling in a simulation.",
      earnedAt: objectionSession?.endedAt ?? null,
      href: "/practice",
      xp: 100,
    },
    {
      key: "improved",
      title: "Getting Better",
      description: "Beat your previous score on the same scenario.",
      earnedAt: improved,
      href: "/practice",
      xp: 75,
    },
    {
      key: "all-missions",
      title: "Mission Complete",
      description: `Scored ${PASS_SCORE}+ on all ${ASSIGNMENTS.length} missions.`,
      earnedAt: allMissions ? passedSubs[passedSubs.length - 1].createdAt : null,
      href: "/assignments",
      xp: 250,
    },
    {
      key: "launch-ready",
      title: "Launch Ready",
      description: "Readiness 70+ with evidence in at least 4 of 7 dimensions.",
      earnedAt: launchReady ? (lastSnap?.createdAt ?? new Date().toISOString()) : null,
      href: "/readiness",
      xp: 300,
    },
    {
      key: "skill-explorer",
      title: "Skill Explorer",
      description: "Your assessment identified three or more monetizable skills.",
      earnedAt: commercialSkills >= 3 ? (state.profile?.createdAt ?? null) : null,
      href: "/profile/skills",
      xp: 50,
    },
    {
      key: "market-researcher",
      title: "Market Researcher",
      description: `Scored ${PASS_SCORE}+ on both customer research missions (2 and 3).`,
      earnedAt: latest(passedAt("target-customer"), passedAt("customer-problem")),
      href: "/assignments/target-customer",
      xp: 100,
    },
    {
      key: "first-portfolio",
      title: "First Portfolio",
      description: `Scored ${PASS_SCORE}+ on the portfolio project mission.`,
      earnedAt: passedAt("portfolio-case"),
      href: "/assignments/portfolio-case",
      xp: 100,
    },
    {
      key: "practice-champion",
      title: "Practice Champion",
      description: "Completed five AI client simulations.",
      earnedAt: sessions.length >= 5 ? (sessions[4].endedAt ?? sessions[4].startedAt) : null,
      href: "/practice",
      xp: 150,
    },
    {
      key: "sales-ready",
      title: "Sales Ready",
      description: `Scored ${PASS_SCORE}+ in a simulation and on the objection-reply and pitch missions.`,
      earnedAt: latest(passedSim ? (passedSim.endedAt ?? passedSim.startedAt) : null, passedAt("objection-reply"), passedAt("pitch")),
      href: "/practice",
      xp: 200,
    },
    {
      key: "weekly-first",
      title: "Weekly Starter",
      description: "Completed your first weekly mission.",
      earnedAt: weeklyDone[0]?.completedAt ?? null,
      href: "/assignments/weekly",
      xp: 50,
    },
    {
      key: "weekly-full",
      title: "Full Week",
      description: "Completed every weekly mission in a single week.",
      earnedAt: fullWeeks[0] ?? null,
      href: "/assignments/weekly",
      xp: 100,
    },
    {
      key: "weekly-ten",
      title: "Consistent Earner-in-Training",
      description: "Completed ten weekly missions in total.",
      earnedAt: weeklyDone.length >= 10 ? weeklyDone[9].completedAt : null,
      href: "/assignments/weekly",
      xp: 200,
    },
  ];
  return list.map((a) => ({ ...a, earned: a.earnedAt !== null }));
}
