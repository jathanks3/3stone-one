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

// ---- Thornbury Hospitality Group ----
// Three-location restaurant group (Uptown, Riverside, Lakeside — flagship brand
// "Thornbury Kitchen & Tap") plus a growing catering & private-events arm that
// books corporate lunches, weddings, and venue partnerships across the region.

const RESTAURANT_ORGANIZATIONS: Organization[] = [
  { id: "org_rst_meridian", name: "Meridian Capital Partners", domain: "meridiancapital.com", industry: "Financial Services", ownerId: "emp_rst_dana", createdAt: "2025-02-18" },
  { id: "org_rst_langley", name: "Langley & Cross LLP", domain: "langleycross.com", industry: "Legal Services", ownerId: "emp_rst_dana", createdAt: "2025-05-06" },
  { id: "org_rst_oakhurst", name: "Oakhurst Country Club", domain: "oakhurstcc.org", industry: "Private Club", ownerId: "emp_rst_devon", createdAt: "2025-01-08" },
  { id: "org_rst_ridgeview", name: "Ridgeview University", domain: "ridgeview.edu", industry: "Higher Education", ownerId: "emp_rst_renata", createdAt: "2025-02-27" },
  { id: "org_rst_wilmont", name: "The Wilmont Estate", domain: "wilmontestate.com", industry: "Event Venue", ownerId: "emp_rst_dana", createdAt: "2025-03-25" },
  { id: "org_rst_brightside", name: "Brightside Health Partners", domain: "brightsidehealth.com", industry: "Healthcare", ownerId: "emp_rst_dana", createdAt: "2025-06-14" },
  { id: "org_rst_harlow", name: "Harlow & Vance Advertising", domain: "harlowvance.com", industry: "Marketing & Advertising", ownerId: "emp_rst_dana", createdAt: "2025-07-01" },
  { id: "org_rst_summit", name: "Summit Ridge Realty Group", domain: "summitridgerealty.com", industry: "Real Estate", ownerId: "emp_rst_dana", createdAt: "2026-01-20" },
  { id: "org_rst_glenmoor", name: "Glenmoor Golf & Events", domain: "glenmoorgolfclub.com", industry: "Private Club", ownerId: "emp_rst_devon", createdAt: "2026-04-02" },
];

const RESTAURANT_PEOPLE: Person[] = [
  { id: "per_rst_whitney", firstName: "Whitney", lastName: "Sorrell", email: "whitney.sorrell@meridiancapital.com", phone: "(555) 734-0142", organizationId: "org_rst_meridian", personType: "customer", ownerId: "emp_rst_dana", createdAt: "2025-02-18", lastContact: "3 days ago" },
  { id: "per_rst_owen", firstName: "Owen", lastName: "Radcliffe", email: "owen.radcliffe@langleycross.com", phone: "(555) 734-0298", organizationId: "org_rst_langley", personType: "customer", ownerId: "emp_rst_dana", createdAt: "2025-05-06", lastContact: "1 week ago" },
  { id: "per_rst_deborah", firstName: "Deborah", lastName: "Ashcombe", email: "deborah.ashcombe@oakhurstcc.org", phone: "(555) 734-0355", organizationId: "org_rst_oakhurst", personType: "contact", ownerId: "emp_rst_devon", createdAt: "2025-01-08", lastContact: "Yesterday" },
  { id: "per_rst_terrence", firstName: "Terrence", lastName: "Boyle", email: "terrence.boyle@ridgeview.edu", phone: "(555) 734-0410", organizationId: "org_rst_ridgeview", personType: "customer", ownerId: "emp_rst_renata", createdAt: "2025-02-27", lastContact: "5 days ago" },
  { id: "per_rst_josephine", firstName: "Josephine", lastName: "Marchetti", email: "josephine.marchetti@wilmontestate.com", phone: "(555) 734-0567", organizationId: "org_rst_wilmont", personType: "customer", ownerId: "emp_rst_dana", createdAt: "2025-03-25", lastContact: "2 days ago" },
  { id: "per_rst_angela", firstName: "Angela", lastName: "Restrepo", email: "angela.restrepo@brightsidehealth.com", phone: "(555) 734-0623", organizationId: "org_rst_brightside", personType: "customer", ownerId: "emp_rst_dana", createdAt: "2025-06-14", lastContact: "Today" },
  { id: "per_rst_miles", firstName: "Miles", lastName: "Thackeray", email: "miles.thackeray@harlowvance.com", phone: "(555) 734-0789", organizationId: "org_rst_harlow", personType: "lead", ownerId: "emp_rst_dana", createdAt: "2025-07-01", lastContact: "6 days ago" },
  { id: "per_rst_natalie", firstName: "Natalie", lastName: "Fenwick", email: "natalie.fenwick@summitridgerealty.com", phone: "(555) 734-0845", organizationId: "org_rst_summit", personType: "lead", ownerId: "emp_rst_dana", createdAt: "2026-01-20", lastContact: "This morning" },
  { id: "per_rst_preston", firstName: "Preston", lastName: "Aldergate", email: "preston.aldergate@glenmoorgolfclub.com", phone: "(555) 734-0912", organizationId: "org_rst_glenmoor", personType: "lead", ownerId: "emp_rst_devon", createdAt: "2026-04-02", lastContact: "Today" },
];

