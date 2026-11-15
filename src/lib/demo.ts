// Pre-written, clearly labelled demo dataset for judges: Alex, a video editor
// (documentation §18). Nothing here is presented as real user data.

import { ASSIGNMENT_BY_KEY } from "./assignments";
import { newId } from "./id";
import { buildAssignmentFeedback, buildEvaluation, type AssignmentAIResult } from "./evaluation";
import { DEFAULT_SCENARIO_KEY, SCENARIO_BY_KEY } from "./scenarios";
import type { AssessmentInput, AssessmentResult, EvaluationAI, ServiceOfferInput } from "./schemas";
import { computeReadiness } from "./progress";
import { READINESS_KEYS, type AssignmentSubmission, type PricingWorksheet, type ReadinessSnapshot, type RoleplaySession, type ServiceOffer, type SkillProfile, type WorkspaceState } from "./types";

const ago = (days: number, hours = 0) => new Date(Date.now() - (days * 24 + hours) * 3600_000).toISOString();
const uid = newId;

export const DEMO_ASSESSMENT: AssessmentInput = {
  displayName: "Alex Rivera",
  skill: "Short-form video editing",
  otherSkills: "Basic motion graphics, social media captions",
  level: 4,
  tasksDoneWell: "Cutting raw phone footage into punchy 15–30 second Reels with captions, music and clean transitions.",
  helpRequests: "Friends and my gym ask me to edit their Instagram Reels and TikToks.",
  experience: "3 years editing for my own channel and about 20 Reels for my local gym (unpaid).",
  workExample:
    "Edited a series of 12 Reels for my gym's spring challenge: planned shots with the coach, cut each to 20 seconds, added captions and licensed music. The coach said members started sharing them.",
  confidence: 2,
  interests: "Fitness, wellness, local businesses",
  hoursPerWeek: 8,
  preferredIndustries: "Local fitness studios and personal trainers",
  goal: "side_income",
  goalNote: "",
  selfRatings: {
    skill_capability: 4,
    service_definition: 2,
    target_customer: 3,
    pricing_rationale: 1,
    value_proposition: 3,
    client_communication: 3,
    objection_handling: 2,
    negotiation: 1,
    closing: 2,
  },
};

export const DEMO_RESULT: AssessmentResult = {
  summary:
    "Alex has hands-on short-form editing experience, including a 12-Reel series for a local gym, and can spend about 8 hours a week. The craft is solid; pricing, negotiation and defining a clear package are the main gaps.",
  facts_from_user: [
    "3 years of editing for own channel",
    "Edited ~20 Reels for a local gym (unpaid)",
    "Friends and the gym ask for Reels and TikTok edits",
    "8 hours available per week",
  ],
  identified_skills: [
    { name: "Short-form video editing", level: 4, basis: "from-example", commercial: true, note: "Supported by the 12-Reel gym series." },
    { name: "Motion graphics", level: 2, basis: "self-reported", commercial: false, note: "Mentioned as basic." },
    { name: "Social captions", level: 3, basis: "self-reported", commercial: true, note: "Could be an add-on to edits." },
  ],
  strengths: ["Fast turnaround on short edits", "Understands fitness content", "Has a relevant sample series"],
  gaps: [
    { competency: "pricing_rationale", note: "Has never priced paid work; self-rated 1/5." },
    { competency: "negotiation", note: "Unsure how to respond to cheaper offers." },
    { competency: "service_definition", note: "No fixed package or revision limits yet." },
  ],
  service_directions: [
    {
      name: "Monthly Reels editing package for local fitness studios",
      target_customer: "Independent fitness studios and personal trainers",
      problem_solved: "They need to post short videos every week but have no time or editing skills.",
      why_it_may_fit: "Alex already edited a 12-Reel series for a gym and knows fitness content.",
      assumptions_to_validate: [
        "Studio owners will pay instead of using free editing apps",
        "8 hours a week is enough for 10 Reels a month",
        "$150–250 per month is acceptable to small studios",
      ],
      price_hypothesis: {
        low: 150,
        high: 250,
        unit: "per month (10 Reels)",
        basis: "Estimate: ~6 hours of editing at $30–40/h plus music licence. Not market data.",
      },
    },
  ],
  recommended_next_steps: ["Define a 10-Reel monthly package", "Build a pricing rationale", "Practise the “cheaper freelancer” objection"],
};

