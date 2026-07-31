// Real model integration, first wired up for the Student edition's AI
// add-on (src/app/api/ai/assistant/route.ts). Uses the same
// ANTHROPIC_API_KEY/model as 3Stone Counsel's guidance engine (the
// founder's own Anthropic account — one key shared across products
// rather than a separate one per app).
//
// Every function in src/server/ai/capabilities.ts and
// src/server/ai/assistant.ts remains deterministic automation (template
// strings/keyword matching), not real AI — those stay the demo-only
// fallback. This file is the one place that should import the provider
// SDK directly.
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-5";

export function isAiProviderConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface AiTextResult {
  text: string;
  real: boolean;
}

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set — call isAiProviderConfigured() first.");
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

// Multi-turn text chat — no tool use, no structured extraction. That's a
// deliberate scope call for this first real capability: it's a general
// assistant grounded in a system prompt describing 3Stone One Student,
// not a retrieval system over the student's real project/task data (that
// would need its own capability + real data-fetching work, not bundled
// in here).
export async function generateChatReply(systemPrompt: string, messages: AiChatMessage[]): Promise<AiTextResult> {
  if (!isAiProviderConfigured()) {
    return { text: "", real: false };
  }
  const response = await getClient().messages.create({
    model: MODEL,
    system: systemPrompt,
    messages,
    max_tokens: 1024,
  });
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
  return { text, real: true };
}
