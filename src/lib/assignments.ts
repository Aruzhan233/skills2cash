import type { CompetencyKey } from "./competencies";
import type { StageKey } from "./stages";

export interface AssignmentCriterion {
  key: string;
  label: string;
  competency: CompetencyKey;
  description: string;
  /** Signals used ONLY by the labelled offline sample evaluator (not by the AI). */
  signals: string[];
}

export interface AssignmentDef {
  key: string;
  number: number;
  title: string;
  stage: StageKey;
  competencies: CompetencyKey[];
  description: string;
  prompt: string;
  placeholder: string;
  tips: string[];
  minWords: number;
  criteria: [AssignmentCriterion, ...AssignmentCriterion[]];
}

// Practical missions (documentation §7.4 + master prompt Step 8). Each has a
// description, instructions, submission field, rubric, score and feedback.
export const ASSIGNMENTS: AssignmentDef[] = [
  {
    key: "offer-sentence",
    number: 1,
    title: "Create a one-sentence service offer",
    stage: "build",
    competencies: ["service_definition", "target_customer", "value_proposition"],
    description: "Turn your broad skill into one specific, countable offer for one type of client.",
    prompt:
      "Write one sentence that says who you help, what you deliver and what outcome they get. Add one line on why this client would care now.",
    placeholder:
      "I help [specific client] get [concrete outcome] by delivering [defined deliverables] every [timeframe].\nWhy now: …",
    tips: [
      "Name a narrow client type, not “everyone”.",
      "Describe the result for the client, not only your tasks.",
      "Make the deliverables countable.",
    ],
    minWords: 15,
    criteria: [
      {
        key: "specific_customer",
        label: "Specific customer",
        competency: "target_customer",
        description: "Names a narrow, recognisable client segment and its situation.",
        signals: ["for ", "owners", "studio", "shop", "local", "small", "coach", "agency", "startup", "salon", "restaurant", "clinic", "creator"],
      },
      {
        key: "concrete_outcome",
        label: "Concrete outcome",
        competency: "value_proposition",
        description: "States a result the client cares about, not only the work performed.",
        signals: ["so that", "so they", "more ", "save", "grow", "bookings", "leads", "sales", "time", "without", "consistent", "result"],
      },
      {
        key: "clear_scope",
        label: "Clear scope",
        competency: "service_definition",
        description: "Deliverables are defined and countable (what, how many, how often).",
        signals: ["per ", "every", "week", "month", "package", "videos", "reels", "posts", "pages", "1", "2", "3", "4", "5", "6", "8", "10", "12"],
      },
    ],
  },
  {
    key: "target-customer",
    number: 2,
    title: "Define your target customer",
    stage: "discover",
    competencies: ["target_customer"],
    description: "Describe one realistic customer you could reach in the next month.",
    prompt:
      "Describe one target customer: who they are, their situation, where you could find them, what they currently do instead of hiring you, and what you still need to validate about them.",
    placeholder: "My target customer is … They currently … I could reach them through … I still need to check …",
    tips: ["Be specific enough that you could name three real examples.", "Note what you know vs. what you assume."],
    minWords: 30,
    criteria: [
      {
        key: "segment",
        label: "Specific segment",
        competency: "target_customer",
        description: "A narrow, recognisable type of customer with context.",
        signals: ["owner", "small", "local", "business", "who ", "age", "studio", "freelancer", "coach", "agency", "shop"],
      },
      {
        key: "current_alternative",
        label: "Current alternative",
        competency: "target_customer",
        description: "Explains what the customer does today instead (DIY, cheaper provider, nothing).",
        signals: ["currently", "instead", "themselves", "diy", "today", "now they", "cheaper", "fiverr", "nephew", "ignore"],
      },
      {
        key: "reach",
        label: "How to reach them",
        competency: "closing",
        description: "Names a realistic channel to reach this customer.",
        signals: ["instagram", "linkedin", "facebook", "group", "network", "referral", "email", "meetup", "chamber", "community", "dm", "walk in"],
      },
      {
        key: "assumptions",
        label: "Assumptions flagged",
        competency: "target_customer",
        description: "Separates known facts from assumptions that still need validation.",
        signals: ["assume", "validate", "check", "not sure", "test", "ask", "interview", "confirm", "hypothesis"],
      },
    ],
  },
  {
    key: "customer-problem",
    number: 3,
    title: "Identify the customer's problem",
    stage: "discover",
    competencies: ["target_customer", "value_proposition"],
    description: "Describe the problem in the customer's own words, and what it costs them.",
    prompt:
      "Write the customer's problem as they would say it, what it costs them (time, money, missed opportunities) and three discovery questions you would ask to confirm it.",
    placeholder: "In their words: “…”\nIt costs them …\nQuestions I would ask:\n1. …\n2. …\n3. …",
    tips: ["Use the customer's language, not jargon.", "Quantify the cost where you can, but don't invent numbers."],
    minWords: 30,
    criteria: [
      {
        key: "customer_language",
        label: "Customer's words",
        competency: "target_customer",
        description: "States the problem from the customer's perspective.",
        signals: ["\"", "“", "i don't", "i can't", "i need", "we need", "they say", "in their words", "no time"],
      },
      {
        key: "cost_of_problem",
        label: "Cost of the problem",
        competency: "value_proposition",
        description: "Explains what the problem costs the customer.",
        signals: ["cost", "lose", "losing", "hours", "money", "missed", "miss", "fewer", "less", "$"],
      },
      {
        key: "discovery_questions",
        label: "Discovery questions",
        competency: "target_customer",
        description: "Includes open, relevant questions to confirm the problem.",
        signals: ["?", "what ", "how ", "when "],
      },
    ],
  },
  {
    key: "pricing-packages",
    number: 4,
    title: "Create three pricing packages",
    stage: "price",
    competencies: ["pricing_rationale", "service_definition"],
    description: "Design Basic / Standard / Premium options and explain the difference.",
    prompt:
      "Describe three packages (Basic, Standard, Premium): what each includes, its price, revision limits, and why the price steps make sense. Say how you will test these prices with real people.",
    placeholder: "Basic — $… : …\nStandard — $… : …\nPremium — $… : …\nWhy the steps: …\nHow I will test: …",
    tips: ["Change scope between tiers, not just the price.", "Use the Pricing Builder to calculate effort first."],
    minWords: 40,
    criteria: [
      {
        key: "three_tiers",
        label: "Three distinct tiers",
        competency: "service_definition",
        description: "Three packages with clearly different scope.",
        signals: ["basic", "standard", "premium", "starter", "pro"],
      },
      {
        key: "priced_scope",
        label: "Price tied to scope",
        competency: "pricing_rationale",
        description: "Each price is linked to deliverables, effort or revisions.",
        signals: ["$", "includes", "revision", "hours", "per ", "deliver"],
      },
      {
        key: "validation_plan",
        label: "Validation plan",
        competency: "pricing_rationale",
        description: "Treats prices as hypotheses and names a way to test them.",
        signals: ["test", "validate", "ask", "interview", "pilot", "first client", "feedback", "hypothesis"],
      },
    ],
  },
  {
    key: "portfolio-case",
    number: 5,
    title: "Build a sample portfolio project",
    stage: "build",
    competencies: ["skill_capability", "value_proposition"],
    description: "Write a short case study of a real or clearly labelled sample project.",
    prompt:
      "Describe one project as a mini case study: the situation, what you did, the result, and what a client would get from it. If it is a practice/sample project, label it as a sample.",
    placeholder: "Project (real / sample): …\nSituation: …\nWhat I did: …\nResult: …",
    tips: ["Never present a sample as real client work.", "Show your process, not only the final output."],
    minWords: 40,
    criteria: [
      {
        key: "situation",
        label: "Situation and goal",
        competency: "target_customer",
        description: "Explains the context and goal of the project.",
        signals: ["situation", "goal", "needed", "wanted", "context", "client", "for a"],
      },
      {
        key: "process",
        label: "Process shown",
        competency: "skill_capability",
        description: "Describes concrete steps or decisions the user made.",
        signals: ["i ", "edited", "designed", "built", "created", "cut", "chose", "process", "first", "then"],
      },
      {
        key: "result",
        label: "Result",
        competency: "value_proposition",
        description: "States an outcome without inventing numbers.",
        signals: ["result", "outcome", "views", "feedback", "saved", "used", "delivered", "launched"],
      },
      {
        key: "honest_label",
        label: "Honest labelling",
        competency: "client_communication",
        description: "Clearly states whether the work is real or a sample.",
        signals: ["sample", "real", "practice", "personal project", "concept", "for a friend", "volunteer"],
      },
    ],
  },
  {
    key: "pitch",
    number: 6,
    title: "Write a professional pitch",
    stage: "launch",
    competencies: ["value_proposition", "client_communication"],
    description: "A 30-second pitch you could say on a call or at a meetup.",
    prompt: "Write a 3–5 sentence pitch: who you help, the problem, what you deliver, why you, and a soft call to action.",
    placeholder: "Hi, I'm … I help … who struggle with … I deliver … Would it be useful if …?",
    tips: ["Lead with the client's problem.", "End with a low-pressure question."],
    minWords: 30,
    criteria: [
      {
        key: "problem_first",
        label: "Problem first",
        competency: "target_customer",
        description: "Leads with the client's situation or problem.",
        signals: ["struggle", "problem", "busy", "no time", "need", "hard", "who "],
      },
      {
        key: "value",
        label: "Clear value",
        competency: "value_proposition",
        description: "Explains the outcome and why the user is a good fit.",
        signals: ["so that", "help", "more", "save", "result", "because", "experience"],
      },
      {
        key: "cta",
        label: "Soft call to action",
        competency: "closing",
        description: "Ends with a clear, low-pressure next step.",
        signals: ["?", "would you", "happy to", "call", "chat", "send", "sample", "free"],
      },
    ],
  },
  {
    key: "objection-reply",
    number: 7,
    title: "Respond to a customer objection",
    stage: "practice",
    competencies: ["objection_handling", "negotiation", "closing"],
    description: "Practise a written reply to the most common price objection.",
    prompt:
      "A potential client writes: “I like your work, but another freelancer offered to do it for half the price.” Write your reply message (4–8 sentences).",
    placeholder: "Thanks for being upfront about that…",
    tips: [
      "Acknowledge the concern before answering it.",
      "Compare scope, not just price.",
      "Avoid an automatic discount; offer options.",
      "End with a concrete next step.",
    ],
    minWords: 40,
    criteria: [
      {
        key: "acknowledges",
        label: "Acknowledges the concern",
        competency: "client_communication",
        description: "Responds respectfully and shows the concern was heard.",
        signals: ["understand", "thanks", "thank you", "fair", "makes sense", "appreciate", "totally"],
      },
      {
        key: "reframes_value",
        label: "Reframes on value and scope",
        competency: "objection_handling",
        description: "Explains differences in scope or outcome instead of arguing.",
        signals: ["includes", "scope", "difference", "compare", "result", "deadline", "revision", "quality"],
      },
      {
        key: "price_integrity",
        label: "Offers options, not a blind discount",
        competency: "negotiation",
        description: "Avoids a blind discount; offers scoped alternatives if needed.",
        signals: ["option", "package", "smaller", "starter", "trial", "instead", "fewer", "pilot"],
      },
      {
        key: "next_step",
        label: "Clear next step",
        competency: "closing",
        description: "Proposes a specific next action.",
        signals: ["call", "send", "friday", "monday", "tomorrow", "this week", "schedule", "start", "next step"],
      },
    ],
  },
  {
    key: "outreach",
    number: 8,
    title: "Write a customer outreach message",
    stage: "launch",
    competencies: ["client_communication", "closing", "value_proposition"],
    description: "A short first message you would send yourself to one potential client. Skills2Cash never sends it.",
    prompt:
      "Write a short outreach message (DM or email) to one realistic potential client. Personalise it, explain the value briefly, and ask a low-pressure question.",
    placeholder: "Hi [name], I noticed … I help … Would you be open to …?",
    tips: ["Personalise the first line.", "Keep it under 120 words.", "You send it yourself — the platform does not contact anyone."],
    minWords: 30,
    criteria: [
      {
        key: "personalised",
        label: "Personalised",
        competency: "target_customer",
        description: "Refers to something specific about the recipient.",
        signals: ["noticed", "saw", "your ", "loved", "came across", "recent"],
      },
      {
        key: "brief_value",
        label: "Brief value",
        competency: "value_proposition",
        description: "States the benefit in one or two sentences.",
        signals: ["help", "so that", "more", "save", "without", "result"],
      },
      {
        key: "low_pressure_ask",
        label: "Low-pressure ask",
        competency: "closing",
        description: "Ends with an easy, specific question or offer.",
        signals: ["?", "would you", "open to", "happy to", "free", "sample", "quick"],
      },
    ],
  },
];

export const ASSIGNMENT_BY_KEY: Record<string, AssignmentDef> = Object.fromEntries(
  ASSIGNMENTS.map((a) => [a.key, a]),
);
