import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { cookies } from "next/headers";
import { SignupShell } from "../SignupShell";
import { ProductForm } from "./ProductForm";

export const metadata: Metadata = { title: "Choose your product — 3Stone One" };

export default async function SignupProductPage() {
  const session = await getSession();
  if (!session || session.isDemo) {
    redirect("/signup");
  }
  const desiredEdition = (await cookies()).get("signup_edition")?.value;

  return (
    <SignupShell title="Choose your product" subtitle="You can't change this later without contacting support." stepIndex={4}>
      <ProductForm initialEdition={desiredEdition} />
    </SignupShell>
  );
}
