import type {
  ActivityItem,
  Deal,
  Employee,
  IndustryDataset,
  Invoice,
  Job,
  Organization,
  Person,
} from "@/types";

// ---- Willowmere Event Center — mock dataset ----
// Everything below is authored specifically for the Event Center industry
// profile. Job -> "Event", Customer -> "Client", Employee -> "Coordinator".

const EVENT_ORGANIZATIONS: Organization[] = [
  { id: "org_ec_whitfieldreyes", name: "The Whitfield-Reyes Wedding", domain: "", industry: "Private Event", ownerId: "emp_ec_holly", createdAt: "2025-06-20" },
  { id: "org_ec_park", name: "The Park-Delgado Wedding", domain: "", industry: "Private Event", ownerId: "emp_ec_holly", createdAt: "2025-08-01" },
  { id: "org_ec_summit", name: "Summit Ridge Capital", domain: "summitridgecapital.com", industry: "Corporate", ownerId: "emp_ec_dante", createdAt: "2025-01-15" },
  { id: "org_ec_northlake", name: "Northlake Children's Foundation", domain: "northlakechildrens.org", industry: "Nonprofit", ownerId: "emp_ec_holly", createdAt: "2025-09-10" },
  { id: "org_ec_vantage", name: "Vantage Analytics", domain: "vantageanalytics.io", industry: "Corporate", ownerId: "emp_ec_dante", createdAt: "2024-11-01" },
  { id: "org_ec_hollis", name: "The Hollis-Bennett Wedding", domain: "", industry: "Private Event", ownerId: "emp_ec_holly", createdAt: "2025-10-05" },
  { id: "org_ec_riverbend", name: "Riverbend Rotary Club", domain: "riverbendrotary.org", industry: "Nonprofit", ownerId: "emp_ec_holly", createdAt: "2026-05-12" },
  { id: "org_ec_ferris", name: "Ferris & Cole Law Group", domain: "ferriscole.com", industry: "Corporate", ownerId: "emp_ec_holly", createdAt: "2026-06-30" },
  { id: "org_ec_amara", name: "The Amara-Singh Wedding", domain: "", industry: "Private Event", ownerId: "emp_ec_holly", createdAt: "2025-12-15" },
  { id: "org_ec_gladstone", name: "Gladstone Manufacturing", domain: "gladstonemfg.com", industry: "Corporate", ownerId: "emp_ec_holly", createdAt: "2026-03-01" },
];

const EVENT_PEOPLE: Person[] = [
  { id: "per_ec_claire", firstName: "Claire", lastName: "Whitfield", email: "claire.whitfield@gmail.com", phone: "(555) 480-1011", organizationId: "org_ec_whitfieldreyes", personType: "customer", ownerId: "emp_ec_holly", createdAt: "2025-06-20", lastContact: "1 month ago" },
  { id: "per_ec_derek", firstName: "Derek", lastName: "Park", email: "derek.park@icloud.com", phone: "(555) 480-1022", organizationId: "org_ec_park", personType: "customer", ownerId: "emp_ec_holly", createdAt: "2025-08-01", lastContact: "Today" },
  { id: "per_ec_natalie", firstName: "Natalie", lastName: "Cho", email: "natalie.cho@summitridgecapital.com", phone: "(555) 480-1033", organizationId: "org_ec_summit", personType: "customer", ownerId: "emp_ec_dante", createdAt: "2025-01-15", lastContact: "1 week ago" },
  { id: "per_ec_martin", firstName: "Martin", lastName: "Alvarez", email: "martin.alvarez@northlakechildrens.org", phone: "(555) 480-1044", organizationId: "org_ec_northlake", personType: "customer", ownerId: "emp_ec_holly", createdAt: "2025-09-10", lastContact: "2 weeks ago" },
  { id: "per_ec_sophia", firstName: "Sophia", lastName: "Reyes-Kim", email: "sophia.reyeskim@vantageanalytics.io", phone: "(555) 480-1055", organizationId: "org_ec_vantage", personType: "customer", ownerId: "emp_ec_dante", createdAt: "2024-11-01", lastContact: "Today" },
  { id: "per_ec_brianna", firstName: "Brianna", lastName: "Hollis", email: "brianna.hollis@yahoo.com", phone: "(555) 480-1066", organizationId: "org_ec_hollis", personType: "customer", ownerId: "emp_ec_holly", createdAt: "2025-10-05", lastContact: "4 days ago" },
  { id: "per_ec_walter", firstName: "Walter", lastName: "Osei", email: "walter.osei@riverbendrotary.org", phone: "(555) 480-1077", organizationId: "org_ec_riverbend", personType: "lead", ownerId: "emp_ec_holly", createdAt: "2026-05-12", lastContact: "5 days ago" },
  { id: "per_ec_diane", firstName: "Diane", lastName: "Ferris", email: "diane.ferris@ferriscole.com", phone: "(555) 480-1088", organizationId: "org_ec_ferris", personType: "lead", ownerId: "emp_ec_holly", createdAt: "2026-06-30", lastContact: "Yesterday" },
  { id: "per_ec_amara", firstName: "Amara", lastName: "Singh", email: "amara.singh@outlook.com", phone: "(555) 480-1099", organizationId: "org_ec_amara", personType: "lead", ownerId: "emp_ec_holly", createdAt: "2025-12-15", lastContact: "2 days ago" },
  { id: "per_ec_curtis", firstName: "Curtis", lastName: "Nguyen", email: "curtis.nguyen@gladstonemfg.com", phone: "(555) 480-1100", organizationId: "org_ec_gladstone", personType: "lead", ownerId: "emp_ec_holly", createdAt: "2026-03-01", lastContact: "1 month ago" },
];

