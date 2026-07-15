import type { IndustryProfile, NavSection } from "@/types";

export function getNavSections(profile: IndustryProfile): NavSection[] {
  const t = profile.terms;
  return [
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
          key: "documents",
          href: "/documents",
          label: "Documents",
          icon: "FileText",
          description: "Company and project files, shareable with clients.",
        },
        {
          key: "knowledge",
          href: "/knowledge",
          label: "Knowledge Center",
          icon: "BookOpen",
          description: "Policies, training, SOPs, and video — your company wiki.",
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
          description: "Connect QuickBooks, Stripe, Slack, and more.",
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
          description: "A full audit trail of everything that happens in this workspace.",
        },
        {
          key: "settings",
          href: "/settings",
          label: "Settings",
          icon: "Settings",
          description: "Company profile, branding, users, and industry profile.",
        },
      ],
    },
  ];
}

export function getAllNavItems(profile: IndustryProfile) {
  return getNavSections(profile).flatMap((section) => section.items);
}
