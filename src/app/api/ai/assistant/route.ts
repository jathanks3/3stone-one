import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/server/db";
import { generateChatReply, isAiProviderConfigured, type AiChatMessage } from "@/server/ai/aiProvider";
import { assertAiCapacity, recordAiUsage, UsageCapError } from "@/server/services/usageCapService";

// Real AI, included for every real workspace on every edition - no more
// Student-only paid toggle. What keeps this safe isn't an edition check,
// it's the usage cap (usageCapService.ts): assertAiCapacity below throws
// before this ever reaches the billable Anthropic call, and every
// success is recorded so the cap can't be bypassed by racing requests.
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const requestLog = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

function systemPromptFor(editionKey: string): string {
  const context =
    editionKey === "student"
      ? "a lightweight workspace for college and grad school coursework and group projects (documents, tasks/projects, and meetings)"
      : editionKey === "workspace"
        ? "a day-to-day team workspace (CRM, projects, people, meetings, documents, and more)"
        : "a full business operating system (customers, projects, finance, people, meetings, documents, and more)";

  return `You are the 3Stone One assistant, a helpful AI built into 3Stone One — ${context}.

Help with things like: explaining or outlining a document, breaking work into tasks, drafting or improving writing, summarizing notes, and general planning questions. You do not have access to the workspace's actual documents, tasks, customers, or numbers in this conversation — if their question depends on specific content they haven't pasted in, ask them to share it rather than guessing.

Be concise, direct, and encouraging. No hype, no filler.`;
}

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.isDemo) {
    return NextResponse.json({ error: "Not available for this session." }, { status: 403 });
  }

  if (isRateLimited(session.userId)) {
    return NextResponse.json({ error: "You're sending messages too quickly. Try again in a minute." }, { status: 429 });
  }

  const membership = await db.workspaceMember.findFirst({
    where: { userId: session.userId, status: "active" },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });
  if (!membership) {
    return NextResponse.json({ error: "No workspace found." }, { status: 403 });
  }

  if (!isAiProviderConfigured()) {
    return NextResponse.json({ error: "AI isn't configured yet." }, { status: 503 });
  }

  try {
    await assertAiCapacity(membership.workspace.id);
  } catch (err) {
    if (err instanceof UsageCapError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    throw err;
  }

  const body = await req.json().catch(() => null);
  const rawMessages = body?.messages;
  if (!Array.isArray(rawMessages) || rawMessages.length === 0 || rawMessages.length > MAX_MESSAGES) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const messages: AiChatMessage[] = [];
  for (const m of rawMessages) {
    if (
      !m ||
      (m.role !== "user" && m.role !== "assistant") ||
      typeof m.content !== "string" ||
      m.content.length === 0 ||
      m.content.length > MAX_MESSAGE_LENGTH
    ) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    messages.push({ role: m.role, content: m.content });
  }

  try {
    const result = await generateChatReply(systemPromptFor(membership.workspace.editionKey), messages);
    // Only a successful, billed call counts against the cap - a failed
    // generation must never cost the customer part of their allowance.
    await recordAiUsage(membership.workspace.id, session.userId);
    return NextResponse.json({ text: result.text });
  } catch (err) {
    console.error("[api/ai/assistant] generation failed:", err);
    return NextResponse.json({ error: "The assistant couldn't respond just now. Try again." }, { status: 502 });
  }
}