const EVENT_DEALS: Deal[] = [
  { id: "deal_ec_whitfieldreyes", personId: "per_ec_claire", organizationId: "org_ec_whitfieldreyes", title: "Whitfield-Reyes Wedding — Grand Ballroom", value: 28500, stage: "won", ownerId: "emp_ec_holly", expectedCloseDate: "2025-07-10" },
  { id: "deal_ec_park", personId: "per_ec_derek", organizationId: "org_ec_park", title: "Park-Delgado Wedding — Grand Ballroom", value: 19500, stage: "won", ownerId: "emp_ec_holly", expectedCloseDate: "2025-09-01" },
  { id: "deal_ec_summit", personId: "per_ec_natalie", organizationId: "org_ec_summit", title: "Summit Ridge Capital Holiday Party — Grand Ballroom", value: 34000, stage: "won", ownerId: "emp_ec_holly", expectedCloseDate: "2026-06-15" },
  { id: "deal_ec_northlake", personId: "per_ec_martin", organizationId: "org_ec_northlake", title: "Northlake Children's Foundation Gala — Grand Ballroom", value: 42000, stage: "won", ownerId: "emp_ec_holly", expectedCloseDate: "2026-01-20" },
  { id: "deal_ec_vantage", personId: "per_ec_sophia", organizationId: "org_ec_vantage", title: "Vantage Analytics Q3 Offsite — The Loft", value: 15800, stage: "won", ownerId: "emp_ec_holly", expectedCloseDate: "2026-05-01" },
  { id: "deal_ec_hollis", personId: "per_ec_brianna", organizationId: "org_ec_hollis", title: "Hollis-Bennett Wedding — Magnolia Room", value: 22000, stage: "won", ownerId: "emp_ec_holly", expectedCloseDate: "2026-05-15" },
  { id: "deal_ec_amara", personId: "per_ec_amara", organizationId: "org_ec_amara", title: "Amara-Singh Wedding — Grand Ballroom", value: 45000, stage: "negotiation", ownerId: "emp_ec_holly", expectedCloseDate: "2026-07-31" },
  { id: "deal_ec_riverbend", personId: "per_ec_walter", organizationId: "org_ec_riverbend", title: "Riverbend Rotary Annual Dinner — Skyline Room", value: 8200, stage: "proposal", ownerId: "emp_ec_holly", expectedCloseDate: "2026-07-25" },
  { id: "deal_ec_ferris", personId: "per_ec_diane", organizationId: "org_ec_ferris", title: "Ferris & Cole Holiday Party — Garden Terrace", value: 11500, stage: "contacted", ownerId: "emp_ec_holly", expectedCloseDate: "2026-08-15" },
  { id: "deal_ec_gladstone", personId: "per_ec_curtis", organizationId: "org_ec_gladstone", title: "Gladstone Manufacturing Retirement Dinner — The Loft", value: 6400, stage: "lost", ownerId: "emp_ec_holly", expectedCloseDate: "2026-04-10" },
];

