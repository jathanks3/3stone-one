import type { Metadata } from "next";
import { ProjectsClient } from "@/features/projects/ProjectsClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "Projects — 3Stone One" };

export default async function ProjectsPage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="Projects" />;
  }
  return <ProjectsClient />;
}
