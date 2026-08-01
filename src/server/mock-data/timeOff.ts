import type { TimeOffRequest } from "@/types";

// Seed data for Time Off (Workspace edition only - see
// src/lib/editionModules.ts). Reuses the same Harper & Voss Consulting
// team as the rest of the Workspace demo (see people.ts's
// WORKSPACE_EMPLOYEES, jobs.ts's WORKSPACE_JOBS) - not the construction
// flagship's team/jobs.
export const WORKPLACE_TIME_OFF: TimeOffRequest[] = [
  {
    id: "pto_1",
    requesterName: "Alicia Ford",
    type: "vacation",
    startDate: "2026-08-10",
    endDate: "2026-08-14",
    status: "pending",
    notes: "Family trip - booked before requesting, flexible on exact dates if needed.",
  },
  {
    id: "pto_2",
    requesterName: "Devon Carter",
    type: "sick",
    startDate: "2026-08-02",
    endDate: "2026-08-02",
    status: "approved",
    notes: "",
  },
  {
    id: "pto_3",
    requesterName: "Ryan Ostrowski",
    type: "personal",
    startDate: "2026-08-06",
    endDate: "2026-08-06",
    status: "pending",
    notes: "Appointment that can't be moved.",
  },
  {
    id: "pto_4",
    requesterName: "Priya Nair",
    type: "vacation",
    startDate: "2026-07-28",
    endDate: "2026-07-30",
    status: "denied",
    notes: "Conflicts with the Atlas Website Redesign deadline - resubmit for a later week.",
  },
];
