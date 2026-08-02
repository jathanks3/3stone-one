"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { db } from "@/server/db";

export interface ProblemReportState {
  error?: string;
  success?: string;
}

const PRODUCT_AREAS = new Set(["3Stone One", "Workspace", "Student", "3Stone Admin", "3Stone AI website", "3Stone Picks", "3Stone Counsel", "Other"]);

function clean(value: FormDataEntryValue | null, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

export async function submitProblemReport(
  _previous: ProblemReportState,
  formData: FormData
): Promise<ProblemReportState> {
  // Invisible bot field. Real customers never fill it.
  if (clean(formData.get("company"), 100)) return { success: "Report received. Thank you." };

  const session = await getSession();
  const membership = session && !session.isDemo
    ? await db.workspaceMember.findFirst({
        where: { userId: session.userId, status: "active" },
        select: { workspaceId: true, user: { select: { email: true } } },
        orderBy: { joinedAt: "asc" },
      })
    : null;

  const requestedByEmail = (membership?.user.email ?? clean(formData.get("email"), 254)).toLowerCase();
  const subject = clean(formData.get("subject"), 160);
  const body = clean(formData.get("details"), 5000);
  const sourceCandidate = clean(formData.get("sourceUrl"), 1000);
  let sourceUrl = "";
  try {
    const parsed = new URL(sourceCandidate);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") sourceUrl = parsed.toString();
  } catch {
    // A missing or malformed source should never block the actual report.
  }
  const requestedArea = clean(formData.get("productArea"), 80);
  const productArea = PRODUCT_AREAS.has(requestedArea) ? requestedArea : "Other";

  if (!requestedByEmail || !/^\S+@\S+\.\S+$/.test(requestedByEmail)) return { error: "Enter a valid email so we can follow up." };
  if (subject.length < 4) return { error: "Briefly describe the problem in the subject." };
  if (body.length < 10) return { error: "Tell us what happened and what you expected instead." };

  const recentReports = await db.supportTicket.count({
    where: { requestedByEmail, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
  });
  if (recentReports >= 5) return { error: "We received several reports from this email. Please wait a few minutes before sending another." };

  // The canonical company inbox lives in 3Stone Admin. Only report
  // success after that system accepts the issue, so customers are never
  // told a report reached staff when it only exists in a product silo.
  const adminResponse = await fetch(
    process.env.ADMIN_ISSUE_REPORT_URL ?? "https://admin.3stoneai.com/api/v1/public/issue-reports",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceProduct: productArea,
        pageUrl: sourceUrl || "https://one.3stoneai.com",
        reporterEmail: requestedByEmail,
        description: `${subject}\n\n${body}`.slice(0, 2000),
      }),
      cache: "no-store",
    }
  );
  if (!adminResponse.ok) return { error: "We could not reach the support dashboard. Please try again in a moment." };

  // Keep a product-local copy for workspace context and audit history;
  // the canonical staff workflow remains admin.3stoneai.com above.
  await db.supportTicket.create({
    data: {
      workspaceId: membership?.workspaceId,
      requestedByEmail,
      subject,
      sourceUrl: sourceUrl || undefined,
      productArea,
      messages: { create: { authorType: "customer", authorId: session && !session.isDemo ? session.userId : undefined, body } },
    },
  });
  revalidatePath("/3stone-ai/support");
  revalidatePath("/3stone-ai");
  return { success: "Report received. It is now in the 3Stone AI support dashboard." };
}