const RESTAURANT_DEALS: Deal[] = [
  { id: "deal_rst_meridian", personId: "per_rst_whitney", organizationId: "org_rst_meridian", title: "Meridian Capital Partners Office Lunch Program", value: 3200, stage: "won", ownerId: "emp_rst_dana", expectedCloseDate: "2026-02-01" },
  { id: "deal_rst_langley", personId: "per_rst_owen", organizationId: "org_rst_langley", title: "Langley & Cross Client Appreciation Dinner", value: 6800, stage: "won", ownerId: "emp_rst_dana", expectedCloseDate: "2026-05-01" },
  { id: "deal_rst_oakhurst", personId: "per_rst_deborah", organizationId: "org_rst_oakhurst", title: "Oakhurst Country Club Summer Gala Co-Catering", value: 9200, stage: "negotiation", ownerId: "emp_rst_devon", expectedCloseDate: "2026-08-01" },
  { id: "deal_rst_ridgeview", personId: "per_rst_terrence", organizationId: "org_rst_ridgeview", title: "Ridgeview University Homecoming Tailgate Catering", value: 12500, stage: "won", ownerId: "emp_rst_renata", expectedCloseDate: "2026-06-15" },
  { id: "deal_rst_wilmont", personId: "per_rst_josephine", organizationId: "org_rst_wilmont", title: "The Wilmont Estate Preferred Caterer Agreement", value: 14800, stage: "won", ownerId: "emp_rst_dana", expectedCloseDate: "2026-06-01" },
  { id: "deal_rst_brightside", personId: "per_rst_angela", organizationId: "org_rst_brightside", title: "Brightside Health Partners Quarterly Staff Luncheon", value: 2400, stage: "proposal", ownerId: "emp_rst_dana", expectedCloseDate: "2026-08-01" },
  { id: "deal_rst_harlow", personId: "per_rst_miles", organizationId: "org_rst_harlow", title: "Harlow & Vance Holiday Party Catering", value: 5400, stage: "contacted", ownerId: "emp_rst_dana", expectedCloseDate: "2026-11-15" },
  { id: "deal_rst_summit", personId: "per_rst_natalie", organizationId: "org_rst_summit", title: "Summit Ridge Realty Client Appreciation Mixer", value: 4100, stage: "new_lead", ownerId: "emp_rst_dana", expectedCloseDate: "2026-09-10" },
  { id: "deal_rst_glenmoor", personId: "per_rst_preston", organizationId: "org_rst_glenmoor", title: "Glenmoor Golf & Events Member Wedding Package Pilot", value: 11200, stage: "negotiation", ownerId: "emp_rst_devon", expectedCloseDate: "2026-08-05" },
];

