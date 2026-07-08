import type { SessionUser, Workspace } from "@/types";

export const DEMO_WORKSPACE: Workspace = {
  id: "ws_acme",
  name: "Acme Construction",
  slug: "acme-construction",
  industryProfileKey: "construction",
  plan: "pro",
};

export const DEMO_USER: SessionUser = {
  id: "user_demo",
  name: "Alex Rivera",
  initials: "AR",
  email: "alex@acmeconstruction.com",
  role: "Owner",
  title: "Owner",
};
