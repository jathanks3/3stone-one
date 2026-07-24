// Abstraction only — no API key exists in any environment for this app
// today (checked ANTHROPIC_API_KEY/OPENAI_API_KEY/CLAUDE_API_KEY across
// .env.local and `vercel env ls`; none present). Per the founder's
// stack-reconciliation charter: "if an approved AI provider already
// exists in environment variables, integrate it. Otherwise create the
// abstraction only" — this is the "otherwise."
//
// Every function in src/server/ai/capabilities.ts and
// src/server/ai/assistant.ts is deterministic automation, not real AI:
// template strings and regex/keyword matching over data, no model call,
// no probabilistic output. See docs/18-architecture-inventory.md's AI
// entry for the full audit. Nothing production-facing claims otherwise —
// every one of those functions is reachable only from the demo
// experience today (every module that calls into them is still
// NotYetConnected for real sessions), and the one place that WAS reached
// unconditionally (the AiAssistant chat widget, mounted globally in
// AppShell with no isDemo check) was a real bug, fixed as part of this
// same audit.
//
// Once a real key exists, generateText below is the one place to wire an
// actual model call — nothing else in this app should import a
// provider SDK directly.

export function isAiProviderConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface AiTextResult {
  text: string;
  real: boolean;
}

// Deliberately unimplemented beyond the configuration check: wiring an
// actual prompt, model choice, cost/latency handling, and error handling
// is real feature work for whichever capability first needs it, not
// something to stub in speculatively. Every caller must already have a
// deterministic fallback (the existing capabilities.ts functions) and
// must use it when this returns real:false.
export async function generateText(_prompt: string): Promise<AiTextResult> {
  if (!isAiProviderConfigured()) {
    return { text: "", real: false };
  }
  throw new Error(
    "ANTHROPIC_API_KEY is set, but no model integration has been wired up yet — this is an abstraction, not a working call. Implement the actual request here before using it."
  );
}
