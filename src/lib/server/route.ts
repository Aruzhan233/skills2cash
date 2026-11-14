import { NextResponse } from "next/server";
import type { z } from "zod";
import { AIError } from "../ai/openai";

// Best-effort in-memory rate limit per client IP (per server instance).
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_REQUESTS;
}

export type ApiErrorCode = AIError["code"] | "bad_request" | "too_many_requests" | "internal";

function fail(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

/** Validates the JSON body with Zod, runs the AI task, and maps errors to JSON responses. */
export async function handleAI<S extends z.ZodTypeAny, R>(
  req: Request,
  schema: S,
  run: (input: z.infer<S>) => Promise<R>,
): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return fail("too_many_requests", "Too many requests. Please wait a minute and retry.", 429);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("bad_request", "Request body must be JSON.", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
      .join("; ");
    return fail("bad_request", `Invalid input — ${msg}`, 400);
  }
  try {
    const data = await run(parsed.data);
    return NextResponse.json({ ok: true, data, generatedBy: "ai" });
  } catch (e) {
    if (e instanceof AIError) return fail(e.code, e.message, e.status);
    console.error("[ai-route]", e);
    return fail("internal", "Unexpected server error.", 500);
  }
}
