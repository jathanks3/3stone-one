import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";
import type { LetterGrade as PrismaLetterGrade } from "../../../generated/prisma/client";

// The demo's LetterGrade type (src/types/index.ts) uses the literal
// display strings ("A+", "B-", ...) - Postgres enum identifiers can't
// contain "+"/"-", so the real GpaCourse.grade column uses word forms
// instead. This is the one translation point between the two; every
// other real module's enums (TaskStatus, ApplicationStatus, ...)
// happened to already match their demo string unions exactly.
export type DisplayLetterGrade = "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D+" | "D" | "D-" | "F";

const TO_PRISMA_GRADE: Record<DisplayLetterGrade, PrismaLetterGrade> = {
  "A+": "a_plus", A: "a", "A-": "a_minus",
  "B+": "b_plus", B: "b", "B-": "b_minus",
  "C+": "c_plus", C: "c", "C-": "c_minus",
  "D+": "d_plus", D: "d", "D-": "d_minus",
  F: "f",
};
const FROM_PRISMA_GRADE: Record<PrismaLetterGrade, DisplayLetterGrade> = {
  a_plus: "A+", a: "A", a_minus: "A-",
  b_plus: "B+", b: "B", b_minus: "B-",
  c_plus: "C+", c: "C", c_minus: "C-",
  d_plus: "D+", d: "D", d_minus: "D-",
  f: "F",
};

export interface GpaCourseRow {
  id: string;
  name: string;
  credits: number;
  grade: DisplayLetterGrade;
}

export async function listGpaCourses(workspaceId: string, studentId: string): Promise<GpaCourseRow[]> {
  const courses = await db.gpaCourse.findMany({ where: { workspaceId, studentId }, orderBy: { createdAt: "asc" } });
  return courses.map((c) => ({ id: c.id, name: c.name, credits: c.credits, grade: FROM_PRISMA_GRADE[c.grade] }));
}

export async function createGpaCourse(workspaceId: string, studentId: string, name: string, credits: number, grade: DisplayLetterGrade): Promise<GpaCourseRow> {
  const course = await db.gpaCourse.create({
    data: { workspaceId, studentId, name: name.trim() || "Untitled course", credits: Number.isFinite(credits) ? credits : 0, grade: TO_PRISMA_GRADE[grade] },
  });
  await logActivity(workspaceId, studentId, "added_gpa_course", "GpaCourse", course.id, { name: course.name });
  return { id: course.id, name: course.name, credits: course.credits, grade };
}

export async function updateGpaCourse(
  workspaceId: string,
  studentId: string,
  courseId: string,
  patch: { name?: string; credits?: number; grade?: DisplayLetterGrade }
): Promise<void> {
  const existing = await db.gpaCourse.findFirst({ where: { id: courseId, workspaceId, studentId } });
  if (!existing) throw new Error("Course not found.");
  await db.gpaCourse.update({
    where: { id: courseId },
    data: {
      ...(patch.name !== undefined ? { name: patch.name.trim() || "Untitled course" } : {}),
      ...(patch.credits !== undefined ? { credits: Number.isFinite(patch.credits) ? patch.credits : 0 } : {}),
      ...(patch.grade !== undefined ? { grade: TO_PRISMA_GRADE[patch.grade] } : {}),
    },
  });
}

export async function deleteGpaCourse(workspaceId: string, studentId: string, courseId: string): Promise<void> {
  const existing = await db.gpaCourse.findFirst({ where: { id: courseId, workspaceId, studentId } });
  if (!existing) throw new Error("Course not found.");
  await db.gpaCourse.delete({ where: { id: courseId } });
  await logActivity(workspaceId, studentId, "removed_gpa_course", "GpaCourse", courseId, { name: existing.name });
}
