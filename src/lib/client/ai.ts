"use client";
import {
  sampleAssessment,
  sampleAssignmentEval,
  sampleEvaluation,
  sampleOfferImprove,
  samplePricingCoach,
  scriptedClientTurn,
} from "../fallback";
import type { AssignmentAIResult } from "../evaluation";
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
} from "../schemas";
import type { Generator } from "../types";

interface Routes {
  assess: [AssessmentInput, AssessmentResult];
  "offer/improve": [OfferImproveRequest, OfferImproveResult];
  "pricing/coach": [PricingCoachRequest, PricingCoachResult];
  "roleplay/turn": [ClientTurnRequest, ClientTurnResult];
  "roleplay/evaluate": [ClientTurnRequest, EvaluationAI];
  "assignments/evaluate": [AssignmentRequest, AssignmentAIResult];
}
export type AIRoute = keyof Routes;

const OFFLINE: { [K in AIRoute]: (b: Routes[K][0]) => Routes[K][1] } = {
  assess: sampleAssessment,
  "offer/improve": sampleOfferImprove,
  "pricing/coach": samplePricingCoach,
  "roleplay/turn": scriptedClientTurn,
  "roleplay/evaluate": sampleEvaluation,
  "assignments/evaluate": sampleAssignmentEval,
};

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export interface AIResult<T> {
  data: T;
  generatedBy: Generator;
  /** Present when the result came from a fallback. */
  notice?: string;
}

/**
 * Calls a server AI route.
 * - offline: skip the network and use the labelled offline sample (scripted demo).
 * - fallbackOnError: if the AI fails, return the labelled sample instead of throwing (demo mode).
 */
export async function callAI<K extends AIRoute>(
  route: K,
  body: Routes[K][0],
  opts: { offline?: boolean; fallbackOnError?: boolean } = {},
): Promise<AIResult<Routes[K][1]>> {
  const offline = () => ({
    data: OFFLINE[route](body),
    generatedBy: "sample" as const,
  });
  if (opts.offline) {
    await new Promise((r) => setTimeout(r, 350));
    return { ...offline(), notice: "Scripted mode — offline sample, not AI." };
  }
  try {
    const res = await fetch(`/api/${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    let json: { ok?: boolean; data?: Routes[K][1]; error?: { code: string; message: string } } = {};
    try {
      json = await res.json();
    } catch {
      throw new ApiError("invalid_response", "The server returned an unreadable response.");
    }
    if (!res.ok || !json.ok || !json.data) {
      throw new ApiError(json.error?.code ?? "upstream", json.error?.message ?? `Request failed (${res.status}).`);
    }
    return { data: json.data, generatedBy: "ai" };
  } catch (e) {
    const err = e instanceof ApiError ? e : new ApiError("network", "Network error — check your connection.");
    if (opts.fallbackOnError && err.code !== "bad_request") {
      return { ...offline(), notice: `AI unavailable (${err.message}) — showing an offline sample, not AI.` };
    }
    throw err;
  }
}

/** Runs the labelled offline sample directly (used by "Use offline sample" buttons). */
export function offlineAI<K extends AIRoute>(route: K, body: Routes[K][0]): AIResult<Routes[K][1]> {
  return { data: OFFLINE[route](body), generatedBy: "sample", notice: "Offline sample — not AI." };
}
