import type { Budget, Invoice, MonthlyFinancial, PurchaseRequest, Vendor, VendorExpense } from "@/types";

export const REVENUE_MTD = 184000;
export const REVENUE_DELTA_PCT = 12;
export const PROFIT_MTD = 61200;
export const PROFIT_DELTA_PCT = 8;
export const CASH_FLOW_MONTHLY = 14300;
export const CASH_RUNWAY_DAYS = 42;

export const MONTHLY_FINANCIALS: MonthlyFinancial[] = [
  { month: "Feb", revenue: 142000, expenses: 101000 },
  { month: "Mar", revenue: 149000, expenses: 104500 },
  { month: "Apr", revenue: 156000, expenses: 108000 },
  { month: "May", revenue: 158000, expenses: 109500 },
  { month: "Jun", revenue: 164300, expenses: 113000 },
  { month: "Jul", revenue: REVENUE_MTD, expenses: REVENUE_MTD - PROFIT_MTD },
];

export const DEMO_INVOICES: Invoice[] = [
  { id: "inv_1042", number: "INV-1042", client: "Riverside Properties", amount: 12400, status: "sent", issuedDate: "2026-06-15", dueDate: "2026-07-15" },
  { id: "inv_1038", number: "INV-1038", client: "Smith Co.", amount: 4200, status: "overdue", issuedDate: "2026-05-28", dueDate: "2026-06-28" },
  { id: "inv_1051", number: "INV-1051", client: "Downtown Lofts", amount: 5800, status: "sent", issuedDate: "2026-06-20", dueDate: "2026-07-20" },
  { id: "inv_1029", number: "INV-1029", client: "Oakwood Logistics", amount: 46000, status: "paid", issuedDate: "2026-05-01", dueDate: "2026-05-15" },
  { id: "inv_1031", number: "INV-1031", client: "Lincoln Park HOA", amount: 12800, status: "paid", issuedDate: "2026-05-20", dueDate: "2026-06-01" },
  { id: "inv_1055", number: "INV-1055", client: "Harbor View LLC", amount: 31500, status: "sent", issuedDate: "2026-06-25", dueDate: "2026-07-25" },
  { id: "inv_1058", number: "INV-1058", client: "Fifth Ave Retail Group", amount: 15200, status: "sent", issuedDate: "2026-07-01", dueDate: "2026-07-31" },
  { id: "inv_1060", number: "INV-1060", client: "Sunridge Medical", amount: 22000, status: "paid", issuedDate: "2026-06-10", dueDate: "2026-06-24" },
];

export const DEMO_VENDORS: Vendor[] = [
  { id: "ven_1", name: "Ferguson Supply", category: "Materials" },
  { id: "ven_2", name: "BuildRight Subcontractors", category: "Subcontractors" },
  { id: "ven_3", name: "United Rentals", category: "Equipment Rental" },
  { id: "ven_4", name: "Shell Fleet Services", category: "Fuel" },
  { id: "ven_5", name: "SafetyFirst PPE Co.", category: "Safety Supplies" },
  { id: "ven_6", name: "Sherwin-Williams", category: "Materials" },
];

export const VENDOR_EXPENSES: VendorExpense[] = [
  { vendor: "Subcontractors", amount: 18200 },
  { vendor: "Materials", amount: 9400 },
  { vendor: "Equipment Rental", amount: 6100 },
  { vendor: "Fuel", amount: 3200 },
];

export const PENDING_PURCHASE_REQUESTS: PurchaseRequest[] = [
  { id: "pr_marcus_tools", requestedBy: "Marcus Webb", amount: 2400, reason: "Replacement power tools for the Riverside crew", status: "pending" },
  { id: "pr_diego_ppe", requestedBy: "Diego Ramirez", amount: 640, reason: "PPE restock for the Fifth Ave crew", status: "pending" },
  { id: "pr_casey_rental", requestedBy: "Casey Nguyen", amount: 1850, reason: "Scaffold rental extension — Downtown Lofts rooftop", status: "approved" },
];

export const BUDGETS: Budget[] = [
  { department: "Construction", amount: 40000, spent: 31200 },
  { department: "Field", amount: 22000, spent: 19800 },
  { department: "Estimating", amount: 8000, spent: 3100 },
  { department: "Admin", amount: 12000, spent: 9400 },
];

export const BUDGET_CONSTRUCTION = BUDGETS[0];