export const DEMO_OFFER_INPUT: ServiceOfferInput = {
  skill: "Short-form video editing",
  title: "Monthly Reels package for local fitness studios",
  targetCustomer: "Independent fitness studios and personal trainers in my city",
  customerProblem: "They know they should post short videos every week, but filming and editing eats their evenings and results look amateur.",
  outcome: "A consistent, professional-looking Reels feed every week without the owner spending time editing.",
  deliverables: "10 edited Reels per month (15–30 s), captions, licensed music, cover frames.",
  scope: "One 20-minute planning call per month, editing of client-supplied footage, delivery in 9:16 MP4.",
  timeline: "Delivered in two batches: 5 Reels by day 7 and 5 by day 14.",
  revisionPolicy: "Up to 2 revision rounds per Reel.",
  uvp: "Fitness-specific editing from someone who trains at a studio and understands what members share.",
  exclusions: "Filming on location, paid ads management, posting and community management.",
  pricingModel: "package",
  priceAmount: 200,
  priceUnit: "per month (10 Reels)",
  priceRationale:
    "About 6 hours of editing plus music licensing and 2 revision rounds. $200 is my starting hypothesis; I will test it with 5 studio owners.",
};

function demoSubmission(key: string, text: string, ai: AssignmentAIResult, at: string): AssignmentSubmission {
  const def = ASSIGNMENT_BY_KEY[key];
  const feedback = buildAssignmentFeedback(def, ai, "sample");
  return { id: uid(), assignmentKey: key, text, feedback, score: feedback.overallScore, createdAt: at };
}

export const DEMO_MESSAGES: Array<{ role: "user" | "client"; content: string }> = [
  { role: "client", content: "" },
  {
    role: "user",
    content: "Thanks for being upfront! Can I ask what the other freelancer includes for $80 — is it the same 10 Reels with music and captions?",
  },
  { role: "client", content: "I think it's 10 Reels, not sure about music. To me the result looks pretty similar." },
  {
    role: "user",
    content: "That makes sense. My $200 includes licensed music, captions and 2 revision rounds, and you get everything in two batches so you can post every week.",
  },
  { role: "client", content: "Okay, but my budget is still tight. Can you do it for $120?" },
  { role: "user", content: "I could do $150 if that helps." },
  { role: "client", content: "Hm, maybe. What's the next step?" },
  { role: "user", content: "I can send you a contract and we start next week." },
];

const DEMO_EVAL_AI: EvaluationAI = {
  dimensions: {
    discovery: {
      score: 4,
      evidence: ["Can I ask what the other freelancer includes for $80"],
      comment: "Asked a good comparison question before defending the price.",
    },
    value_proposition: {
      score: 3,
      evidence: ["you get everything in two batches so you can post every week"],
      comment: "Mentioned the weekly posting benefit, but not the client's results.",
    },
    clarity: { score: 4, evidence: ["My $200 includes licensed music, captions and 2 revision rounds"], comment: "Specific and easy to follow." },
    pricing_rationale: {
      score: 3,
      evidence: ["My $200 includes licensed music, captions and 2 revision rounds"],
      comment: "Explained what is included, then dropped the price without changing scope.",
    },
    objection_handling: { score: 3, evidence: ["That makes sense."], comment: "Acknowledged the concern; did not find out what mattered most." },
    negotiation: { score: 2, evidence: ["I could do $150 if that helps."], comment: "Gave a discount without asking for anything in return." },
    professional_communication: { score: 4, evidence: ["Thanks for being upfront!"], comment: "Friendly and respectful throughout." },
    next_step: { score: 3, evidence: ["we start next week"], comment: "Next step is vague — no date, no trial." },
  },
  strengths: ["Asked what the competitor's quote includes before defending the price.", "Listed concrete inclusions (music, captions, revisions)."],
  mistakes: ["Dropped the price to $150 without reducing scope."],
  improvements: [
    {
      text: "Trade scope instead of discounting.",
      example: "If budget is the main issue, a 5-Reel starter package for $110 could be a low-risk way to start.",
    },
    { text: "Close with a specific, low-risk next step.", example: "Shall I edit one sample Reel from your footage by Thursday?" },
  ],
};

