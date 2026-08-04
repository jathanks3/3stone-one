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
import type { CustomerAiProvider } from "@/server/services/customerAiProviderService";

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

function getAnthropicClient(provider?: CustomerAiProvider): Anthropic {
  return provider?.provider === "anthropic" ? new Anthropic({ apiKey: provider.apiKey }) : getClient();
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
  executeTool?: AiToolExecutor,
  provider?: CustomerAiProvider
): Promise<AiTextResult> {
  if (!provider && !isAiProviderConfigured()) {
    return { text: "", real: false };
  }
  if (provider?.provider === "openai") {
    return generateOpenAiReply(systemPrompt, messages, tools, executeTool, provider);
  }
  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({ role: m.role, content: m.content }));
  const anthropicClient = getAnthropicClient(provider);
  const model = provider?.model ?? MODEL;

  const first = await anthropicClient.messages.create({
    model,
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

  const second = await anthropicClient.messages.create({
    model,
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

type OpenAiToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
type OpenAiMessage = { content?: string | null; tool_calls?: OpenAiToolCall[] };
type OpenAiResponse = { choices?: Array<{ message?: OpenAiMessage }> ; error?: { message?: string } };

async function openAiRequest(apiKey: string, body: Record<string, unknown>): Promise<OpenAiResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await response.json().catch(() => ({})) as OpenAiResponse;
  if (!response.ok) throw new Error(json.error?.message ?? `OpenAI request failed (${response.status}).`);
  return json;
}

async function generateOpenAiReply(
  systemPrompt: string,
  messages: AiChatMessage[],
  tools: AiTool[],
  executeTool: AiToolExecutor | undefined,
  provider: CustomerAiProvider
): Promise<AiTextResult> {
  const openAiTools = tools.map((tool) => ({
    type: "function" as const,
    function: { name: tool.name, description: tool.description, parameters: tool.input_schema },
  }));
  const chatMessages: Array<Record<string, unknown>> = [{ role: "system", content: systemPrompt }, ...messages];
  const first = await openAiRequest(provider.apiKey, {
    model: provider.model,
    messages: chatMessages,
    ...(openAiTools.length ? { tools: openAiTools } : {}),
    max_completion_tokens: 1024,
  });
  const assistant = first.choices?.[0]?.message;
  if (!assistant) throw new Error("OpenAI returned no assistant message.");
  const toolCalls = assistant.tool_calls ?? [];
  if (!toolCalls.length || !executeTool) return { text: assistant.content ?? "", real: true };

  chatMessages.push({ role: "assistant", content: assistant.content ?? null, tool_calls: toolCalls });
  for (const call of toolCalls) {
    let input: Record<string, unknown> = {};
    try { input = JSON.parse(call.function.arguments) as Record<string, unknown>; } catch { /* The executor will receive an empty object and validate it. */ }
    let content: string;
    try { content = await executeTool(call.function.name, input); }
    catch (err) { content = `Failed: ${err instanceof Error ? err.message : "something went wrong."}`; }
    chatMessages.push({ role: "tool", tool_call_id: call.id, content });
  }
  const second = await openAiRequest(provider.apiKey, {
    model: provider.model,
    messages: chatMessages,
    max_completion_tokens: 1024,
  });
  return { text: second.choices?.[0]?.message?.content ?? "", real: true };
}
