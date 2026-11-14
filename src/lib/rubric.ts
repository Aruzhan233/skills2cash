import type { CompetencyKey } from "./competencies";
import type { RubricKey } from "./schemas";

export interface RubricDimension {
  key: RubricKey;
  label: string;
  question: string;
  competency: CompetencyKey;
  /** Observable behaviours for score anchors 1, 3 and 5. */
  anchors: { 1: string; 3: string; 5: string };
}

// Roleplay evaluation rubric (documentation §13). Evaluates observable
// communication behaviours, not personality traits.
export const ROLEPLAY_RUBRIC: RubricDimension[] = [
  {
    key: "discovery",
    label: "Discovery",
    question: "Did the seller ask relevant questions and understand the customer need?",
    competency: "target_customer",
    anchors: {
      1: "Asked no questions; pitched or defended immediately.",
      3: "Asked at least one relevant question but did not use the answer.",
      5: "Asked targeted questions and tied the offer to what the customer said.",
    },
  },
  {
    key: "value_proposition",
    label: "Value proposition",
    question: "Did the seller explain the outcome and value clearly?",
    competency: "value_proposition",
    anchors: {
      1: "Talked only about tasks or self; no customer outcome.",
      3: "Mentioned an outcome in general terms.",
      5: "Linked a concrete outcome to the customer's own goal.",
    },
  },
  {
    key: "clarity",
    label: "Clarity",
    question: "Were the messages understandable and specific?",
    competency: "client_communication",
    anchors: {
      1: "Vague, confusing or contradictory.",
      3: "Mostly clear with some vague claims.",
      5: "Specific, concise, easy to act on.",
    },
  },
  {
    key: "pricing_rationale",
    label: "Pricing rationale",
    question: "Could the seller explain scope and price without unsupported claims?",
    competency: "pricing_rationale",
    anchors: {
      1: "Dropped the price without reason or gave no justification.",
      3: "Justified price partly (e.g. by effort) but not by scope or value.",
      5: "Explained what the price includes and offered scoped alternatives instead of a blind discount.",
    },
  },
  {
    key: "objection_handling",
    label: "Objection handling",
    question: "Did the seller respond constructively to concerns?",
    competency: "objection_handling",
    anchors: {
      1: "Ignored, argued with, or immediately caved to the objection.",
      3: "Acknowledged the objection but answered generically.",
      5: "Acknowledged, clarified the real concern and answered it with specifics.",
    },
  },
  {
    key: "negotiation",
    label: "Negotiation",
    question: "Did the seller trade scope, options or terms instead of conceding blindly?",
    competency: "negotiation",
    anchors: {
      1: "Gave in immediately or refused to discuss any option.",
      3: "Offered a concession or option without asking for anything in return.",
      5: "Offered structured options (smaller scope, package, trial) that protect value for both sides.",
    },
  },
  {
    key: "professional_communication",
    label: "Professional communication",
    question: "Was the tone respectful and the language professional?",
    competency: "client_communication",
    anchors: {
      1: "Dismissive, pushy or unprofessional wording.",
      3: "Polite but occasionally defensive or overly casual.",
      5: "Respectful, calm and customer-focused throughout.",
    },
  },
  {
    key: "next_step",
    label: "Next step",
    question: "Did the seller propose a clear, appropriate next action?",
    competency: "closing",
    anchors: {
      1: "No next step proposed.",
      3: "Vague next step (e.g. 'let me know').",
      5: "Specific next step with time or deliverable (e.g. a trial edit by Friday).",
    },
  },
];

export const RUBRIC_BY_KEY = Object.fromEntries(ROLEPLAY_RUBRIC.map((d) => [d.key, d])) as Record<
  RubricKey,
  RubricDimension
>;
