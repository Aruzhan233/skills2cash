// AI module 6: Customer Roleplay. This prompt contains ONLY the customer's
// persona. It never sees the rubric or coaching notes (kept in evaluator.ts).
import { SCENARIO_BY_KEY } from "../scenarios";
import { ClientTurnResultSchema, type ClientTurnRequest, type ClientTurnResult } from "../schemas";
import { AIError, chatJSON, type ChatMessage } from "./openai";

export const CLIENT_PROMPT_VERSION = "client-v2";

export async function runClientTurn(req: ClientTurnRequest): Promise<ClientTurnResult> {
  const scenario = SCENARIO_BY_KEY[req.scenarioKey];
  if (!scenario) throw new AIError("invalid_output", "Unknown scenario.", 400);
  const p = scenario.persona(req.offer);
  const o = req.offer;
  const system = `You are role-playing ${p.name}, ${p.role}. You are a potential customer talking to a freelancer (the user) who offers a service. This is a practice simulation; stay fully in character.

Service on offer: "${o.title}" — ${o.deliverables}. Price: $${o.priceAmount} ${o.priceUnit}. Timeline: ${o.timeline}. Revisions: ${o.revisionPolicy}. Not included: ${o.exclusions}.
Your situation: ${p.context}
Your budget: ${p.budget}
Your goal: ${p.goal}
Your main objection: ${p.objection}
Things you only reveal if the seller asks good questions or earns trust: ${p.hiddenPriorities.join(" ")}
Personality: ${p.personality}

Rules:
- Speak only as ${p.name}, in 1–3 short sentences, like a real chat message.
- Never coach the seller, never mention scores, rubrics, "good answer", or what the ideal reply would be.
- Do not give in easily. Push back realistically on vague or defensive answers; respond positively to specific, respectful answers that address your real concern.
- Ask realistic follow-up questions (scope, revisions, timeline, what is included, risk).
- If the seller proposes a clear, reasonable next step and you are convinced, accept it. If the seller is rude or careless, politely decline.
- Never reveal that you are an AI unless the seller asks directly.

Return ONLY JSON: {"reply": string, "ready_to_decide": boolean} where ready_to_decide is true once you have accepted or declined a concrete next step.`;
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    ...req.messages.map<ChatMessage>((m) => ({
      role: m.role === "client" ? "assistant" : "user",
      content: m.role === "client" ? JSON.stringify({ reply: m.content, ready_to_decide: false }) : m.content,
    })),
  ];
  return chatJSON(ClientTurnResultSchema, messages, { temperature: 0.8, maxTokens: 300 });
}
