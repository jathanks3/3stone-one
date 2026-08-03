import type { IndustryProfile, NavSection } from "@/types";

// allowedModuleKeys is null for Business edition (unrestricted, matches
// today's behavior exactly) or a Set for editions with a real module cut
// (see src/lib/editionModules.ts). Filters items, then drops any section
// left with none.
export function getNavSections(profile: IndustryProfile, allowedModuleKeys: Set<string> | null = null): NavSection[] {
  const t = profile.terms;
  const sections: NavSection[] = [
    {
      items: [
        {
          key: "portfolio",
          href: "/portfolio",
          label: "Executive Overview",
          icon: "Building2",
          description: "One login, every business you own — switch instantly.",
        },
        { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
      ],
    },
    {
      title: "Workspace",
      items: [
        {
          key: "crm",
          href: "/crm",
          label: t.customers,
          icon: "Users",
          description: `Leads, ${t.customers.toLowerCase()}, companies, and your sales pipeline.`,
        },
        {
          key: "projects",
          href: "/projects",
          label: t.projects,
          icon: "KanbanSquare",
          description: `Kanban, calendar, and list views for every ${t.project.toLowerCase()}.`,
        },
        {
          key: "people",
          href: "/people",
          label: t.employees,
          icon: "Contact2",
          description: `Directory, departments, roles, and announcements for your ${t.employees.toLowerCase()}.`,
        },
        {
          key: "communications",
          href: "/communications",
          label: "Communications",
          icon: "MessagesSquare",
          description: "Email, internal chat, and call notes — one searchable hub.",
        },
        {
          key: "meetings",
          href: "/meetings",
          label: "Meetings",
          icon: "CalendarClock",
          description: "Agendas, action items, AI summaries, and decisions.",
        },
        {
          key: "calendar",
          href: "/calendar",
          label: "Calendar",
          icon: "Calendar",
          description: "Add, move, and delete what's coming up.",
        },
        {
          key: "documents",
          href: "/documents",
          label: "Documents",
          icon: "FileText",
          description: "A private file vault for your work, organized and easy to find.",
        },
        {
          key: "notes",
          href: "/notes",
          label: "Notes",
          icon: "StickyNote",
          description: "Quick notes and drafts, separate from shared documents.",
        },
        {
          key: "grades",
          href: "/grades",
          label: "Grades",
          icon: "GraduationCap",
          description: "Real grades from Canvas and your other connected school systems.",
        },
        {
          key: "gpa",
          href: "/gpa",
          label: "GPA Calculator",
          icon: "Calculator",
          description: "Add your courses and grades — your GPA updates instantly.",
        },
        {
          key: "job-tracker",
          href: "/job-tracker",
          label: "Internship & Job Tracker",
          icon: "Briefcase",
          description: "A real pipeline for internship and job applications — saved through offer.",
        },
        {
          key: "time-off",
          href: "/time-off",
          label: "Time Off",
          icon: "Plane",
          description: "Request time off and approve requests from your team.",
        },
        {
          key: "knowledge",
          href: "/knowledge",
          label: "Knowledge Center",
          icon: "BookOpen",
          description: "Guides, references, and how-tos in one shared place.",
        },
        {
          key: "finance",
          href: "/finance",
          label: "Finance",
          icon: "Landmark",
          description: "Revenue, profit, invoices, purchase requests, and budgets.",
        },
        {
          key: "inventory",
          href: "/inventory",
          label: "Inventory",
          icon: "PackageSearch",
          description: "Products, supplies, stock movements, suppliers, and purchase orders.",
        },
      ],
    },
    {
      title: "Automate & analyze",
      items: [
        {
          key: "automation",
          href: "/automation",
          label: "Automation",
          icon: "Workflow",
          description: "A visual workflow builder for the busywork between systems.",
        },
        {
          key: "analytics",
          href: "/analytics",
          label: "Analytics & Reports",
          icon: "BarChart3",
          description: "Cross-module reporting and a custom report builder.",
        },
        {
          key: "integrations",
          href: "/integrations",
          label: "Integrations",
          icon: "Plug",
          description: "Connect the tools you already use — calendars, chat, docs, and more.",
        },
      ],
    },
    {
      title: "Company",
      items: [
        {
          key: "client-portal",
          href: "/client-portal",
          label: "Client Portal",
          icon: "Eye",
          description: "Preview what your clients see when they log in.",
        },
        {
          key: "activity",
          href: "/activity",
          label: "Activity Log",
          icon: "History",
          description: "A timestamped record of everything that's happened here.",
        },
        {
          key: "settings",
          href: "/settings",
          label: "Settings",
          icon: "Settings",
          description: "Your profile, team, and preferences.",
        },
      ],
    },
  ];

  if (!allowedModuleKeys) return sections;
  return sections
    .map((section) => ({ ...section, items: section.items.filter((item) => allowedModuleKeys.has(item.key)) }))
    .filter((section) => section.items.length > 0);
}

export function getAllNavItems(profile: IndustryProfile, allowedModuleKeys: Set<string> | null = null) {
  return getNavSections(profile, allowedModuleKeys).flatMap((section) => section.items);
}
