import { db } from "@/server/db";

export interface CustomerListItem {
  id: string;
  name: string;
  productName: string;
  editionName: string;
  lifecycleStage: string;
  plan: string;
  mrrCents: number;
  createdAt: Date;
}

// The first real Platform read — every "customer" is a Workspace, seen
// from the operator's side rather than the tenant's own. Deliberately
// read-only and unfiltered by permission scope beyond "caller is staff,"
// which the route handler already checked before calling this — no
// service function in src/server/platform/* re-checks staff access
// itself; that's the API/layout layers' job, not the service layer's.
export async function listCustomers(): Promise<CustomerListItem[]> {
  const workspaces = await db.workspace.findMany({
    include: {
      product: true,
      edition: true,
      lifecycleStage: true,
      subscription: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return workspaces.map((w) => ({
    id: w.id,
    name: w.name,
    productName: w.product.name,
    editionName: w.edition.name,
    lifecycleStage: w.lifecycleStage.label,
    plan: w.plan,
    mrrCents: w.subscription?.mrrCents ?? 0,
    createdAt: w.createdAt,
  }));
}
