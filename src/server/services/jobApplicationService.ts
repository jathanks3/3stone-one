import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";
import type { ApplicationStatus } from "../../../generated/prisma/client";

export interface JobApplicationRow {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedDate: Date | null;
  notes: string | null;
  source: string;
  sourceUrl: string | null;
}

export async function listJobApplications(workspaceId: string, studentId: string): Promise<JobApplicationRow[]> {
  return db.jobApplication.findMany({
    where: { workspaceId, studentId },
    orderBy: { createdAt: "asc" },
    select: { id: true, company: true, role: true, status: true, appliedDate: true, notes: true, source: true, sourceUrl: true },
  });
}

export async function createJobApplication(workspaceId: string, studentId: string, company: string, role: string, notes: string, source = "manual", sourceUrl = ""): Promise<JobApplicationRow> {
  const trimmedCompany = company.trim();
  const trimmedRole = role.trim();
  if (!trimmedCompany || !trimmedRole) throw new Error("Company and role are required.");
  const normalizedSource = ["manual", "linkedin", "indeed", "handshake", "12twenty", "company_site", "other"].includes(source) ? source : "other";
  const normalizedUrl = sourceUrl.trim();
  if (normalizedUrl && !/^https?:\/\//i.test(normalizedUrl)) throw new Error("The job link must start with http:// or https://.");
  const application = await db.jobApplication.create({
    data: { workspaceId, studentId, company: trimmedCompany, role: trimmedRole, notes: notes.trim() || null, source: normalizedSource, sourceUrl: normalizedUrl || null, status: "saved" },
  });
  await logActivity(workspaceId, studentId, "added_job_application", "JobApplication", application.id, { company: trimmedCompany, role: trimmedRole });
  return application;
}

const STATUS_ORDER: ApplicationStatus[] = ["saved", "applied", "interviewing", "offer", "rejected"];

export async function moveJobApplication(workspaceId: string, studentId: string, applicationId: string, direction: -1 | 1): Promise<JobApplicationRow> {
  const existing = await db.jobApplication.findFirst({ where: { id: applicationId, workspaceId, studentId } });
  if (!existing) throw new Error("Application not found.");
  const currentIndex = STATUS_ORDER.indexOf(existing.status);
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= STATUS_ORDER.length) return existing;
  const nextStatus = STATUS_ORDER[nextIndex];
  // Moving into "applied" or past it for the first time sets today's
  // date if one isn't already recorded - a real side effect of the
  // status change, matching the demo's own behavior exactly.
  const appliedDate = existing.appliedDate ?? (nextStatus !== "saved" ? new Date() : null);
  const application = await db.jobApplication.update({ where: { id: applicationId }, data: { status: nextStatus, appliedDate } });
  await logActivity(workspaceId, studentId, "moved_job_application", "JobApplication", applicationId, { status: nextStatus });
  return application;
}

export async function deleteJobApplication(workspaceId: string, studentId: string, applicationId: string): Promise<void> {
  const existing = await db.jobApplication.findFirst({ where: { id: applicationId, workspaceId, studentId } });
  if (!existing) throw new Error("Application not found.");
  await db.jobApplication.delete({ where: { id: applicationId } });
  await logActivity(workspaceId, studentId, "deleted_job_application", "JobApplication", applicationId, { company: existing.company });
}
