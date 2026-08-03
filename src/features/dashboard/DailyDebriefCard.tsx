"use client";

import { useEffect, useState } from "react";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { cn } from "@/lib/utils";
import { askAssistant } from "@/lib/assistantBus";
import type { DailyDebrief, DebriefStatus } from "@/server/services/debriefService";

type Period = "morning" | "afternoon" | "evening";

function currentPeriod(hour: number): Period {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  return "evening";
}

const PERIOD_LABEL: Record<Period, string> = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" };

const STATUS_COPY: Record<DebriefStatus, { label: string; tone: "good" | "warning" | "critical" }> = {
  on_track: { label: "On track", tone: "good" },
  needs_attention: { label: "Needs attention", tone: "warning" },
  behind: { label: "Falling behind", tone: "critical" },
};

export function DailyDebriefCard({ debrief, isStudent }: { debrief: DailyDebrief; isStudent: boolean }) {
  // Computed on the client deliberately - this is about the viewer's own
  // local time of day, not the server's. Falls back to "morning" during
  // server render/hydration (see the mounted guard) so there's no flash
  // of a wrong period.
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<Period>("morning");
  useEffect(() => {
    setPeriod(currentPeriod(new Date().getHours()));
    setMounted(true);
  }, []);

  const statusCopy = STATUS_COPY[debrief.status];
  const noAttentionNeeded = debrief.attentionItems.length === 0;
  const prepWord = isStudent ? "study" : "prep";

  function askForHelp(item: string) {
    askAssistant(isStudent ? `Help me study for this: ${item}` : `Help me prep for this: ${item}`);
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-ink-1">Daily debrief</h2>
        <div className="flex items-center gap-1.5">
          {(["morning", "afternoon", "evening"] as Period[]).map((p) => (
            <span
              key={p}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                mounted && p === period ? "bg-accent text-on-accent" : "bg-surface-raised text-ink-3"
              )}
            >
              {PERIOD_LABEL[p]}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-[28px] font-bold text-ink-1">{debrief.score}</span>
        <Badge tone={statusCopy.tone}>{statusCopy.label}</Badge>
      </div>

      {!noAttentionNeeded ? (
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">Needs your attention</p>
          <ul className="flex flex-col gap-1.5">
            {debrief.attentionItems.map((item) => (
              <li key={item} className="text-[13px] text-ink-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : debrief.suggestions.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-3">
            Nothing urgent - here&apos;s what to {prepWord} for next
          </p>
          <ul className="flex flex-col gap-2">
            {debrief.suggestions.map((item) => (
              <li key={item} className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-line bg-bg px-3 py-2">
                <span className="text-[13px] text-ink-2">{item}</span>
                <Button variant="secondary" onClick={() => askForHelp(item)}>
                  Need help with this?
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-[13px] text-ink-3">Nothing needs attention, and nothing&apos;s coming up soon either. Enjoy the break.</p>
      )}
    </Card>
  );
}
