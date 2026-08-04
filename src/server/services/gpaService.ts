import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";
import { listCanvasGrades } from "@/server/services/canvasIntegrationService";
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

export async function upsertTranscriptCourses(
  workspaceId: string,
  studentId: string,
  courses: Array<{ name: string; credits: number; grade: DisplayLetterGrade }>
): Promise<number> {
  let imported = 0;
  for (const course of courses.slice(0, 100)) {
    const name = course.name.trim();
    if (!name || !(course.grade in TO_PRISMA_GRADE) || !Number.isFinite(course.credits) || course.credits <= 0) continue;
    const existing = await db.gpaCourse.findFirst({ where: { workspaceId, studentId, name: { equals: name, mode: "insensitive" } } });
    if (existing) {
      await db.gpaCourse.update({ where: { id: existing.id }, data: { name, credits: course.credits, grade: TO_PRISMA_GRADE[course.grade] } });
    } else {
      await db.gpaCourse.create({ data: { workspaceId, studentId, name, credits: course.credits, grade: TO_PRISMA_GRADE[course.grade] } });
    }
    imported += 1;
  }
  if (imported) await logActivity(workspaceId, studentId, "imported_transcript_courses", "GpaCourse", studentId, { count: imported });
  return imported;
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

// Canvas doesn't know academic credit-hours (that's a registrar concept,
// not something an LMS tracks) - new Canvas-synced courses default to 3
// (the most common US credit-hour value) and stay fully editable, same
// as any manually-added course.
const DEFAULT_SYNCED_CREDITS = 3;

function letterFromCanvasGrade(raw: string): DisplayLetterGrade | null {
  // Canvas's own configured letter (e.g. "A-", sometimes "A-*" for a
  // "grade changed since last view" marker) - strip anything but the
  // grade itself and validate against our own vocabulary rather than
  // trusting an arbitrary string into the enum.
  const cleaned = raw.trim().toUpperCase().replace(/[^A-F+-]/g, "") as DisplayLetterGrade;
  return cleaned in TO_PRISMA_GRADE ? cleaned : null;
}

function letterFromScore(score: number): DisplayLetterGrade {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D-";
  return "F";
}

// Called whenever the GPA page loads (see (app)/gpa/page.tsx) - same
// "live read-through" philosophy as calendarService's Google/Outlook/
// Canvas sync, except this one actually needs to write real GpaCourse
// rows (GPA math needs stored courses, not a per-request merge). Matches
// on course name to stay idempotent - a repeat load updates the same
// row's grade instead of creating a duplicate every time.
export async function syncCanvasGradesIntoGpa(workspaceId: string, studentId: string): Promise<void> {
  const grades = await listCanvasGrades(workspaceId).catch((err) => {
    console.error("[gpaService] Canvas grades sync failed:", err instanceof Error ? err.message : err);
    return [];
  });
  for (const g of grades) {
    const letter = (g.currentGrade && letterFromCanvasGrade(g.currentGrade)) ?? (g.currentScore !== null ? letterFromScore(g.currentScore) : null);
    if (!letter) continue; // Nothing computed yet for this course - nothing honest to sync.
    const existing = await db.gpaCourse.findFirst({ where: { workspaceId, studentId, name: g.courseName } });
    if (existing) {
      if (existing.grade !== TO_PRISMA_GRADE[letter]) {
        await db.gpaCourse.update({ where: { id: existing.id }, data: { grade: TO_PRISMA_GRADE[letter] } });
      }
    } else {
      await db.gpaCourse.create({
        data: { workspaceId, studentId, name: g.courseName, credits: DEFAULT_SYNCED_CREDITS, grade: TO_PRISMA_GRADE[letter] },
      });
    }
  }
}
