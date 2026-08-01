import type { Deal, Person, PipelineStageKey } from "@/types";

export const PIPELINE_STAGES: { key: PipelineStageKey; label: string }[] = [
  { key: "new_lead", label: "New Lead" },
  { key: "contacted", label: "Contacted" },
  { key: "proposal", label: "Proposal" },
  { key: "negotiation", label: "Negotiation" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

export const DEMO_PEOPLE: Person[] = [
  { id: "per_sarah", firstName: "Sarah", lastName: "Chen", email: "sarah.chen@riversideprops.com", phone: "(555) 402-1187", organizationId: "org_riverside", personType: "customer", ownerId: "emp_jane", createdAt: "2024-11-02", lastContact: "2 days ago" },
  { id: "per_robert", firstName: "Robert", lastName: "Kim", email: "robert.kim@smithco.com", phone: "(555) 402-2298", organizationId: "org_smith", personType: "customer", ownerId: "emp_jane", createdAt: "2025-01-14", lastContact: "9 days ago" },
  { id: "per_elena", firstName: "Elena", lastName: "Vasquez", email: "elena.vasquez@downtownlofts.com", phone: "(555) 402-3309", organizationId: "org_downtown", personType: "customer", ownerId: "emp_jane", createdAt: "2025-02-20", lastContact: "1 week ago" },
  { id: "per_david", firstName: "David", lastName: "Park", email: "david.park@harborviewllc.com", phone: "(555) 402-4410", organizationId: "org_harbor", personType: "customer", ownerId: "emp_priya", createdAt: "2025-03-05", lastContact: "3 days ago" },
  { id: "per_michael", firstName: "Michael", lastName: "Torres", email: "michael.torres@maplestreetpartners.com", phone: "(555) 402-5521", organizationId: "org_maple", personType: "customer", ownerId: "emp_priya", createdAt: "2025-04-11", lastContact: "5 days ago" },
  { id: "per_angela", firstName: "Angela", lastName: "Wu", email: "a.wu@sunridgemedical.com", phone: "(555) 402-6632", organizationId: "org_sunridge", personType: "customer", ownerId: "emp_jane", createdAt: "2025-04-28", lastContact: "4 days ago" },
  { id: "per_james", firstName: "James", lastName: "Foster", email: "james.foster@fifthaveretail.com", phone: "(555) 402-7743", organizationId: "org_fifth", personType: "customer", ownerId: "emp_diego", createdAt: "2025-05-02", lastContact: "6 days ago" },
  { id: "per_linda", firstName: "Linda", lastName: "Osei", email: "linda.osei@lincolnparkhoa.org", phone: "(555) 402-8854", organizationId: "org_lincoln", personType: "customer", ownerId: "emp_casey", createdAt: "2024-08-19", lastContact: "3 weeks ago" },
  { id: "per_carlos", firstName: "Carlos", lastName: "Mendez", email: "carlos.mendez@oakwoodlogistics.com", phone: "(555) 402-9965", organizationId: "org_oakwood", personType: "customer", ownerId: "emp_taylor", createdAt: "2024-06-30", lastContact: "1 month ago" },
  { id: "per_rachel", firstName: "Rachel", lastName: "Whitfield", email: "rachel@whitfieldfamily.com", phone: "(555) 402-1076", organizationId: "org_whitfield", personType: "customer", ownerId: "emp_priya", createdAt: "2025-06-01", lastContact: "Today" },
  { id: "per_ben", firstName: "Ben", lastName: "Carter", email: "ben.carter@bayviewcp.com", phone: "(555) 402-2187", organizationId: "org_bayview", personType: "lead", ownerId: "emp_priya", createdAt: "2026-06-20", lastContact: "Yesterday" },
  { id: "per_nora", firstName: "Nora", lastName: "Islam", email: "nora.islam@northgateholdings.com", phone: "(555) 402-3298", organizationId: "org_northgate", personType: "lead", ownerId: "emp_priya", createdAt: "2026-06-25", lastContact: "Today" },
  { id: "per_tom", firstName: "Tom", lastName: "Reilly", email: "tom.reilly@gmail.com", phone: "(555) 402-4309", organizationId: null, personType: "lead", ownerId: "emp_jane", createdAt: "2026-07-01", lastContact: "This morning" },
  { id: "per_grace", firstName: "Grace", lastName: "Kim", email: "grace.kim@outlook.com", phone: "(555) 402-5410", organizationId: null, personType: "lead", ownerId: "emp_priya", createdAt: "2026-06-28", lastContact: "2 days ago" },
];

export const DEMO_DEALS: Deal[] = [
  { id: "deal_riverside", personId: "per_sarah", organizationId: "org_riverside", title: "Riverside Clubhouse Remodel", value: 40000, stage: "won", ownerId: "emp_jane", expectedCloseDate: "2026-04-20" },
  { id: "deal_smith", personId: "per_robert", organizationId: "org_smith", title: "Smith Co. Storefront Renovation", value: 28500, stage: "won", ownerId: "emp_jane", expectedCloseDate: "2026-04-01" },
  { id: "deal_downtown", personId: "per_elena", organizationId: "org_downtown", title: "Downtown Lofts Common Areas", value: 52000, stage: "won", ownerId: "emp_jane", expectedCloseDate: "2026-03-10" },
  { id: "deal_harbor", personId: "per_david", organizationId: "org_harbor", title: "Harbor View HQ Build-out", value: 95000, stage: "won", ownerId: "emp_priya", expectedCloseDate: "2026-07-01" },
  { id: "deal_maple", personId: "per_michael", organizationId: "org_maple", title: "Maple Street Duplex", value: 61000, stage: "proposal", ownerId: "emp_priya", expectedCloseDate: "2026-08-15" },
  { id: "deal_sunridge", personId: "per_angela", organizationId: "org_sunridge", title: "Sunridge Clinic Expansion", value: 73500, stage: "won", ownerId: "emp_jane", expectedCloseDate: "2026-07-20" },
  { id: "deal_fifth", personId: "per_james", organizationId: "org_fifth", title: "Fifth Ave Retail Fit-out", value: 38200, stage: "won", ownerId: "emp_diego", expectedCloseDate: "2026-05-20" },
  { id: "deal_lincoln", personId: "per_linda", organizationId: "org_lincoln", title: "Lincoln Park Pergola", value: 12800, stage: "won", ownerId: "emp_casey", expectedCloseDate: "2026-04-15" },
  { id: "deal_oakwood", personId: "per_carlos", organizationId: "org_oakwood", title: "Oakwood Warehouse Roof", value: 46000, stage: "won", ownerId: "emp_taylor", expectedCloseDate: "2026-02-25" },
  { id: "deal_cedar", personId: "per_rachel", organizationId: "org_whitfield", title: "Cedar Hills Custom Home", value: 210000, stage: "negotiation", ownerId: "emp_priya", expectedCloseDate: "2026-08-01" },
  { id: "deal_bayview", personId: "per_ben", organizationId: "org_bayview", title: "Bayview Warehouse Retrofit", value: 85000, stage: "contacted", ownerId: "emp_priya", expectedCloseDate: "2026-09-30" },
  { id: "deal_northgate", personId: "per_nora", organizationId: "org_northgate", title: "Northgate Office Renovation", value: 120000, stage: "proposal", ownerId: "emp_priya", expectedCloseDate: "2026-10-15" },
  { id: "deal_reilly", personId: "per_tom", organizationId: null, title: "Reilly Home Addition", value: 34000, stage: "new_lead", ownerId: "emp_jane", expectedCloseDate: "2026-10-30" },
  { id: "deal_grace", personId: "per_grace", organizationId: null, title: "Kim Retail Buildout", value: 58000, stage: "negotiation", ownerId: "emp_priya", expectedCloseDate: "2026-08-20" },
  { id: "deal_fairview", personId: "per_tom", organizationId: null, title: "Fairview Plaza Renovation", value: 45000, stage: "lost", ownerId: "emp_priya", expectedCloseDate: "2026-05-01" },
];

export function getPersonName(personId: string) {
  const p = DEMO_PEOPLE.find((x) => x.id === personId);
  return p ? `${p.firstName} ${p.lastName}` : "Unknown";
}

// Workspace edition's own CRM contacts and engagements (Harper & Voss
// Consulting) - see jobs.ts's WORKSPACE_JOBS, organizations.ts's
// WORKSPACE_ORGANIZATIONS, and industries/workplace.ts.
export const WORKSPACE_PEOPLE: Person[] = [
  { id: "wper_natalie", firstName: "Natalie", lastName: "Cho", email: "natalie.cho@northstarretail.com", phone: "(555) 502-1187", organizationId: "worg_northstar", personType: "customer", ownerId: "wemp_jordan", createdAt: "2025-02-10", lastContact: "2 days ago" },
  { id: "wper_omar", firstName: "Omar", lastName: "Hassan", email: "omar.hassan@atlashealthpartners.com", phone: "(555) 502-2298", organizationId: "worg_atlas", personType: "customer", ownerId: "wemp_jordan", createdAt: "2025-03-01", lastContact: "1 week ago" },
  { id: "wper_stephanie", firstName: "Stephanie", lastName: "Reed", email: "s.reed@beaconcommunityfund.org", phone: "(555) 502-3309", organizationId: "worg_beacon", personType: "customer", ownerId: "wemp_alicia", createdAt: "2025-04-15", lastContact: "3 days ago" },
  { id: "wper_kevin", firstName: "Kevin", lastName: "Yoon", email: "kevin.yoon@summitoutdoorgear.com", phone: "(555) 502-4410", organizationId: "worg_summit", personType: "lead", ownerId: "wemp_alicia", createdAt: "2026-06-20", lastContact: "Yesterday" },
  { id: "wper_diane", firstName: "Diane", lastName: "Muller", email: "diane.muller@lumenlegalgroup.com", phone: "(555) 502-5521", organizationId: "worg_lumen", personType: "customer", ownerId: "wemp_jordan", createdAt: "2025-01-05", lastContact: "2 weeks ago" },
  { id: "wper_frank", firstName: "Frank", lastName: "Delgado", email: "frank.delgado@cascademfg.com", phone: "(555) 502-6632", organizationId: "worg_cascade", personType: "customer", ownerId: "wemp_priya", createdAt: "2024-12-01", lastContact: "1 month ago" },
  { id: "wper_grace2", firstName: "Grace", lastName: "Simmons", email: "grace.simmons@gmail.com", phone: "(555) 502-7743", organizationId: null, personType: "lead", ownerId: "wemp_jordan", createdAt: "2026-07-01", lastContact: "This morning" },
];

export const WORKSPACE_DEALS: Deal[] = [
  { id: "wdeal_northstar", personId: "wper_natalie", organizationId: "worg_northstar", title: "Northstar Brand Strategy", value: 32000, stage: "won", ownerId: "wemp_jordan", expectedCloseDate: "2026-05-01" },
  { id: "wdeal_atlas", personId: "wper_omar", organizationId: "worg_atlas", title: "Atlas Website Redesign", value: 18500, stage: "won", ownerId: "wemp_jordan", expectedCloseDate: "2026-04-15" },
  { id: "wdeal_beacon", personId: "wper_stephanie", organizationId: "worg_beacon", title: "Beacon Ops Review", value: 14000, stage: "proposal", ownerId: "wemp_alicia", expectedCloseDate: "2026-08-25" },
  { id: "wdeal_summit", personId: "wper_kevin", organizationId: "worg_summit", title: "Summit Market Research", value: 22000, stage: "contacted", ownerId: "wemp_alicia", expectedCloseDate: "2026-09-30" },
  { id: "wdeal_lumen", personId: "wper_diane", organizationId: "worg_lumen", title: "Lumen Intake Overhaul", value: 9800, stage: "won", ownerId: "wemp_jordan", expectedCloseDate: "2026-04-25" },
  { id: "wdeal_cascade", personId: "wper_frank", organizationId: "worg_cascade", title: "Cascade HR Policy Refresh", value: 11200, stage: "won", ownerId: "wemp_priya", expectedCloseDate: "2026-03-20" },
  { id: "wdeal_grace2", personId: "wper_grace2", organizationId: null, title: "Simmons Consulting Retainer", value: 15000, stage: "new_lead", ownerId: "wemp_jordan", expectedCloseDate: "2026-10-01" },
];
