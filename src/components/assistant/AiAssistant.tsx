"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Sparkles, X, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIndustry } from "@/lib/industry";
import { useAssistantSize } from "@/lib/assistantSize";
import { onAskAssistant } from "@/lib/assistantBus";
import { getIndustryDataset } from "@/server/mock-data/industries";
import { generateAttendanceForEmployees } from "@/server/mock-data/attendance";
import { DEMO_VENDORS } from "@/server/mock-data";
import { DEMO_BUSINESSES, getBusinessName } from "@/server/mock-data/businesses";
import { answerQuestion, answerExecutiveQuestion, type ExecutiveBusiness } from "@/server/ai/assistant";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "What should I reorder today?",
  "What is my total inventory value?",
  "Summarize today's operations",
  "Who still owes deposits?",
  "How much profit did we make this month?",
  "Which projects are at risk?",
];

// The demo runs a keyword-matching mock engine (src/server/ai/assistant.ts),
// not the real model - these have to be things that engine can actually
// answer for that edition's mock dataset, not the open-ended prompts the
// real assistant handles (see STUDENT_SUGGESTIONS etc. below, which are
// real-session-only). Student/Workspace have no Finance/Inventory (see
// editionModules.ts), so their demo suggestions never reference those.
const STUDENT_DEMO_SUGGESTIONS = [
  "Summarize today",
  "What's due tomorrow?",
  "Compare this month to last month",
  "Which assignments are at risk?",
];

const WORKSPACE_DEMO_SUGGESTIONS = [
  "Summarize today",
  "What's coming up?",
  "Compare this month to last month",
  "Which projects are at risk?",
];

function demoSuggestions(editionKey: string): string[] {
  if (editionKey === "student") return STUDENT_DEMO_SUGGESTIONS;
  if (editionKey === "workspace") return WORKSPACE_DEMO_SUGGESTIONS;
  return SUGGESTIONS;
}

const EXECUTIVE_SUGGESTIONS = [
  "Which business needs attention?",
  "Compare businesses",
  "How much did I make across everything this month?",
];

const STUDENT_SUGGESTIONS = [
  "Help me break this assignment into tasks",
  "Give me feedback on a paragraph I'll paste in",
  "Draft an outline for a project proposal",
];

const WORKSPACE_SUGGESTIONS = [
  "Draft a status update for a project",
  "Help me plan a meeting agenda",
  "Summarize a document I'll paste in",
];

const BUSINESS_SUGGESTIONS = [
  "Draft a customer follow-up",
  "Summarize a document I'll paste in",
  "Help me plan a meeting agenda",
];

function realSessionSuggestions(editionKey: string): string[] {
  if (editionKey === "student") return STUDENT_SUGGESTIONS;
  if (editionKey === "workspace") return WORKSPACE_SUGGESTIONS;
  return BUSINESS_SUGGESTIONS;
}

function realSessionHint(editionKey: string): string {
  if (editionKey === "student") return "Ask anything — coursework, writing, planning";
  return "Ask anything — documents, planning, writing";
}

// "Large" is the new default (roughly 2.2cm at typical screen density) -
// "Compact" is the original size, kept as the opt-out (see Settings ->
// Appearance). Icon/face size scales with the button so it never looks
// like a tiny icon adrift in a big circle.
const BUTTON_SIZE: Record<"large" | "compact", number> = { large: 84, compact: 52 };

