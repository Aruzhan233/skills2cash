import { z } from "zod";
import { COMPETENCY_KEYS } from "./competencies";

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const optText = (max: number) => z.string().trim().max(max).default("");
const level = z.number().int().min(1).max(5);

// ---------------------------------------------------------------- assessment
export const GOALS = ["side_income", "freelance_fulltime", "test_idea", "other"] as const;
export const GOAL_LABEL: Record<(typeof GOALS)[number], string> = {
  side_income: "Earn side income next to my job",
  freelance_fulltime: "Build towards full-time freelancing",
  test_idea: "Test whether my skill can be a service",
  other: "Something else",
};

export const SelfRatingsSchema = z.object(
  Object.fromEntries(COMPETENCY_KEYS.map((k) => [k, level])) as Record<
    (typeof COMPETENCY_KEYS)[number],
    typeof level
  >,
);
export type SelfRatings = z.infer<typeof SelfRatingsSchema>;

export const AssessmentInputSchema = z.object({
  displayName: text(1, 60),
  skill: text(2, 100),
  otherSkills: optText(300),
  level: level,
  tasksDoneWell: text(5, 600),
  helpRequests: optText(600),
  experience: text(5, 800),
  workExample: text(20, 1500),
  confidence: level,
  interests: optText(300),
  hoursPerWeek: z.number().int().min(1).max(60),
  preferredIndustries: optText(300),
  goal: z.enum(GOALS),
  goalNote: optText(300),
  selfRatings: SelfRatingsSchema,
});
export type AssessmentInput = z.infer<typeof AssessmentInputSchema>;

export const PriceHypothesisSchema = z.object({
  low: z.number().positive().max(100000),
  high: z.number().positive().max(100000),
  unit: text(2, 60),
  basis: text(5, 400),
});

export const ServiceDirectionSchema = z.object({
  name: text(3, 140),
  target_customer: text(3, 300),
  problem_solved: text(3, 400),
  why_it_may_fit: text(3, 500),
  assumptions_to_validate: z.array(text(3, 300)).min(1).max(5),
  price_hypothesis: PriceHypothesisSchema,
});
export type ServiceDirection = z.infer<typeof ServiceDirectionSchema>;

export const IdentifiedSkillSchema = z.object({
  name: text(2, 100),
  level: level,
  basis: z.enum(["self-reported", "from-example"]),
  commercial: z.boolean(),
  note: text(2, 300),
});

/** Structured output the model must return for /api/assess. */
export const AssessmentResultSchema = z.object({
  summary: text(10, 700),
  facts_from_user: z.array(text(3, 300)).min(1).max(6),
  identified_skills: z.array(IdentifiedSkillSchema).min(1).max(6),
  strengths: z.array(text(2, 200)).min(1).max(4),
  gaps: z
    .array(z.object({ competency: z.enum(COMPETENCY_KEYS), note: text(3, 300) }))
    .min(1)
    .max(4),
  service_directions: z.array(ServiceDirectionSchema).min(1).max(3),
  recommended_next_steps: z.array(text(3, 300)).min(1).max(4),
});
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;

// ------------------------------------------------------------- service offer
export const PRICING_MODELS = ["fixed", "package", "hourly"] as const;
export const PRICING_MODEL_LABEL: Record<(typeof PRICING_MODELS)[number], string> = {
  fixed: "Fixed project price",
  package: "Recurring package",
  hourly: "Hourly rate",
};

export const ServiceOfferInputSchema = z.object({
  skill: text(2, 100),
  title: text(3, 140),
  targetCustomer: text(3, 300),
  customerProblem: text(5, 600),
  outcome: text(5, 600),
  deliverables: text(5, 1000),
  scope: text(5, 1200),
  timeline: text(2, 300),
  revisionPolicy: text(2, 300),
  uvp: text(5, 500),
  exclusions: text(3, 800),
  pricingModel: z.enum(PRICING_MODELS),
  priceAmount: z.number().positive().max(999999),
  priceUnit: text(1, 60),
  priceRationale: text(10, 1200),
});
export type ServiceOfferInput = z.infer<typeof ServiceOfferInputSchema>;

export const OFFER_TEXT_FIELDS = [
  "title",
  "targetCustomer",
  "customerProblem",
  "outcome",
  "deliverables",
  "scope",
  "timeline",
  "revisionPolicy",
  "uvp",
  "exclusions",
  "priceRationale",
] as const;
export type OfferTextField = (typeof OFFER_TEXT_FIELDS)[number];

/** Loose draft accepted by /api/offer/improve (fields may be incomplete). */
export const OfferDraftSchema = z.object({
  skill: text(2, 100),
  title: optText(140),
  targetCustomer: optText(300),
  customerProblem: optText(600),
  outcome: optText(600),
  deliverables: optText(1000),
  scope: optText(1200),
  timeline: optText(300),
  revisionPolicy: optText(300),
  uvp: optText(500),
  exclusions: optText(800),
  priceRationale: optText(1200),
});
export type OfferDraft = z.infer<typeof OfferDraftSchema>;

