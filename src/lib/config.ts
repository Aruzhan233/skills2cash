// Initial product settings. These thresholds are configurable starting points,
// not scientifically validated cut-offs.
export const SCORE_BANDS = {
  /** Below this percentage the next step is remedial practice. */
  remedialBelow: 60,
  /** At or above this percentage the user advances to harder practice. */
  advanceAt: 80,
} as const;

/** A conversation with fewer user turns than this is flagged as low-confidence. */
export const MIN_USER_TURNS_FOR_CONFIDENCE = 3;

/** If fewer than this share of criteria could be scored, the result is low-confidence. */
export const MIN_SCORED_RATIO = 0.6;

/** Maximum number of user turns in one roleplay session. */
export const MAX_USER_TURNS = 12;

export const SCORING_FORMULA_VERSION = "v1";