const RESTAURANT_JOBS: Job[] = [
  {
    id: "job_rst_meridian",
    name: "Meridian Capital Partners — Office Lunch Program",
    client: "Meridian Capital Partners",
    organizationId: "org_rst_meridian",
    status: "in_progress",
    value: 9600,
    startDate: "2026-01-05",
    dueDate: "2026-12-31",
    ownerId: "emp_rst_dana",
    description: "Recurring boxed-lunch service for 85 employees across two floors of Meridian's downtown office, delivered every Tuesday and Thursday with a rotating seasonal menu.",
  },
  {
    id: "job_rst_langley",
    name: "Langley & Cross Client Appreciation Dinner",
    client: "Langley & Cross LLP",
    organizationId: "org_rst_langley",
    status: "done",
    value: 6800,
    startDate: "2026-05-10",
    dueDate: "2026-05-15",
    ownerId: "emp_rst_dana",
    description: "Plated three-course dinner for 40 partners and top clients at the firm's downtown office, with paired wine service and the Thornbury Kitchen signature braised short rib.",
  },
  {
    id: "job_rst_oakhurst",
    name: "Oakhurst Country Club Summer Gala Co-Catering",
    client: "Oakhurst Country Club",
    organizationId: "org_rst_oakhurst",
    status: "scheduled",
    value: 9200,
    startDate: "2026-08-15",
    dueDate: "2026-08-16",
    ownerId: "emp_rst_devon",
    description: "Co-catering the club's 200-guest Summer Gala alongside the in-house kitchen — Thornbury supplying the raw bar, a live carving station, and the dessert display.",
  },
  {
    id: "job_rst_ridgeview",
    name: "Ridgeview University Homecoming Tailgate Catering",
    client: "Ridgeview University",
    organizationId: "org_rst_ridgeview",
    status: "scheduled",
    value: 12500,
    startDate: "2026-10-10",
    dueDate: "2026-10-10",
    ownerId: "emp_rst_renata",
    description: "Tailgate-style catering for 600 alumni and donors outside the stadium ahead of the homecoming game — smoked brisket, a whole roasted hog, and a build-your-own taco bar.",
  },
  {
    id: "job_rst_wilmont",
    name: "The Wilmont Estate Satellite Kitchen Build-Out",
    client: "The Wilmont Estate",
    organizationId: "org_rst_wilmont",
    status: "in_progress",
    value: 38000,
    startDate: "2026-06-01",
    dueDate: "2026-09-01",
    ownerId: "emp_rst_dana",
    description: "Building a permanent 400-square-foot prep kitchen on the Wilmont Estate grounds so Thornbury can serve as the venue's exclusive in-house caterer for all 2027 weddings.",
  },
  {
    id: "job_rst_brightside",
    name: "Brightside Health Partners Quarterly Staff Luncheon",
    client: "Brightside Health Partners",
    organizationId: "org_rst_brightside",
    status: "scheduled",
    value: 2400,
    startDate: "2026-07-22",
    dueDate: "2026-07-22",
    ownerId: "emp_rst_dana",
    description: "Buffet-style lunch for 120 clinical and administrative staff across Brightside's main campus, with build-your-own grain bowls and a dedicated allergen-free station.",
  },
  {
    id: "job_rst_harlow",
    name: "Harlow & Vance Holiday Party Catering",
    client: "Harlow & Vance Advertising",
    organizationId: "org_rst_harlow",
    status: "bid",
    value: 5400,
    startDate: "2026-06-20",
    dueDate: "2026-06-25",
    ownerId: "emp_rst_dana",
    overdue: true,
    description: "Proposal sent for a 150-guest holiday party at Harlow & Vance's downtown loft — passed appetizers, an open bar, and a live carving station; still awaiting a signed contract.",
  },
  {
    id: "job_rst_summit",
    name: "Summit Ridge Realty Client Appreciation Mixer",
    client: "Summit Ridge Realty Group",
    organizationId: "org_rst_summit",
    status: "bid",
    value: 4100,
    startDate: "2026-09-05",
    dueDate: "2026-09-05",
    ownerId: "emp_rst_dana",
    description: "Proposal out for a 75-guest client appreciation happy hour at Summit Ridge's new office — passed hors d'oeuvres, a craft cocktail menu, and a build-your-own charcuterie wall.",
  },
  {
    id: "job_rst_glenmoor",
    name: "Glenmoor Golf & Events Member Wedding Package Pilot",
    client: "Glenmoor Golf & Events",
    organizationId: "org_rst_glenmoor",
    status: "scheduled",
    value: 14800,
    startDate: "2026-09-20",
    dueDate: "2026-09-20",
    ownerId: "emp_rst_devon",
    description: "Pilot wedding package for Glenmoor's first member wedding under the new joint catering agreement — 120 guests, plated dinner service, and a dedicated cocktail-hour raw bar.",
  },
];

