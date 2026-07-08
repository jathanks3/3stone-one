import type { DocumentFile } from "@/types";

export const DEMO_DOCUMENTS: DocumentFile[] = [
  { id: "doc_1", name: "Riverside-Remodel-Contract.pdf", category: "contract", sizeKb: 842, uploadedById: "emp_jane", uploadedAt: "2026-05-01", jobId: "job_riverside", organizationId: "org_riverside", visibility: "shared" },
  { id: "doc_2", name: "Riverside-Permit-Approval.pdf", category: "permit", sizeKb: 356, uploadedById: "emp_priya", uploadedAt: "2026-05-08", jobId: "job_riverside", organizationId: "org_riverside", visibility: "shared" },
  { id: "doc_3", name: "Riverside-Site-Plan-v2.pdf", category: "plan", sizeKb: 1204, uploadedById: "emp_priya", uploadedAt: "2026-05-10", jobId: "job_riverside", organizationId: "org_riverside", visibility: "shared" },
  { id: "doc_4", name: "Riverside-Progress-Photos-Jun.zip", category: "photo", sizeKb: 6820, uploadedById: "emp_marcus", uploadedAt: "2026-06-22", jobId: "job_riverside", organizationId: "org_riverside", visibility: "internal" },
  { id: "doc_5", name: "Smith-Co-Renovation-Contract.pdf", category: "contract", sizeKb: 710, uploadedById: "emp_jane", uploadedAt: "2026-04-10", jobId: "job_smith", organizationId: "org_smith", visibility: "shared" },
  { id: "doc_6", name: "Smith-Co-ADA-Compliance-Report.pdf", category: "report", sizeKb: 288, uploadedById: "emp_taylor", uploadedAt: "2026-06-05", jobId: "job_smith", organizationId: "org_smith", visibility: "internal" },
  { id: "doc_7", name: "Downtown-Lofts-Contract.pdf", category: "contract", sizeKb: 902, uploadedById: "emp_jane", uploadedAt: "2026-03-15", jobId: "job_downtown", organizationId: "org_downtown", visibility: "shared" },
  { id: "doc_8", name: "Downtown-Lofts-Rooftop-Plans.pdf", category: "plan", sizeKb: 1440, uploadedById: "emp_casey", uploadedAt: "2026-05-02", jobId: "job_downtown", organizationId: "org_downtown", visibility: "shared" },
  { id: "doc_9", name: "Harbor-View-Proposal.pdf", category: "contract", sizeKb: 654, uploadedById: "emp_priya", uploadedAt: "2026-06-20", jobId: "job_harbor", organizationId: "org_harbor", visibility: "shared" },
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
