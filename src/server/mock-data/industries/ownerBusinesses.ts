import type { ActivityItem, Deal, Employee, IndustryDataset, IndustryProfileKey, Invoice, Job, Organization, Person } from "@/types";

type DemoConfig = {
  key: IndustryProfileKey;
  id: string;
  name: string;
  clients: [string, string, string, string];
  team: [string, string, string];
  titles: [string, string, string];
  work: [string, string, string, string];
  kpis: [{ label: string; value: string; delta: string }, { label: string; value: string; delta: string }, { label: string; value: string; delta: string }];
  chart: { title: string; primary: string; secondary: string; values: [number, number][] };
  breakdown: string[];
  recommendations: string[];
};

function buildDataset(c: DemoConfig): IndustryDataset {
  const organizations: Organization[] = c.clients.map((name, i) => ({
    id: `org_${c.id}_${i}`, name, domain: "", industry: c.key === "clothing_brand" ? "Direct-to-consumer" : "Personal services", ownerId: `emp_${c.id}_${i % 3}`, createdAt: `2026-0${i + 2}-12`,
  }));
  const people: Person[] = c.clients.map((name, i) => {
    const [first, ...last] = name.split(" ");
    return { id: `per_${c.id}_${i}`, firstName: first, lastName: last.join(" ") || "Customer", email: `${first.toLowerCase()}@example.com`, phone: `(555) 240-10${i}0`, organizationId: organizations[i].id, personType: i === 3 ? "lead" : "customer", ownerId: `emp_${c.id}_${i % 3}`, createdAt: `2026-0${i + 2}-12`, lastContact: i === 2 ? "6 weeks ago" : i === 1 ? "Yesterday" : "Today" };
  });
  const employees: Employee[] = c.team.map((name, i) => ({ id: `emp_${c.id}_${i}`, name, initials: name.split(" ").map((p) => p[0]).join(""), title: c.titles[i], department: i === 0 ? "Operations" : "Service", email: `${name.toLowerCase().replace(" ", ".")}@example.com`, phone: `(555) 310-20${i}0`, hireDate: `202${i + 2}-04-15`, role: i === 0 ? "Manager" : "Member", overdueCount: i === 2 ? 1 : 0, overtimeHours: i === 1 ? 2 : 0, status: i === 2 ? "away" : "active" }));
  const jobs: Job[] = c.work.map((name, i) => ({ id: `job_${c.id}_${i}`, name, client: c.clients[i], organizationId: organizations[i].id, status: (["in_progress", "scheduled", "done", "bid"] as const)[i], value: [185, 240, 320, 460][i] * (c.key === "clothing_brand" ? 8 : 1), startDate: `2026-07-${10 + i}`, dueDate: `2026-07-${10 + i}`, ownerId: employees[i % 3].id, overdue: i === 3, description: `${name} for ${c.clients[i]} with the next action and owner clearly tracked.` }));
  const deals: Deal[] = jobs.map((j, i) => ({ id: `deal_${c.id}_${i}`, personId: people[i].id, organizationId: organizations[i].id, title: j.name, value: j.value, stage: (["won", "negotiation", "won", "contacted"] as const)[i], ownerId: j.ownerId, expectedCloseDate: j.dueDate }));
  const invoices: Invoice[] = jobs.map((j, i) => ({ id: `inv_${c.id}_${i}`, number: `${c.id.toUpperCase()}-${410 + i}`, client: j.client, amount: j.value, status: (["paid", "sent", "paid", "overdue"] as const)[i], issuedDate: `2026-07-0${i + 1}`, dueDate: `2026-07-${7 + i}`, depositAmount: i === 1 ? Math.round(j.value * .3) : undefined, depositPaid: i === 1 ? false : undefined }));
  const notifications: ActivityItem[] = [
    { id: `act_${c.id}_1`, message: `${c.work[0]} checked in and ready`, actor: c.team[0], timestamp: "Today", kind: "job", module: "Projects" },
    { id: `act_${c.id}_2`, message: c.recommendations[0], actor: "3Stone AI", timestamp: "This morning", kind: "automation", module: "Dashboard" },
    { id: `act_${c.id}_3`, message: `${c.clients[1]} replied to the latest follow-up`, actor: c.team[1], timestamp: "Today", kind: "message", module: "Communications" },
  ];
  return {
    profileKey: c.key, orgName: c.name, greetingSubtitle: `Here’s what needs your attention at ${c.name} today.`,
    kpis: c.kpis.map((k, i) => ({ key: `kpi_${i}`, label: k.label, value: k.value, deltaLabel: k.delta, tone: i === 2 ? "neutral" : "positive", trend: i === 0 ? c.chart.values.map((v) => v[0]) : undefined })) as IndustryDataset["kpis"],
    monthlyChart: { title: c.chart.title, primaryLabel: c.chart.primary, secondaryLabel: c.chart.secondary, unit: "currency", months: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((month, i) => ({ month, primary: c.chart.values[i][0], secondary: c.chart.values[i][1] })) },
    breakdownChart: { title: `${c.key === "clothing_brand" ? "Order" : "Client"} workflow`, segments: c.breakdown.map((label, i) => ({ label, count: [4, 7, 3, 12][i] ?? i + 2 })) },
    organizations, people, deals, jobs, invoices, employees, notifications, aiRecommendations: c.recommendations,
  };
}

