import { getAllowedModuleKeys } from "@/lib/editionModules";
import { listAllCalendarEvents } from "@/server/services/calendarService";
import { listProjects } from "@/server/services/projectService";

// The Dashboard's "daily debrief": a real, data-driven readiness score plus
// either what needs attention right now, or - when nothing does - real
// upcoming work worth prepping for. There's no notification/push
// infrastructure in this app (see docs), so this deliberately isn't "an
// email at 8am/1pm/6pm" - it's whatever's true right now, computed fresh
// every time the Dashboard loads. Morning/afternoon/evening framing is a
// client-side concern (the viewer's own local time of day), not something
// this service knows or needs to - see DailyDebriefCard.tsx.

export type DebriefStatus = "on_track" | "needs_attention" | "behind";

export interface DailyDebrief {
  score: number;
  status: DebriefStatus;
  attentionItems: string[];
  suggestions: string[];
}

export type HealthTone = "good" | "warning" | "critical";

export interface HealthMeta {
  tone: HealthTone;
  label: string;
  explanation: string;
}

// Same score bands and copy as the demo's getBusinessHealthScoreForDataset
// (src/server/mock-data/index.ts) - this is what keeps the real Dashboard's
// health ring reading identically to the demo's, just driven by the real
// score above instead of a mock dataset's overdue-jobs/invoices math.
export function describeHealth(score: number): HealthMeta {
  if (score >= 85) return { tone: "good", label: "Strong", explanation: "Steady progress, with nothing urgent slipping through the cracks." };
  if (score >= 65) return { tone: "warning", label: "Fair", explanation: "A few things need attention before they become bigger problems." };
  return { tone: "critical", label: "Needs attention", explanation: "Overdue items are piling up and need attention soon." };
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function getDailyDebrief(workspaceId: string, editionKey: string): Promise<DailyDebrief> {
  const modules = getAllowedModuleKeys(editionKey);
  const allowed = (key: string) => modules === null || modules.has(key);
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);

  const [events, projects] = await Promise.all([
    allowed("calendar") ? listAllCalendarEvents(workspaceId) : Promise.resolve([]),
    allowed("projects") ? listProjects(workspaceId) : Promise.resolve([]),
  ]);

  const overdueTasks = projects.flatMap((p) =>
    p.tasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate.getTime() < now.getTime())
  );
  const overdueProjects = projects.filter((p) => p.statusKey !== "done" && p.dueDate && p.dueDate.getTime() < now.getTime());

  const attentionItems = [
    ...overdueProjects.slice(0, 3).map((p) => `${p.name} was due ${fmtShort(p.dueDate as Date)}`),
    ...overdueTasks.slice(0, 5 - Math.min(3, overdueProjects.length)).map((t) => `${t.title} was due ${fmtShort(t.dueDate as Date)}`),
  ];

  const score = Math.max(0, 100 - Math.min(60, overdueTasks.length * 12) - Math.min(30, overdueProjects.length * 15));
  const status: DebriefStatus = score >= 85 ? "on_track" : score >= 60 ? "needs_attention" : "behind";

  let suggestions: string[] = [];
  if (attentionItems.length === 0) {
    const upcomingProjects = projects
      .filter((p) => p.statusKey !== "done" && p.dueDate && p.dueDate.getTime() >= now.getTime())
      .sort((a, b) => (a.dueDate as Date).getTime() - (b.dueDate as Date).getTime())
      .slice(0, 3)
      .map((p) => `Start prepping for "${p.name}" — due ${fmtShort(p.dueDate as Date)}`);

    const laterToday = events
      .filter((e) => e.date === todayIso && !e.allDay)
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 2)
      .map((e) => `"${e.title}" later today at ${e.time}`);

    suggestions = [...upcomingProjects, ...laterToday].slice(0, 4);
  }

  return { score, status, attentionItems, suggestions };
}