const EVENT_JOBS: Job[] = [
  {
    id: "job_ec_whitfieldreyes",
    name: "Whitfield-Reyes Wedding",
    client: "The Whitfield-Reyes Wedding",
    organizationId: "org_ec_whitfieldreyes",
    status: "done",
    value: 28500,
    startDate: "2026-05-16",
    dueDate: "2026-05-16",
    ownerId: "emp_ec_maya",
    description: "180-guest wedding reception in the Grand Ballroom with a five-course plated dinner from the in-house catering team and a live 6-piece band; ceremony held on the Garden Terrace at sunset.",
  },
  {
    id: "job_ec_northlake",
    name: "Northlake Children's Foundation Gala",
    client: "Northlake Children's Foundation",
    organizationId: "org_ec_northlake",
    status: "done",
    value: 42000,
    startDate: "2026-06-06",
    dueDate: "2026-06-06",
    ownerId: "emp_ec_grant",
    description: "300-guest fundraising gala in the Grand Ballroom with silent-auction staging, a full AV package for the paddle-raise, and a seated three-course dinner — raised a record amount for the foundation.",
  },
  {
    id: "job_ec_summitretreat",
    name: "Summit Ridge Capital Team Offsite",
    client: "Summit Ridge Capital",
    organizationId: "org_ec_summit",
    status: "done",
    value: 9200,
    startDate: "2026-04-24",
    dueDate: "2026-04-24",
    ownerId: "emp_ec_dante",
    description: "Half-day leadership offsite for 40 in The Loft, boardroom-style AV setup, working lunch and afternoon coffee service.",
  },
  {
    id: "job_ec_summitholiday",
    name: "Summit Ridge Capital Holiday Party",
    client: "Summit Ridge Capital",
    organizationId: "org_ec_summit",
    status: "scheduled",
    value: 34000,
    startDate: "2026-12-12",
    dueDate: "2026-12-12",
    ownerId: "emp_ec_dante",
    description: "220-person corporate holiday party in the Grand Ballroom — plated dinner, open bar, live DJ, and a step-and-repeat photo backdrop at the entrance.",
  },
  {
    id: "job_ec_hollis",
    name: "Hollis-Bennett Wedding",
    client: "The Hollis-Bennett Wedding",
    organizationId: "org_ec_hollis",
    status: "scheduled",
    value: 22000,
    startDate: "2026-09-12",
    dueDate: "2026-09-12",
    ownerId: "emp_ec_maya",
    description: "140-guest wedding in the Magnolia Room — cocktail-style reception, buffet catering, and a string quartet for the ceremony on the Garden Terrace.",
  },
  {
    id: "job_ec_amara",
    name: "Amara-Singh Wedding",
    client: "The Amara-Singh Wedding",
    organizationId: "org_ec_amara",
    status: "bid",
    value: 45000,
    startDate: "2026-10-24",
    dueDate: "2026-10-24",
    ownerId: "emp_ec_maya",
    description: "260-guest wedding tentatively held across the Grand Ballroom and Garden Terrace pending final contract sign-off — proposed multi-course plated dinner, full floral buildout, and a 10-piece live band.",
  },
  {
    id: "job_ec_vantageq3",
    name: "Vantage Analytics Q3 Offsite",
    client: "Vantage Analytics",
    organizationId: "org_ec_vantage",
    status: "in_progress",
    value: 15800,
    startDate: "2026-07-08",
    dueDate: "2026-07-09",
    ownerId: "emp_ec_owen",
    description: "Two-day leadership offsite for 65 in The Loft, full conference AV and breakout-room setup, catered lunches both days plus a closing happy hour tonight.",
  },
  {
    id: "job_ec_parkdelgado",
    name: "Park-Delgado Wedding",
    client: "The Park-Delgado Wedding",
    organizationId: "org_ec_park",
    status: "in_progress",
    value: 19500,
    startDate: "2026-07-11",
    dueDate: "2026-07-11",
    ownerId: "emp_ec_grant",
    description: "160-guest wedding weekend — Friday rehearsal dinner in The Loft, Saturday reception in the Grand Ballroom; final headcount and floor plan are due from the couple this week.",
  },
  {
    id: "job_ec_riverbend",
    name: "Riverbend Rotary Annual Dinner",
    client: "Riverbend Rotary Club",
    organizationId: "org_ec_riverbend",
    status: "bid",
    value: 8200,
    startDate: "2026-09-05",
    dueDate: "2026-09-05",
    ownerId: "emp_ec_dante",
    description: "90-guest annual awards dinner proposed for the Skyline Room — plated dinner and a podium/mic setup for the awards program; proposal is out and awaiting a board vote.",
  },
  {
    id: "job_ec_ferris",
    name: "Ferris & Cole Holiday Party",
    client: "Ferris & Cole Law Group",
    organizationId: "org_ec_ferris",
    status: "bid",
    value: 11500,
    startDate: "2026-12-05",
    dueDate: "2026-12-05",
    ownerId: "emp_ec_holly",
    description: "Tentative hold on the Garden Terrace for roughly 70 guests pending their final headcount and menu selections — still an early-stage inquiry.",
  },
];

