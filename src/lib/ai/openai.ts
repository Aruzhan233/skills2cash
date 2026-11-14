// Server-only OpenAI helper. Never import this file from a client component:
// it reads OPENAI_API_KEY from the server environment.
import type { z } from "zod";

export type AIErrorCode =
  | "not_configured"
  | "rate_limited"
  | "invalid_output"
  | "empty_response"
  | "upstream"
  | "timeout"
  | "network";

export class AIError extends Error {
  constructor(
    public code: AIErrorCode,
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function aiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

const TIMEOUT_MS = 30_000;

async function callOnce(messages: ChatMessage[], temperature: number, maxTokens: number): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new AIError("not_configured", "The AI service is not configured on this server.", 503);
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const reasoning = /gpt-oss/i.test(model);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
    res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        // Reasoning models (e.g. openai/gpt-oss-* on Groq) spend tokens on hidden reasoning first.
        max_tokens: reasoning ? maxTokens + 2000 : maxTokens,
        ...(reasoning ? { reasoning_effort: "low" } : {}),
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw new AIError("timeout", "The AI took too long to respond.", 504);
    throw new AIError("network", "Could not reach the AI service.", 502);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    let code = "";
    let detail = "";
    try {
      const err = (await res.json()) as { error?: { code?: string; type?: string; message?: string } };
      code = err.error?.code || err.error?.type || "";
      detail = (err.error?.message || "").slice(0, 200);
    } catch {
      /* non-JSON error body */
    }
    console.error("[openai]", res.status, code, detail);
    if (code === "insufficient_quota")
      throw new AIError("not_configured", "The AI account has no credits left (insufficient_quota). Add billing/credits for the API key.", 503);
    if (res.status === 401) throw new AIError("not_configured", "The AI key on the server is invalid (401). Check OPENAI_API_KEY.", 503);
    if (res.status === 403) throw new AIError("not_configured", `The AI provider refused the request (403). ${detail}`.trim(), 503);
    if (res.status === 404 || code === "model_not_found")
      throw new AIError("not_configured", `The AI model "${process.env.OPENAI_MODEL || "gpt-4o-mini"}" is not available for this key. Check OPENAI_MODEL.`, 503);
    if (res.status === 429) throw new AIError("rate_limited", "The AI service rate limit was reached. Please retry in a moment.", 429);
    if (res.status === 400) throw new AIError("upstream", `The AI provider rejected the request (400). ${detail}`.trim(), 502);
    throw new AIError("upstream", `The AI service returned an error (${res.status}).`, 502);
  }
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = body.choices?.[0]?.message?.content?.trim();
  if (!content) throw new AIError("empty_response", "The AI returned an empty response.", 502);
  return content;
}

/**
 * Calls the model in JSON mode and validates the result with Zod.
 * One repair attempt is made if the output does not match the schema.
 */
export async function chatJSON<S extends z.ZodTypeAny>(
  schema: S,
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<z.infer<S>> {
  const temperature = opts.temperature ?? 0.4;
  const maxTokens = opts.maxTokens ?? 1200;
  let lastError = "";
  const convo = [...messages];
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callOnce(convo, temperature, maxTokens);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      lastError = "Response was not valid JSON.";
      convo.push({ role: "assistant", content: raw }, { role: "user", content: `${lastError} Return only valid JSON.` });
      continue;
    }
    const result = schema.safeParse(parsed);
    if (result.success) return result.data;
    lastError = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    convo.push(
      { role: "assistant", content: raw },
      { role: "user", content: `The JSON did not match the required schema (${lastError}). Return corrected JSON only.` },
    );
  }
  throw new AIError("invalid_output", `The AI returned an invalid structure. ${lastError}`.trim(), 502);
}
