// User retention logic: weekly missions, XP, levels and the monetization
// journey tracker. Everything here is a pure function of saved workspace data —
// no percentages or rewards are hardcoded as user progress.

import { z } from "zod";
import { ASSIGNMENTS } from "./assignments";
import type { CompetencyKey } from "./competencies";
import { bestScoreByKey, competencyScores, completedSessions, computeReadiness, currentStage, PASS_SCORE, READINESS_MIN_DIMENSIONS, stageProgress } from "./progress";
import { STAGE_BY_KEY, STAGE_KEYS, type StageKey } from "./stages";
import type { WeeklyCategory, WeeklyDifficulty, WeeklyMission, WorkspaceState, XpTransaction } from "./types";

// ------------------------------------------------------------------ weeks
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Monday (local time) of the week containing `d`, as YYYY-MM-DD. */
export function weekStartOf(d: Date): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return ymd(x);
}

function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addWeeks(weekStart: string, n: number): string {
  const d = parseYmd(weekStart);
  d.setDate(d.getDate() + n * 7);
  return ymd(d);
}

/** Sunday 23:59:59 (local) of the given week. */
export function weekDeadline(weekStart: string): string {
  const d = parseYmd(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 0);
  return d.toISOString();
}

export function formatWeekRange(weekStart: string): string {
  const a = parseYmd(weekStart);
  const b = parseYmd(weekStart);
  b.setDate(b.getDate() + 6);
  const f = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${f(a)} – ${f(b)}`;
}

export function daysLeft(deadline: string, now: Date): number {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - now.getTime()) / 86_400_000));
}

// ----------------------------------------------------------- mission catalog
export const WEEKLY_CATEGORY_LABEL: Record<WeeklyCategory, string> = {
  research: "Customer research",
  offer: "Service offer",
  pricing: "Pricing",
  portfolio: "Portfolio",
  sales: "Sales practice",
  outreach: "Outreach",
};

export const WEEKLY_XP: Record<WeeklyDifficulty, number> = { Easy: 30, Medium: 50, Hard: 80 };

interface Template {
  key: string;
  title: string;
  /** `{customer}` and `{service}` are replaced with the user's own data. */
  description: string;
  steps: string[];
  category: WeeklyCategory;
  difficulty: WeeklyDifficulty;
  competency: CompetencyKey;
  stage: StageKey;
  /** Only offered when this is true for the user's saved data. */
  available?: (s: WorkspaceState) => boolean;
}

export const WEEKLY_TEMPLATES: Template[] = [
  {
    key: "research-5-customers",
    title: "Research five potential customers",
    description: "Find five real {customer} you could realistically reach and note how each one handles the problem today.",
    steps: ["List five by name (business or person)", "For each: what do they do about the problem now?", "Mark the two that look most likely to pay"],
    category: "research", difficulty: "Medium", competency: "target_customer", stage: "discover",
  },
  {
    key: "competitors-3",
    title: "Analyze three competitors",
    description: "Look at three people or companies already selling something like “{service}”. Compare price, scope and what they leave out.",
    steps: ["Write down each competitor's price and what is included", "Note one thing each does poorly or not at all", "Decide one way your offer will be different"],
    category: "research", difficulty: "Medium", competency: "value_proposition", stage: "discover",
  },
  {
    key: "customer-conversation",
    title: "Talk to one potential customer",
    description: "Have a 10-minute conversation with one of {customer}. Ask about their problem — do not pitch.",
    steps: ["Prepare three open questions", "Listen for the words they use to describe the problem", "Write down what surprised you"],
    category: "research", difficulty: "Hard", competency: "target_customer", stage: "discover",
  },
  {
    key: "create-offer",
    title: "Create your service offer",
    description: "Turn your skill into a specific offer for {customer} in the Service Builder: outcome, deliverables, scope and timeline.",
    steps: ["Open the Service Builder", "Fill in outcome, deliverables and what is not included", "Save the offer"],
    category: "offer", difficulty: "Medium", competency: "service_definition", stage: "build",
    available: (s) => !s.offer,
  },
  {
    key: "sharpen-offer",
    title: "Sharpen your offer's outcome and boundaries",
    description: "Rewrite the outcome of “{service}” as a result the client gets, and add two clear exclusions.",
    steps: ["Rewrite the outcome without describing your tasks", "Add two things that are explicitly not included", "Save the updated offer"],
    category: "offer", difficulty: "Easy", competency: "service_definition", stage: "build",
    available: (s) => !!s.offer,
  },
  {
    key: "pricing-packages",
    title: "Define three pricing packages",
    description: "Build Basic, Standard and Premium packages for “{service}” in the Pricing Builder, each with a different scope.",
    steps: ["Enter your hours, target rate and costs", "Change scope between tiers, not only the number", "Save the pricing worksheet"],
    category: "pricing", difficulty: "Medium", competency: "pricing_rationale", stage: "price",
    available: (s) => !s.pricing,
  },
  {
    key: "price-reaction",
    title: "Test your price with three people",
    description: "Show your Standard package to three {customer} (or people who know them) and ask how the price feels.",
    steps: ["Share the package and the price", "Ask: “What would make this an easy yes?”", "Write down each reaction word for word"],
    category: "pricing", difficulty: "Hard", competency: "pricing_rationale", stage: "price",
    available: (s) => !!s.pricing,
  },
  {
    key: "portfolio-sample",
    title: "Create a portfolio sample",
    description: "Make one small sample of “{service}” that {customer} could look at in under a minute.",
    steps: ["Pick a realistic brief for your target customer", "Produce one finished sample", "Add two lines: the problem and the result"],
    category: "portfolio", difficulty: "Hard", competency: "skill_capability", stage: "build",
  },
  {
    key: "before-after-case",
    title: "Write a before / after case",
    description: "Describe one piece of work you have already done as a short case: the situation before, what you did, the result.",
    steps: ["Choose real past work, paid or unpaid", "Write three short paragraphs: before, what you did, after", "State honestly what was and was not measured"],
    category: "portfolio", difficulty: "Medium", competency: "skill_capability", stage: "build",
  },
  {
    key: "objection-practice",
    title: "Practice handling a price objection",
    description: "Run one AI client simulation where the client pushes back on the price of “{service}”, and finish it to get a score.",
    steps: ["Open Practice and pick a price-objection scenario", "Ask what matters most before defending the price", "End the session and read the evaluation"],
    category: "sales", difficulty: "Medium", competency: "objection_handling", stage: "practice",
    available: (s) => !!s.offer,
  },
  {
    key: "discount-reply",
    title: "Write your reply to “Can you do it cheaper?”",
    description: "Prepare an answer that offers a smaller scope instead of a blind discount on “{service}”.",
    steps: ["Acknowledge the budget concern", "Offer a reduced-scope option at a lower price", "End with a question that moves the conversation on"],
    category: "sales", difficulty: "Easy", competency: "negotiation", stage: "practice",
  },
  {
    key: "discovery-questions",
    title: "Prepare five discovery questions",
    description: "Write five questions you will ask {customer} before you ever mention a price.",
    steps: ["Two questions about their current situation", "Two about what the problem costs them", "One about how they would judge success"],
    category: "sales", difficulty: "Easy", competency: "client_communication", stage: "practice",
  },
  {
    key: "closing-lines",
    title: "Write two closing lines",
    description: "Write two ways to end a sales conversation with a concrete next step, a date and who does what.",
    steps: ["One for a client who is ready", "One for a client who needs to think", "Both must name a specific next step and day"],
    category: "sales", difficulty: "Easy", competency: "closing", stage: "practice",
  },
  {
    key: "outreach-message",
    title: "Write your first client outreach message",
    description: "Draft a short personal message to one real {customer}. Mention something specific about them. You send it yourself.",
    steps: ["Pick one real person or business", "Open with something specific about them", "Offer one small, concrete next step"],
    category: "outreach", difficulty: "Medium", competency: "value_proposition", stage: "launch",
  },
  {
    key: "send-outreach-3",
    title: "Send three outreach messages",
    description: "Personalise your outreach message for three {customer} and send them. Skills2Cash never contacts anyone for you.",
    steps: ["Personalise the first line for each recipient", "Send all three", "Note who replied and what they said"],
    category: "outreach", difficulty: "Hard", competency: "closing", stage: "launch",
    available: (s) => !!s.offer,
  },
  {
    key: "pitch-30s",
    title: "Record a 30-second pitch",
    description: "Say out loud who “{service}” is for, the problem it solves and the result — in 30 seconds. Record it once and listen back.",
    steps: ["Write three sentences: who, problem, result", "Record yourself saying it", "Listen once and cut one unnecessary phrase"],
    category: "outreach", difficulty: "Easy", competency: "value_proposition", stage: "launch",
  },
  {
    key: "publish-offer",
    title: "Publish your offer where customers can see it",
    description: "Put a short version of “{service}” somewhere {customer} actually look: a profile, bio, listing or pinned post.",
    steps: ["Pick the one place your customers already use", "Publish who it is for, what they get and the price", "Add a clear way to contact you"],
    category: "outreach", difficulty: "Medium", competency: "service_definition", stage: "launch",
    available: (s) => !!s.offer,
  },
  {
    key: "ask-referrals",
    title: "Ask two people for an introduction",
    description: "Ask two people you know whether they can introduce you to {customer}.",
    steps: ["Choose two people with relevant contacts", "Tell them in one sentence who you help and how", "Ask for one specific introduction each"],
    category: "outreach", difficulty: "Easy", competency: "client_communication", stage: "launch",
  },
];

/** How many missions a user gets per week, from the hours they said they have. */
export function weeklyMissionCount(s: WorkspaceState): number {
  const h = s.profile?.assessment.hoursPerWeek ?? 5;
  return h <= 3 ? 2 : h >= 10 ? 4 : 3;
}

function lowerFirst(t: string) {
  return t ? t.charAt(0).toLowerCase() + t.slice(1) : t;
}

/**
 * Picks this week's missions from saved data:
 * weakest competencies first, then the current learning stage, adjusted for the
 * user's skill level, with one category per pick where possible. Templates the
 * user already completed are never issued again while unseen ones remain.
 */
export function generateWeeklyMissions(s: WorkspaceState, weekStart: string, newId: () => string, now: Date = new Date()): WeeklyMission[] {
  if (!s.profile) return [];
  const existing = s.weeklyMissions.filter((m) => m.weekStart === weekStart);
  const want = weeklyMissionCount(s) - existing.length;
  if (want <= 0) return [];

  const completed = new Set(s.weeklyMissions.filter((m) => m.status === "completed").map((m) => m.templateKey));
  const thisWeek = new Set(existing.map((m) => m.templateKey));
  const scores = competencyScores(s)
    .filter((c) => c.display !== null)
    .sort((a, b) => (a.display ?? 0) - (b.display ?? 0));
  const weakRank = new Map(scores.slice(0, 3).map((c, i) => [c.key, i]));
  const stage = currentStage(stageProgress(s));
  const stageIdx = STAGE_KEYS.indexOf(stage);
  const level = s.profile.assessment.level;

  const base = (t: Template) => {
    let score = 0;
    const rank = weakRank.get(t.competency);
    if (rank !== undefined) score += 6 - rank * 2;
    const d = STAGE_KEYS.indexOf(t.stage) - stageIdx;
    if (d === 0) score += 5;
    else if (d === 1) score += 2;
    else if (d < 0) score += 1;
    if (level <= 2 && t.difficulty === "Hard") score -= 3;
    if (level >= 4 && t.difficulty === "Easy") score -= 1;
    return score;
  };

  const usable = WEEKLY_TEMPLATES.filter((t) => !thisWeek.has(t.key) && (!t.available || t.available(s)));
  const fresh = usable.filter((t) => !completed.has(t.key));
  // Repeat an already-completed mission only when nothing new is left.
  const pool = fresh.length >= want ? fresh : [...fresh, ...usable.filter((t) => completed.has(t.key))];

  const picked: Template[] = [];
  const usedCategories = new Set(existing.map((m) => m.category));
  while (picked.length < want && picked.length < pool.length) {
    let best: Template | null = null;
    let bestScore = -Infinity;
    for (const t of pool) {
      if (picked.includes(t)) continue;
      const sc = base(t) - (usedCategories.has(t.category) ? 4 : 0) - (completed.has(t.key) ? 20 : 0);
      if (sc > bestScore) { best = t; bestScore = sc; }
    }
    if (!best) break;
    picked.push(best);
    usedCategories.add(best.category);
  }

  const customer = lowerFirst(s.offer?.targetCustomer || s.profile.direction.target_customer);
  const service = s.offer?.title || s.profile.direction.name;
  const fill = (t: string) => t.replaceAll("{customer}", customer).replaceAll("{service}", service);
  const createdAt = now.toISOString();
  return picked.map((t) => {
    const rank = weakRank.get(t.competency);
    const weak = scores.find((c) => c.key === t.competency);
    const reason =
      rank !== undefined && weak
        ? `${weak.label} is one of your lowest scores (${weak.display}/100).`
        : t.stage === stage
          ? `Fits your current learning stage: ${STAGE_BY_KEY[stage].title}.`
          : `Prepares you for the ${STAGE_BY_KEY[t.stage].title} stage.`;
    return {
      id: newId(),
      weekStart,
      templateKey: t.key,
      title: t.title,
      description: fill(t.description),
      steps: t.steps,
      reason,
      category: t.category,
      difficulty: t.difficulty,
      xp: WEEKLY_XP[t.difficulty],
      deadline: weekDeadline(weekStart),
      status: "active" as const,
      completionNote: null,
      completedAt: null,
      createdAt,
    };
  });
}

/** What the user must write to confirm a mission: a short, honest note on what they did. */
export const CompletionNoteSchema = z.string().trim().min(15, "Describe what you did in at least 15 characters.").max(1000);

export interface WeeklyStats {
  weekStart: string;
  missions: WeeklyMission[];
  completed: number;
  total: number;
  percent: number;
  xpEarned: number;
  xpAvailable: number;
  /** Consecutive weeks (ending this or last week) with at least one completed mission. */
  streak: number;
  totalCompleted: number;
}

export function weeklyStats(s: WorkspaceState, now: Date = new Date()): WeeklyStats {
  const weekStart = weekStartOf(now);
  const missions = s.weeklyMissions.filter((m) => m.weekStart === weekStart);
  const done = missions.filter((m) => m.status === "completed");
  const activeWeeks = new Set(s.weeklyMissions.filter((m) => m.status === "completed").map((m) => m.weekStart));
  let streak = 0;
  let w = activeWeeks.has(weekStart) ? weekStart : addWeeks(weekStart, -1);
  while (activeWeeks.has(w)) { streak++; w = addWeeks(w, -1); }
  return {
    weekStart,
    missions,
    completed: done.length,
    total: missions.length,
    percent: missions.length ? Math.round((done.length / missions.length) * 100) : 0,
    xpEarned: done.reduce((a, m) => a + m.xp, 0),
    xpAvailable: missions.reduce((a, m) => a + m.xp, 0),
    streak,
    totalCompleted: s.weeklyMissions.filter((m) => m.status === "completed").length,
  };
}

// ------------------------------------------------------------- XP and levels
export function totalXp(xp: XpTransaction[]): number {
  return xp.reduce((a, t) => a + t.amount, 0);
}

export const LEVEL_TITLES = ["Explorer", "Builder", "Offer Maker", "Seller", "Negotiator", "Closer", "Earner"];

/** XP needed to reach level L (1-based): 0, 100, 300, 600, 1000, … */
export function levelStart(level: number): number {
  return 50 * level * (level - 1);
}

export interface LevelInfo {
  level: number;
  title: string;
  xp: number;
  /** XP earned inside the current level and the size of the level. */
  into: number;
  span: number;
  toNext: number;
  percent: number;
}

export function levelFor(xp: number): LevelInfo {
  let level = 1;
  while (xp >= levelStart(level + 1)) level++;
  const start = levelStart(level);
  const span = levelStart(level + 1) - start;
  const into = xp - start;
  return {
    level,
    title: LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1],
    xp,
    into,
    span,
    toNext: span - into,
    percent: Math.round((into / span) * 100),
  };
}

// ------------------------------------------------------------ journey tracker
export interface PhaseCheck {
  label: string;
  done: boolean;
  href: string;
}

export interface JourneyPhase {
  key: string;
  number: number;
  title: string;
  description: string;
  href: string;
  checks: PhaseCheck[];
  done: number;
  total: number;
  percent: number;
}

/** The eight-phase monetization journey, each phase scored from saved activity. */
export function journeyPhases(s: WorkspaceState): JourneyPhase[] {
  const stages = stageProgress(s);
  const reqs = (k: StageKey) => stages.find((x) => x.key === k)!.requirements.map((r) => ({ label: r.label, done: r.done, href: r.href }));
  const scores = competencyScores(s);
  const demonstrated = scores.filter((c) => c.demonstrated !== null).length;
  const best = bestScoreByKey(s.submissions);
  const readiness = computeReadiness(s);
  const sims = completedSessions(s.sessions);

  const raw: Array<Omit<JourneyPhase, "number" | "done" | "total" | "percent">> = [
    {
      key: "discover",
      title: "Discover skills",
      description: "Know which of your skills someone would pay for.",
      href: "/profile/skills",
      checks: [
        { label: "Complete the skill assessment", done: !!s.profile, href: "/onboarding" },
        { label: "Choose a service direction", done: !!s.profile?.direction, href: "/profile/skills" },
      ],
    },
    {
      key: "gaps",
      title: "Identify skill gaps",
      description: "Replace self-ratings with scores you have actually demonstrated.",
      href: "/profile/skills",
      checks: [
        { label: "Rate yourself on the nine competencies", done: !!s.profile, href: "/onboarding" },
        { label: "Get a demonstrated score in one competency", done: demonstrated >= 1, href: "/assignments" },
        { label: "Get demonstrated scores in five competencies", done: demonstrated >= 5, href: "/profile/skills" },
      ],
    },
    {
      key: "learn",
      title: "Learn",
      description: "Work through customer discovery on your learning path.",
      href: "/path",
      checks: reqs("discover").filter((r) => r.href !== "/onboarding"),
    },
    {
      key: "build",
      title: "Build a service",
      description: "Turn the skill into a specific offer with proof.",
      href: "/service-builder",
      checks: reqs("build"),
    },
    {
      key: "price",
      title: "Set prices",
      description: "Build packages and a price you can explain.",
      href: "/service-builder/pricing",
      checks: reqs("price"),
    },
    {
      key: "practice",
      title: "Practice selling",
      description: "Rehearse real client conversations until objections feel routine.",
      href: "/practice",
      checks: [
        ...reqs("practice"),
        { label: "Complete three AI client simulations", done: sims.length >= 3, href: "/practice" },
      ],
    },
    {
      key: "missions",
      title: "Complete real-world missions",
      description: "Produce the assets you need to approach real people.",
      href: "/assignments",
      checks: ASSIGNMENTS.map((a) => ({
        label: `Mission ${a.number}: ${a.title}`,
        done: (best[a.key] ?? -1) >= PASS_SCORE,
        href: `/assignments/${a.key}`,
      })),
    },
    {
      key: "ready",
      title: "Become ready to monetize",
      description: "Enough demonstrated evidence to start approaching clients.",
      href: "/readiness",
      checks: [
        { label: `Evidence in at least ${READINESS_MIN_DIMENSIONS} readiness dimensions`, done: readiness.evidenced >= READINESS_MIN_DIMENSIONS, href: "/readiness" },
        { label: "Readiness score of 50 or higher", done: (readiness.overall ?? 0) >= 50, href: "/readiness" },
        { label: "Readiness score of 70 or higher", done: (readiness.overall ?? 0) >= 70 && !readiness.provisional, href: "/readiness" },
      ],
    },
  ];
  return raw.map((p, i) => {
    const done = p.checks.filter((c) => c.done).length;
    return { ...p, number: i + 1, done, total: p.checks.length, percent: p.checks.length ? Math.round((done / p.checks.length) * 100) : 0 };
  });
}

/** Overall journey progress: the mean of the eight phase percentages. */
export function journeyPercent(phases: JourneyPhase[]): number {
  return phases.length ? Math.round(phases.reduce((a, p) => a + p.percent, 0) / phases.length) : 0;
}

/** First phase that is not complete — "where am I?". */
export function currentPhase(phases: JourneyPhase[]): JourneyPhase {
  return phases.find((p) => p.percent < 100) ?? phases[phases.length - 1];
}

// ------------------------------------------------------------ weekly activity
export interface WeekActivity {
  weekStart: string;
  label: string;
  missions: number;
  simulations: number;
  weekly: number;
  total: number;
}

/** Activity per week for the last `weeks` weeks, oldest first. */
export function weeklyActivity(s: WorkspaceState, weeks = 6, now: Date = new Date()): WeekActivity[] {
  const cur = weekStartOf(now);
  const out: WeekActivity[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const w = addWeeks(cur, -i);
    const inWeek = (iso: string | null) => !!iso && weekStartOf(new Date(iso)) === w;
    const missions = s.submissions.filter((x) => inWeek(x.createdAt)).length;
    const simulations = completedSessions(s.sessions).filter((x) => inWeek(x.endedAt ?? x.startedAt)).length;
    const weekly = s.weeklyMissions.filter((x) => x.status === "completed" && inWeek(x.completedAt)).length;
    out.push({ weekStart: w, label: i === 0 ? "This week" : formatWeekRange(w).split(" – ")[0], missions, simulations, weekly, total: missions + simulations + weekly });
  }
  return out;
}
