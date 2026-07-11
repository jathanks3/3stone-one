"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIndustry } from "@/lib/industry";
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
  "Summarize today's operations",
  "Who still owes deposits?",
  "How much profit did we make this month?",
  "Which projects are at risk?",
];

const EXECUTIVE_SUGGESTIONS = [
  "Which business needs attention?",
  "Compare businesses",
  "How much did I make across everything this month?",
];

export function AiAssistant() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        data-tour="ai-assistant"
        aria-expanded={open}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className={cn(
          "fixed bottom-5 left-1/2 z-[105] flex h-13 w-13 -translate-x-1/2 items-center justify-center rounded-full bg-accent text-on-accent shadow-[var(--shadow)] transition-transform hover:scale-105 active:scale-95",
          "lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0",
          "h-13 w-13"
        )}
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>
      {open ? <AssistantPanel onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function AssistantPanel({ onClose }: { onClose: () => void }) {
  const { profile } = useIndustry();
  const pathname = usePathname();
  const isExecutive = pathname === "/portfolio";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    const userMsg: ChatMessage = { id: `u_${nextId.current++}`, role: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

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
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[110] flex justify-center lg:inset-x-auto lg:bottom-24 lg:right-6 lg:justify-end">
      <div className="flex h-[80vh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-[var(--shadow)] lg:h-[560px] lg:w-[400px] lg:rounded-2xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-line px-4 py-3.5">
          <div>
            <p className="text-[14px] font-bold text-ink-1">3Stone AI</p>
            <p className="text-[12px] text-ink-3">
              {isExecutive ? "Ask anything across all your businesses" : `Ask anything about ${getIndustryDataset(profile.key).orgName}`}
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

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] leading-relaxed text-ink-2">
                I can answer questions across every module — customers, projects, finance, your team, and more.
                Try one:
              </p>
              <div className="flex flex-col gap-1.5">
                {(isExecutive ? EXECUTIVE_SUGGESTIONS : SUGGESTIONS).map((s) => (
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
                    "max-w-[85%] rounded-[12px] px-3.5 py-2.5 text-[13.5px] leading-relaxed",
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
            placeholder="Ask about your business…"
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