const RESTAURANT_INVOICES: Invoice[] = [
  { id: "inv_rst_1", number: "CTR-2211", client: "Meridian Capital Partners", amount: 2400, status: "paid", issuedDate: "2026-06-02", dueDate: "2026-06-16" },
  { id: "inv_rst_2", number: "CTR-2214", client: "Langley & Cross LLP", amount: 6800, status: "paid", issuedDate: "2026-05-16", dueDate: "2026-05-30" },
  { id: "inv_rst_3", number: "CTR-2219", client: "Ridgeview University", amount: 4000, status: "sent", issuedDate: "2026-07-01", dueDate: "2026-07-31" },
  { id: "inv_rst_4", number: "CTR-2222", client: "The Wilmont Estate", amount: 15000, status: "sent", issuedDate: "2026-06-20", dueDate: "2026-07-20" },
  { id: "inv_rst_5", number: "CTR-2225", client: "Brightside Health Partners", amount: 2400, status: "overdue", issuedDate: "2026-05-25", dueDate: "2026-06-08" },
  { id: "inv_rst_6", number: "CTR-2228", client: "Oakhurst Country Club", amount: 4600, status: "sent", issuedDate: "2026-06-28", dueDate: "2026-07-28" },
  { id: "inv_rst_7", number: "CTR-2231", client: "Glenmoor Golf & Events", amount: 5000, status: "paid", issuedDate: "2026-06-10", dueDate: "2026-06-24" },
];

const RESTAURANT_EMPLOYEES: Employee[] = [
  { id: "emp_rst_renata", name: "Renata Ashworth", initials: "RA", title: "Founder & CEO", department: "Admin", email: "renata.ashworth@thornburyhg.com", phone: "(555) 618-2201", hireDate: "2016-05-01", role: "Owner", overdueCount: 0, status: "active" },
  { id: "emp_rst_devon", name: "Devon Okafor", initials: "DO", title: "General Manager", department: "Front of House", email: "devon.okafor@thornburyhg.com", phone: "(555) 618-2245", hireDate: "2020-03-02", role: "Manager", overdueCount: 1, status: "active" },
  { id: "emp_rst_marcus", name: "Marcus Ihenetu", initials: "MI", title: "Executive Chef", department: "Kitchen", email: "marcus.ihenetu@thornburyhg.com", phone: "(555) 618-2278", hireDate: "2019-08-12", role: "Manager", overdueCount: 0, overtimeHours: 6, status: "active" },
  { id: "emp_rst_colette", name: "Colette Fontaine", initials: "CF", title: "Sous Chef", department: "Kitchen", email: "colette.fontaine@thornburyhg.com", phone: "(555) 618-2309", hireDate: "2022-02-14", role: "Member", overdueCount: 0, overtimeHours: 9, status: "active" },
  { id: "emp_rst_isaiah", name: "Isaiah Brennan", initials: "IB", title: "Bar Manager", department: "Front of House", email: "isaiah.brennan@thornburyhg.com", phone: "(555) 618-2341", hireDate: "2020-11-03", role: "Manager", overdueCount: 0, status: "active" },
  { id: "emp_rst_dana", name: "Dana Whitfield", initials: "DW", title: "Catering Sales Manager", department: "Catering", email: "dana.whitfield@thornburyhg.com", phone: "(555) 618-2367", hireDate: "2023-01-09", role: "Manager", overdueCount: 2, status: "active" },
  { id: "emp_rst_priya", name: "Priya Nkemelu", initials: "PN", title: "Front of House Manager", department: "Front of House", email: "priya.nkemelu@thornburyhg.com", phone: "(555) 618-2398", hireDate: "2021-07-19", role: "Manager", overdueCount: 0, status: "away" },
  { id: "emp_rst_grace", name: "Grace Kowalski", initials: "GK", title: "Office Manager", department: "Admin", email: "grace.kowalski@thornburyhg.com", phone: "(555) 618-2412", hireDate: "2018-09-20", role: "Admin", overdueCount: 0, status: "active" },
];

