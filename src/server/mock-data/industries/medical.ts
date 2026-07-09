import type {
  ActivityItem,
  Deal,
  Employee,
  Invoice,
  IndustryDataset,
  Job,
  Organization,
  Person,
} from "@/types";

// ---- Referring / partner organizations ----
// Patients are individuals (see `people` below); these represent the
// institutional relationships around the practice — referring specialists,
// a hospital discharge-follow-up pipeline, insurance networks, and employer
// wellness accounts.
const organizations: Organization[] = [
  { id: "org_med_northside", name: "Northside Orthopedic Associates", domain: "northsideortho.com", industry: "Orthopedic Referral", ownerId: "emp_med_okafor", createdAt: "2025-02-10" },
  { id: "org_med_valley", name: "Valley Regional Hospital", domain: "valleyregional.org", industry: "Hospital Referral Network", ownerId: "emp_med_feld", createdAt: "2025-01-05" },
  { id: "org_med_summit", name: "Summit Health Network", domain: "summithealthnetwork.com", industry: "Insurance Network", ownerId: "emp_med_cho", createdAt: "2024-09-15" },
  { id: "org_med_brightpath", name: "BrightPath Wellness Partners", domain: "brightpathwellness.com", industry: "Employer Wellness Program", ownerId: "emp_med_ibarra", createdAt: "2025-03-20" },
  { id: "org_med_greenfield", name: "Greenfield Manufacturing", domain: "greenfieldmfg.com", industry: "Manufacturing (Employer Wellness Account)", ownerId: "emp_med_ibarra", createdAt: "2025-05-01" },
  { id: "org_med_westside", name: "Westside Pediatric Group", domain: "westsidepeds.com", industry: "Pediatric Referral", ownerId: "emp_med_okafor", createdAt: "2025-04-12" },
  { id: "org_med_harbormutual", name: "Harbor Mutual Insurance", domain: "harbormutual.com", industry: "Insurance Payer", ownerId: "emp_med_cho", createdAt: "2024-11-30" },
];

// ---- Patients ----
const people: Person[] = [
  { id: "per_med_reyes", firstName: "Carla", lastName: "Reyes", email: "carla.reyes@gmail.com", phone: "(555) 610-1123", organizationId: null, personType: "customer", ownerId: "emp_med_torres", createdAt: "2024-10-02", lastContact: "2 days ago" },
  { id: "per_med_donnelly", firstName: "Walter", lastName: "Donnelly", email: "walter.donnelly@outlook.com", phone: "(555) 610-2287", organizationId: "org_med_valley", personType: "customer", ownerId: "emp_med_ibarra", createdAt: "2026-06-28", lastContact: "Yesterday" },
  { id: "per_med_nakamura", firstName: "Sophie", lastName: "Nakamura", email: "sophie.nakamura@icloud.com", phone: "(555) 610-3341", organizationId: null, personType: "lead", ownerId: "emp_med_torres", createdAt: "2026-06-18", lastContact: "1 week ago" },
  { id: "per_med_boateng", firstName: "Kwame", lastName: "Boateng", email: "kwame.boateng@greenfieldmfg.com", phone: "(555) 610-4409", organizationId: "org_med_greenfield", personType: "customer", ownerId: "emp_med_ibarra", createdAt: "2025-05-14", lastContact: "3 days ago" },
  { id: "per_med_alvarez", firstName: "Diego", lastName: "Alvarez", email: "diego.alvarez@yahoo.com", phone: "(555) 610-5512", organizationId: "org_med_northside", personType: "customer", ownerId: "emp_med_okafor", createdAt: "2026-05-02", lastContact: "Today" },
  { id: "per_med_finch", firstName: "Harold", lastName: "Finch", email: "hfinch62@gmail.com", phone: "(555) 610-6674", organizationId: null, personType: "customer", ownerId: "emp_med_ibarra", createdAt: "2019-02-11", lastContact: "2 weeks ago" },
  { id: "per_med_patel", firstName: "Nisha", lastName: "Patel", email: "nisha.patel@brightpathwellness.com", phone: "(555) 610-7788", organizationId: "org_med_brightpath", personType: "customer", ownerId: "emp_med_ibarra", createdAt: "2025-04-01", lastContact: "4 days ago" },
  { id: "per_med_griggs", firstName: "Olivia", lastName: "Griggs", email: "olivia.griggs@gmail.com", phone: "(555) 610-8890", organizationId: "org_med_westside", personType: "lead", ownerId: "emp_med_torres", createdAt: "2026-07-02", lastContact: "This morning" },
];

