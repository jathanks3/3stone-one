import type { Metadata } from "next";
import { ProjectsClient } from "@/features/projects/ProjectsClient";

export const metadata: Metadata = { title: "Projects — 3Stone One" };

export default function ProjectsPage() {
  return <ProjectsClient />;
}