const PROACTIVE_TIPS: Record<string, string[]> = {
  student: [
    "Study for your next exam with one focused 25-minute session, then let me make notes from what you learned.",
    "Check your next Outlook or Canvas date and let me help you prepare for it.",
    "Upload class notes, photos, or audio in Knowledge and ask me to turn them into a study guide and saved notes.",
    "Pick your hardest assignment, break it into three steps, and let me make a note you can return to.",
  ],
  workspace: [
    "Review your next Outlook or Teams meeting and let me prepare an agenda with you.",
    "Preview a file in Knowledge, then let me summarize it and make notes.",
    "After your next meeting, let me capture decisions, follow-ups, and action items as notes.",
    "Check which project needs a follow-up today, then let me save the plan as a note.",
  ],
  business: [
    "Review today's Outlook or Teams meetings and let me prepare talking points.",
    "After a meeting or important email, let me make notes with decisions and next actions.",
    "Ask me which project or customer needs attention first, then let me save the plan as a note.",
    "Preview a document, photo, or audio file in Knowledge and let me pull out notes and next actions.",
  ],
};

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [proactiveTip, setProactiveTip] = useState<string | null>(null);
  const { editionKey } = useIndustry();
  const { assistantSize } = useAssistantSize();
  const buttonSize = BUTTON_SIZE[assistantSize];
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; offsetX: number; offsetY: number; moved: boolean } | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const saved = window.localStorage.getItem("3stone-ai-position");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { x: number; y: number };
          setPosition({
            x: Math.max(8, Math.min(window.innerWidth - buttonSize - 8, parsed.x)),
            y: Math.max(8, Math.min(window.innerHeight - buttonSize - 8, parsed.y)),
          });
          return;
        } catch {
          // Fall through to the edition-safe bottom-right default.
        }
      }
      setPosition({ x: window.innerWidth - buttonSize - 24, y: window.innerHeight - buttonSize - 24 });
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [buttonSize]);

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!position) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - position.x,
      offsetY: event.clientY - position.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const x = Math.max(8, Math.min(window.innerWidth - buttonSize - 8, event.clientX - drag.offsetX));
    const y = Math.max(8, Math.min(window.innerHeight - buttonSize - 8, event.clientY - drag.offsetY));
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 8) drag.moved = true;
    setPosition({ x, y });
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (position) window.localStorage.setItem("3stone-ai-position", JSON.stringify(position));
    dragRef.current = null;
    if (!drag.moved) setOpen((current) => !current);
  }

  function cancelDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
  }

  // Lets a page (e.g. the Dashboard's daily debrief card) open this panel
  // with a question already queued up, instead of the user having to
  // retype what they just read on the page.
  useEffect(() => {
    return onAskAssistant(({ prompt }) => {
      setPendingPrompt(prompt);
      setProactiveTip(null);
      setOpen(true);
    });
  }, []);

  useEffect(() => {
    if (open) return;

    const tips = PROACTIVE_TIPS[editionKey] ?? PROACTIVE_TIPS.business;
    let hideTimer: number | undefined;
    const showNextTip = () => {
      const storageKey = `3stone-ai-tip-index-${editionKey}`;
      const previous = Number(window.localStorage.getItem(storageKey) ?? "-1");
      const next = (previous + 1) % tips.length;
      window.localStorage.setItem(storageKey, String(next));
      setProactiveTip(tips[next]);
      if (hideTimer) window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setProactiveTip(null), 14_000);
    };

    const firstTimer = window.setTimeout(showNextTip, 18_000);
    const interval = window.setInterval(showNextTip, 3 * 60_000);
    return () => {
      window.clearTimeout(firstTimer);
      window.clearInterval(interval);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [editionKey, open]);

  // Real bug found during an earlier AI audit: this widget used to answer
  // every question from DEMO_VENDORS / getIndustryDataset(profile.key) —
  // entirely fictional data — with no isDemo check at all. A real
  // customer opening it got confident, specific answers ("X owes a
  // $500 deposit") about a business that isn't theirs. That's fixed by
  // the branch in ask() below: every real (non-demo) session always
  // hits the real model at /api/ai/assistant, never the mock data path.
  // Real AI is included for every edition now - what keeps it safe is
  // the server-side usage cap (usageCapService.ts), not an edition gate.

  return (
    <>
      <div
        className="fixed z-[105] touch-none cursor-grab active:cursor-grabbing"
        style={position ? { left: position.x, top: position.y } : { right: 24, bottom: 24 }}
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={cancelDrag}
      >
        {proactiveTip && !open ? (
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => {
              setPendingPrompt(`Help me act on this suggestion: ${proactiveTip}`);
              setProactiveTip(null);
              setOpen(true);
            }}
            className="ai-tip-bubble absolute bottom-[82%] right-[78%] w-56 rounded-2xl border border-accent/20 bg-surface px-4 py-3 text-left text-sm font-medium leading-snug text-foreground shadow-xl"
          >
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-accent">Quick tip</span>
            {proactiveTip}
          </button>
        ) : null}
        {!open ? (
          <span
            aria-hidden
            className="ai-orb-glow pointer-events-none absolute rounded-full"
            style={{ inset: -Math.round(buttonSize * 0.11) }}
          />
        ) : null}
        <button
          type="button"
          aria-label={open ? "Close AI assistant" : "Open AI assistant"}
          className="relative flex items-center justify-center overflow-visible bg-transparent text-accent transition-transform hover:scale-105 active:scale-95"
          style={{ width: buttonSize, height: buttonSize }}
        >
          <span className={cn("relative block", open ? "ai-companion-listening" : "ai-companion-float")} style={{ width: Math.round(buttonSize * 1.55), height: Math.round(buttonSize * 1.55) }}>
            <Image
              src="/branding/ai-companion.png"
              alt=""
              fill
              sizes={`${Math.round(buttonSize * 1.55)}px`}
              className="pointer-events-none select-none object-contain drop-shadow-[0_12px_16px_rgba(0,0,0,0.35)]"
              priority
            />
            <Image
              src="/branding/ai-companion-wink.png"
              alt=""
              fill
              sizes={`${Math.round(buttonSize * 1.55)}px`}
              className="ai-companion-wink-frame pointer-events-none select-none object-contain drop-shadow-[0_12px_16px_rgba(0,0,0,0.35)]"
              priority
            />
          </span>
        </button>
      </div>
      {open ? (
        <AssistantPanel
          onClose={() => setOpen(false)}
          initialPrompt={pendingPrompt}
          onConsumeInitialPrompt={() => setPendingPrompt(null)}
        />
      ) : null}
    </>
  );
}