export const HAIR_SALON_DATASET = buildDataset({ key: "hair_salon", id: "hair", name: "Crown & Coil Salon", clients: ["Avery Morgan", "Simone Brooks", "Taylor Reed", "Morgan Ellis"], team: ["Nia Carter", "Jade Wilson", "Camille Ross"], titles: ["Salon Manager", "Senior Stylist", "Colorist"], work: ["Silk press appointment", "Balayage appointment", "Protective style appointment", "New guest consultation"], kpis: [{ label: "Appointments Today", value: "14", delta: "3 openings remain" }, { label: "Rebooking Rate", value: "72%", delta: "+6% this month" }, { label: "Average Ticket", value: "$148", delta: "$24 retail per guest" }], chart: { title: "Service revenue vs. product sales — 6 months", primary: "Services", secondary: "Retail products", values: [[21800, 3200], [23200, 3500], [25100, 3900], [26900, 4200], [28100, 4700], [30400, 5200]] }, breakdown: ["Consultations", "Booked", "In Service", "Completed"], recommendations: ["Three guests are due to rebook within seven days; a personalized text could protect roughly $460 in repeat revenue.", "Jade Wilson leads service revenue this month at $9,840 with a 79% rebooking rate.", "Retail attachment is strongest on color appointments; feature the bond-care bundle at checkout today."] });

export const LASH_STUDIO_DATASET = buildDataset({ key: "lash_studio", id: "lash", name: "Luna Lash Atelier", clients: ["Mia Bennett", "Kennedy Price", "Jordan Lane", "Riley Stone"], team: ["Ari Monroe", "Tessa King", "Leah Grant"], titles: ["Studio Lead", "Master Lash Artist", "Lash Artist"], work: ["Volume fill", "Classic full set", "Wet-set fill", "New client consultation"], kpis: [{ label: "Fills Due", value: "9", delta: "4 not yet booked" }, { label: "Client Retention", value: "84%", delta: "+5% this quarter" }, { label: "Memberships", value: "38", delta: "3 renew this week" }], chart: { title: "Appointment revenue vs. memberships — 6 months", primary: "Appointments", secondary: "Memberships", values: [[14200, 4100], [15100, 4400], [15800, 4700], [16600, 5100], [17900, 5400], [18800, 5900]] }, breakdown: ["Consultations", "Confirmed", "In Service", "Completed"], recommendations: ["Four clients are due for fills but have not rebooked; the automated 18-day reminder could recover about $420.", "Kennedy Price’s consent form expires before tomorrow’s appointment and needs renewal.", "Membership clients book 1.7 times more often; offer Mia Bennett the maintenance plan after today’s fill."] });

export const ESTHETICIAN_DATASET = buildDataset({ key: "esthetician", id: "skin", name: "Serein Skin Studio", clients: ["Naomi Chen", "Elena Ortiz", "Priya Shah", "Casey Dunn"], team: ["Amara Cole", "Sofia James", "Bri Lee"], titles: ["Lead Esthetician", "Esthetician", "Studio Coordinator"], work: ["Hydrafacial treatment", "Chemical peel", "Acne program check-in", "Skin consultation"], kpis: [{ label: "Treatments Booked", value: "11", delta: "86% capacity today" }, { label: "Repeat-Client Rate", value: "76%", delta: "+4% this month" }, { label: "Package Usage", value: "68%", delta: "7 sessions remain" }], chart: { title: "Treatment revenue vs. product sales — 6 months", primary: "Treatments", secondary: "Skincare products", values: [[18600, 5100], [19400, 5400], [20700, 5900], [21900, 6200], [23100, 6800], [24700, 7400]] }, breakdown: ["Consultations", "Booked", "Treatment", "Follow-up"], recommendations: ["Vitamin C serum has only five units left and appears in three upcoming home-care plans; reorder today.", "Naomi Chen has two prepaid package sessions remaining but no future appointment booked.", "Acne-program clients with a scheduled four-week check-in retain 18% better; Casey Dunn needs one scheduled."] });

export const CLOTHING_BRAND_DATASET = buildDataset({ key: "clothing_brand", id: "wear", name: "Northline Goods", clients: ["Olivia Parker", "Marcus Green", "Zoe Turner", "Devon Hayes"], team: ["Imani West", "Noah Brooks", "Kai Rivers"], titles: ["Operations Lead", "Fulfillment Manager", "Brand Coordinator"], work: ["Order #1842 — Core Hoodie", "Order #1843 — Studio Set", "Wholesale order — Common Ground", "Cart recovery — Capsule Drop"], kpis: [{ label: "Orders Today", value: "46", delta: "+18% vs. last Friday" }, { label: "Fulfillment Pending", value: "12", delta: "Oldest is 19 hours" }, { label: "Return Rate", value: "4.2%", delta: "Down 0.8% this month" }], chart: { title: "Net sales vs. product costs — 6 months", primary: "Net sales", secondary: "Product costs", values: [[38200, 14200], [41600, 15100], [44900, 16000], [49300, 17100], [52700, 18200], [58400, 19600]] }, breakdown: ["Unfulfilled", "Picking", "Shipped", "Delivered"], recommendations: ["Core Hoodie in Onyx, size M, has six units left and sold 14 units in the last 48 hours; replenish or pause its campaign.", "The Studio Set is this month’s best seller at $18,420 net sales and a 61% product margin.", "Twelve orders are waiting for fulfillment; clearing the four oldest before noon protects the two-day shipping promise."] });