// ---- New-patient intake / program-enrollment pipeline ----
const deals: Deal[] = [
  { id: "deal_med_reyes", personId: "per_med_reyes", organizationId: null, title: "Carla Reyes — New Patient Intake", value: 450, stage: "won", ownerId: "emp_med_torres", expectedCloseDate: "2024-10-16" },
  { id: "deal_med_donnelly", personId: "per_med_donnelly", organizationId: "org_med_valley", title: "Walter Donnelly — New Patient Intake (Post-Discharge Follow-up)", value: 900, stage: "won", ownerId: "emp_med_ibarra", expectedCloseDate: "2026-07-05" },
  { id: "deal_med_nakamura", personId: "per_med_nakamura", organizationId: null, title: "Sophie Nakamura — New Patient Intake", value: 500, stage: "lost", ownerId: "emp_med_torres", expectedCloseDate: "2026-06-10" },
  { id: "deal_med_boateng", personId: "per_med_boateng", organizationId: "org_med_greenfield", title: "Greenfield Manufacturing — Wellness Program Enrollment", value: 1800, stage: "negotiation", ownerId: "emp_med_ibarra", expectedCloseDate: "2026-07-30" },
  { id: "deal_med_alvarez", personId: "per_med_alvarez", organizationId: "org_med_northside", title: "Diego Alvarez — New Patient Intake (Ortho Referral)", value: 600, stage: "proposal", ownerId: "emp_med_okafor", expectedCloseDate: "2026-07-22" },
  { id: "deal_med_finch", personId: "per_med_finch", organizationId: null, title: "Harold Finch — New Patient Intake (Medicare)", value: 1200, stage: "won", ownerId: "emp_med_ibarra", expectedCloseDate: "2025-01-10" },
  { id: "deal_med_patel", personId: "per_med_patel", organizationId: "org_med_brightpath", title: "BrightPath Wellness Partners — Program Enrollment", value: 3000, stage: "won", ownerId: "emp_med_ibarra", expectedCloseDate: "2025-04-01" },
  { id: "deal_med_griggs", personId: "per_med_griggs", organizationId: "org_med_westside", title: "Olivia Griggs — New Patient Intake (Aging Out of Pediatric Care)", value: 350, stage: "new_lead", ownerId: "emp_med_torres", expectedCloseDate: "2026-07-20" },
];

// ---- Appointments ----
const jobs: Job[] = [
  { id: "job_med_reyes", name: "Annual Physical — Carla Reyes", client: "Carla Reyes", organizationId: "org_med_summit", status: "done", value: 220, startDate: "2026-07-08", dueDate: "2026-07-08", ownerId: "emp_med_okafor", description: "Comprehensive annual wellness exam, updated vaccinations, and a bloodwork order for an established patient." },
  { id: "job_med_donnelly", name: "Post-Discharge Follow-up — Walter Donnelly", client: "Walter Donnelly", organizationId: "org_med_valley", status: "in_progress", value: 180, startDate: "2026-07-08", dueDate: "2026-07-08", ownerId: "emp_med_feld", description: "14-day follow-up after a CHF hospitalization at Valley Regional Hospital — medication reconciliation and vitals check." },
  { id: "job_med_boateng", name: "Wellness Screening — Kwame Boateng", client: "Kwame Boateng", organizationId: "org_med_greenfield", status: "scheduled", value: 200, startDate: "2026-07-09", dueDate: "2026-07-09", ownerId: "emp_med_ashby", description: "Annual biometric screening under Greenfield Manufacturing's employer wellness program." },
  { id: "job_med_alvarez", name: "Post-Op Knee Follow-up — Diego Alvarez", client: "Diego Alvarez", organizationId: "org_med_northside", status: "scheduled", value: 150, startDate: "2026-07-10", dueDate: "2026-07-10", ownerId: "emp_med_okafor", description: "Follow-up visit after a referral from Northside Orthopedic Associates for post-surgical knee recovery." },
  { id: "job_med_finch", name: "Medicare Annual Wellness Visit — Harold Finch", client: "Harold Finch", organizationId: "org_med_harbormutual", status: "done", value: 240, startDate: "2026-06-24", dueDate: "2026-06-24", ownerId: "emp_med_feld", description: "Medicare Annual Wellness Visit with fall-risk screening and medication review for a long-time patient." },
  { id: "job_med_patel", name: "Wellness Screening — Nisha Patel", client: "Nisha Patel", organizationId: "org_med_brightpath", status: "done", value: 210, startDate: "2026-06-30", dueDate: "2026-06-30", ownerId: "emp_med_ashby", description: "Biometric screening and health coaching session under the BrightPath Wellness Partners employer program." },
  { id: "job_med_griggs", name: "New Patient Consult — Olivia Griggs", client: "Olivia Griggs", organizationId: "org_med_westside", status: "bid", value: 300, startDate: "2026-07-16", dueDate: "2026-07-16", ownerId: "emp_med_okafor", description: "Initial new-patient consultation for a patient aging out of Westside Pediatric Group; awaiting a confirmation call to finalize insurance verification." },
  { id: "job_med_nakamura", name: "New Patient Consult — Sophie Nakamura", client: "Sophie Nakamura", organizationId: "org_med_summit", status: "scheduled", value: 300, startDate: "2026-06-25", dueDate: "2026-06-25", ownerId: "emp_med_okafor", overdue: true, description: "New-patient consultation — patient no-showed and has not responded to two reschedule attempts." },
];

