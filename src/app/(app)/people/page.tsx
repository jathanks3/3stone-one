import type { Metadata } from "next";
import { PeopleClient } from "@/features/people/PeopleClient";
import { getSession } from "@/lib/session";
import { NotYetConnected } from "@/components/shell/NotYetConnected";

export const metadata: Metadata = { title: "People — 3Stone One" };

export default async function PeoplePage() {
  const session = await getSession();
  if (session && !session.isDemo) {
    return <NotYetConnected moduleName="People" />;
  }
  return <PeopleClient />;
}
