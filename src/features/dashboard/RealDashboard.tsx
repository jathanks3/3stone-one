import { AlertTriangle, Sparkles } from "lucide-react";
import { Card } from "@/ui/Card";
import { HealthMeter } from "@/ui/HealthMeter";
import { KpiTile } from "@/ui/KpiTile";
import { getAllowedModuleKeys } from "@/lib/editionModules";
import { humanizeAction, relativeTime } from "@/lib/utils";
import { describeHealth } from "@/server/services/debriefService";
import type { RealDashboardData } from "@/server/services/dashboardService";

// Same per-edition copy as the demo's greetingSubtitle (see
// src/server/mock-data/industries/student.ts / workplace.ts) - this is
// what a real Student/Workspace session should read at the very top,
// instead of the generic "your workspace" line that only really fits
// Business. Business keeps the generic line: there's no one static
// sentence that fits every industry the way there is for
// Student/Workspace, and the demo itself only picks a fixed sentence
// once a specific industry is chosen.
const EDITION_GREETING_SUBTITLE: Record<string, string> = {
  student: "Here's what's due across your assignments and group work today.",
  workspace: "Here's what your team is working on today.",
};

// A genuine Server Component, not "use client" — nothing here is
// interactive, and it's already fed server-resolved data, so there's no
// reason to ship it as client JS. This is what a truthful empty state
// looks like (docs/15-company-platform-vision.md, the founder's
// production charter): every number is real, most of them are
// legitimately zero for a workspace that's just been created, and
// nothing here is dressed up to look otherwise.
//
// Layout mirrors the demo Dashboard's top section (DashboardClient.tsx:
// greeting → morning briefing + health ring → "what needs my attention" /
// "what changed today") so a real session sees the same shape it was
// shown in the demo, just backed by its own workspace's real numbers
// instead of mock data. Deliberately does NOT also render
// DailyDebriefCard below this - that card duplicates the same
// score/status/attention-items this page already leads with, which read
// as two dashboards stacked instead of one.
export function RealDashboard({ data }: { data: RealDashboardData }) {
  const hasAnyActivity =
    data.openProjectCount > 0 || data.unpaidInvoiceCount > 0 || data.recentActivity.length > 0;

  // Real bug: every edition saw "Team members" and "Unpaid invoices"
  // regardless of whether People or Finance are even part of that
  // edition (Student has neither; Workspace has no Finance - see
  // editionModules.ts). Only show a KPI card for a concept that
  // edition's module list actually includes.
  const allowedModules = getAllowedModuleKeys(data.editionKey);
  const showTeamMembers = !allowedModules || allowedModules.has("people");
  const showInvoices = !allowedModules || allowedModules.has("finance");

  const health = describeHealth(data.debrief.score);
  const firstName = data.userName.split(" ")[0];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-[22px] font-bold text-ink-1">Good morning, {firstName}</h1>
        <p className="text-[14px] text-ink-2">
          {hasAnyActivity
            ? EDITION_GREETING_SUBTITLE[data.editionKey] ?? "Here's what's happening in your workspace."
            : `Your workspace is ready. Nothing here yet — ${showTeamMembers ? "invite your team, or " : ""}add your first project${showInvoices ? " or invoice" : ""} to get started.`}
        </p>
      </div>

      <div className="rounded-2xl border border-accent-wash-strong bg-accent-wash p-5 sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles size={16} strokeWidth={2.25} />
              <p className="text-[12px] font-semibold uppercase tracking-wide">Your morning briefing</p>
            </div>
            <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-ink-1">{data.briefingSummary}</p>
            <a
              href="#attention"
              className="mt-4 inline-block rounded-[9px] border border-accent-wash-strong bg-surface px-3.5 py-2 text-[13px] font-semibold text-accent hover:bg-accent-wash-strong"
            >
              See what needs attention
            </a>
          </div>

          <div className="flex flex-shrink-0 items-center gap-4 border-t border-accent-wash-strong pt-5 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
            <HealthMeter score={data.debrief.score} label={health.label} tone={health.tone} />
            <div className="max-w-[168px]">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">Overall health</p>
              <p className="mt-1 text-[13px] leading-snug text-ink-2">{health.explanation}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card id="attention" className="scroll-mt-6 p-5">
          <h2 className="text-[13px] font-semibold text-ink-2">What needs my attention</h2>
          {data.debrief.attentionItems.length > 0 ? (
            <ul className="mt-3.5 flex flex-col gap-3.5">
              {data.debrief.attentionItems.map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <AlertTriangle size={16} className="flex-shrink-0 text-critical" />
                  <span className="text-[14px] text-ink-1">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3.5 text-[14px] text-ink-3">Nothing needs your attention right now.</p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-[13px] font-semibold text-ink-2">What changed today</h2>
          {data.recentActivity.length > 0 ? (
            <ul className="mt-3.5 flex flex-col gap-3.5">
              {data.recentActivity.map((entry, i) => (
                <li key={i} className="flex items-start justify-between gap-3">
                  <span className="text-[14px] text-ink-1">{humanizeAction(entry.action)}</span>
                  <span className="flex-shrink-0 whitespace-nowrap text-[12px] text-ink-3">{relativeTime(entry.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3.5 text-[14px] text-ink-3">Nothing has changed yet.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {showTeamMembers ? (
          <KpiTile label="Team members" value={String(data.memberCount)} />
        ) : null}
        <KpiTile
          label="Open projects"
          value={String(data.openProjectCount)}
          deltaLabel={data.overdueProjectCount > 0 ? `${data.overdueProjectCount} overdue` : "On track"}
          tone={data.overdueProjectCount > 0 ? "negative" : "positive"}
        />
        {showInvoices ? (
          <KpiTile
            label="Unpaid invoices"
            value={String(data.unpaidInvoiceCount)}
            deltaLabel={data.unpaidInvoiceCount > 0 ? "Needs follow-up" : "All current"}
            tone={data.unpaidInvoiceCount > 0 ? "negative" : "positive"}
          />
        ) : null}
      </div>
    </div>
  );
}
