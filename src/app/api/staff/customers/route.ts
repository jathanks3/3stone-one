import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/server/db";

// Real per-customer rows for 3Stone Admin's cross-product customer list -
// same staff-key gate as stats/route.ts, but this one deliberately does
// carry personal info (email) since that's the entire point of this
// endpoint: letting the founder actually see who signed up, not just an
// aggregate count.
export async function GET(req: NextRequest) {
  const key = req.headers.get("x-staff-key");
  if (!process.env.ONE_STAFF_KEY || key !== process.env.ONE_STAFF_KEY) {
    return NextResponse.json({ error: "Invalid staff key." }, { status: 401 });
  }

  const subscriptions = await db.subscription.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      status: true,
      plan: true,
      mrrCents: true,
      createdAt: true,
      workspace: {
        select: {
          name: true,
          editionKey: true,
          members: {
            where: { role: { name: "Owner" } },
            take: 1,
            select: { user: { select: { email: true, name: true } } },
          },
        },
      },
    },
  });

  const customers = subscriptions.map((s) => ({
    email: s.workspace.members[0]?.user.email ?? null,
    name: s.workspace.members[0]?.user.name ?? null,
    workspaceName: s.workspace.name,
    edition: s.workspace.editionKey,
    plan: s.plan,
    status: s.status,
    mrr: s.mrrCents / 100,
    signedUpAt: s.createdAt.toISOString(),
  }));

  return NextResponse.json({ customers, generatedAt: new Date().toISOString() });
}
