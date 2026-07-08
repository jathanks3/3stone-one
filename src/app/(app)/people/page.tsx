import type { Metadata } from "next";
import { PeopleClient } from "@/features/people/PeopleClient";

export const metadata: Metadata = { title: "People — 3Stone One" };

export default function PeoplePage() {
  return <PeopleClient />;
}