// ---- Patient billing / insurance claim invoices ----
const invoices: Invoice[] = [
  { id: "inv_med_3301", number: "INV-3301", client: "Carla Reyes", amount: 220, status: "paid", issuedDate: "2026-07-08", dueDate: "2026-07-22" },
  { id: "inv_med_3298", number: "INV-3298", client: "Walter Donnelly", amount: 180, status: "sent", issuedDate: "2026-07-08", dueDate: "2026-07-22" },
  { id: "inv_med_3280", number: "INV-3280", client: "Greenfield Manufacturing", amount: 1800, status: "sent", issuedDate: "2026-07-01", dueDate: "2026-07-31" },
  { id: "inv_med_3240", number: "INV-3240", client: "Harold Finch", amount: 240, status: "paid", issuedDate: "2026-06-24", dueDate: "2026-07-08" },
  { id: "inv_med_3255", number: "INV-3255", client: "Nisha Patel", amount: 210, status: "paid", issuedDate: "2026-06-30", dueDate: "2026-07-14" },
  { id: "inv_med_3199", number: "INV-3199", client: "Diego Alvarez", amount: 150, status: "overdue", issuedDate: "2026-05-20", dueDate: "2026-06-04" },
  { id: "inv_med_3312", number: "INV-3312", client: "Sophie Nakamura", amount: 75, status: "overdue", issuedDate: "2026-06-25", dueDate: "2026-07-02" },
  { id: "inv_med_3320", number: "INV-3320", client: "BrightPath Wellness Partners", amount: 3000, status: "sent", issuedDate: "2026-07-01", dueDate: "2026-07-31" },
];

