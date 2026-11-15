// Learning framework: Discover → Build → Price → Practice → Launch (documentation §6).

export const STAGE_KEYS = ["discover", "build", "price", "practice", "launch"] as const;
export type StageKey = (typeof STAGE_KEYS)[number];

export interface StageDef {
  key: StageKey;
  number: number;
  title: string;
  tagline: string;
  objectives: string[];
  lesson: string;
  example: { before: string; after: string };
  /** Tool page where the stage's main work happens. */
  tool: { href: string; label: string } | null;
  /** Requirement on top of missions, described in plain text for the UI. */
  completion: string;
}

export const STAGES: StageDef[] = [
  {
    key: "discover",
    number: 1,
    title: "Discover",
    tagline: "Find a skill you can realistically offer",
    objectives: [
      "Name the skill and evidence you already have",
      "Pick one customer segment and its problem",
      "Separate facts from assumptions you still need to test",
    ],
    lesson:
      "A monetizable skill is not just something you are good at — it is something a specific person has a problem with and would rather pay for than do themselves. Start from evidence: what do people already ask you for? Then narrow down to one customer type. Anything you have not heard from a real customer is an assumption.",
    example: {
      before: "I'm good with video.",
      after: "Small fitness studios in my city struggle to post short videos every week; I already edit Reels for my gym.",
    },
    tool: { href: "/onboarding", label: "Skill assessment" },
    completion: "Assessment completed, plus Missions 2 and 3 scored 60 or higher.",
  },
  {
    key: "build",
    number: 2,
    title: "Build",
    tagline: "Turn the skill into a specific service offer",
    objectives: [
      "Define outcome, deliverables, scope and exclusions",
      "Set timeline and revision policy",
      "Show proof with an honest portfolio sample",
    ],
    lesson:
      "Clients buy outcomes, not hours. A clear offer says who it is for, what they get (countable deliverables), what is not included and how long it takes. Exclusions and revision limits protect both you and the client.",
    example: {
      before: "I know graphic design.",
      after: "I create starter brand identity packages for independent coffee shops: logo, colour palette and 5 social templates in 2 weeks.",
    },
    tool: { href: "/service-builder", label: "Service Builder" },
    completion: "Service offer saved, plus Missions 1 and 5 scored 60 or higher.",
  },
  {
    key: "price",
    number: 3,
    title: "Price",
    tagline: "Build a price you can explain",
    objectives: [
      "Estimate effort, direct costs and tool costs",
      "Design Basic / Standard / Premium packages",
      "Write a rationale and a plan to test the price",
    ],
    lesson:
      "Start from a floor: hours × the hourly amount you want + costs. Then package: change scope between tiers instead of only the number. Any price you set now is a hypothesis — test it by asking real potential clients, not by guessing market rates.",
    example: {
      before: "$50 because others charge that.",
      after: "Standard $200: 10 Reels, 2 revision rounds, ~6 hours + music licence. I'll test it with 5 studio owners this month.",
    },
    tool: { href: "/service-builder/pricing", label: "Pricing Builder" },
    completion: "Pricing worksheet saved, plus Mission 4 scored 60 or higher.",
  },
  {
    key: "practice",
    number: 4,
    title: "Practice",
    tagline: "Rehearse real sales conversations with AI clients",
    objectives: [
      "Ask discovery questions before defending the price",
      "Handle objections with scope and options, not blind discounts",
      "Close with a concrete next step",
    ],
    lesson:
      "Objections are questions in disguise. Acknowledge the concern, ask what matters most, compare scope rather than price, and offer options (smaller package, trial). Always end with a specific next step.",
    example: {
      before: "OK, I can do it for $80 too.",
      after: "That makes sense. Can I ask what matters most — price or getting all 10 on time? If budget is tight, a 5-Reel starter could be a good test.",
    },
    tool: { href: "/practice", label: "AI Client Simulator" },
    completion: "At least one simulation scored 60 or higher, plus Mission 7 scored 60 or higher.",
  },
  {
    key: "launch",
    number: 5,
    title: "Launch",
    tagline: "Prepare the assets to approach real people",
    objectives: [
      "Write a short pitch",
      "Draft an outreach message you will send yourself",
      "Validate the offer with real potential customers",
    ],
    lesson:
      "Launching is a test, not a promise. Talk to five real potential customers, listen more than you pitch, and update your offer and price from what you hear. Skills2Cash never contacts anyone for you.",
    example: {
      before: "Posting “I edit videos, DM me”.",
      after: "Five personal messages to studio owners, each mentioning their recent posts and offering a free sample edit.",
    },
    tool: { href: "/readiness", label: "Readiness dashboard" },
    completion: "Missions 6 and 8 scored 60 or higher.",
  },
];

export const STAGE_BY_KEY: Record<StageKey, StageDef> = Object.fromEntries(
  STAGES.map((s) => [s.key, s]),
) as Record<StageKey, StageDef>;
