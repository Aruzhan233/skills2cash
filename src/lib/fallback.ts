// Labelled offline fallbacks. Used ONLY when the AI is unavailable or the
// visitor chooses the scripted demo. Every result produced here is marked
// generatedBy = "sample" and shown with an "Offline sample — not AI" label.
// They are deterministic keyword heuristics, not a substitute for the AI.

import { ASSIGNMENT_BY_KEY } from "./assignments";
import { COMPETENCIES, COMPETENCY_KEYS, type CompetencyKey } from "./competencies";
import type { AssignmentAIResult } from "./evaluation";
import { SCENARIO_BY_KEY } from "./scenarios";
import type {
  AssessmentInput,
  AssessmentResult,
  AssignmentRequest,
  ClientTurnRequest,
  ClientTurnResult,
  EvaluationAI,
  OfferImproveRequest,
  OfferImproveResult,
  PricingCoachRequest,
  PricingCoachResult,
  RubricKey,
} from "./schemas";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// ------------------------------------------------------------- assessment
export function sampleAssessment(input: AssessmentInput): AssessmentResult {
  const ratings = COMPETENCY_KEYS.map((k) => ({ k, v: input.selfRatings[k] }));
  const sorted = [...ratings].sort((a, b) => b.v - a.v);
  const strengths = sorted.slice(0, 3).map(({ k }) => `${COMPETENCIES[k].label} (self-rated ${input.selfRatings[k]}/5)`);
  const gaps = [...ratings]
    .sort((a, b) => a.v - b.v)
    .slice(0, 3)
    .map(({ k, v }) => ({
      competency: k as CompetencyKey,
      note: `Self-rated ${v}/5 — practise ${COMPETENCIES[k].label.toLowerCase()} with a mission or simulation.`,
    }));
  const customer = input.preferredIndustries.trim() || "small local businesses";
  const hours = Math.max(2, Math.min(10, Math.round(input.hoursPerWeek / 2)));
  const low = Math.max(50, hours * 25);
  const high = Math.max(low + 50, hours * 45);
  const others = input.otherSkills
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
    .slice(0, 2);
  return {
    summary: `${input.displayName} has hands-on experience with ${input.skill.toLowerCase()} and rates their level ${input.level}/5. They have about ${input.hoursPerWeek} hours a week and want to ${input.goal === "side_income" ? "earn side income" : "turn this skill into a service"}. This is an offline sample profile built from the answers only.`,
    facts_from_user: [
      `Main skill: ${input.skill} (level ${input.level}/5, self-reported)`,
      `Does well: ${clip(input.tasksDoneWell, 200)}`,
      `Experience: ${clip(input.experience, 200)}`,
      `Available: ${input.hoursPerWeek} hours per week`,
    ],
    identified_skills: [
      {
        name: input.skill,
        level: input.level,
        basis: input.workExample.length > 80 ? "from-example" : "self-reported",
        commercial: true,
        note: "Main skill named in the assessment.",
      },
      ...others.map((name) => ({
        name: cap(name),
        level: 2,
        basis: "self-reported" as const,
        commercial: false,
        note: "Mentioned as an additional skill; level not assessed.",
      })),
    ],
    strengths,
    gaps,
    service_directions: [
      {
        name: `${cap(input.skill)} package for ${customer}`,
        target_customer: cap(customer),
        problem_solved: `They need ${input.skill.toLowerCase()} done reliably but lack the time or skill to do it themselves.`,
        why_it_may_fit: `You said you do this well: “${clip(input.tasksDoneWell, 120)}”.`,
        assumptions_to_validate: [
          `${cap(customer)} actually pay for this instead of doing it themselves`,
          `You can deliver within ${input.hoursPerWeek} hours a week`,
          "The price range below is acceptable to them",
        ],
        price_hypothesis: {
          low,
          high,
          unit: "per project",
          basis: `Rough estimate: about ${hours} hours of work at $25–45/hour. This is a hypothesis, not market data.`,
        },
      },
    ],
    recommended_next_steps: [
      "Define one narrow service in the Service Builder",
      "Talk to 3 potential customers to test your assumptions",
      "Practise a price objection in the AI Client Simulator",
    ],
  };
}

