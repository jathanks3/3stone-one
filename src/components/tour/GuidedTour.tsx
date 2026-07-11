"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type TourStep = { title: string; body: string; route?: string; target?: string; action?: "switcher" | "assistant" };

const STEPS: TourStep[] = [
  { title: "Executive Overview", body: "Start with every business in one view—revenue movement, overdue work, and where your attention will have the most impact.", route: "/portfolio", target: "main h1" },
  { title: "Business Health", body: "Health signals are computed from the underlying work and finance records, so the overview stays connected to what is actually happening.", route: "/portfolio", target: "main" },
  { title: "One login, every business", body: "Open My Businesses to move from the portfolio view into a specific company. Every module and the AI update together.", target: "[data-tour='business-switcher']", action: "switcher" },
  { title: "Switch the entire operating context", body: "Choose any company—event venue, restaurant, security, construction, beauty, or retail—to see its own KPIs, customers, team, workflow, and finances.", target: "[data-tour='business-switcher-menu']" },
  { title: "One business-aware AI", body: "The assistant answers from the selected company’s demo records—not generic filler. Ask what needs attention, who has not clocked in, or what is hurting profit.", route: "/dashboard", target: "[data-tour='ai-assistant']", action: "assistant" },
  { title: "Customer management", body: "CRM adapts to the active business while keeping one consistent workflow for leads, customers, and follow-up.", route: "/crm", target: "main h1" },
  { title: "Financial decision clarity", body: "See revenue, outstanding invoices or deposits, costs, and approvals without turning 3Stone One into an accounting ledger.", route: "/finance", target: "main h1" },
  { title: "Work and documents stay connected", body: "Track the jobs, events, appointments, treatments, or orders that create the financial picture—and keep their files close by.", route: "/projects", target: "main h1" },
  { title: "Back to what matters", body: "Return to the Executive Overview whenever you need the owner-level picture across every business.", route: "/portfolio", target: "main h1" },
  { title: "Built around the owner", body: "One Login. One Platform. One AI.\n\n3Stone One — Built Around the Owner." },
];

export function GuidedTour({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const titleId = useId();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const item = STEPS[step];
    if (item.route) router.push(item.route);
    const timer = window.setTimeout(() => {
      const target = item.target ? document.querySelector<HTMLElement>(item.target) : null;
      target?.classList.add("guided-tour-target");
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (item.action === "switcher" && target?.getAttribute("aria-expanded") !== "true") target?.click();
      if (item.action === "assistant" && target?.getAttribute("aria-expanded") !== "true") target?.click();
    }, item.route ? 500 : 80);
    return () => {
      window.clearTimeout(timer);
      document.querySelectorAll(".guided-tour-target").forEach((node) => node.classList.remove("guided-tour-target"));
    };
  }, [router, step]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setStep((current) => Math.min(STEPS.length - 1, current + 1));
      if (event.key === "ArrowLeft") setStep((current) => Math.max(0, current - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, step]);

  const item = STEPS[step];
  const last = step === STEPS.length - 1;
  return (
    <section role="dialog" aria-modal="false" aria-labelledby={titleId} className="fixed inset-x-3 bottom-20 z-[140] mx-auto max-w-md rounded-2xl border border-line-strong bg-surface p-4 shadow-[var(--shadow)] lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Guided tour · {step + 1} of {STEPS.length}</p>
          <h2 id={titleId} className="mt-1 text-[17px] font-bold text-ink-1">{item.title}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close guided tour" className="flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-2 hover:bg-surface-raised"><X size={17} /></button>
      </div>
      <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-2">{item.body}</p>
      <div className="mt-4 flex items-center justify-between">
        <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0} className="flex min-h-10 items-center gap-1 rounded-[10px] px-3 text-[13px] font-medium text-ink-2 hover:bg-surface-raised disabled:opacity-30"><ChevronLeft size={16} /> Back</button>
        <button type="button" onClick={() => last ? onClose() : setStep((value) => Math.min(STEPS.length - 1, value + 1))} className="flex min-h-10 items-center gap-1 rounded-[10px] bg-accent px-4 text-[13px] font-semibold text-on-accent">{last ? "Finish" : "Next"}{last ? null : <ChevronRight size={16} />}</button>
      </div>
    </section>
  );
}
