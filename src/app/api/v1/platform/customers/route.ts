import { NextResponse } from "next/server";
import { requireStaff } from "@/server/auth/requireStaff";
import { listCustomers } from "@/server/platform/services/customerService";
import { recordAuditEntry } from "@/server/platform/services/auditLogService";

// Thin: check permission, call the service, shape the response — same
// rule docs/01-architecture.md sets for every route handler in this app.
// This is the API-layer twin of /3stone-ai/customers' server-rendered
// page — same guard pattern (requireStaff, not "trust the caller"), same
// service call, same audit write, for whichever future client code needs
// this as JSON instead of rendered HTML.
export async function GET() {
  const auth = await requireStaff();
  if ("response" in auth) return auth.response;

  const customers = await listCustomers();
  await recordAuditEntry({ staffUserId: auth.session.userId, action: "viewed_customers_list_via_api" });

  return NextResponse.json({ data: customers });
}
