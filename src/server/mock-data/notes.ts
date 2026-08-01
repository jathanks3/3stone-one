import type { Note } from "@/types";

// Seed data for the Notes module (Workspace/Student editions - see
// src/lib/editionModules.ts). Two sets so the demo actually feels like
// each edition's own notes, not the same list with a new icon.
export const DEMO_NOTES: Note[] = [
  {
    id: "note_1",
    title: "Downtown Lofts — kickoff prep",
    body: "Confirm scope with client before Monday's call. Send updated timeline and get sign-off on the material list.",
    updatedAt: "2 days ago",
    pinned: true,
  },
  {
    id: "note_2",
    title: "Vendor contacts",
    body: "Ace Supply — Mike (555-0142). Riverside Materials — Dana (555-0198). Both deliver within 2 business days.",
    updatedAt: "5 days ago",
  },
  {
    id: "note_3",
    title: "Q3 planning ideas",
    body: "Consider adding a second crew for the fall rush. Revisit pricing on custom builds before the next bid cycle.",
    updatedAt: "1 week ago",
  },
];

export const STUDENT_NOTES: Note[] = [
  {
    id: "snote_1",
    title: "Stats midterm — study list",
    body: "Chapters 4–7. Focus on hypothesis testing and regression. Review problem sets 3 and 4 before Wednesday.",
    updatedAt: "1 day ago",
    pinned: true,
  },
  {
    id: "snote_2",
    title: "Capstone proposal outline",
    body: "Intro, problem statement, methodology, timeline, expected outcomes. Due Aug 6 — send draft to the group by Friday.",
    updatedAt: "3 days ago",
  },
  {
    id: "snote_3",
    title: "Group project ideas",
    body: "Marketing 401 — social media campaign for a local business. Ask Riley about the bakery connection.",
    updatedAt: "5 days ago",
  },
];

// Workspace edition's own notes (Harper & Voss Consulting) - was
// previously falling back to DEMO_NOTES (construction vendor contacts) -
// this is its own content, not a relabeled reuse.
export const WORKSPACE_NOTES: Note[] = [
  {
    id: "wnote_1",
    title: "Northstar — kickoff prep",
    body: "Confirm scope with client before Monday's call. Send updated engagement plan and get sign-off on the timeline.",
    updatedAt: "2 days ago",
    pinned: true,
  },
  {
    id: "wnote_2",
    title: "Freelance contractor contacts",
    body: "Design contractor — Mia (555-0142). Copywriting — Dana (555-0198). Both turn around drafts within 3 business days.",
    updatedAt: "5 days ago",
  },
  {
    id: "wnote_3",
    title: "Q3 planning ideas",
    body: "Consider adding a second research analyst for the fall pipeline. Revisit pricing tiers before the next round of proposals.",
    updatedAt: "1 week ago",
  },
];
