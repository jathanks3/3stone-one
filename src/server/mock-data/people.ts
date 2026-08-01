import type { Announcement, Department, Employee } from "@/types";

export const DEMO_EMPLOYEES: Employee[] = [
  {
    id: "emp_jane",
    name: "Jane Dorsey",
    initials: "JD",
    title: "Project Manager",
    department: "Construction",
    email: "jane.dorsey@redoakconstruction.com",
    phone: "(555) 201-4471",
    hireDate: "2022-03-14",
    role: "Manager",
    overdueCount: 2,
    overtimeHours: 11,
    status: "active",
  },
  {
    id: "emp_marcus",
    name: "Marcus Webb",
    initials: "MW",
    title: "Electrician",
    department: "Field",
    email: "marcus.webb@redoakconstruction.com",
    phone: "(555) 201-8823",
    hireDate: "2023-06-01",
    role: "Member",
    overdueCount: 1,
    status: "active",
  },
  {
    id: "emp_priya",
    name: "Priya Shah",
    initials: "PS",
    title: "Lead Estimator",
    department: "Estimating",
    email: "priya.shah@redoakconstruction.com",
    phone: "(555) 201-3390",
    hireDate: "2026-07-04",
    role: "Manager",
    overdueCount: 0,
    status: "active",
  },
  {
    id: "emp_diego",
    name: "Diego Ramirez",
    initials: "DR",
    title: "Technician",
    department: "Field",
    email: "diego.ramirez@redoakconstruction.com",
    phone: "(555) 201-7712",
    hireDate: "2024-01-08",
    role: "Member",
    overdueCount: 0,
    status: "active",
  },
  {
    id: "emp_sam",
    name: "Sam Okafor",
    initials: "SO",
    title: "Office Manager",
    department: "Admin",
    email: "sam.okafor@redoakconstruction.com",
    phone: "(555) 201-5541",
    hireDate: "2021-11-19",
    role: "Admin",
    overdueCount: 0,
    status: "active",
  },
  {
    id: "emp_taylor",
    name: "Taylor Brooks",
    initials: "TB",
    title: "Technician",
    department: "Field",
    email: "taylor.brooks@redoakconstruction.com",
    phone: "(555) 201-6650",
    hireDate: "2023-09-25",
    role: "Member",
    overdueCount: 0,
    status: "away",
  },
  {
    id: "emp_morgan",
    name: "Morgan Lee",
    initials: "ML",
    title: "Accountant",
    department: "Finance",
    email: "morgan.lee@redoakconstruction.com",
    phone: "(555) 201-9902",
    hireDate: "2022-08-15",
    role: "Member",
    overdueCount: 0,
    status: "active",
  },
  {
    id: "emp_casey",
    name: "Casey Nguyen",
    initials: "CN",
    title: "Technician",
    department: "Field",
    email: "casey.nguyen@redoakconstruction.com",
    phone: "(555) 201-2287",
    hireDate: "2024-04-02",
    role: "Member",
    overdueCount: 0,
    status: "active",
  },
];

export const DEMO_DEPARTMENTS: Department[] = [
  { id: "dept_construction", name: "Construction", leadId: "emp_jane" },
  { id: "dept_field", name: "Field", leadId: "emp_marcus" },
  { id: "dept_estimating", name: "Estimating", leadId: "emp_priya" },
  { id: "dept_admin", name: "Admin", leadId: "emp_sam" },
  { id: "dept_finance", name: "Finance", leadId: "emp_morgan" },
];

export const DEMO_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann_1",
    title: "Riverside Properties signed — kickoff next week",
    body: "Great news — Riverside Properties signed the clubhouse remodel contract. Jane will run kickoff with the field team Monday morning.",
    authorId: "emp_sam",
    at: "2 days ago",
  },
  {
    id: "ann_2",
    title: "Welcome Priya Shah, Lead Estimator",
    body: "Please join us in welcoming Priya Shah to the Estimating team. Priya joins us from a regional GC and will be leading bids on Harbor View, Maple Street, and Cedar Hills.",
    authorId: "emp_sam",
    department: "Estimating",
    at: "3 days ago",
  },
  {
    id: "ann_3",
    title: "Updated safety check-in process for job sites",
    body: "Starting this week, all field staff should check in via the site log at the start and end of every shift. See the Knowledge Center for the updated SOP.",
    authorId: "emp_sam",
    department: "Field",
    at: "5 days ago",
  },
  {
    id: "ann_4",
    title: "Q2 numbers are in — revenue up 12%",
    body: "Thanks to everyone's work this quarter — revenue is up 12% over last quarter, driven largely by the Riverside and Harbor View contracts.",
    authorId: "emp_morgan",
    at: "1 week ago",
  },
  {
    id: "ann_5",
    title: "New vendor account: Ferguson Supply",
    body: "We've opened a new materials account with Ferguson Supply for faster turnaround on plumbing fixtures. Reach out to Sam for account details.",
    authorId: "emp_sam",
    department: "Admin",
    at: "1 week ago",
  },
];

