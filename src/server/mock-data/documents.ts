import type { DocumentFile } from "@/types";

export const DEMO_DOCUMENTS: DocumentFile[] = [
  { id: "doc_1", name: "Riverside-Remodel-Contract.pdf", category: "contract", sizeKb: 842, uploadedById: "emp_jane", uploadedAt: "2026-05-01", jobId: "job_riverside", organizationId: "org_riverside", visibility: "shared", signatureStatus: "signed" },
  { id: "doc_2", name: "Riverside-Permit-Approval.pdf", category: "permit", sizeKb: 356, uploadedById: "emp_priya", uploadedAt: "2026-05-08", jobId: "job_riverside", organizationId: "org_riverside", visibility: "shared" },
  { id: "doc_3", name: "Riverside-Site-Plan-v2.pdf", category: "plan", sizeKb: 1204, uploadedById: "emp_priya", uploadedAt: "2026-05-10", jobId: "job_riverside", organizationId: "org_riverside", visibility: "shared" },
  { id: "doc_4", name: "Riverside-Progress-Photos-Jun.zip", category: "photo", sizeKb: 6820, uploadedById: "emp_marcus", uploadedAt: "2026-06-22", jobId: "job_riverside", organizationId: "org_riverside", visibility: "internal" },
  { id: "doc_5", name: "Smith-Co-Renovation-Contract.pdf", category: "contract", sizeKb: 710, uploadedById: "emp_jane", uploadedAt: "2026-04-10", jobId: "job_smith", organizationId: "org_smith", visibility: "shared" },
  { id: "doc_6", name: "Smith-Co-ADA-Compliance-Report.pdf", category: "report", sizeKb: 288, uploadedById: "emp_taylor", uploadedAt: "2026-06-05", jobId: "job_smith", organizationId: "org_smith", visibility: "internal" },
  { id: "doc_7", name: "Downtown-Lofts-Contract.pdf", category: "contract", sizeKb: 902, uploadedById: "emp_jane", uploadedAt: "2026-03-15", jobId: "job_downtown", organizationId: "org_downtown", visibility: "shared" },
  { id: "doc_8", name: "Downtown-Lofts-Rooftop-Plans.pdf", category: "plan", sizeKb: 1440, uploadedById: "emp_casey", uploadedAt: "2026-05-02", jobId: "job_downtown", organizationId: "org_downtown", visibility: "shared" },
  { id: "doc_9", name: "Harbor-View-Proposal.pdf", category: "contract", sizeKb: 654, uploadedById: "emp_priya", uploadedAt: "2026-06-20", jobId: "job_harbor", organizationId: "org_harbor", visibility: "shared", signatureStatus: "viewed" },
  { id: "doc_10", name: "Harbor-View-Steel-Order-Invoice.pdf", category: "invoice", sizeKb: 198, uploadedById: "emp_morgan", uploadedAt: "2026-06-28", jobId: "job_harbor", organizationId: "org_harbor", visibility: "internal" },
  { id: "doc_11", name: "Sunridge-Clinic-Floor-Plan.pdf", category: "plan", sizeKb: 980, uploadedById: "emp_priya", uploadedAt: "2026-07-02", jobId: "job_sunridge", organizationId: "org_sunridge", visibility: "shared" },
  { id: "doc_12", name: "Fifth-Ave-Retail-Contract.pdf", category: "contract", sizeKb: 588, uploadedById: "emp_diego", uploadedAt: "2026-06-01", jobId: "job_fifth", organizationId: "org_fifth", visibility: "shared" },
  { id: "doc_13", name: "Employee-Safety-Handbook-2026.pdf", category: "report", sizeKb: 1120, uploadedById: "emp_sam", uploadedAt: "2026-01-10", jobId: null, organizationId: null, visibility: "internal" },
  { id: "doc_14", name: "Vendor-Master-Agreement-Ferguson.pdf", category: "contract", sizeKb: 412, uploadedById: "emp_sam", uploadedAt: "2026-07-03", jobId: null, organizationId: null, visibility: "internal" },
];

