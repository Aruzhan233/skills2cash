// Skills2Cash competency framework (documentation §24.2, extended with
// negotiation per the master development prompt). The same definitions are
// used by the assessment, assignments and roleplay evaluation so progress can
// be compared over time.

export const COMPETENCY_KEYS = [
  "skill_capability",
  "service_definition",
  "target_customer",
  "pricing_rationale",
  "value_proposition",
  "client_communication",
  "objection_handling",
  "negotiation",
  "closing",
] as const;

export type CompetencyKey = (typeof COMPETENCY_KEYS)[number];

export interface Competency {
  key: CompetencyKey;
  label: string;
  short: string;
  description: string;
}

export const COMPETENCIES: Record<CompetencyKey, Competency> = {
  skill_capability: {
    key: "skill_capability",
    label: "Skill capability",
    short: "Craft",
    description: "How well you can perform the underlying craft or task, shown through samples and case studies.",
  },
  service_definition: {
    key: "service_definition",
    label: "Service definition",
    short: "Service",
    description: "Defining a specific service, its scope, deliverables and limits.",
  },
  target_customer: {
    key: "target_customer",
    label: "Target-customer research",
    short: "Customer",
    description: "Identifying a customer segment, its problem, and asking discovery questions.",
  },
  pricing_rationale: {
    key: "pricing_rationale",
    label: "Pricing",
    short: "Pricing",
    description: "Explaining a price through scope, effort, costs and value — and testing it.",
  },
  value_proposition: {
    key: "value_proposition",
    label: "Value proposition",
    short: "Value",
    description: "Communicating the outcome for the client and why it matters.",
  },
  client_communication: {
    key: "client_communication",
    label: "Client communication",
    short: "Communication",
    description: "Clear, specific, respectful and professional messages.",
  },
  objection_handling: {
    key: "objection_handling",
    label: "Objection handling",
    short: "Objections",
    description: "Responding to price, trust, timing and scope objections constructively.",
  },
  negotiation: {
    key: "negotiation",
    label: "Negotiation",
    short: "Negotiation",
    description: "Trading scope, options or terms instead of giving blind discounts.",
  },
  closing: {
    key: "closing",
    label: "Sales & closing",
    short: "Closing",
    description: "Agreeing on a clear, appropriate next step with the client.",
  },
};

export const COMPETENCY_LIST: Competency[] = COMPETENCY_KEYS.map((k) => COMPETENCIES[k]);
