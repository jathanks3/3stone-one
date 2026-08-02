"use server";

import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { requireActiveMember } from "@/server/services/teamService";
import { createGoogleSpreadsheet } from "@/server/services/googleIntegrationService";
import { db } from "@/server/db";

export interface AnalyticsActionState { error?: string; success?: string; url?: string }

export async function exportWorkspaceSnapshotToSheetsAction(_prev: AnalyticsActionState, _form: FormData): Promise<AnalyticsActionState> {
  try {
    const session = await getSession();
    if (!session || session.isDemo) throw new Error("Not authenticated.");
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    if (!workspaceId) throw new Error("No workspace.");
    await requireActiveMember(session.userId, workspaceId);
    const [workspace, projects, people, organizations] = await Promise.all([
      db.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { name: true } }),
      db.project.findMany({ where: { workspaceId }, select: { name: true, statusKey: true }, orderBy: { createdAt: "desc" } }),
      db.person.findMany({ where: { workspaceId }, select: { firstName: true, lastName: true, personType: true } }),
      db.organization.findMany({ where: { workspaceId }, select: { name: true } }),
    ]);
    const values: (string | number | boolean)[][] = [
      ["3Stone One Workspace Snapshot", workspace.name],
      ["Generated", new Date().toISOString()],
      [],
      ["Projects"],
      ["Name", "Status"],
      ...projects.map((project) => [project.name, project.statusKey]),
      [],
      ["People"],
      ["Name", "Type"],
      ...people.map((person) => [`${person.firstName} ${person.lastName}`, person.personType]),
      [],
      ["Organizations"],
      ["Name"],
      ...organizations.map((organization) => [organization.name]),
    ];
    const url = await createGoogleSpreadsheet(workspaceId, `${workspace.name} - 3Stone One Snapshot`, values);
    return { success: "Google Sheet created.", url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}
