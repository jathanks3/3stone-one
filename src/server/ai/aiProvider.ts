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
  /** Set only when the model actually used create_note this turn - the
   * route persists it via noteService, this function never touches the
   * database itself. */
  createdNote?: { title: string; body: string };
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

// One real tool, not a general framework - the founder asked specifically
// for "the assistant can create notes that populate in the note section,"
// not a general capability registry (that's still the docs-only
// aspiration described in CLAUDE.md's AiCapability section). If more
// tools are genuinely needed later, generalize this then.
const CREATE_NOTE_TOOL: Anthropic.Tool = {
  name: "create_note",
  description:
    "Save a real note to the user's Notes section. Only call this when the user clearly asks you to save/write/remember something as a note - never for an ordinary conversational reply.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "A short, clear title for the note." },
      body: { type: "string", description: "The note's full content, in the user's own words where possible." },
    },
    required: ["title", "body"],
  },
};

// Multi-turn text chat, plus the one create_note tool above. Still not a
// general retrieval/automation framework - the context this reasons over
// comes entirely from the workspace data snapshot already built into the
// system prompt (see src/server/ai/context.ts), not live tool calls.
export async function generateChatReply(systemPrompt: string, messages: AiChatMessage[]): Promise<AiTextResult> {
  if (!isAiProviderConfigured()) {
    return { text: "", real: false };
  }
  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({ role: m.role, content: m.content }));

  const first = await getClient().messages.create({
    model: MODEL,
    system: systemPrompt,
    messages: anthropicMessages,
    tools: [CREATE_NOTE_TOOL],
    max_tokens: 1024,
  });

  const toolUse = first.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use" && block.name === "create_note"
  );

  if (!toolUse) {
    const text = first.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
    return { text, real: true };
  }

  const input = toolUse.input as { title?: unknown; body?: unknown };
  const createdNote = {
    title: typeof input.title === "string" && input.title.trim() ? input.title.trim() : "Note from assistant",
    body: typeof input.body === "string" ? input.body.trim() : "",
  };

  // Second turn: tell the model the note is saved so it can give a real
  // conversational reply instead of leaving the user staring at nothing -
  // Claude's own tool-use protocol requires this round trip (a tool_use
  // block must always be followed by a matching tool_result).
  const second = await getClient().messages.create({
    model: MODEL,
    system: systemPrompt,
    messages: [
      ...anthropicMessages,
      { role: "assistant", content: first.content },
      {
        role: "user",
        content: [{ type: "tool_result", tool_use_id: toolUse.id, content: "Saved to Notes." } satisfies Anthropic.ToolResultBlockParam],
      },
    ],
    max_tokens: 1024,
  });
  const text = second.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
  return { text, real: true, createdNote };
}