export function getEmployeeName(id: string) {
  return DEMO_EMPLOYEES.find((e) => e.id === id)?.name ?? "Unknown";
}

export function getEmployeeInitials(id: string) {
  return DEMO_EMPLOYEES.find((e) => e.id === id)?.initials ?? "?";
}

// Workspace edition's own team roster (Harper & Voss Consulting) - see
// jobs.ts's WORKSPACE_JOBS and industries/workplace.ts.
export const WORKSPACE_EMPLOYEES: Employee[] = [
  { id: "wemp_jordan", name: "Jordan Ellis", initials: "JE", title: "Senior Consultant", department: "Consulting", email: "jordan.ellis@harpervoss.com", phone: "(555) 301-4471", hireDate: "2021-09-01", role: "Manager", overdueCount: 1, status: "active" },
  { id: "wemp_alicia", name: "Alicia Ford", initials: "AF", title: "Research Analyst", department: "Research", email: "alicia.ford@harpervoss.com", phone: "(555) 301-8823", hireDate: "2023-02-14", role: "Member", overdueCount: 0, status: "active" },
  { id: "wemp_priya", name: "Priya Nair", initials: "PN", title: "HR Consultant", department: "People Ops", email: "priya.nair@harpervoss.com", phone: "(555) 301-3390", hireDate: "2022-05-20", role: "Manager", overdueCount: 0, status: "active" },
  { id: "wemp_devon", name: "Devon Carter", initials: "DC", title: "Associate Consultant", department: "Consulting", email: "devon.carter@harpervoss.com", phone: "(555) 301-7712", hireDate: "2024-01-08", role: "Member", overdueCount: 0, status: "active" },
  { id: "wemp_maya", name: "Maya Patel", initials: "MP", title: "Office Manager", department: "Admin", email: "maya.patel@harpervoss.com", phone: "(555) 301-5541", hireDate: "2021-11-19", role: "Admin", overdueCount: 0, status: "active" },
  { id: "wemp_ryan", name: "Ryan Ostrowski", initials: "RO", title: "Associate Consultant", department: "Consulting", email: "ryan.ostrowski@harpervoss.com", phone: "(555) 301-6650", hireDate: "2023-09-25", role: "Member", overdueCount: 1, status: "away" },
];

export const WORKSPACE_DEPARTMENTS: Department[] = [
  { id: "wdept_consulting", name: "Consulting", leadId: "wemp_jordan" },
  { id: "wdept_research", name: "Research", leadId: "wemp_alicia" },
  { id: "wdept_peopleops", name: "People Ops", leadId: "wemp_priya" },
  { id: "wdept_admin", name: "Admin", leadId: "wemp_maya" },
];

export const WORKSPACE_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "wann_1",
    title: "Northstar Brand Strategy — kickoff went well",
    body: "Kickoff with Northstar Retail Co. went great this morning. Jordan will send the full engagement plan to the team by Friday.",
    authorId: "wemp_maya",
    at: "2 days ago",
  },
  {
    id: "wann_2",
    title: "Welcome Ryan Ostrowski to Consulting",
    body: "Please join us in welcoming Ryan Ostrowski to the Consulting team, joining us from a regional advisory firm.",
    authorId: "wemp_maya",
    department: "Consulting",
    at: "4 days ago",
  },
  {
    id: "wann_3",
    title: "Updated client engagement checklist",
    body: "A refreshed engagement checklist is up in the Knowledge Center - please use it for every new client kickoff going forward.",
    authorId: "wemp_jordan",
    at: "5 days ago",
  },
  {
    id: "wann_4",
    title: "Q2 client satisfaction scores are in",
    body: "Great quarter - average client satisfaction is up across every active engagement. Thanks for the work, everyone.",
    authorId: "wemp_priya",
    at: "1 week ago",
  },
];
