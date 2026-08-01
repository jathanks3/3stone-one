import type { Meeting } from "@/types";

export const DEMO_MEETINGS: Meeting[] = [
  {
    id: "meet_1",
    title: "Riverside Kickoff Walkthrough",
    at: "2026-07-09 10:00 AM",
    attendees: ["Jane Dorsey", "Marcus Webb", "Sarah Chen (Riverside Properties)"],
    agenda: ["Site walkthrough", "Confirm crew access & gate codes", "Review timeline and milestones", "Q&A"],
    actionItems: [
      { id: "ai_1", title: "Share gate codes with crew", assigneeId: "emp_jane", done: false },
      { id: "ai_2", title: "Confirm dumpster delivery date", assigneeId: "emp_marcus", done: false },
    ],
    decisions: [],
    summary: null,
    status: "upcoming",
  },
  {
    id: "meet_2",
    title: "Weekly Field Ops Sync",
    at: "2026-07-10 8:00 AM",
    attendees: ["Jane Dorsey", "Marcus Webb", "Diego Ramirez", "Taylor Brooks", "Casey Nguyen"],
    agenda: ["Job status round-robin", "Overdue items — Smith Co., Downtown Lofts", "Materials and scheduling conflicts"],
    actionItems: [
      { id: "ai_3", title: "Escalate Smith Co. signage vendor delay", assigneeId: "emp_jane", done: false },
    ],
    decisions: [],
    summary: null,
    status: "upcoming",
  },
  {
    id: "meet_3",
    title: "Harbor View Design Review",
    at: "2026-06-30 2:00 PM",
    attendees: ["Priya Shah", "David Park (Harbor View LLC)"],
    agenda: ["Review floor plan revisions", "Confirm structural steel order", "Discuss budget contingency"],
    actionItems: [
      { id: "ai_4", title: "Send updated floor plan PDF", assigneeId: "emp_priya", done: true },
      { id: "ai_5", title: "Place structural steel order", assigneeId: "emp_priya", done: true },
    ],
    decisions: ["Approved a 5% contingency budget for structural changes", "Confirmed steel delivery for the week of the 28th"],
    summary:
      "David approved the revised floor plan and the added contingency budget. Steel order is confirmed for delivery the week of the 28th. No open concerns — David is pleased with progress.",
    status: "past",
  },
  {
    id: "meet_4",
    title: "Monthly Financial Review",
    at: "2026-06-28 9:00 AM",
    attendees: ["Jordan Ellis", "Morgan Lee"],
    agenda: ["Review Q2 revenue and profit", "Discuss outstanding invoices", "Budget check-in by department"],
    actionItems: [
      { id: "ai_6", title: "Follow up on Smith Co. overdue invoice", assigneeId: "emp_morgan", done: false },
    ],
    decisions: ["Approved Marcus Webb's $2,400 tools purchase request"],
    summary:
      "Revenue is up 12% quarter over quarter, driven by Riverside and Harbor View. One invoice (Smith Co., INV-1038) is overdue and needs follow-up. Construction department budget is on track at 78% utilized.",
    status: "past",
  },
  {
    id: "meet_5",
    title: "Bayview Construction Partners — Discovery Call",
    at: "2026-07-06 1:00 PM",
    attendees: ["Priya Shah", "Ben Carter (Bayview Construction Partners)"],
    agenda: ["Understand warehouse retrofit scope", "Discuss budget range and timeline"],
    actionItems: [
      { id: "ai_7", title: "Send rough estimate to Ben Carter", assigneeId: "emp_priya", done: false },
    ],
    decisions: [],
    summary:
      "Promising new opportunity — warehouse retrofit, budget range $80-90K, flexible timeline into Q4. Ben was engaged and asked good questions about our safety record.",
    status: "past",
  },
  {
    id: "meet_6",
    title: "Cedar Hills Final Design Walkthrough",
    at: "2026-07-12 3:00 PM",
    attendees: ["Priya Shah", "Rachel Whitfield (The Whitfield Family)"],
    agenda: ["Walk through final design", "Confirm material selections", "Review contract terms before signing"],
    actionItems: [],
    decisions: [],
    summary: null,
    status: "upcoming",
  },
];

// Workspace edition's own meetings (Harper & Voss Consulting) - see
// jobs.ts's WORKSPACE_JOBS and industries/workplace.ts.
export const WORKSPACE_MEETINGS: Meeting[] = [
  {
    id: "wmeet_1",
    title: "Northstar Kickoff",
    at: "2026-07-09 10:00 AM",
    attendees: ["Jordan Ellis", "Devon Carter", "Natalie Cho (Northstar Retail Co.)"],
    agenda: ["Introductions", "Confirm engagement scope and timeline", "Set up weekly check-in cadence", "Q&A"],
    actionItems: [
      { id: "wai_1", title: "Send engagement plan to Northstar", assigneeId: "wemp_jordan", done: false },
      { id: "wai_2", title: "Schedule weekly check-ins", assigneeId: "wemp_devon", done: false },
    ],
    decisions: [],
    summary: null,
    status: "upcoming",
  },
  {
    id: "wmeet_2",
    title: "Weekly Team Sync",
    at: "2026-07-10 9:00 AM",
    attendees: ["Jordan Ellis", "Alicia Ford", "Devon Carter", "Ryan Ostrowski"],
    agenda: ["Engagement status round-robin", "Overdue items — Atlas Website Redesign", "Staffing for Summit proposal"],
    actionItems: [
      { id: "wai_3", title: "Follow up on Atlas timeline slip", assigneeId: "wemp_jordan", done: false },
    ],
    decisions: [],
    summary: null,
    status: "upcoming",
  },
  {
    id: "wmeet_3",
    title: "Atlas Website Design Review",
    at: "2026-06-30 2:00 PM",
    attendees: ["Ryan Ostrowski", "Omar Hassan (Atlas Health Partners)"],
    agenda: ["Review homepage mockups", "Confirm patient portal requirements", "Discuss timeline recovery plan"],
    actionItems: [
      { id: "wai_4", title: "Send updated mockups", assigneeId: "wemp_ryan", done: true },
    ],
    decisions: ["Approved revised timeline with a two-week extension", "Confirmed portal requirements as scoped"],
    summary: "Omar approved the revised homepage direction and the two-week timeline extension. No open concerns.",
    status: "past",
  },
  {
    id: "wmeet_4",
    title: "Beacon Proposal Review",
    at: "2026-06-28 1:00 PM",
    attendees: ["Alicia Ford", "Stephanie Reed (Beacon Community Fund)"],
    agenda: ["Present ops review findings", "Discuss recommended process changes", "Next steps"],
    actionItems: [
      { id: "wai_5", title: "Send final proposal PDF", assigneeId: "wemp_alicia", done: false },
    ],
    decisions: [],
    summary: "Positive reception to the draft findings — Stephanie asked for the formal proposal by end of week.",
    status: "past",
  },
];