// --------------------------------------------------------------- offer
export function sampleOfferImprove(req: OfferImproveRequest): OfferImproveResult {
  const d = req.draft;
  const dir = req.direction;
  const customer = d.targetCustomer || dir?.target_customer || "small local businesses";
  const keep = (v: string, alt: string) => (v.trim().length >= 10 ? v : alt);
  return {
    suggestions: {
      title: keep(d.title, `${cap(d.skill)} package for ${customer.toLowerCase()}`),
      targetCustomer: keep(d.targetCustomer, cap(customer)),
      customerProblem: keep(
        d.customerProblem,
        dir?.problem_solved ?? `They need ${d.skill.toLowerCase()} done consistently but have no time to learn or do it.`,
      ),
      outcome: keep(d.outcome, "Consistent, professional results every month without the client spending their own evenings on it."),
      deliverables: keep(d.deliverables, "A fixed, countable set of deliverables per month (e.g. 8 items), delivered in agreed formats."),
      scope: keep(d.scope, "Includes planning call, production of the agreed deliverables and delivery files."),
      timeline: keep(d.timeline, "First delivery within 7 days of receiving materials."),
      revisionPolicy: keep(d.revisionPolicy, "Up to 2 rounds of revisions per deliverable."),
      uvp: keep(d.uvp, `Specialised in ${customer.toLowerCase()}, with fast and reliable turnaround.`),
      exclusions: keep(d.exclusions, "Content strategy, paid ads and extra deliverables are not included."),
      priceRationale: keep(
        d.priceRationale,
        "The price covers my estimated hours, tools and revisions. It is a starting hypothesis that I will test with my first 3–5 clients.",
      ),
    },
    notes: [
      "Offline sample: empty or very short fields were filled from a template — edit them to fit you.",
      "Keep deliverables countable and exclusions explicit.",
    ],
    assumptions_to_validate: [`${cap(customer)} see this problem as worth paying for`, "Your timeline is realistic with your weekly hours"],
  };
}

// ------------------------------------------------------------- pricing
export function samplePricingCoach(req: PricingCoachRequest): PricingCoachResult {
  const p = req.pricing;
  const floor = Math.round(p.hoursPerProject * p.hourlyTarget + p.directCosts + p.toolCosts);
  const [b, s, pr] = p.packages;
  const risks: string[] = [];
  if (s.price < floor) risks.push(`The Standard price ($${s.price}) is below your cost floor ($${floor}).`);
  if (pr.price < s.price * 1.3) risks.push("Premium is less than 30% above Standard — the step may look arbitrary.");
  if (b.deliverables.trim() === s.deliverables.trim()) risks.push("Basic and Standard have the same deliverables; change scope, not only price.");
  if (!risks.length) risks.push("Hours per project are an estimate — track your real time on the first projects.");
  return {
    rationale: `My Standard package is $${s.price}. It includes ${s.deliverables.toLowerCase()} with ${s.revisions} revision round${s.revisions === 1 ? "" : "s"}. It takes me about ${s.hours} hours plus tool and material costs, so my cost floor is around $${floor}. Basic ($${b.price}) is a smaller starting point and Premium ($${pr.price}) adds more scope for clients who want more. These prices are my starting hypothesis, and I will adjust them after talking to real clients.`,
    risks,
    validation_steps: [
      "Show the three packages to 5 potential clients and ask which they would choose and why.",
      "Track actual hours on your first 3 projects and recalculate.",
      "Note every price objection you hear and what scope the client actually needed.",
    ],
  };
}

// ---------------------------------------------------------- scripted client
export function scriptedClientTurn(req: ClientTurnRequest): ClientTurnResult {
  const scenario = SCENARIO_BY_KEY[req.scenarioKey];
  const lines = scenario ? scenario.scripted(req.offer) : ["Okay. What would the next step be?"];
  const userTurns = req.messages.filter((m) => m.role === "user").length;
  const idx = Math.min(Math.max(userTurns - 1, 0), lines.length - 1);
  return { reply: lines[idx], ready_to_decide: userTurns >= lines.length };
}

