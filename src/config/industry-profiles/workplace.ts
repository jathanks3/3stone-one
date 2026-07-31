import type { IndustryProfile } from "@/types";

// Not a real-world industry - this is the fixed profile every 3Stone One
// Workspace edition workspace gets automatically (see
// (marketing)/signup/product/actions.ts), since "which industry are you
// in" doesn't apply to a day-to-day worker/manager the way it does for
// the flagship product. Terms stay close to plain business language -
// this audience already speaks in "projects" and "team", not a
// specialized vocabulary.
export const workplaceProfile: IndustryProfile = {
  key: "workplace",
  label: "Workspace",
  terms: {
    project: "Project",
    projects: "Projects",
    customer: "Customer",
    customers: "Customers",
    employee: "Team member",
    employees: "Team members",
  },
};