const EVENT_INVOICES: Invoice[] = [
  { id: "inv_ec_2101", number: "DEP-2101", client: "The Whitfield-Reyes Wedding", amount: 5000, status: "paid", issuedDate: "2026-02-15", dueDate: "2026-03-01", depositAmount: 5000, depositPaid: true },
  { id: "inv_ec_2102", number: "BAL-2102", client: "The Whitfield-Reyes Wedding", amount: 23500, status: "paid", issuedDate: "2026-04-20", dueDate: "2026-05-09" },
  { id: "inv_ec_2108", number: "DEP-2108", client: "Summit Ridge Capital", amount: 8500, status: "paid", issuedDate: "2026-06-20", dueDate: "2026-07-05", depositAmount: 8500, depositPaid: true },
  { id: "inv_ec_2130", number: "DEP2-2130", client: "Summit Ridge Capital", amount: 12000, status: "sent", issuedDate: "2026-07-01", dueDate: "2026-08-01", depositAmount: 12000, depositPaid: false },
  { id: "inv_ec_2112", number: "DEP-2112", client: "Northlake Children's Foundation", amount: 10500, status: "paid", issuedDate: "2026-05-05", dueDate: "2026-05-19", depositAmount: 10500, depositPaid: true },
  { id: "inv_ec_2115", number: "DEP-2115", client: "Vantage Analytics", amount: 3950, status: "paid", issuedDate: "2026-06-01", dueDate: "2026-06-15", depositAmount: 3950, depositPaid: true },
  { id: "inv_ec_2119", number: "DEP-2119", client: "The Hollis-Bennett Wedding", amount: 5500, status: "overdue", issuedDate: "2026-06-10", dueDate: "2026-06-24", depositAmount: 5500, depositPaid: false },
  { id: "inv_ec_2123", number: "BAL-2123", client: "The Park-Delgado Wedding", amount: 9750, status: "overdue", issuedDate: "2026-06-01", dueDate: "2026-07-01" },
];

const EVENT_EMPLOYEES: Employee[] = [
  { id: "emp_ec_renee", name: "Renee Calloway", initials: "RC", title: "Owner & General Manager", department: "Executive", email: "renee.calloway@willowmereevents.com", phone: "(555) 610-1001", hireDate: "2018-04-02", role: "Owner", overdueCount: 0, status: "active" },
  { id: "emp_ec_holly", name: "Holly Bennett", initials: "HB", title: "Sales & Bookings Manager", department: "Sales", email: "holly.bennett@willowmereevents.com", phone: "(555) 610-1002", hireDate: "2020-02-10", role: "Manager", overdueCount: 0, status: "active" },
  { id: "emp_ec_dante", name: "Dante Ruiz", initials: "DR", title: "Venue Manager", department: "Operations", email: "dante.ruiz@willowmereevents.com", phone: "(555) 610-1003", hireDate: "2019-08-19", role: "Manager", overdueCount: 0, overtimeHours: 14, status: "active" },
  { id: "emp_ec_priscilla", name: "Priscilla Nakamura", initials: "PN", title: "Catering Director", department: "Catering", email: "priscilla.nakamura@willowmereevents.com", phone: "(555) 610-1004", hireDate: "2021-05-03", role: "Manager", overdueCount: 1, status: "active" },
  { id: "emp_ec_owen", name: "Owen Fitzgerald", initials: "OF", title: "AV/Production Lead", department: "Production", email: "owen.fitzgerald@willowmereevents.com", phone: "(555) 610-1005", hireDate: "2022-09-12", role: "Member", overdueCount: 0, status: "active" },
  { id: "emp_ec_maya", name: "Maya Sutton", initials: "MS", title: "Event Coordinator", department: "Events", email: "maya.sutton@willowmereevents.com", phone: "(555) 610-1006", hireDate: "2023-03-06", role: "Member", overdueCount: 1, status: "active" },
  { id: "emp_ec_grant", name: "Grant Ochoa", initials: "GO", title: "Event Coordinator", department: "Events", email: "grant.ochoa@willowmereevents.com", phone: "(555) 610-1007", hireDate: "2024-06-24", role: "Member", overdueCount: 0, status: "active" },
  { id: "emp_ec_lydia", name: "Lydia Park", initials: "LP", title: "Office Administrator", department: "Admin", email: "lydia.park@willowmereevents.com", phone: "(555) 610-1008", hireDate: "2021-11-15", role: "Admin", overdueCount: 0, status: "away" },
];

