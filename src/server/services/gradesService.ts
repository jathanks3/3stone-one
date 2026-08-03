import { listCanvasGrades, type CanvasCourseGrade } from "@/server/services/canvasIntegrationService";

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
  source: "canvas";
}

export async function listAllGrades(workspaceId: string): Promise<GradeRow[]> {
  const canvasGrades = await listCanvasGrades(workspaceId).catch((err) => {
    console.error("[gradesService] Canvas grades fetch failed:", err instanceof Error ? err.message : err);
    return [] as CanvasCourseGrade[];
  });
  return canvasGrades.map((g) => ({ ...g, source: "canvas" as const }));
}
