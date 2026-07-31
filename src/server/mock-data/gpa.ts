import type { GpaCourse } from "@/types";

// Seed data for the GPA Calculator (Student edition only - see
// src/lib/editionModules.ts). Same courses referenced elsewhere in the
// Student demo (Statistics, Marketing 401, Capstone) so the demo reads
// as one coherent semester, not disconnected sample data per module.
export const STUDENT_GPA_COURSES: GpaCourse[] = [
  { id: "gpa_1", name: "Statistics 301", credits: 4, grade: "A-" },
  { id: "gpa_2", name: "Marketing 401", credits: 3, grade: "B+" },
  { id: "gpa_3", name: "Capstone Seminar", credits: 3, grade: "A" },
  { id: "gpa_4", name: "Microeconomics", credits: 3, grade: "B" },
];
