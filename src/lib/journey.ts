// The learner journey shown in the main navigation. Account and billing pages
// (e.g. /subscription) are deliberately not part of it.

import { ASSIGNMENTS } from "./assignments";
import { bestScoreByKey, completedSessions, computeReadiness, PASS_SCORE, stageProgress } from "./progress";
import type { WorkspaceState } from "./types";

export const JOURNEY_KEYS = ["skills", "path", "service", "practice", "missions", "readiness"] as const;
export type JourneyKey = (typeof JOURNEY_KEYS)[number];

export interface JourneyStep {
  key: JourneyKey;
  number: number;
  href: string;
  label: string;
  /** What the learner achieves at this step. */
  phase: string;
  description: string;
  /** Extra path prefixes that belong to this step. */
  also?: string[];
}

export const JOURNEY: JourneyStep[] = [
  {
    key: "skills",
    number: 1,
    href: "/profile/skills",
    label: "My Skills",
    phase: "Discover your skills",
    description: "Assess your skills and see which ones you can monetize.",
    also: ["/onboarding"],
  },
  {
    key: "path",
    number: 2,
    href: "/path",
    label: "Learning Path",
    phase: "Close your skill gaps",
    description: "Follow a personalised roadmap that adapts to your results.",
  },
  {
    key: "service",
    number: 3,
    href: "/service-builder",
    label: "Service Builder",
    phase: "Build a service and set prices",
    description: "Turn a skill into a specific offer with packages and prices.",
  },
  {
    key: "practice",
    number: 4,
    href: "/practice",
    label: "Practice",
    phase: "Practice selling",
    description: "Rehearse client conversations, objections and closing with AI clients.",
  },
  {
    key: "missions",
    number: 5,
    href: "/assignments",
    label: "Missions",
    phase: "Complete real-world missions",
    description: "Practical assignments with rubric-based feedback.",
  },
  {
    key: "readiness",
    number: 6,
    href: "/readiness",
    label: "Readiness",
    phase: "Become ready to monetize",
    description: "See your readiness score, remaining gaps and launch checklist.",
  },
];

/** Readiness at or above this (with enough evidence) counts as launch-ready. */
export const LAUNCH_READY_SCORE = 70;

function under(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

export function journeyStepForPath(path: string): JourneyStep | null {
  return JOURNEY.find((s) => under(path, s.href) || s.also?.some((a) => under(path, a))) ?? null;
}

export type JourneyStatus = "done" | "in_progress" | "todo";

export interface JourneyProgress {
  status: JourneyStatus;
  detail: string;
}

/** Status of every journey step, derived only from saved workspace data. */
export function journeyProgress(state: WorkspaceState): Record<JourneyKey, JourneyProgress> {
  const stages = stageProgress(state);
  const stagesDone = stages.filter((s) => s.status === "completed").length;
  const stagesStarted = stages.some((s) => s.status !== "not_started");

  const sims = completedSessions(state.sessions);
  const simPassed = sims.some((s) => (s.overallScore ?? 0) >= PASS_SCORE);

  const best = bestScoreByKey(state.submissions);
  const missionsPassed = ASSIGNMENTS.filter((a) => (best[a.key] ?? -1) >= PASS_SCORE).length;

  const readiness = computeReadiness(state);
  const launchReady = readiness.overall !== null && readiness.overall >= LAUNCH_READY_SCORE && !readiness.provisional;

  const pick = (done: boolean, started: boolean): JourneyStatus => (done ? "done" : started ? "in_progress" : "todo");

  return {
    skills: {
      status: pick(!!state.profile, false),
      detail: state.profile ? "Assessment completed" : "Assessment not taken yet",
    },
    path: {
      status: pick(stagesDone === stages.length, stagesStarted),
      detail: `${stagesDone} of ${stages.length} stages complete`,
    },
    service: {
      status: pick(!!state.offer && !!state.pricing, !!state.offer || !!state.pricing),
      detail: `Offer ${state.offer ? "saved" : "not saved"} · pricing ${state.pricing ? "saved" : "not saved"}`,
    },
    practice: {
      status: pick(simPassed, state.sessions.length > 0),
      detail: `${sims.length} simulation${sims.length === 1 ? "" : "s"} completed`,
    },
    missions: {
      status: pick(missionsPassed === ASSIGNMENTS.length, state.submissions.length > 0),
      detail: `${missionsPassed} of ${ASSIGNMENTS.length} missions complete`,
    },
    readiness: {
      status: pick(launchReady, readiness.overall !== null),
      detail: readiness.overall === null ? "No demonstrated evidence yet" : `Readiness ${readiness.overall}/100${readiness.provisional ? " · provisional" : ""}`,
    },
  };
}

/** The step after the given page, for "next step" links. Flexible — never a gate. */
export function nextAfter(path: string): { href: string; label: string; description: string } | null {
  if (path === "/service-builder") {
    return { href: "/service-builder/pricing", label: "Pricing Builder", description: "Design Basic, Standard and Premium packages for this offer." };
  }
  const step = JOURNEY.find((s) => s.href === path) ?? (path === "/service-builder/pricing" ? JOURNEY[2] : null);
  if (!step) return null;
  const next = JOURNEY[step.number];
  return next ? { href: next.href, label: next.label, description: next.description } : null;
}