// ------------------------------------------------------- heuristic scoring
const SIGNALS: Record<RubricKey, RegExp[]> = {
  discovery: [/\?/, /\b(what|how|which|when|why)\b.*\?/i, /\b(tell me|can i ask|could you share|what matters)\b/i],
  value_proposition: [/\b(result|outcome|so (that|you)|save|more (bookings|clients|views|time|sales)|grow|consistent|without)\b/i],
  clarity: [/\d/, /\b(includes?|deliver|each|per|by)\b/i],
  pricing_rationale: [/\$|\bprice\b|\bcost/i, /\b(includes?|scope|revision|hours?|licen[cs]e|covers)\b/i],
  objection_handling: [/\b(understand|fair|makes sense|good question|i hear you|totally|appreciate|upfront|thanks for)\b/i, /\b(difference|compare|instead|reliab|deadline|on time)\b/i],
  negotiation: [/\b(option|package|smaller|starter|trial|pilot|first (month|batch)|if you commit|instead of)\b/i],
  professional_communication: [/\b(thanks|thank you|happy to|glad|appreciate|please)\b/i],
  next_step: [/\b(call|schedule|send|start|book|trial|sample)\b/i, /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|this week|next week|by \w+)\b/i],
};
const NEGATIVE = /\b(whatever|take it or leave it|not my problem|cheap(er)? (guys|people)|stupid)\b/i;
const CAVE = /\b(ok(ay)?,? i('ll| will| can) (do it|lower|match)|fine,? (\$?\d+)|i can match)\b/i;

function scoreFrom(hits: number, max: number): number {
  if (hits <= 0) return 1;
  return Math.min(5, 1 + Math.round((hits / max) * 4));
}

export function sampleEvaluation(req: ClientTurnRequest): EvaluationAI {
  const userMsgs = req.messages.filter((m) => m.role === "user").map((m) => m.content);
  const all = userMsgs.join("\n");
  const sentences = userMsgs.flatMap((m) => m.split(/(?<=[.!?])\s+/)).filter((s) => s.trim().length > 3);
  const dims = {} as EvaluationAI["dimensions"];
  for (const key of Object.keys(SIGNALS) as RubricKey[]) {
    const rx = SIGNALS[key];
    const matched = sentences.filter((s) => rx.some((r) => r.test(s)));
    const hits = rx.filter((r) => r.test(all)).length + Math.min(2, matched.length - 1);
    let score: number | null = userMsgs.length === 0 ? null : scoreFrom(hits, rx.length + 2);
    if (key === "professional_communication" && score !== null) score = NEGATIVE.test(all) ? 1 : Math.max(score, 3);
    if ((key === "negotiation" || key === "pricing_rationale") && CAVE.test(all) && score !== null) score = Math.min(score, 2);
    if (key === "next_step" && userMsgs.length < 2 && matched.length === 0) score = null;
    dims[key] = {
      score,
      evidence: matched.slice(0, 1).map((s) => s.trim()),
      comment:
        score === null
          ? "Not enough evidence in the conversation."
          : `Offline heuristic: ${matched.length} message part${matched.length === 1 ? "" : "s"} matched this criterion's signals.`,
    };
  }
  const ranked = (Object.keys(dims) as RubricKey[]).filter((k) => dims[k].score !== null).sort((a, b) => (dims[b].score ?? 0) - (dims[a].score ?? 0));
  const best = ranked.slice(0, 2);
  const worst = ranked.slice(-2).reverse();
  const label = (k: RubricKey) => k.replace(/_/g, " ");
  return {
    dimensions: dims,
    strengths: best.map((k) => `Showed ${label(k)} signals (score ${dims[k].score}/5).`),
    mistakes: CAVE.test(all) ? ["Agreed to lower the price without getting anything in return."] : [],
    improvements: worst.map((k) => ({
      text: `Work on ${label(k)}.`,
      example: IMPROVEMENT_EXAMPLE[k],
    })),
  };
}

const IMPROVEMENT_EXAMPLE: Record<RubricKey, string> = {
  discovery: "Before we talk price — what matters most to you here: budget, speed or results?",
  value_proposition: "The goal is that you get consistent content every week without spending your evenings on it.",
  clarity: "For $200 you get 10 Reels, each up to 30 seconds, delivered within 5 days.",
  pricing_rationale: "The price covers about 6 hours of editing, licensed music and two revision rounds.",
  objection_handling: "That's a fair concern. Can I ask what the other quote includes, so we compare like for like?",
  negotiation: "If budget is the main issue, a 5-Reel starter package for $110 could be a low-risk way to start.",
  professional_communication: "Thanks for being upfront — happy to find something that works for you.",
  next_step: "Shall I send you one sample edit by Thursday so you can decide with no risk?",
};

export function sampleAssignmentEval(req: AssignmentRequest): AssignmentAIResult {
  const def = ASSIGNMENT_BY_KEY[req.assignmentKey];
  const text = req.text.toLowerCase();
  const words = req.text.trim().split(/\s+/).length;
  const lengthOk = words >= (def?.minWords ?? 20);
  const criteria: AssignmentAIResult["criteria"] = {};
  const missing: string[] = [];
  const good: string[] = [];
  for (const c of def?.criteria ?? []) {
    const hits = c.signals.filter((s) => text.includes(s)).length;
    let score = hits === 0 ? 1 : hits === 1 ? 2 : hits <= 3 ? 3 : 4;
    if (score >= 3 && lengthOk) score += hits >= 5 ? 1 : 0;
    if (!lengthOk) score = Math.min(score, 3);
    criteria[c.key] = {
      score,
      comment: hits === 0 ? `No clear sign of “${c.label.toLowerCase()}” yet.` : `Some signs of ${c.label.toLowerCase()} found (offline keyword check).`,
    };
    (score >= 3 ? good : missing).push(c.label);
  }
  return {
    criteria,
    strengths: good.length ? [`Covers: ${good.join(", ")}.`] : [],
    improvements: [
      ...(missing.length ? [`Strengthen: ${missing.join(", ")}.`] : []),
      ...(!lengthOk ? [`Add more detail (at least ${def?.minWords ?? 20} words).`] : []),
      "Run the AI review when available for specific feedback.",
    ].slice(0, 3),
    improved_example: def ? def.placeholder : req.text,
  };
}