// ---- Providers & staff ----
const employees: Employee[] = [
  { id: "emp_med_okafor", name: "Dr. Renee Okafor", initials: "RO", title: "Physician — Family Medicine", department: "Clinical", email: "renee.okafor@willowcreekfamilymed.com", phone: "(555) 618-1001", hireDate: "2015-09-01", role: "Owner", overdueCount: 0, status: "active" },
  { id: "emp_med_feld", name: "Dr. Marcus Feld", initials: "MF", title: "Physician — Family Medicine", department: "Clinical", email: "marcus.feld@willowcreekfamilymed.com", phone: "(555) 618-1002", hireDate: "2018-03-12", role: "Manager", overdueCount: 0, status: "active" },
  { id: "emp_med_ashby", name: "Lauren Ashby, NP", initials: "LA", title: "Nurse Practitioner", department: "Clinical", email: "lauren.ashby@willowcreekfamilymed.com", phone: "(555) 618-1003", hireDate: "2021-06-01", role: "Member", overdueCount: 0, overtimeHours: 6, status: "active" },
  { id: "emp_med_singh", name: "Priya Singh, RN", initials: "PS", title: "Registered Nurse", department: "Clinical", email: "priya.singh@willowcreekfamilymed.com", phone: "(555) 618-1004", hireDate: "2019-05-14", role: "Member", overdueCount: 0, status: "away" },
  { id: "emp_med_vue", name: "Tasha Vue", initials: "TV", title: "Medical Assistant", department: "Clinical", email: "tasha.vue@willowcreekfamilymed.com", phone: "(555) 618-1005", hireDate: "2022-01-10", role: "Member", overdueCount: 1, status: "active" },
  { id: "emp_med_ibarra", name: "Grace Ibarra", initials: "GI", title: "Practice Manager", department: "Admin", email: "grace.ibarra@willowcreekfamilymed.com", phone: "(555) 618-1006", hireDate: "2017-11-05", role: "Manager", overdueCount: 0, status: "active" },
  { id: "emp_med_torres", name: "Mia Torres", initials: "MT", title: "Front Desk Coordinator", department: "Front Office", email: "mia.torres@willowcreekfamilymed.com", phone: "(555) 618-1007", hireDate: "2023-02-20", role: "Member", overdueCount: 0, status: "active" },
  { id: "emp_med_cho", name: "Kevin Cho", initials: "KC", title: "Billing Specialist", department: "Billing", email: "kevin.cho@willowcreekfamilymed.com", phone: "(555) 618-1008", hireDate: "2020-08-15", role: "Member", overdueCount: 2, status: "active" },
];

const notifications: ActivityItem[] = [
  { id: "act_med_1", message: "Diego Alvarez's post-op knee follow-up confirmed for Jul 10", actor: "Mia Torres", timestamp: "This morning", kind: "job", module: "Appointments" },
  { id: "act_med_2", message: "New patient intake completed — Walter Donnelly (Valley Regional Hospital referral)", actor: "Grace Ibarra", timestamp: "Today", kind: "deal", module: "Patients" },
  { id: "act_med_3", message: "Sophie Nakamura no-showed for her New Patient Consult — deal moved to Lost", actor: "System", timestamp: "Yesterday", kind: "job", module: "Appointments" },
  { id: "act_med_4", message: "Lab results uploaded for Harold Finch — CBC and lipid panel", actor: "Priya Singh, RN", timestamp: "2 days ago", kind: "document", module: "Charts" },
  { id: "act_med_5", message: "Invoice INV-3199 (Diego Alvarez) is now 34 days overdue", actor: "System", timestamp: "Today", kind: "invoice", module: "Billing" },
  { id: "act_med_6", message: "Prior authorization approved for Kwame Boateng's wellness screening", actor: "Kevin Cho", timestamp: "3 days ago", kind: "approval", module: "Billing" },
  { id: "act_med_7", message: "Workflow \"Appointment Reminder — 24hr\" ran for 26 patients", actor: "Automation", timestamp: "Today", kind: "automation", module: "Automation" },
  { id: "act_med_8", message: "Priya Singh, RN is out this week — schedule adjusted", actor: "Grace Ibarra", timestamp: "Yesterday", kind: "message", module: "People" },
  { id: "act_med_9", message: "Nisha Patel completed her BrightPath wellness screening", actor: "Lauren Ashby, NP", timestamp: "3 days ago", kind: "job", module: "Appointments" },
  { id: "act_med_10", message: "New patient lead added — Olivia Griggs", actor: "Mia Torres", timestamp: "Today", kind: "deal", module: "Patients" },
  { id: "act_med_11", message: "Meeting completed: Weekly Clinical Huddle", actor: "Dr. Renee Okafor", timestamp: "1 week ago", kind: "meeting", module: "Meetings" },
  { id: "act_med_12", message: "Invoice INV-3320 (BrightPath Wellness Partners) sent for annual renewal", actor: "Kevin Cho", timestamp: "1 week ago", kind: "invoice", module: "Billing" },
  { id: "act_med_13", message: "Uploaded Donnelly-Discharge-Summary.pdf", actor: "Dr. Marcus Feld", timestamp: "Today", kind: "document", module: "Charts" },
  { id: "act_med_14", message: "Referral received from Northside Orthopedic Associates for Diego Alvarez", actor: "Grace Ibarra", timestamp: "5 days ago", kind: "deal", module: "Patients" },
  { id: "act_med_15", message: "Tasha Vue flagged 1 chart note pending co-signature", actor: "System", timestamp: "Today", kind: "task", module: "Charts" },
];

