import type { Organization } from "@/types";

export const DEMO_ORGANIZATIONS: Organization[] = [
  { id: "org_riverside", name: "Riverside Properties", domain: "riversideprops.com", industry: "Real Estate", ownerId: "emp_jane", createdAt: "2024-11-02" },
  { id: "org_smith", name: "Smith Co.", domain: "smithco.com", industry: "Retail", ownerId: "emp_jane", createdAt: "2025-01-14" },
  { id: "org_downtown", name: "Downtown Lofts", domain: "downtownlofts.com", industry: "Real Estate", ownerId: "emp_jane", createdAt: "2025-02-20" },
  { id: "org_harbor", name: "Harbor View LLC", domain: "harborviewllc.com", industry: "Commercial Property", ownerId: "emp_priya", createdAt: "2025-03-05" },
  { id: "org_maple", name: "Maple Street Partners", domain: "maplestreetpartners.com", industry: "Real Estate Development", ownerId: "emp_priya", createdAt: "2025-04-11" },
  { id: "org_sunridge", name: "Sunridge Medical", domain: "sunridgemedical.com", industry: "Healthcare", ownerId: "emp_jane", createdAt: "2025-04-28" },
  { id: "org_fifth", name: "Fifth Ave Retail Group", domain: "fifthaveretail.com", industry: "Retail", ownerId: "emp_diego", createdAt: "2025-05-02" },
  { id: "org_lincoln", name: "Lincoln Park HOA", domain: "lincolnparkhoa.org", industry: "Property Association", ownerId: "emp_casey", createdAt: "2024-08-19" },
  { id: "org_oakwood", name: "Oakwood Logistics", domain: "oakwoodlogistics.com", industry: "Logistics", ownerId: "emp_taylor", createdAt: "2024-06-30" },
  { id: "org_whitfield", name: "The Whitfield Family", domain: "", industry: "Private Residence", ownerId: "emp_priya", createdAt: "2025-06-01" },
  { id: "org_bayview", name: "Bayview Construction Partners", domain: "bayviewcp.com", industry: "Construction", ownerId: "emp_jane", createdAt: "2025-06-20" },
  { id: "org_northgate", name: "Northgate Holdings", domain: "northgateholdings.com", industry: "Commercial Property", ownerId: "emp_priya", createdAt: "2025-06-25" },
];

// Workspace edition's own client list (Harper & Voss Consulting) - see
// jobs.ts's WORKSPACE_JOBS and industries/workplace.ts.
export const WORKSPACE_ORGANIZATIONS: Organization[] = [
  { id: "worg_northstar", name: "Northstar Retail Co.", domain: "northstarretail.com", industry: "Retail", ownerId: "wemp_jordan", createdAt: "2025-02-10" },
  { id: "worg_atlas", name: "Atlas Health Partners", domain: "atlashealthpartners.com", industry: "Healthcare", ownerId: "wemp_jordan", createdAt: "2025-03-01" },
  { id: "worg_beacon", name: "Beacon Community Fund", domain: "beaconcommunityfund.org", industry: "Nonprofit", ownerId: "wemp_alicia", createdAt: "2025-04-15" },
  { id: "worg_summit", name: "Summit Outdoor Gear", domain: "summitoutdoorgear.com", industry: "Retail", ownerId: "wemp_alicia", createdAt: "2025-05-20" },
  { id: "worg_lumen", name: "Lumen Legal Group", domain: "lumenlegalgroup.com", industry: "Legal Services", ownerId: "wemp_jordan", createdAt: "2025-01-05" },
  { id: "worg_cascade", name: "Cascade Manufacturing", domain: "cascademfg.com", industry: "Manufacturing", ownerId: "wemp_priya", createdAt: "2024-12-01" },
];
