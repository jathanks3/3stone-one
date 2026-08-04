import { db } from "@/server/db";
import { logActivity } from "@/server/services/activityService";
import { getRecentGmailMessages } from "@/server/services/googleIntegrationService";
import { getRecentOutlookMessages } from "@/server/services/microsoftIntegrationService";
import { isJobApplicationMessage } from "@/server/services/integrationContentRouter";
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
    where: { workspaceId, studentId, source: { notIn: ["dismissed_outlook", "dismissed_gmail"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true, company: true, role: true, status: true, appliedDate: true, notes: true, source: true, sourceUrl: true },
  });
}

export async function createJobApplication(workspaceId: string, studentId: string, company: string, role: string, notes: string, source = "manual", sourceUrl = ""): Promise<JobApplicationRow> {
  const trimmedCompany = company.trim();
  const trimmedRole = role.trim();
  if (!trimmedCompany || !trimmedRole) throw new Error("Company and role are required.");
  const normalizedSource = ["manual", "linkedin", "indeed", "handshake", "12twenty", "company_site", "outlook", "gmail", "other"].includes(source) ? source : "other";
  const normalizedUrl = sourceUrl.trim();
  if (normalizedUrl && !/^https?:\/\//i.test(normalizedUrl)) throw new Error("The job link must start with http:// or https://.");
  const application = await db.jobApplication.create({
    data: { workspaceId, studentId, company: trimmedCompany, role: trimmedRole, notes: notes.trim() || null, source: normalizedSource, sourceUrl: normalizedUrl || null, status: "saved" },
  });
  await logActivity(workspaceId, studentId, "added_job_application", "JobApplication", application.id, { company: trimmedCompany, role: trimmedRole });
  return application;
}

function inferCompany(senderName: string, senderAddress: string): string {
  const cleanedName = senderName
    .replace(/<[^>]+>/g, "")
    .replace(/\b(recruiting|recruitment|talent acquisition|careers?|jobs?|human resources|hr team|no-?reply)\b/gi, "")
    .replace(/[|–—_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleanedName && !/@/.test(cleanedName)) return cleanedName;
  const domain = senderAddress.split("@")[1]?.split(".")[0] ?? "";
  return domain ? domain.charAt(0).toUpperCase() + domain.slice(1) : "Employer";
}

function inferRole(subject: string): string {
  const patterns = [
    /(?:application|applicant|candidacy)\s+(?:for|to)\s+(.+?)(?:\s+(?:at|with)\s+.+)?$/i,
    /(?:interview|offer)\s+(?:for|regarding)\s+(.+?)(?:\s+(?:at|with)\s+.+)?$/i,
    /(?:role|position)[:\s-]+(.+)$/i,
  ];
  for (const pattern of patterns) {
    const match = subject.match(pattern)?.[1]?.replace(/[.!]+$/, "").trim();
    if (match && match.length <= 100) return match;
  }
  return subject.replace(/^(re|fw|fwd):\s*/i, "").slice(0, 100) || "Job application";
}

function inferStatus(text: string): ApplicationStatus {
  if (/not (moving|proceeding) forward|unfortunately|another candidate|not selected/i.test(text)) return "rejected";
  if (/offer (letter|of employment)|pleased to offer|job offer/i.test(text)) return "offer";
  if (/interview|phone screen|screening call/i.test(text)) return "interviewing";
  if (/application (received|submitted)|thank you for (applying|your application)/i.test(text)) return "applied";
  return "saved";
}

/**
 * Adds conservative, duplicate-safe application updates detected in connected
 * inboxes. Provider messages remain read-only; the tracker stores only the
 * small application card the user needs to manage.
 */
export async function syncJobApplicationsFromEmail(workspaceId: string, studentId: string): Promise<number> {
  const integrations = await db.integration.findMany({
    where: { workspaceId, provider: { in: ["microsoft", "google"] }, status: "connected" },
    select: { provider: true, scope: true },
  });
  const microsoft = integrations.find((item) => item.provider === "microsoft");
  const google = integrations.find((item) => item.provider === "google");
  const gmailReadGranted = /gmail\.(readonly|read)|\/auth\/gmail\.modify/i.test(google?.scope ?? "");

  const [outlookMessages, gmailMessages] = await Promise.all([
    microsoft ? getRecentOutlookMessages(workspaceId, 50).catch(() => []) : Promise.resolve([]),
    google && gmailReadGranted ? getRecentGmailMessages(workspaceId, 50).catch(() => []) : Promise.resolve([]),
  ]);

  const candidates = [
    ...outlookMessages.map((message) => ({
      provider: "outlook",
      externalUrl: message.webLink || `https://outlook.office.com/mail/inbox/id/${encodeURIComponent(message.id)}`,
      subject: message.subject,
      preview: message.preview,
      senderName: message.senderName,
      senderAddress: message.senderAddress,
      receivedAt: message.receivedAt,
    })),
    ...gmailMessages.map((message) => ({
      provider: "gmail",
      externalUrl: `https://mail.google.com/mail/u/0/#inbox/${encodeURIComponent(message.id)}`,
      subject: message.subject,
      preview: message.preview,
      senderName: message.from,
      senderAddress: message.from.match(/<([^>]+)>/)?.[1] ?? message.from,
      receivedAt: message.receivedAt,
    })),
  ].filter((message) => isJobApplicationMessage([message.subject, message.preview]));

  if (!candidates.length) return 0;
  const existing = await db.jobApplication.findMany({
    where: { workspaceId, studentId, sourceUrl: { in: candidates.map((message) => message.externalUrl) } },
    select: { sourceUrl: true },
  });
  const existingUrls = new Set(existing.map((item) => item.sourceUrl));
  let created = 0;

  for (const message of candidates) {
    if (existingUrls.has(message.externalUrl)) continue;
    const combined = `${message.subject} ${message.preview}`;
    const status = inferStatus(combined);
    const receivedAt = new Date(message.receivedAt);
    const application = await db.jobApplication.create({
      data: {
        workspaceId,
        studentId,
        company: inferCompany(message.senderName, message.senderAddress),
        role: inferRole(message.subject),
        status,
        appliedDate: status === "saved" || Number.isNaN(receivedAt.getTime()) ? null : receivedAt,
        notes: `Detected from ${message.provider === "outlook" ? "Outlook" : "Gmail"}: ${message.preview}`.slice(0, 500),
        source: message.provider,
        sourceUrl: message.externalUrl,
      },
    });
    existingUrls.add(message.externalUrl);
    created += 1;
    await logActivity(workspaceId, studentId, "imported_job_application", "JobApplication", application.id, { source: message.provider });
  }
  return created;
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
  // Keep a tiny tombstone for auto-routed inbox cards so deleting one does
  // not make the same provider message reappear on the next page load.
  if (existing.source === "outlook" || existing.source === "gmail") {
    await db.jobApplication.update({ where: { id: applicationId }, data: { source: `dismissed_${existing.source}` } });
  } else {
    await db.jobApplication.delete({ where: { id: applicationId } });
  }
  await logActivity(workspaceId, studentId, "deleted_job_application", "JobApplication", applicationId, { company: existing.company });
}
