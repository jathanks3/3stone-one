import type { SessionUser, Workspace } from "@/types";

export const DEMO_WORKSPACE: Workspace = {
  id: "ws_demo",
  name: "Red Oak Construction",
  slug: "red-oak-construction",
  industryProfileKey: "construction",
  plan: "pro",
};

export const DEMO_USER: SessionUser = {
  id: "user_demo",
  name: "Jordan Ellis",
  initials: "JE",
  email: "demo@3stoneone.com",
  role: "Owner",
  title: "Founder & CEO",
};
