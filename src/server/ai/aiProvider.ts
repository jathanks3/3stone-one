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

export type AiTool = Anthropic.Tool;

// Deliberately generic - this file has no idea what "create_note" or
// "create_project" mean, it just runs whatever tool the model called and
// hands back a plain string result. The caller (api/ai/assistant/route.ts)
// owns the real tool list (edition-gated via getAllowedModuleKeys) and
// the actual service calls - this file stays free of every service
// import, matching this app's own architecture rule that a route/service
// boundary is never blurred. Not a general AiCapability registry (still
// docs-only per CLAUDE.md) - just real tool-use, one bounded round.
export type AiToolExecutor = (name: string, input: Record<string, unknown>) => Promise<string>;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set — call isAiProviderConfigured() first.");
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

// Multi-turn text chat, plus whatever tools the caller passes in (empty
// array = plain chat, same as before tools existed). Bounded to one
// round of tool use - if the model tries to call more tools after seeing
// the results, this returns whatever text came back rather than looping
// again, so a single request can never spiral into an unbounded chain of
// model calls.
export async function generateChatReply(
  systemPrompt: string,
  messages: AiChatMessage[],
  tools: AiTool[] = [],
  executeTool?: AiToolExecutor
): Promise<AiTextResult> {
  if (!isAiProviderConfigured()) {
    return { text: "", real: false };
  }
  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({ role: m.role, content: m.content }));

  const first = await getClient().messages.create({
    model: MODEL,
    system: systemPrompt,
    messages: anthropicMessages,
    ...(tools.length ? { tools } : {}),
    max_tokens: 1024,
  });

  const toolUses = first.content.filter((block): block is Anthropic.ToolUseBlock => block.type === "tool_use");
  if (toolUses.length === 0 || !executeTool) {
    return { text: extractText(first.content), real: true };
  }

  // Claude's tool-use protocol requires every tool_use block be followed
  // by a matching tool_result before the model can give its next real
  // reply - run each one, then make the follow-up call with the results.
  const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
    toolUses.map(async (tu) => {
      let content: string;
      try {
        content = await executeTool(tu.name, tu.input as Record<string, unknown>);
      } catch (err) {
        content = `Failed: ${err instanceof Error ? err.message : "something went wrong."}`;
      }
      return { type: "tool_result", tool_use_id: tu.id, content };
    })
  );

  const second = await getClient().messages.create({
    model: MODEL,
    system: systemPrompt,
    messages: [
      ...anthropicMessages,
      { role: "assistant", content: first.content },
      { role: "user", content: toolResults },
    ],
    max_tokens: 1024,
  });
  return { text: extractText(second.content), real: true };
}
