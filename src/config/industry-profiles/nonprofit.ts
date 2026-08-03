import type { IndustryProfile } from "@/types";

// A real, selectable option for Workspace edition (alongside the generic
// "workplace" default) - not automatic like workplace/student, chosen at
// signup (see (marketing)/signup/product/ProductForm.tsx + actions.ts).
// "Constituent" is the standard nonprofit-sector umbrella term (used by
// Bloomerang, Neon CRM, Salesforce Nonprofit Cloud, etc.) covering donors,
// clients/beneficiaries, volunteers, and members alike - not invented
// vocabulary.
export const nonprofitProfile: IndustryProfile = {
  key: "nonprofit",
  label: "Nonprofit",
  terms: {
    project: "Program",
    projects: "Programs",
    customer: "Constituent",
    customers: "Constituents",
    employee: "Staff Member",
    employees: "Staff",
  },
};
