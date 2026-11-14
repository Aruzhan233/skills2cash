import { MIN_SCORED_RATIO, SCORE_BANDS } from "./config";

/**
 * Deterministic scoring (documented in README → "Scoring formula").
 *
 * Each criterion is scored by the evaluator on a 1–5 scale, or null when the
 * conversation/submission does not contain enough evidence for it.
 *
 *   criterion% = (score − 1) / 4 × 100            (1 → 0, 3 → 50, 5 → 100)
 *   overall    = round( mean(criterion% over scored criteria) )
 *
 * Unscored (null) criteria are excluded from the mean and reported separately.
 * If no criterion is scored the overall score is null ("not enough evidence").
 */
export function levelToPercent(level: number): number {
  const clamped = Math.min(5, Math.max(1, level));
  return Math.round(((clamped - 1) / 4) * 100);
}

export interface OverallResult {
  overall: number | null;
  scored: number;
  total: number;
  lowCoverage: boolean;
}

export function computeOverall(scores: Array<number | null | undefined>): OverallResult {
  const total = scores.length;
  const valid = scores.filter((s): s is number => typeof s === "number" && s >= 1 && s <= 5);
  const scored = valid.length;
  if (scored === 0) return { overall: null, scored, total, lowCoverage: true };
  const sum = valid.reduce((acc, s) => acc + ((s - 1) / 4) * 100, 0);
  return {
    overall: Math.round(sum / scored),
    scored,
    total,
    lowCoverage: total > 0 && scored / total < MIN_SCORED_RATIO,
  };
}

export type Band = "remedial" | "targeted" | "advance";

export function scoreBand(percent: number): Band {
  if (percent < SCORE_BANDS.remedialBelow) return "remedial";
  if (percent < SCORE_BANDS.advanceAt) return "targeted";
  return "advance";
}

export const BAND_LABEL: Record<Band, string> = {
  remedial: "Needs practice",
  targeted: "Developing",
  advance: "Strong",
};

export function levelLabel(percent: number): string {
  if (percent < 25) return "Starting";
  if (percent < 50) return "Emerging";
  if (percent < 75) return "Capable";
  return "Confident";
}

/** Normalises text for evidence matching: lower-case, collapsed whitespace, unified quotes. */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Keeps only quotes that literally appear in at least one of the given texts. */
export function filterVerifiedQuotes(quotes: string[], sources: string[]): string[] {
  const haystack = sources.map(normalizeForMatch);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of quotes) {
    const n = normalizeForMatch(q).replace(/^["']|["']$/g, "");
    if (n.length < 4 || seen.has(n)) continue;
    if (haystack.some((h) => h.includes(n))) {
      seen.add(n);
      out.push(q.trim().replace(/^["“]|["”]$/g, ""));
    }
  }
  return out;
}