function AssistantPanel({
  onClose,
  initialPrompt,
  onConsumeInitialPrompt,
}: {
  onClose: () => void;
  initialPrompt?: string | null;
  onConsumeInitialPrompt?: () => void;
}) {
  const { profile, isDemo, editionKey } = useIndustry();
  const pathname = usePathname();
  const isExecutive = isDemo && pathname === "/portfolio";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [usage, setUsage] = useState<{ used: number; total: number; isPaid: boolean } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Real sessions persist their conversation (api/ai/assistant/route.ts) -
  // load it once when the panel opens so a reload never loses it. Demo
  // never has a real thread to load.
  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    fetch("/api/ai/assistant")
      .then((res) => (res.ok ? res.json() : { messages: [] }))
      .then((data: { messages?: { role: "user" | "assistant"; content: string }[]; usage?: { used: number; total: number; isPaid: boolean } }) => {
        if (cancelled) return;
        setMessages(
          (data.messages ?? []).map((m) => ({ id: `h_${nextId.current++}`, role: m.role, text: m.content }))
        );
        if (data.usage) setUsage(data.usage);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setHistoryLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isDemo]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!initialPrompt) return;
    ask(initialPrompt);
    onConsumeInitialPrompt?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    const userMsg: ChatMessage = { id: `u_${nextId.current++}`, role: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    if (isDemo) {
      window.setTimeout(() => {
        const answer = isExecutive
          ? answerExecutiveQuestion(
              trimmed,
              DEMO_BUSINESSES.map(
                (business): ExecutiveBusiness => ({
                  name: getBusinessName(business),
                  dataset: getIndustryDataset(business.industryProfileKey),
                })
              )
            )
          : answerQuestion(trimmed, {
              dataset: getIndustryDataset(profile.key),
              attendance: generateAttendanceForEmployees(getIndustryDataset(profile.key).employees),
              vendors: DEMO_VENDORS,
              terms: profile.terms,
            });
        setMessages((m) => [...m, { id: `a_${nextId.current++}`, role: "assistant", text: answer }]);
        setLoading(false);
      }, 650);
      return;
    }

    // Real session: hit the real model. The server already has this
    // user's prior conversation persisted - only the newest message goes
    // over the wire, not the whole thread every time.
    fetch("/api/ai/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Something went wrong.");
        if (data.usage) setUsage(data.usage);
        return data.text as string;
      })
      .then((text) => {
        setMessages((m) => [...m, { id: `a_${nextId.current++}`, role: "assistant", text: text || "I didn't get a response — try again." }]);
      })
      .catch((err: Error) => {
        setMessages((m) => [...m, { id: `a_${nextId.current++}`, role: "assistant", text: err.message }]);
      })
      .finally(() => setLoading(false));
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[110] flex justify-center lg:inset-x-auto lg:bottom-24 lg:right-6 lg:justify-end">
      <div className="flex h-[80vh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-[var(--shadow)] lg:h-[560px] lg:w-[400px] lg:min-h-[360px] lg:min-w-[320px] lg:max-h-[80vh] lg:max-w-[80vw] lg:resize lg:rounded-2xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-line px-4 py-3.5">
          <div>
            <p className="text-[14px] font-bold text-ink-1">3Stone AI</p>
            <p className="text-[12px] text-ink-3">
              {!isDemo
                ? realSessionHint(editionKey)
                : isExecutive
                  ? "Ask anything across all your businesses"
                  : `Ask anything about ${getIndustryDataset(profile.key).orgName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] text-ink-2 hover:bg-surface-raised"
          >
            <X size={17} />
          </button>
        </div>

        {!isDemo && usage ? (
          <div className="flex flex-shrink-0 items-center gap-2 border-b border-line px-4 py-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-raised">
              <div
                className={cn("h-full rounded-full", usage.used >= usage.total ? "bg-critical" : "bg-accent")}
                style={{ width: `${Math.min(100, (usage.used / usage.total) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-ink-3">
              {usage.used}/{usage.total} {usage.isPaid ? "actions this cycle" : "free trial actions"}
            </span>
          </div>
        ) : null}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {!isDemo && !historyLoaded ? (
            <p className="text-[13px] text-ink-3">Loading your conversation…</p>
          ) : messages.length === 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] leading-relaxed text-ink-2">
                {!isDemo
                  ? "Ask me to help outline something, plan out work, or improve something you've written. Try one:"
                  : isExecutive
                    ? "I can answer questions across every business you run. Try one:"
                    : editionKey === "student"
                      ? "I can answer questions about your assignments and group work. Try one:"
                      : editionKey === "workspace"
                        ? "I can answer questions across your projects and team. Try one:"
                        : "I can answer questions across every module — customers, projects, finance, your team, and more. Try one:"}
              </p>
              <div className="flex flex-col gap-1.5">
                {(!isDemo ? realSessionSuggestions(editionKey) : isExecutive ? EXECUTIVE_SUGGESTIONS : demoSuggestions(editionKey)).map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="rounded-[10px] border border-line bg-bg px-3 py-2 text-left text-[13px] text-ink-2 transition-colors hover:bg-surface-raised hover:text-ink-1"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-[12px] px-3.5 py-2.5 text-[13.5px] leading-relaxed",
                    m.role === "user"
                      ? "ml-auto bg-accent text-on-accent"
                      : "mr-auto border border-line bg-bg text-ink-2"
                  )}
                >
                  {m.text}
                </div>
              ))}
              {loading ? (
                <div className="mr-auto flex items-center gap-1.5 rounded-[12px] border border-line bg-bg px-3.5 py-2.5">
                  <Sparkles size={13} className="animate-pulse text-accent" />
                  <span className="text-[12.5px] text-ink-3">Thinking…</span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex flex-shrink-0 items-center gap-2 border-t border-line p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={!isDemo ? "Ask anything…" : editionKey === "student" ? "Ask about your coursework…" : "Ask about your business…"}
            className="flex-1 rounded-[10px] border border-line bg-bg px-3 py-2 text-[13.5px] text-ink-1 outline-none placeholder:text-ink-3 focus:border-line-strong"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-accent text-on-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowUp size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
