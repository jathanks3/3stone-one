import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignupShell } from "../SignupShell";
import { ProductForm } from "./ProductForm";

export const metadata: Metadata = { title: "Choose your product — 3Stone One" };

export default async function SignupProductPage() {
  const session = await getSession();
  if (!session || session.isDemo) {
    redirect("/signup");
  }

  return (
    <SignupShell title="Choose your product" subtitle="You can't change this later without contacting support." stepIndex={5}>
      <ProductForm />
    </SignupShell>
  );
}