export function buildDemoState(): WorkspaceState {
  const created = ago(6);
  const profile: SkillProfile = {
    id: uid(),
    displayName: DEMO_ASSESSMENT.displayName,
    assessment: DEMO_ASSESSMENT,
    result: DEMO_RESULT,
    direction: DEMO_RESULT.service_directions[0],
    directionEdited: false,
    rejectedStrengths: [],
    generatedBy: "sample",
    createdAt: created,
    updatedAt: created,
  };
  const offer: ServiceOffer = { ...DEMO_OFFER_INPUT, id: uid(), updatedAt: ago(5) };
  const pricing: PricingWorksheet = {
    id: uid(),
    hoursPerProject: 6,
    hourlyTarget: 30,
    directCosts: 10,
    toolCosts: 15,
    revisionsIncluded: 2,
    scopeNotes: "Client supplies footage; I edit and deliver in two batches.",
    packages: [
      { tier: "basic", name: "Starter", deliverables: "5 Reels per month, captions", hours: 3, revisions: 1, price: 110 },
      { tier: "standard", name: "Studio", deliverables: "10 Reels per month, captions, licensed music, covers", hours: 6, revisions: 2, price: 200 },
      { tier: "premium", name: "Studio Pro", deliverables: "16 Reels per month, captions, music, covers, monthly content plan", hours: 10, revisions: 2, price: 340 },
    ],
    rationale: "",
    coach: null,
    coachGeneratedBy: null,
    updatedAt: ago(4),
  };
  const submissions = [
    demoSubmission(
      "target-customer",
      "My target customer is the owner of an independent fitness studio in my city with 50–200 members. They currently film on their phone and post irregularly, or ask a member to help. I could reach them through Instagram DMs and by visiting studios. I still need to validate whether they would pay monthly or prefer one-off edits.",
      {
        criteria: {
          segment: { score: 4, comment: "Clear, local segment with size." },
          current_alternative: { score: 4, comment: "Names DIY and member help." },
          reach: { score: 3, comment: "Channels named; no first-step plan." },
          assumptions: { score: 3, comment: "One assumption flagged." },
        },
        strengths: ["Specific segment", "Realistic alternatives"],
        improvements: ["Add how many studios you could contact this month."],
        improved_example: "Owners of independent studios (50–200 members) in my city who post irregularly…",
      },
      ago(5, 3),
    ),
    demoSubmission(
      "offer-sentence",
      "I help independent fitness studios post consistently by editing 10 Reels a month from their own footage, delivered in two batches.\nWhy now: studios compete for new members on Instagram every season.",
      {
        criteria: {
          specific_customer: { score: 4, comment: "Independent fitness studios — specific." },
          concrete_outcome: { score: 3, comment: "“Post consistently” is good; link it to new members." },
          clear_scope: { score: 4, comment: "Countable: 10 Reels, two batches." },
        },
        strengths: ["Countable deliverables"],
        improvements: ["Name the result the owner wants (e.g. more trial sign-ups)."],
        improved_example:
          "I help independent fitness studios attract more trial members by editing 10 on-brand Reels a month from their footage.",
      },
      ago(4, 6),
    ),
    demoSubmission(
      "pricing-packages",
      "Basic $110: 5 Reels. Standard $200: 10 Reels with music. Premium $340: 16 Reels and a content plan. I think these are fair.",
      {
        criteria: {
          three_tiers: { score: 3, comment: "Three tiers with different volume." },
          priced_scope: { score: 2, comment: "Revisions and effort not explained." },
          validation_plan: { score: 1, comment: "No plan to test prices." },
        },
        strengths: ["Scope changes between tiers"],
        improvements: ["Explain hours and revisions per tier.", "Add how you will test these prices."],
        improved_example:
          "Standard $200: 10 Reels, 2 revision rounds, ~6 h + music licence. I'll show all three packages to 5 studio owners and ask which they'd pick.",
      },
      ago(3, 2),
    ),
  ];
  const scenario = SCENARIO_BY_KEY[DEFAULT_SCENARIO_KEY];
  const msgs = DEMO_MESSAGES.map((m, i) => ({
    id: uid(),
    role: m.role,
    content: i === 0 ? scenario.opening(DEMO_OFFER_INPUT) : m.content,
    createdAt: ago(2, 8 - i * 0.05),
  }));
  const evaluation = buildEvaluation(DEMO_EVAL_AI, msgs, scenario.key, "sample");
  const session: RoleplaySession = {
    id: uid(),
    scenarioKey: scenario.key,
    offerSnapshot: DEMO_OFFER_INPUT,
    status: "completed",
    scripted: true,
    startedAt: ago(2, 8),
    endedAt: ago(2, 7.5),
    messages: msgs,
    evaluation,
    overallScore: evaluation.overallScore,
  };
  const base: WorkspaceState = { profile, offer, pricing, submissions, sessions: [session], snapshots: [], weeklyMissions: [], xp: [] };
  const r = computeReadiness(base);
  const dims = Object.fromEntries(READINESS_KEYS.map((k) => [k, r.dimensions[k].score])) as ReadinessSnapshot["dimensions"];
  return { ...base, snapshots: [{ id: uid(), overall: r.overall, dimensions: dims, createdAt: session.endedAt ?? ago(2) }] };
}