const EVENT_ACTIVITY: ActivityItem[] = [
  { id: "act_ec_1", message: "Park-Delgado Wedding final balance (BAL-2123) is now 7 days overdue", actor: "System", timestamp: "Today", kind: "invoice", module: "Finance" },
  { id: "act_ec_2", message: "Sent second deposit invoice to Summit Ridge Capital (DEP2-2130)", actor: "Lydia Park", timestamp: "1 week ago", kind: "invoice", module: "Finance" },
  { id: "act_ec_3", message: "New inquiry: Ferris & Cole Law Group holiday party", actor: "Holly Bennett", timestamp: "Yesterday", kind: "deal", module: "CRM" },
  { id: "act_ec_4", message: "Contract signed — Hollis-Bennett Wedding", actor: "Holly Bennett", timestamp: "1 week ago", kind: "deal", module: "CRM" },
  { id: "act_ec_5", message: "Floor plan uploaded for Amara-Singh Wedding — Grand Ballroom", actor: "Maya Sutton", timestamp: "3 days ago", kind: "document", module: "Documents" },
  { id: "act_ec_6", message: "Walkthrough scheduled with Vantage Analytics ahead of the Q3 offsite", actor: "Owen Fitzgerald", timestamp: "2 days ago", kind: "meeting", module: "Meetings" },
  { id: "act_ec_7", message: "Vendor confirmed: floral order for Amara-Singh Wedding", actor: "Priscilla Nakamura", timestamp: "4 days ago", kind: "task", module: "Projects" },
  { id: "act_ec_8", message: "Maya Sutton assigned as lead coordinator — Park-Delgado Wedding", actor: "Dante Ruiz", timestamp: "1 week ago", kind: "job", module: "Projects" },
  { id: "act_ec_9", message: "Northlake Children's Foundation Gala marked Completed", actor: "Grant Ochoa", timestamp: "1 month ago", kind: "job", module: "Projects" },
  { id: "act_ec_10", message: "Workflow \"Deposit Reminder\" ran for Hollis-Bennett Wedding", actor: "Automation", timestamp: "Today", kind: "automation", module: "Automation" },
  { id: "act_ec_11", message: "Purchase request approved — extra linens for Amara-Singh Wedding", actor: "Renee Calloway", timestamp: "2 days ago", kind: "approval", module: "Finance" },
  { id: "act_ec_12", message: "Grant Ochoa started as Event Coordinator", actor: "Renee Calloway", timestamp: "3 weeks ago", kind: "hire", module: "People" },
  { id: "act_ec_13", message: "Sent 4 messages in #bookings", actor: "Holly Bennett", timestamp: "Today", kind: "message", module: "Communications" },
  { id: "act_ec_14", message: "Proposal sent — Riverbend Rotary Annual Dinner, Skyline Room", actor: "Dante Ruiz", timestamp: "5 days ago", kind: "deal", module: "CRM" },
  { id: "act_ec_15", message: "Invoice DEP-2108 (Summit Ridge Capital) paid in full", actor: "System", timestamp: "2 weeks ago", kind: "invoice", module: "Finance" },
  { id: "act_ec_16", message: "Deal marked Lost — Gladstone Manufacturing Retirement Dinner", actor: "Holly Bennett", timestamp: "1 week ago", kind: "deal", module: "CRM" },
  { id: "act_ec_17", message: "Uploaded Vantage-Analytics-Offsite-Floor-Plan.pdf", actor: "Owen Fitzgerald", timestamp: "This morning", kind: "document", module: "Documents" },
  { id: "act_ec_18", message: "Meeting completed: Weekly Ops & Events Walkthrough", actor: "Renee Calloway", timestamp: "1 week ago", kind: "meeting", module: "Meetings" },
];

