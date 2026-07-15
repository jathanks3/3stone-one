import type { IntegrationProvider } from "@/types";

export const DEMO_INTEGRATIONS: IntegrationProvider[] = [
  { key: "quickbooks", name: "QuickBooks", category: "Accounting", status: "connected", lastSync: "12 minutes ago", blurb: "Revenue, expenses, and invoice status sync into Finance automatically." },
  { key: "excel", name: "Excel", category: "Accounting", status: "not_connected", lastSync: null, blurb: "Import and export budgets, estimates, and reports as spreadsheets." },
  { key: "google_sheets", name: "Google Sheets", category: "Accounting", status: "not_connected", lastSync: null, blurb: "Keep a live spreadsheet copy of any report, always up to date." },
  { key: "toast", name: "Toast", category: "Commerce", status: "not_connected", lastSync: null, blurb: "POS sales data for restaurant and hospitality workspaces." },
  { key: "stripe", name: "Stripe", category: "Payments", status: "connected", lastSync: "2 hours ago", blurb: "Client invoice payments flow straight into Finance and the Client Portal." },
  { key: "calendly", name: "Calendly", category: "Scheduling", status: "transformed", lastSync: null, blurb: "Meeting bookings from your scheduling page appear in Meetings automatically." },
  { key: "slack", name: "Slack", category: "Communication", status: "connected", lastSync: "5 minutes ago", blurb: "Mirror key channels and get automation notifications in Slack." },
  { key: "microsoft_365", name: "Microsoft 365", category: "Productivity", status: "not_connected", lastSync: null, blurb: "Sync email, calendar, and documents from Outlook and OneDrive." },
  { key: "google_workspace", name: "Google Workspace", category: "Productivity", status: "not_connected", lastSync: null, blurb: "Sync email, calendar, and Drive documents from Google." },
  { key: "shopify", name: "Shopify", category: "Commerce", status: "not_connected", lastSync: null, blurb: "Order and customer data for retail and e-commerce workspaces." },
  { key: "square", name: "Square", category: "Commerce", status: "not_connected", lastSync: null, blurb: "Planned connector for example POS and inventory configuration; no live sync in this demo." },
  { key: "clover", name: "Clover", category: "Commerce", status: "not_connected", lastSync: null, blurb: "Planned connector; shown as an inventory integration option only." },
  { key: "lightspeed", name: "Lightspeed", category: "Commerce", status: "not_connected", lastSync: null, blurb: "Example retail catalog and stock configuration; no live connection." },
  { key: "woocommerce", name: "WooCommerce", category: "Commerce", status: "not_connected", lastSync: null, blurb: "Planned connector for catalog and order data; not connected in this demo." },
  { key: "hubspot", name: "HubSpot", category: "CRM", status: "not_connected", lastSync: null, blurb: "Bring existing HubSpot contacts and deals into the CRM module." },
  { key: "salesforce", name: "Salesforce", category: "CRM", status: "not_connected", lastSync: null, blurb: "Bring existing Salesforce accounts and opportunities into the CRM module." },
];

export const INTEGRATION_CATEGORY_ORDER = [
  "Accounting",
  "Payments",
  "Scheduling",
  "Communication",
  "Productivity",
  "Commerce",
  "CRM",
] as const;
