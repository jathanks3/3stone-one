import type { Metadata } from "next";
import { PeopleClient } from "@/features/people/PeopleClient";
import { RealPeopleClient } from "@/features/people/RealPeopleClient";
import { getSession } from "@/lib/session";
import { getActiveWorkspaceIdForUser } from "@/server/services/onboardingService";
import { listAnnouncements, listDepartments, listDirectory } from "@/server/services/peopleService";

export const metadata: Metadata = { title: "People — 3Stone One" };
export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    const workspaceId = await getActiveWorkspaceIdForUser(session.userId);
    const [members, departments, announcements] = workspaceId
      ? await Promise.all([listDirectory(workspaceId), listDepartments(workspaceId), listAnnouncements(workspaceId)])
      : [[], [], []];
    return <RealPeopleClient initialMembers={members} initialDepartments={departments} initialAnnouncements={announcements} />;
  }
  return <PeopleClient />;
}