const monthlyFinancials: { month: string; revenue: number; operatingCost: number }[] = [
  { month: "Feb", revenue: 138000, operatingCost: 101000 },
  { month: "Mar", revenue: 141500, operatingCost: 103200 },
  { month: "Apr", revenue: 146800, operatingCost: 105500 },
  { month: "May", revenue: 151200, operatingCost: 108000 },
  { month: "Jun", revenue: 157400, operatingCost: 110900 },
  { month: "Jul", revenue: 164900, operatingCost: 112300 },
];

const noShowRateByMonth = [11, 10, 9, 9, 8, 7];

const revenueMtd = monthlyFinancials[monthlyFinancials.length - 1].revenue;
const revenuePrevMonth = monthlyFinancials[monthlyFinancials.length - 2].revenue;
const revenueDeltaPct = Math.round(((revenueMtd - revenuePrevMonth) / revenuePrevMonth) * 100);
const noShowRate = noShowRateByMonth[noShowRateByMonth.length - 1];
const noShowRatePrev = noShowRateByMonth[noShowRateByMonth.length - 2];

const appointmentsScheduledToday = 5;
const appointmentsConfirmedToday = 9;
const appointmentsCheckedInToday = 4;
const appointmentsCompletedToday = 8;
const appointmentsToday =
  appointmentsScheduledToday + appointmentsConfirmedToday + appointmentsCheckedInToday + appointmentsCompletedToday;

export const MEDICAL_DATASET: IndustryDataset = {
  profileKey: "medical",
  orgName: "Willow Creek Family Medicine",
  greetingSubtitle: "Here's what matters at Willow Creek Family Medicine today.",
  kpis: [
    {
      key: "revenue_mtd",
      label: "Revenue MTD",
      value: `$${revenueMtd.toLocaleString()}`,
      deltaLabel: `+${revenueDeltaPct}% vs last month`,
      tone: "positive",
      trend: monthlyFinancials.map((m) => m.revenue),
    },
    {
      key: "no_show_rate",
      label: "No-show Rate",
      value: `${noShowRate}%`,
      deltaLabel: `${noShowRate - noShowRatePrev} pt vs last month`,
      tone: "positive",
      trend: noShowRateByMonth,
    },
    {
      key: "appointments_today",
      label: "Appointments Today",
      value: String(appointmentsToday),
      deltaLabel: `${appointmentsScheduledToday} still awaiting confirmation`,
      tone: "neutral",
    },
  ],
  monthlyChart: {
    title: "Revenue vs. operating cost — 6 months",
    primaryLabel: "Revenue",
    secondaryLabel: "Operating Cost",
    unit: "currency",
    months: monthlyFinancials.map((m) => ({ month: m.month, primary: m.revenue, secondary: m.operatingCost })),
  },
  breakdownChart: {
    title: "Appointment status today",
    segments: [
      { label: "Scheduled", count: appointmentsScheduledToday },
      { label: "Confirmed", count: appointmentsConfirmedToday },
      { label: "Checked In / In Progress", count: appointmentsCheckedInToday },
      { label: "Completed", count: appointmentsCompletedToday },
    ],
  },
  organizations,
  people,
  deals,
  jobs,
  invoices,
  employees,
  notifications,
  aiRecommendations: [
    "Diego Alvarez's copay balance (INV-3199, $150) is now 34 days overdue — a quick call before Thursday's follow-up visit usually clears the balance faster than another billing letter.",
    "Sophie Nakamura no-showed for her New Patient Consult and hasn't rebooked — a same-day outreach from Mia Torres tends to recover about half of lost new-patient leads like this.",
    "No-show rate has dropped to 7% from 11% six months ago — the 24-hour reminder automation is working; consider adding a 48-hour first touch to push it lower still.",
    "Greenfield Manufacturing's wellness enrollment deal ($1,800) has been in Negotiation for over a week — Kwame Boateng's completed screening is a good proof point to close the broader employer contract.",
  ],
};
