import type { IndustryProfile } from "@/types";

// Not a real-world industry - this is the fixed profile every 3Stone One
// Student edition workspace gets automatically (see
// (marketing)/signup/product/actions.ts). customer/employee terms are
// never actually surfaced for this edition (CRM and People aren't in
// EDITION_MODULES.student - see src/lib/editionModules.ts) but still
// need a real value since IndustryTerms has no optional fields.
export const studentProfile: IndustryProfile = {
  key: "student",
  label: "Student",
  terms: {
    project: "Assignment",
    projects: "Assignments",
    customer: "Contact",
    customers: "Contacts",
    employee: "Group member",
    employees: "Group members",
  },
};
