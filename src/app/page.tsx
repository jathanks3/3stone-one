import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import HomePage from "./HomePage";

export default async function RootPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  return <HomePage />;
}