const RESTAURANT_ACTIVITY: ActivityItem[] = [
  { id: "act_rst_1", message: "New catering lead: Summit Ridge Realty Group requested a quote for a client appreciation mixer", actor: "Dana Whitfield", timestamp: "Today", kind: "deal", module: "CRM" },
  { id: "act_rst_2", message: "The Wilmont Estate signed the preferred caterer agreement", actor: "Dana Whitfield", timestamp: "Yesterday", kind: "deal", module: "CRM" },
  { id: "act_rst_3", message: "Food cost hit 32.6% this week, up 1.8 points on rising produce prices", actor: "System", timestamp: "Today", kind: "automation", module: "Finance" },
  { id: "act_rst_4", message: "Reminder: Harlow & Vance proposal has been outstanding for 6 days with no response", actor: "Automation", timestamp: "Today", kind: "automation", module: "CRM" },
  { id: "act_rst_5", message: "Invoice CTR-2225 (Brightside Health Partners) is now 30 days overdue", actor: "System", timestamp: "Today", kind: "invoice", module: "Finance" },
  { id: "act_rst_6", message: "Scheduled: Ridgeview University tailgate walkthrough", actor: "Renata Ashworth", timestamp: "3 days ago", kind: "meeting", module: "Meetings" },
  { id: "act_rst_7", message: "Posted next week's kitchen prep schedule for all three locations", actor: "Colette Fontaine", timestamp: "Yesterday", kind: "task", module: "Projects" },
  { id: "act_rst_8", message: "Produce delivery arrived 40 minutes late — Uptown location comped two tables' drinks", actor: "Marcus Ihenetu", timestamp: "2 days ago", kind: "task", module: "Projects" },
  { id: "act_rst_9", message: "Health inspection completed at the Riverside location — passed with a 98", actor: "Devon Okafor", timestamp: "4 days ago", kind: "document", module: "Documents" },
  { id: "act_rst_10", message: "New 5-star review mentions Executive Chef Marcus Ihenetu's summer tasting menu", actor: "System", timestamp: "Yesterday", kind: "message", module: "Communications" },
  { id: "act_rst_11", message: "Priya Nkemelu started as Front of House Manager", actor: "Grace Kowalski", timestamp: "1 week ago", kind: "hire", module: "People" },
  { id: "act_rst_12", message: "Workflow \"Catering Deposit Reminder\" ran for The Wilmont Estate", actor: "Automation", timestamp: "Today", kind: "automation", module: "Automation" },
  { id: "act_rst_13", message: "Uploaded Wilmont-Satellite-Kitchen-Permit.pdf", actor: "Dana Whitfield", timestamp: "2 days ago", kind: "document", module: "Documents" },
  { id: "act_rst_14", message: "Deal moved to Negotiation — Glenmoor Golf & Events Member Wedding Package Pilot", actor: "Devon Okafor", timestamp: "2 days ago", kind: "deal", module: "CRM" },
  { id: "act_rst_15", message: "Purchase request approved — new patio heaters for the Lakeside location", actor: "Renata Ashworth", timestamp: "3 days ago", kind: "approval", module: "Finance" },
  { id: "act_rst_16", message: "Isaiah Brennan updated the summer cocktail menu costing sheet", actor: "Isaiah Brennan", timestamp: "5 days ago", kind: "document", module: "Documents" },
  { id: "act_rst_17", message: "Job status changed to In Service — Meridian Capital Partners Office Lunch Program", actor: "Dana Whitfield", timestamp: "1 week ago", kind: "job", module: "Projects" },
  { id: "act_rst_18", message: "Call logged with Deborah Ashcombe — Oakhurst Country Club gala walkthrough scheduled", actor: "Devon Okafor", timestamp: "Yesterday", kind: "message", module: "Communications" },
];