export const OfferImproveRequestSchema = z.object({
  draft: OfferDraftSchema,
  direction: ServiceDirectionSchema.nullable(),
});
export type OfferImproveRequest = z.infer<typeof OfferImproveRequestSchema>;

export const OfferImproveResultSchema = z.object({
  suggestions: z.object(
    Object.fromEntries(OFFER_TEXT_FIELDS.map((f) => [f, z.string().trim().max(1200)])) as Record<
      OfferTextField,
      z.ZodString
    >,
  ),
  notes: z.array(text(3, 300)).min(1).max(4),
  assumptions_to_validate: z.array(text(3, 300)).min(1).max(4),
});
export type OfferImproveResult = z.infer<typeof OfferImproveResultSchema>;

// ------------------------------------------------------------------- pricing
export const TIERS = ["basic", "standard", "premium"] as const;
export type Tier = (typeof TIERS)[number];

export const PackageSchema = z.object({
  tier: z.enum(TIERS),
  name: text(1, 60),
  deliverables: text(2, 400),
  hours: z.number().min(0).max(1000),
  revisions: z.number().int().min(0).max(20),
  price: z.number().min(0).max(999999),
});
export type PricePackage = z.infer<typeof PackageSchema>;

export const PricingInputSchema = z.object({
  hoursPerProject: z.number().min(0.5).max(1000),
  hourlyTarget: z.number().min(1).max(2000),
  directCosts: z.number().min(0).max(100000),
  toolCosts: z.number().min(0).max(100000),
  revisionsIncluded: z.number().int().min(0).max(20),
  scopeNotes: optText(600),
  packages: z.array(PackageSchema).length(3),
  rationale: optText(1500),
});
export type PricingInput = z.infer<typeof PricingInputSchema>;

export const PricingCoachRequestSchema = z.object({
  pricing: PricingInputSchema,
  offer: ServiceOfferInputSchema.nullable(),
});
export type PricingCoachRequest = z.infer<typeof PricingCoachRequestSchema>;

export const PricingCoachResultSchema = z.object({
  rationale: text(20, 1500),
  risks: z.array(text(3, 300)).min(1).max(4),
  validation_steps: z.array(text(3, 300)).min(1).max(4),
});
export type PricingCoachResult = z.infer<typeof PricingCoachResultSchema>;

// --------------------------------------------------------------- assignments
export const AssignmentRequestSchema = z.object({
  assignmentKey: text(1, 60),
  text: text(10, 3000),
  context: z.object({
    skill: text(1, 100),
    offer: ServiceOfferInputSchema.nullable(),
  }),
});
export type AssignmentRequest = z.infer<typeof AssignmentRequestSchema>;

export const CriterionScoreSchema = z.object({
  score: level.nullable(),
  comment: text(2, 400),
});

export function assignmentAIResultSchema(criteriaKeys: [string, ...string[]]) {
  const shape: Record<string, typeof CriterionScoreSchema> = {};
  for (const k of criteriaKeys) shape[k] = CriterionScoreSchema;
  return z.object({
    criteria: z.object(shape),
    strengths: z.array(text(2, 300)).min(0).max(3),
    improvements: z.array(text(2, 300)).min(1).max(3),
    improved_example: text(5, 1200),
  });
}

// ------------------------------------------------------------------ roleplay
export const ChatMessageSchema = z.object({
  role: z.enum(["user", "client"]),
  content: text(1, 2000),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ClientTurnRequestSchema = z.object({
  scenarioKey: text(1, 60),
  offer: ServiceOfferInputSchema,
  messages: z.array(ChatMessageSchema).min(1).max(30),
});
export type ClientTurnRequest = z.infer<typeof ClientTurnRequestSchema>;

export const ClientTurnResultSchema = z.object({
  reply: text(1, 1200),
  ready_to_decide: z.boolean().default(false),
});
export type ClientTurnResult = z.infer<typeof ClientTurnResultSchema>;

export const EvaluateRequestSchema = ClientTurnRequestSchema;

export const RUBRIC_KEYS = [
  "discovery",
  "value_proposition",
  "clarity",
  "pricing_rationale",
  "objection_handling",
  "negotiation",
  "professional_communication",
  "next_step",
] as const;
export type RubricKey = (typeof RUBRIC_KEYS)[number];

const DimensionAISchema = z.object({
  score: level.nullable(),
  evidence: z.array(z.string().trim().min(1).max(400)).max(3).default([]),
  comment: text(2, 400),
});

export const EvaluationAISchema = z.object({
  dimensions: z.object(
    Object.fromEntries(RUBRIC_KEYS.map((k) => [k, DimensionAISchema])) as Record<
      RubricKey,
      typeof DimensionAISchema
    >,
  ),
  strengths: z.array(text(2, 300)).max(3),
  mistakes: z.array(text(2, 300)).max(3).default([]),
  improvements: z
    .array(z.object({ text: text(2, 300), example: z.string().trim().max(400).default("") }))
    .min(1)
    .max(3),
});
export type EvaluationAI = z.infer<typeof EvaluationAISchema>;
