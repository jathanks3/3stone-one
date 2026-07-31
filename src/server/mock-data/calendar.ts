import type { CalendarEvent } from "@/types";

// Seed data for the Calendar module (Workspace/Student editions - see
// src/lib/editionModules.ts). Two sets so the demo actually feels like
// each edition's own calendar, not the same list with a new icon.
export const DEMO_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: "cal_1", title: "Client kickoff call — Downtown Lofts", date: "2026-08-03", time: "10:00 AM" },
  { id: "cal_2", title: "Team weekly sync", date: "2026-08-04", time: "9:00 AM" },
  { id: "cal_3", title: "Site walkthrough — Fifth Avenue Retail", date: "2026-08-05", time: "1:30 PM" },
  { id: "cal_4", title: "Q3 budget review", date: "2026-08-07", time: "3:00 PM" },
  { id: "cal_5", title: "Proposal deadline — Cedar Hills", date: "2026-08-10", time: "5:00 PM" },
];

export const STUDENT_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: "scal_1", title: "Statistics Midterm", date: "2026-08-03", time: "9:00 AM" },
  { id: "scal_2", title: "Study group — Chapter 7", date: "2026-08-04", time: "4:00 PM" },
  { id: "scal_3", title: "Capstone Proposal due", date: "2026-08-06", time: "11:59 PM" },
  { id: "scal_4", title: "Office hours — Prof. Reyes", date: "2026-08-07", time: "2:00 PM" },
  { id: "scal_5", title: "Marketing 401 group meeting", date: "2026-08-10", time: "6:00 PM" },
];