export const DOCUMENT_CATEGORY_LABEL: Record<DocumentFile["category"], string> = {
  contract: "Contract",
  permit: "Permit",
  invoice: "Invoice",
  plan: "Plan",
  photo: "Photos",
  report: "Report",
};

// Workspace edition's own files (Harper & Voss Consulting) - see
// jobs.ts's WORKSPACE_JOBS and organizations.ts's WORKSPACE_ORGANIZATIONS.
export const WORKSPACE_DOCUMENTS: DocumentFile[] = [
  { id: "wdoc_1", name: "Northstar-Engagement-Agreement.pdf", category: "contract", sizeKb: 512, uploadedById: "wemp_jordan", uploadedAt: "2026-05-12", jobId: "wjob_northstar", organizationId: "worg_northstar", visibility: "shared", signatureStatus: "signed" },
  { id: "wdoc_2", name: "Northstar-Brand-Audit-Draft.pdf", category: "plan", sizeKb: 980, uploadedById: "wemp_alicia", uploadedAt: "2026-06-01", jobId: "wjob_northstar", organizationId: "worg_northstar", visibility: "internal" },
  { id: "wdoc_3", name: "Atlas-Website-Wireframes-v2.pdf", category: "plan", sizeKb: 1340, uploadedById: "wemp_ryan", uploadedAt: "2026-05-20", jobId: "wjob_atlas", organizationId: "worg_atlas", visibility: "shared" },
  { id: "wdoc_4", name: "Atlas-Invoice-June.pdf", category: "invoice", sizeKb: 145, uploadedById: "wemp_maya", uploadedAt: "2026-06-30", jobId: "wjob_atlas", organizationId: "worg_atlas", visibility: "internal" },
  { id: "wdoc_5", name: "Beacon-Ops-Review-Proposal.pdf", category: "report", sizeKb: 690, uploadedById: "wemp_alicia", uploadedAt: "2026-06-15", jobId: "wjob_beacon", organizationId: "worg_beacon", visibility: "shared" },
  { id: "wdoc_6", name: "Client-Onboarding-Checklist.pdf", category: "report", sizeKb: 220, uploadedById: "wemp_maya", uploadedAt: "2026-01-10", jobId: null, organizationId: null, visibility: "internal" },
];

// Student edition's own files - coursework, drafts, and group project
// materials, not contracts/permits/invoices. `category` reuses the
// closed DocumentCategory set (report/plan/photo are the only ones that
// genuinely fit coursework); contract/permit/invoice are never used here.
export const STUDENT_DOCUMENTS: DocumentFile[] = [
  { id: "sdoc_1", name: "Capstone-Proposal-Draft2.pdf", category: "report", sizeKb: 340, uploadedById: "student_self", uploadedAt: "2026-07-20", jobId: "sjob_capstone", organizationId: null, visibility: "internal" },
  { id: "sdoc_2", name: "Marketing401-Group-Slides.pdf", category: "plan", sizeKb: 2100, uploadedById: "student_self", uploadedAt: "2026-07-18", jobId: "sjob_marketing", organizationId: null, visibility: "shared" },
  { id: "sdoc_3", name: "Chem302-Lab-Data-Scan.jpg", category: "photo", sizeKb: 1580, uploadedById: "student_self", uploadedAt: "2026-08-01", jobId: "sjob_labreport", organizationId: null, visibility: "internal" },
  { id: "sdoc_4", name: "Lit-Review-Sources.pdf", category: "report", sizeKb: 410, uploadedById: "student_self", uploadedAt: "2026-07-25", jobId: "sjob_research", organizationId: null, visibility: "internal" },
  { id: "sdoc_5", name: "Stats210-Study-Guide.pdf", category: "report", sizeKb: 265, uploadedById: "student_self", uploadedAt: "2026-06-15", jobId: "sjob_finalexam", organizationId: null, visibility: "internal" },
];
