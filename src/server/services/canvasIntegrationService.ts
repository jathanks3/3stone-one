import { db } from "@/server/db";
import { decryptToken, encryptToken } from "@/lib/tokenEncryption";

type CanvasConfig = { baseUrl?: string; userName?: string };

function normalizeBaseUrl(value: string): string {
  const url = new URL(value.trim());
  if (url.protocol !== "https:") throw new Error("Canvas URL must use https://.");
  return url.origin;
}

async function canvasRequest(baseUrl: string, accessToken: string, path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Canvas rejected the connection (${response.status}). Check the school URL and access token.`);
  return response.json();
}

export async function connectCanvas(workspaceId: string, userId: string, baseUrlInput: string, accessTokenInput: string): Promise<void> {
  const baseUrl = normalizeBaseUrl(baseUrlInput);
  const accessToken = accessTokenInput.trim();
  if (!accessToken) throw new Error("Canvas access token is required.");
  const profile = await canvasRequest(baseUrl, accessToken, "/api/v1/users/self/profile");
  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: "canvas" } },
    update: { status: "connected", connectedAt: new Date(), connectedByUserId: userId, accessTokenEncrypted: encryptToken(accessToken), scope: "personal_access_token", config: { baseUrl, userName: profile?.name ?? null } },
    create: { workspaceId, provider: "canvas", status: "connected", connectedAt: new Date(), connectedByUserId: userId, accessTokenEncrypted: encryptToken(accessToken), scope: "personal_access_token", config: { baseUrl, userName: profile?.name ?? null } },
  });
}

export async function disconnectCanvas(workspaceId: string): Promise<void> {
  await db.integration.upsert({
    where: { workspaceId_provider: { workspaceId, provider: "canvas" } },
    update: { status: "not_connected", connectedAt: null, connectedByUserId: null, accessTokenEncrypted: null, scope: null, config: {} },
    create: { workspaceId, provider: "canvas", status: "not_connected" },
  });
}

export interface CanvasAssignment {
  id: string;
  title: string;
  dueAt: string;
  url?: string;
  courseId?: string;
  courseName?: string;
  submitted?: boolean;
  score?: number | null;
}

// Shared by every list* function below - a not-connected workspace (or
// one whose token was revoked) just gets an empty result, never an
// error, since this only ever feeds read-through display/context, not a
// user-facing action someone is waiting on.
async function getConnectedCanvas(workspaceId: string): Promise<{ baseUrl: string; token: string } | null> {
  const integration = await db.integration.findUnique({ where: { workspaceId_provider: { workspaceId, provider: "canvas" } } });
  if (!integration || integration.status !== "connected" || !integration.accessTokenEncrypted) return null;
  const config = (integration.config ?? {}) as CanvasConfig;
  if (!config.baseUrl) return null;
  return { baseUrl: config.baseUrl, token: decryptToken(integration.accessTokenEncrypted) };
}

export async function listCanvasAssignments(workspaceId: string): Promise<CanvasAssignment[]> {
  const canvas = await getConnectedCanvas(workspaceId);
  if (!canvas) return [];
  const courses = await listActiveCanvasCourses(canvas);
  const assignments = await Promise.all(courses.map(async (course) => {
    if (course.id === undefined || typeof course.name !== "string") return [];
    const courseId = String(course.id);
    const courseName = course.name;
    const rows = await canvasRequest(
      canvas.baseUrl,
      canvas.token,
      `/api/v1/courses/${courseId}/assignments?include[]=submission&order_by=due_at&per_page=100`
    ).catch(() => []);
    if (!Array.isArray(rows)) return [];
    return rows.map((assignment: Record<string, unknown>): CanvasAssignment | null => {
      if (assignment.id === undefined || typeof assignment.name !== "string" || typeof assignment.due_at !== "string") return null;
      const submission = assignment.submission && typeof assignment.submission === "object"
        ? assignment.submission as Record<string, unknown>
        : {};
      return {
        id: String(assignment.id),
        title: assignment.name,
        dueAt: assignment.due_at,
        url: typeof assignment.html_url === "string" ? assignment.html_url : undefined,
        courseId,
        courseName,
        submitted: submission.workflow_state === "submitted" || submission.workflow_state === "graded",
        score: typeof submission.score === "number" ? submission.score : null,
      };
    }).filter((assignment): assignment is CanvasAssignment => assignment !== null);
  }));
  return assignments.flat().sort((a, b) => new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime()).slice(0, 500);
}

export interface CanvasCourseGrade {
  courseId: string;
  courseName: string;
  /** 0-100, null if Canvas has nothing computed yet for this course. */
  currentScore: number | null;
  /** Canvas's own letter, e.g. "A-" - null if the course isn't configured for letter grading. */
  currentGrade: string | null;
}

async function listActiveCanvasCourses(canvas: { baseUrl: string; token: string }): Promise<Record<string, unknown>[]> {
  const courses = await canvasRequest(
    canvas.baseUrl,
    canvas.token,
    "/api/v1/courses?enrollment_state=active&include[]=total_scores&per_page=100"
  );
  return Array.isArray(courses) ? (courses as Record<string, unknown>[]) : [];
}

export async function listCanvasGrades(workspaceId: string): Promise<CanvasCourseGrade[]> {
  const canvas = await getConnectedCanvas(workspaceId);
  if (!canvas) return [];
  const courses = await listActiveCanvasCourses(canvas);
  return courses
    .map((course): CanvasCourseGrade | null => {
      const id = course.id;
      const name = course.name;
      if (id === undefined || typeof name !== "string") return null;
      const enrollments = Array.isArray(course.enrollments) ? (course.enrollments as Record<string, unknown>[]) : [];
      // A student can (rarely) have more than one enrollment on the same
      // course (e.g. re-added after dropping) - the first one Canvas
      // returns is its own primary/most-current one.
      const enrollment = enrollments[0] ?? {};
      const score = enrollment.computed_current_score;
      const grade = enrollment.computed_current_grade;
      return {
        courseId: String(id),
        courseName: name,
        currentScore: typeof score === "number" ? score : null,
        currentGrade: typeof grade === "string" ? grade : null,
      };
    })
    .filter((row): row is CanvasCourseGrade => row !== null);
}

export interface CanvasCourseMaterial {
  courseId: string;
  courseName: string;
  fileId: string;
  displayName: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  updatedAt: string;
}

export async function getCanvasFileBytes(
  workspaceId: string,
  fileId: string
): Promise<{ bytes: ArrayBuffer; contentType: string; filename: string }> {
  const canvas = await getConnectedCanvas(workspaceId);
  if (!canvas) throw new Error("Canvas is not connected.");
  if (!/^\d+$/.test(fileId)) throw new Error("Invalid Canvas file.");

  const file = await canvasRequest(canvas.baseUrl, canvas.token, `/api/v1/files/${fileId}`) as Record<string, unknown>;
  if (typeof file.url !== "string") throw new Error("Canvas did not return this file.");
  const fileUrl = new URL(file.url);
  if (fileUrl.origin !== new URL(canvas.baseUrl).origin) throw new Error("Canvas returned an unexpected file location.");

  const response = await fetch(fileUrl, {
    headers: { Authorization: `Bearer ${canvas.token}` },
    cache: "no-store",
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Canvas could not load this file (${response.status}).`);
  return {
    bytes: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") || (typeof file["content-type"] === "string" ? file["content-type"] : "application/octet-stream"),
    filename: typeof file.display_name === "string" ? file.display_name : `canvas-file-${fileId}`,
  };
}

