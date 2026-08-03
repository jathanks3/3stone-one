"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
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
const ICON_SIZE: Record<"large" | "compact", number> = { large: 34, compact: 22 };
const FACE_SIZE: Record<"large" | "compact", number> = { large: 42, compact: 27 };

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const { isDemo } = useIndustry();
  const { assistantSize } = useAssistantSize();
  const buttonSize = BUTTON_SIZE[assistantSize];
  const iconSize = ICON_SIZE[assistantSize];
  const faceSize = FACE_SIZE[assistantSize];

  // Lets a page (e.g. the Dashboard's daily debrief card) open this panel
  // with a question already queued up, instead of the user having to
  // retype what they just read on the page.
  useEffect(() => {
    return onAskAssistant(({ prompt }) => {
      setPendingPrompt(prompt);
      setOpen(true);
    });
  }, []);

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
        className={cn(
          "fixed bottom-5 left-1/2 z-[105] -translate-x-1/2",
          "lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0"
        )}
      >
        {/* A friendly little monster, not a robot or a generic icon -
            permanent smile, periodic blink, and an occasional wink (see
            the ai-face and ai-bot keyframes in globals.css, unchanged by
            this redesign - only the SVG shapes wearing those animation
            classes changed) so it reads as alive and inviting rather than
            just another button. The halo keys off var(--accent), so it
            already matches whichever edition/accent color is live with no
            extra work here. Calmed down to a plain X while the panel is
            open since the "come chat with me" invitation has been
            accepted at that point. */}
        {/* A rounded-square "squircle," not a circle - matches the
            monster's own round-ish body shape below so the button reads
            as one consistent character silhouette rather than a generic
            round icon button. */}
        {!open ? (
          <span
            aria-hidden
            className="ai-orb-glow pointer-events-none absolute rounded-[30%]"
            style={{ inset: -Math.round(buttonSize * 0.11) }}
          />
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close AI assistant" : "Open AI assistant"}
          className="relative flex items-center justify-center rounded-[30%] bg-accent text-on-accent shadow-[var(--shadow)] transition-transform hover:scale-105 active:scale-95"
          style={{ width: buttonSize, height: buttonSize }}
        >
          {open ? (
            <X size={iconSize} />
          ) : (
            <svg width={faceSize} height={faceSize * 1.15} viewBox="0 0 32 37" fill="none" aria-hidden="true" className="ai-bot-bob">
              {/* Two small horns instead of a robot antenna */}
              <path d="M10 6.5 L7.5 1.5 L12 5.5 Z" fill="currentColor" />
              <path d="M22 6.5 L24.5 1.5 L20 5.5 Z" fill="currentColor" />
              {/* Body - a round-ish blob, not a rectangular robot chassis -
                  drawn before limbs so they attach cleanly to its edge */}
              <rect x="4" y="6" width="24" height="19" rx="10.5" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.08" />
              {/* Texture spots, a monster touch a plain robot wouldn't have */}
              <circle cx="8" cy="19.5" r="1" fill="currentColor" fillOpacity="0.35" />
              <circle cx="24.5" cy="10.5" r="1.2" fill="currentColor" fillOpacity="0.35" />
              {/* Arms - the right one waves at the same moment the right eye winks below */}
              <path className="ai-bot-arm-left" d="M6.5 16c-2.5 1-4 2.8-4.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path className="ai-bot-arm-right" d="M25.5 16c2.5 1 4 2.8 4.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              {/* Stubby legs/feet */}
              <line x1="11.5" y1="25" x2="11.5" y2="30.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="20.5" y1="25" x2="20.5" y2="30.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="8.5" y1="31.2" x2="14.5" y2="31.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="17.5" y1="31.2" x2="23.5" y2="31.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <ellipse className="ai-face-eye-left" cx="12" cy="14.7" rx="2.3" ry="2.8" fill="currentColor" />
              <ellipse className="ai-face-eye-right" cx="20" cy="14.7" rx="2.3" ry="2.8" fill="currentColor" />
              <path
                className="ai-face-mouth"
                d="M10.8 19.8c1.9 2.2 9.5 2.2 11.4 0"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
              {/* Two small fangs, hung off the same mouth line */}
              <path d="M13 20.6 L13.6 22.4 L14.2 20.6 Z" fill="currentColor" />
              <path d="M17.8 20.6 L18.4 22.4 L19 20.6 Z" fill="currentColor" />
            </svg>
          )}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="flex h-[80vh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-[var(--shadow)] lg:h-[560px] lg:w-[400px] lg:rounded-2xl">
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
