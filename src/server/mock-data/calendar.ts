import type { CalendarEvent } from "@/types";

// Seed data for the Calendar module (Workspace/Student editions - see
// src/lib/editionModules.ts). Two sets so the demo actually feels like
// each edition's own calendar, not the same list with a new icon.
//
// time is always 24h "HH:MM" (matches <input type="time">'s value, and
// what src/lib/ics.ts needs for .ics/Google Calendar export) - display
// formatting to 12h happens once, at render time, via formatTime12h in
// CalendarClient.tsx. Storing a pre-formatted "10:00 AM" string here
// would've meant a newly-added event (whose time always comes from the
// 24h time picker) displayed inconsistently from seed events - fixed by
// never storing a display string in the first place.
export const DEMO_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: "cal_1", title: "Client kickoff call — Downtown Lofts", date: "2026-08-03", time: "10:00" },
  { id: "cal_2", title: "Team weekly sync", date: "2026-08-04", time: "09:00" },
  { id: "cal_3", title: "Site walkthrough — Fifth Avenue Retail", date: "2026-08-05", time: "13:30" },
  { id: "cal_4", title: "Q3 budget review", date: "2026-08-07", time: "15:00" },
  { id: "cal_5", title: "Proposal deadline — Cedar Hills", date: "2026-08-10", time: "17:00" },
];

export const STUDENT_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: "scal_1", title: "Statistics Midterm", date: "2026-08-03", time: "09:00" },
  { id: "scal_2", title: "Study group — Chapter 7", date: "2026-08-04", time: "16:00" },
  { id: "scal_3", title: "Capstone Proposal due", date: "2026-08-06", time: "23:59" },
  { id: "scal_4", title: "Office hours — Prof. Reyes", date: "2026-08-07", time: "14:00" },
  { id: "scal_5", title: "Marketing 401 group meeting", date: "2026-08-10", time: "18:00" },
];

// Workspace edition's own calendar (Harper & Voss Consulting) - see
// jobs.ts's WORKSPACE_JOBS and organizations.ts's WORKSPACE_ORGANIZATIONS.
// Was previously falling back to DEMO_CALENDAR_EVENTS (construction
// client names) - this is its own content, not a relabeled reuse.
export const WORKSPACE_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: "wcal_1", title: "Client kickoff call — Northstar Retail Co.", date: "2026-08-03", time: "10:00" },
  { id: "wcal_2", title: "Team weekly sync", date: "2026-08-04", time: "09:00" },
  { id: "wcal_3", title: "Design review — Atlas Website Redesign", date: "2026-08-05", time: "13:30" },
  { id: "wcal_4", title: "Q3 engagement review", date: "2026-08-07", time: "15:00" },
  { id: "wcal_5", title: "Proposal deadline — Summit Market Research", date: "2026-08-10", time: "17:00" },
];
