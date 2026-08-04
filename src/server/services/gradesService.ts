import { listCanvasGrades, type CanvasCourseGrade } from "@/server/services/canvasIntegrationService";
import { listGpaCourses } from "@/server/services/gpaService";

// Read-through merge, same philosophy as calendarService.ts's synced
// events - live-fetched on every load, never stored here. Canvas is the
// only real grade source today; a future integration with real grades
// just adds another Promise.all entry below, same as calendar's
// Google/Outlook/Canvas merge.
export interface GradeRow {
  courseId: string;
  courseName: string;
  currentScore: number | null;
  currentGrade: string | null;
  source: "canvas" | "transcript";
}

export async function listAllGrades(workspaceId: string, studentId?: string): Promise<GradeRow[]> {
  const [canvasGrades, transcriptCourses] = await Promise.all([listCanvasGrades(workspaceId).catch((err) => {
    console.error("[gradesService] Canvas grades fetch failed:", err instanceof Error ? err.message : err);
    return [] as CanvasCourseGrade[];
  }), studentId ? listGpaCourses(workspaceId, studentId) : Promise.resolve([])]);
  const canvasRows = canvasGrades.map((g) => ({ ...g, source: "canvas" as const }));
  const canvasNames = new Set(canvasRows.map((row) => row.courseName.trim().toLocaleLowerCase()));
  const transcriptRows: GradeRow[] = transcriptCourses
    .filter((course) => !canvasNames.has(course.name.trim().toLocaleLowerCase()))
    .map((course) => ({ courseId: course.id, courseName: course.name, currentScore: null, currentGrade: course.grade, source: "transcript" }));
  return [...canvasRows, ...transcriptRows];
}
