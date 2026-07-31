import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/server/db";
import { getBillingSummary } from "@/server/services/billingService";
import { generateChatReply, isAiProviderConfigured, type AiChatMessage } from "@/server/ai/aiProvider";

// Real AI, first wired up for the Student edition's paid add-on. Every
// gate here is re-checked server-side against the database — the client
// (AiAssistant.tsx) also checks editionKey/aiAddOnEnabled before showing
// the widget, but that's UX only, never trusted for authorization.
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

const SYSTEM_PROMPT = `You are the 3Stone One Student assistant, a helpful AI built into 3Stone One's Student edition — a lightweight workspace for college and grad school coursework and group projects (documents, tasks/projects, and meetings).

Help with things like: explaining or outlining a document, breaking an assignment into tasks, drafting or improving writing, summarizing notes, and general study/project-planning questions. You do not have access to the student's actual documents, tasks, or grades in this conversation — if their question depends on specific content they haven't pasted in, ask them to share it rather than guessing.

Be concise, direct, and encouraging. No hype, no filler.`;

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

  if (membership.workspace.editionKey !== "student") {
    return NextResponse.json({ error: "The AI assistant is only available on the Student edition." }, { status: 403 });
  }

  const billing = await getBillingSummary(membership.workspace.id);
  if (!billing.aiAddOnEnabled) {
    return NextResponse.json({ error: "The AI add-on isn't enabled for this workspace." }, { status: 403 });
  }

  if (!isAiProviderConfigured()) {
    return NextResponse.json({ error: "AI isn't configured yet." }, { status: 503 });
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
    const result = await generateChatReply(SYSTEM_PROMPT, messages);
    return NextResponse.json({ text: result.text });
  } catch (err) {
    console.error("[api/ai/assistant] generation failed:", err);
    return NextResponse.json({ error: "The assistant couldn't respond just now. Try again." }, { status: 502 });
  }
}