const MONTHLY_SALES = [
  { month: "Feb", sales: 358000, cogsLabor: 254500, foodCostPct: 29.5 },
  { month: "Mar", sales: 364000, cogsLabor: 257800, foodCostPct: 29.8 },
  { month: "Apr", sales: 381000, cogsLabor: 267500, foodCostPct: 30.1 },
  { month: "May", sales: 402000, cogsLabor: 277000, foodCostPct: 30.4 },
  { month: "Jun", sales: 415000, cogsLabor: 285000, foodCostPct: 30.8 },
  { month: "Jul", sales: 431000, cogsLabor: 301000, foodCostPct: 32.6 },
];

const SALES_MTD = MONTHLY_SALES[MONTHLY_SALES.length - 1].sales;
const SALES_PRIOR_MONTH = MONTHLY_SALES[MONTHLY_SALES.length - 2].sales;
const SALES_DELTA_PCT = Math.round(((SALES_MTD - SALES_PRIOR_MONTH) / SALES_PRIOR_MONTH) * 100);

export const RESTAURANT_DATASET: IndustryDataset = {
  profileKey: "restaurant",
  orgName: "Thornbury Hospitality Group",
  greetingSubtitle: "Here's what matters across Thornbury Hospitality Group today.",
  kpis: [
    {
      key: "sales_mtd",
      label: "Sales MTD",
      value: `$${SALES_MTD.toLocaleString()}`,
      deltaLabel: `+${SALES_DELTA_PCT}% vs last month`,
      tone: "positive",
      trend: MONTHLY_SALES.map((m) => m.sales),
    },
    {
      key: "food_cost_pct",
      label: "Food Cost %",
      value: "32.6%",
      deltaLabel: "+1.8 pts vs last month — produce costs up on the summer menu",
      tone: "negative",
      trend: MONTHLY_SALES.map((m) => m.foodCostPct),
    },
    {
      key: "avg_table_turnover",
      label: "Avg Table Turnover",
      value: "3.6x tonight",
      deltaLabel: "+0.3x vs last Saturday",
      tone: "positive",
      trend: [2.9, 3.0, 3.1, 3.3, 3.4, 3.6],
    },
  ],
  monthlyChart: {
    title: "Sales vs. cost of goods & labor — 6 months",
    primaryLabel: "Sales",
    secondaryLabel: "COGS + Labor",
    unit: "currency",
    months: MONTHLY_SALES.map((m) => ({ month: m.month, primary: m.sales, secondary: m.cogsLabor })),
  },
  breakdownChart: {
    title: "Catering & events pipeline",
    segments: [
      { label: "Proposal Sent", count: RESTAURANT_JOBS.filter((j) => j.status === "bid").length },
      { label: "Upcoming Booking", count: RESTAURANT_JOBS.filter((j) => j.status === "scheduled").length },
      { label: "In Service", count: RESTAURANT_JOBS.filter((j) => j.status === "in_progress").length },
      { label: "Completed", count: RESTAURANT_JOBS.filter((j) => j.status === "done").length },
    ],
  },
  organizations: RESTAURANT_ORGANIZATIONS,
  people: RESTAURANT_PEOPLE,
  deals: RESTAURANT_DEALS,
  jobs: RESTAURANT_JOBS,
  invoices: RESTAURANT_INVOICES,
  employees: RESTAURANT_EMPLOYEES,
  notifications: RESTAURANT_ACTIVITY,
  aiRecommendations: [
    "Food cost has climbed to 32.6% this month, 1.8 points above June and above Marcus Ihenetu's 30% target for the summer menu — worth a quick pass on produce pricing before the next order cycle.",
    "Invoice CTR-2225 from Brightside Health Partners is 30 days overdue on a $2,400 balance — a short call to Angela Restrepo usually clears these faster than a second automated reminder.",
    "Miles Thackeray at Harlow & Vance hasn't responded in 6 days since the holiday party proposal went out — worth a personal follow-up from Dana before the December date books up.",
    "Table turnover is trending up to 3.6x on Saturdays, from 2.9x a month ago — with the Wilmont Estate build-out pulling kitchen staff mid-week, it may be worth shifting Colette's prep schedule to protect weekend service.",
  ],
};