const MONTHLY_REVENUE_COSTS: { month: string; primary: number; secondary: number }[] = [
  { month: "Feb", primary: 58200, secondary: 39500 },
  { month: "Mar", primary: 67400, secondary: 44100 },
  { month: "Apr", primary: 79800, secondary: 49800 },
  { month: "May", primary: 101500, secondary: 61200 },
  { month: "Jun", primary: 110000, secondary: 66500 },
  { month: "Jul", primary: 125400, secondary: 72900 },
];

const REVENUE_MTD = MONTHLY_REVENUE_COSTS[MONTHLY_REVENUE_COSTS.length - 1].primary;
const REVENUE_LAST_MONTH = MONTHLY_REVENUE_COSTS[MONTHLY_REVENUE_COSTS.length - 2].primary;
const REVENUE_DELTA_PCT = Math.round(((REVENUE_MTD - REVENUE_LAST_MONTH) / REVENUE_LAST_MONTH) * 100);

const outstandingInvoices = EVENT_INVOICES.filter((inv) => inv.status !== "paid");
const overdueInvoices = EVENT_INVOICES.filter((inv) => inv.status === "overdue");
const depositsOutstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
const eventsThisWeek = EVENT_JOBS.filter((job) => job.status === "in_progress");

export const EVENT_CENTER_DATASET: IndustryDataset = {
  profileKey: "event_center",
  orgName: "Willowmere Event Center",
  greetingSubtitle: "Here's what matters at Willowmere Event Center today.",
  kpis: [
    {
      key: "revenue_mtd",
      label: "Revenue MTD",
      value: `$${REVENUE_MTD.toLocaleString()}`,
      deltaLabel: `+${REVENUE_DELTA_PCT}% vs last month`,
      tone: "positive",
      trend: MONTHLY_REVENUE_COSTS.map((m) => m.primary),
    },
    {
      key: "deposits_outstanding",
      label: "Deposits Outstanding",
      value: `$${depositsOutstanding.toLocaleString()}`,
      deltaLabel:
        overdueInvoices.length > 0
          ? `${overdueInvoices.length} overdue: ${overdueInvoices.map((inv) => inv.client).join(", ")}`
          : "All current",
      tone: overdueInvoices.length > 0 ? "negative" : "positive",
    },
    {
      key: "events_this_week",
      label: "Events This Week",
      value: `${eventsThisWeek.length} events`,
      deltaLabel: eventsThisWeek.map((job) => job.name).join(", ") || "No events on the calendar this week",
      tone: "neutral",
    },
  ],
  monthlyChart: {
    title: "Booked revenue vs. vendor & operating costs — 6 months",
    primaryLabel: "Revenue",
    secondaryLabel: "Costs",
    unit: "currency",
    months: MONTHLY_REVENUE_COSTS,
  },
  breakdownChart: {
    title: "Event pipeline breakdown",
    segments: [
      { label: "Inquiry", count: EVENT_JOBS.filter((job) => job.status === "bid").length },
      { label: "Booked", count: EVENT_JOBS.filter((job) => job.status === "scheduled").length },
      { label: "This Week", count: EVENT_JOBS.filter((job) => job.status === "in_progress").length },
      { label: "Completed", count: EVENT_JOBS.filter((job) => job.status === "done").length },
    ],
  },
  organizations: EVENT_ORGANIZATIONS,
  people: EVENT_PEOPLE,
  deals: EVENT_DEALS,
  jobs: EVENT_JOBS,
  invoices: EVENT_INVOICES,
  employees: EVENT_EMPLOYEES,
  notifications: EVENT_ACTIVITY,
  pipelineStageLabels: {
    new_lead: "Inquiry",
    contacted: "Contacted",
    proposal: "Proposal Sent",
    negotiation: "Contract & Deposit",
    won: "Booked",
    lost: "Lost",
  },
  aiRecommendations: [
    "The Hollis-Bennett Wedding deposit (DEP-2119, $5,500) is now about two weeks past due — a quick text to Brianna Hollis usually gets a faster response than another emailed invoice.",
    "The Park-Delgado Wedding's final balance (BAL-2123, $9,750) is still outstanding with the reception this Saturday — worth a same-day call from Holly instead of waiting on email.",
    "The Amara-Singh Wedding ($45,000, Grand Ballroom) has been sitting in negotiation since December — it's the largest deal in the pipeline, so getting Amara Singh on a call this week to finalize the contract is worth prioritizing over smaller inquiries.",
    "Riverbend Rotary Club's proposal for the Skyline Room has been out for a while awaiting a board vote — a light check-in from Dante Ruiz this week keeps Willowmere top of mind before they decide.",
  ],
};
