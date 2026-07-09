export type IndustryProfileKey =
  | "construction"
  | "restaurant"
  | "law_firm"
  | "security"
  | "event_center"
  | "medical"
  | "property_management";

export interface IndustryTerms {
  project: string;
  projects: string;
  customer: string;
  customers: string;
  employee: string;
  employees: string;
}

export interface IndustryProfile {
  key: IndustryProfileKey;
  label: string;
  terms: IndustryTerms;
}

// ---- Per-industry dashboards & mock datasets ----
// Each industry gets its own KPIs, charts, sample data, notifications, and AI
// copy so switching industries changes the *experience*, not just the nouns.

export interface IndustryKpi {
  key: string;
  label: string;
  value: string;
  deltaLabel?: string;
  tone?: "positive" | "negative" | "neutral";
  trend?: number[];
}

export interface IndustryMonthlyChart {
  title: string;
  primaryLabel: string;
  secondaryLabel: string;
  unit: "currency" | "percent" | "hours" | "count";
  months: { month: string; primary: number; secondary: number }[];
}

export interface IndustryBreakdownChart {
  title: string;
  segments: { label: string; count: number }[];
}

export interface IndustryDataset {
  profileKey: IndustryProfileKey;
  orgName: string;
  greetingSubtitle: string;
  kpis: [IndustryKpi, IndustryKpi, IndustryKpi];
  monthlyChart: IndustryMonthlyChart;
  breakdownChart: IndustryBreakdownChart;
  organizations: Organization[];
  people: Person[];
  deals: Deal[];
  jobs: Job[];
  invoices: Invoice[];
  employees: Employee[];
  notifications: ActivityItem[];
  aiRecommendations: string[];
  /** Optional per-industry relabeling of the shared 6-stage pipeline (e.g. Event
   * Center's Inquiry / Proposal Sent / Contract Signed / Deposit Paid / Booked). */
  pipelineStageLabels?: Partial<Record<PipelineStageKey, string>>;
}

export type UserRole = "Owner" | "Admin" | "Manager" | "Member";

export interface SessionUser {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: UserRole;
  title: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  industryProfileKey: IndustryProfileKey;
  plan: "free" | "pro" | "enterprise";
}

export interface Employee {
  id: string;
  name: string;
  initials: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  hireDate: string;
  role: UserRole;
  overdueCount: number;
  overtimeHours?: number;
  status: "active" | "away";
}

export interface Department {
  id: string;
  name: string;
  leadId: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  department?: string;
  at: string;
}

export type JobStatus = "bid" | "scheduled" | "in_progress" | "done";

export interface Task {
  id: string;
  jobId: string;
  title: string;
  done: boolean;
  assigneeId: string;
  dueDate: string;
}

export interface Job {
  id: string;
  name: string;
  client: string;
  organizationId: string;
  status: JobStatus;
  value: number;
  dueDate: string;
  startDate: string;
  ownerId: string;
  overdue?: boolean;
  description: string;
}

export type InvoiceStatus = "sent" | "paid" | "overdue";

export interface Invoice {
  id: string;
  number: string;
  client: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  issuedDate: string;
  depositAmount?: number;
  depositPaid?: boolean;
}

// ---- Attendance ----

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  hoursWorked: number;
}

export type ActivityKind =
  | "deal"
  | "task"
  | "hire"
  | "invoice"
  | "document"
  | "meeting"
  | "message"
  | "job"
  | "automation"
  | "approval";

export interface ActivityItem {
  id: string;
  message: string;
  actor: string;
  timestamp: string;
  kind: ActivityKind;
  module: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export interface MonthlyFinancial {
  month: string;
  revenue: number;
  expenses: number;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
}

export interface VendorExpense {
  vendor: string;
  amount: number;
}

export interface PurchaseRequest {
  id: string;
  requestedBy: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

export interface Budget {
  department: string;
  amount: number;
  spent: number;
}

// ---- CRM ----

export interface Organization {
  id: string;
  name: string;
  domain: string;
  industry: string;
  ownerId: string;
  createdAt: string;
}

export type PersonType = "lead" | "customer" | "contact";
export type PipelineStageKey = "new_lead" | "contacted" | "proposal" | "negotiation" | "won" | "lost";

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organizationId: string | null;
  personType: PersonType;
  ownerId: string;
  createdAt: string;
  lastContact: string;
}

export interface Deal {
  id: string;
  personId: string;
  organizationId: string | null;
  title: string;
  value: number;
  stage: PipelineStageKey;
  ownerId: string;
  expectedCloseDate: string;
}

// ---- Documents ----

export type DocumentCategory = "contract" | "permit" | "invoice" | "plan" | "photo" | "report";

export interface DocumentFile {
  id: string;
  name: string;
  category: DocumentCategory;
  sizeKb: number;
  uploadedById: string;
  uploadedAt: string;
  jobId: string | null;
  organizationId: string | null;
  visibility: "internal" | "shared";
  signatureStatus?: "sent" | "viewed" | "signed";
}

// ---- Communications ----

export interface EmailMessage {
  id: string;
  from: string;
  body: string;
  at: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  withOrganizationId: string | null;
  participant: string;
  unread: boolean;
  messages: EmailMessage[];
}

export interface ChatChannel {
  id: string;
  name: string;
  isClientChannel: boolean;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  author: string;
  authorInitials: string;
  body: string;
  at: string;
}

export interface CallNote {
  id: string;
  contactName: string;
  organizationId: string | null;
  authorId: string;
  summary: string;
  at: string;
}

// ---- Meetings ----

export interface ActionItem {
  id: string;
  title: string;
  assigneeId: string;
  done: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  at: string;
  attendees: string[];
  agenda: string[];
  actionItems: ActionItem[];
  decisions: string[];
  summary: string | null;
  status: "upcoming" | "past";
}

// ---- Knowledge Center ----

export type KnowledgeCategory = "policy" | "training" | "process" | "sop" | "video";

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: KnowledgeCategory;
  body: string;
  updatedAt: string;
  author: string;
}

// ---- Automation ----

export interface WorkflowNode {
  id: string;
  kind: "trigger" | "action" | "delay";
  label: string;
  detail: string;
  days?: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  isActive: boolean;
  nodes: WorkflowNode[];
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  at: string;
  status: "success" | "failed";
  summary: string;
}

// ---- Integrations ----

export type IntegrationCategory =
  | "Accounting"
  | "Payments"
  | "Scheduling"
  | "Communication"
  | "Productivity"
  | "Commerce"
  | "CRM";

export interface IntegrationProvider {
  key: string;
  name: string;
  category: IntegrationCategory;
  status: "connected" | "not_connected";
  lastSync: string | null;
  blurb: string;
}

// ---- Portfolio ----

export interface PortfolioCompany {
  id: string;
  name: string;
  industryKey: IndustryProfileKey;
  industryLabel: string;
  revenue: number;
  revenueDeltaPct: number;
  overdueCount: number;
  isCurrent: boolean;
}

// ---- Settings ----

export interface ApiKeyRecord {
  id: string;
  label: string;
  lastFour: string;
  createdAt: string;
  lastUsedAt: string | null;
}

// ---- Reports ----

export interface ReportDefinition {
  id: string;
  name: string;
  entity: string;
  columns: string[];
  createdAt: string;
}

export interface NavItem {
  key: string;
  href: string;
  labelKey?: keyof IndustryTerms;
  label: string;
  icon: string;
  description?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}
