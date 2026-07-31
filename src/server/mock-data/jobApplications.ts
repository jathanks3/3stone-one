import type { JobApplication } from "@/types";

// Seed data for the Internship & Job Tracker (Student edition only -
// see src/lib/editionModules.ts). Ties into the same demo narrative as
// Calendar/Notes/GPA (Jordan Blake's semester).
export const STUDENT_JOB_APPLICATIONS: JobApplication[] = [
  {
    id: "app_1",
    company: "Riverside Analytics",
    role: "Data Analyst Intern",
    status: "interviewing",
    appliedDate: "2026-07-10",
    notes: "Second-round interview scheduled for Aug 5.",
  },
  {
    id: "app_2",
    company: "Bright Path Consulting",
    role: "Summer Associate",
    status: "applied",
    appliedDate: "2026-07-15",
    notes: "Referred by Professor Reyes.",
  },
  {
    id: "app_3",
    company: "Northgate Ventures",
    role: "Marketing Intern",
    status: "offer",
    appliedDate: "2026-06-20",
    notes: "Offer received - decide by Aug 15.",
  },
  {
    id: "app_4",
    company: "Cedar & Co.",
    role: "Research Assistant",
    status: "saved",
    appliedDate: null,
    notes: "Application opens Aug 1.",
  },
  {
    id: "app_5",
    company: "Union Grove Nonprofit",
    role: "Program Intern",
    status: "rejected",
    appliedDate: "2026-06-01",
    notes: "Position filled internally.",
  },
];