export async function listCanvasCourseMaterials(workspaceId: string): Promise<CanvasCourseMaterial[]> {
  const canvas = await getConnectedCanvas(workspaceId);
  if (!canvas) return [];
  const courses = await listActiveCanvasCourses(canvas);
  const materials = await Promise.all(
    courses.map(async (course) => {
      const courseId = course.id;
      const courseName = course.name;
      if (courseId === undefined || typeof courseName !== "string") return [];
      // A course with files disabled (rare, an instructor setting) 404s
      // here - skip it rather than failing the whole materials list over
      // one course.
      const files = await canvasRequest(canvas.baseUrl, canvas.token, `/api/v1/courses/${courseId}/files?per_page=100`).catch(() => []);
      if (!Array.isArray(files)) return [];
      return files
        .map((file: Record<string, unknown>): CanvasCourseMaterial | null => {
          if (file.id === undefined || typeof file.display_name !== "string" || typeof file.url !== "string") return null;
          return {
            courseId: String(courseId),
            courseName,
            fileId: String(file.id),
            displayName: file.display_name,
            url: file.url,
            contentType: typeof file["content-type"] === "string" ? (file["content-type"] as string) : "application/octet-stream",
            sizeBytes: typeof file.size === "number" ? file.size : 0,
            updatedAt: typeof file.updated_at === "string" ? file.updated_at : new Date().toISOString(),
          };
        })
        .filter((row): row is CanvasCourseMaterial => row !== null);
    })
  );
  return materials.flat();
}
