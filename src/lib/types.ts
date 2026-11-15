import type {
  AssessmentInput,
  AssessmentResult,
  PricingCoachResult,
  PricingInput,
  RubricKey,
  ServiceDirection,
  ServiceOfferInput,
} from "./schemas";

export type Mode = "live" | "demo";
/** "ai" = produced by the model; "sample" = labelled offline/scripted fallback. */
export type Generator = "ai" | "sample";

export interface SkillProfile {
  id: string;
  displayName: string;
  assessment: AssessmentInput;
  result: AssessmentResult;
  /** The direction the user kept, possibly edited by the user. */
  direction: ServiceDirection;
  directionEdited: boolean;
  rejectedStrengths: string[];
  generatedBy: Generator;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOffer extends ServiceOfferInput {
  id: string;
  updatedAt: string;
}

export interface PricingWorksheet extends PricingInput {
  id: string;
  coach: PricingCoachResult | null;
  coachGeneratedBy: Generator | null;
  updatedAt: string;
}

export interface CriterionResult {
  score: number | null;
  comment: string;
}

export interface AssignmentFeedback {
  criteria: Record<string, CriterionResult>;
  strengths: string[];
  improvements: string[];
  improvedExample: string;
  overallScore: number | null;
  scoredCount: number;
  totalCount: number;
  lowConfidence: boolean;
  generatedBy: Generator;
  formulaVersion: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentKey: string;
  text: string;
  feedback: AssignmentFeedback;
  score: number | null;
  createdAt: string;
}

export interface RoleplayMessage {
  id: string;
  role: "user" | "client";
  content: string;
  createdAt: string;
}

export interface DimensionResult {
  score: number | null;
  /** Quotes verified to appear verbatim in the user's messages. */
  evidence: string[];
  comment: string;
}

export interface NextPractice {
  kind: "scenario" | "assignment";
  key: string;
  title: string;
  reason: string;
}

export interface Evaluation {
  dimensions: Record<RubricKey, DimensionResult>;
  strengths: string[];
  mistakes: string[];
  improvements: Array<{ text: string; example: string }>;
  overallScore: number | null;
  scoredCount: number;
  totalCount: number;
  userTurns: number;
  lowConfidence: boolean;
  lowConfidenceReasons: string[];
  nextPractice: NextPractice;
  generatedBy: Generator;
  formulaVersion: string;
}

export interface RoleplaySession {
  id: string;
  scenarioKey: string;
  offerSnapshot: ServiceOfferInput;
  status: "active" | "completed";
  /** True when client replies came from the labelled scripted fallback. */
  scripted: boolean;
  startedAt: string;
  endedAt: string | null;
  messages: RoleplayMessage[];
  evaluation: Evaluation | null;
  overallScore: number | null;
}

export const READINESS_KEYS = [
  "service_clarity",
  "target_customer",
  "pricing_rationale",
  "portfolio",
  "communication",
  "objection_handling",
  "closing",
] as const;
export type ReadinessKey = (typeof READINESS_KEYS)[number];

export interface ReadinessSnapshot {
  id: string;
  overall: number | null;
  dimensions: Record<ReadinessKey, number | null>;
  createdAt: string;
}

export const WEEKLY_CATEGORIES = ["research", "offer", "pricing", "portfolio", "sales", "outreach"] as const;
export type WeeklyCategory = (typeof WEEKLY_CATEGORIES)[number];
export type WeeklyDifficulty = "Easy" | "Medium" | "Hard";

/** A personalised real-world task issued for one calendar week. Completion is self-reported. */
export interface WeeklyMission {
  id: string;
  /** Monday of the week it belongs to, YYYY-MM-DD (user's local time). */
  weekStart: string;
  templateKey: string;
  title: string;
  description: string;
  steps: string[];
  /** Why this mission was picked for this user. */
  reason: string;
  category: WeeklyCategory;
  difficulty: WeeklyDifficulty;
  xp: number;
  deadline: string;
  status: "active" | "completed";
  completionNote: string | null;
  completedAt: string | null;
  createdAt: string;
}

export type XpSource = "achievement" | "weekly_mission";

/** One XP award. (source, refKey) is unique per user, so a reward can never be granted twice. */
export interface XpTransaction {
  id: string;
  source: XpSource;
  refKey: string;
  amount: number;
  label: string;
  createdAt: string;
}

export interface WorkspaceState {
  profile: SkillProfile | null;
  offer: ServiceOffer | null;
  pricing: PricingWorksheet | null;
  submissions: AssignmentSubmission[];
  sessions: RoleplaySession[];
  snapshots: ReadinessSnapshot[];
  weeklyMissions: WeeklyMission[];
  xp: XpTransaction[];
}

export const EMPTY_STATE: WorkspaceState = {
  profile: null,
  offer: null,
  pricing: null,
  submissions: [],
  sessions: [],
  snapshots: [],
  weeklyMissions: [],
  xp: [],
};
