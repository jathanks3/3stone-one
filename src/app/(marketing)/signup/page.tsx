import { redirect } from "next/navigation";

// This app (3stone-one) is no longer the customer-facing product —
// workspace.3stoneai.com (the standalone 3stone-workspace/Supabase system)
// is canonical, per the 2026-07-25 founder decision. This app's job now is
// the /3stone-ai Founder Platform (plus hosting the public interactive
// demo at /demo, branded "3Stone Workspace" like the real product); it
// must not accept new customer signups into a second, parallel system.
// Send anyone who lands here to the real product page instead of building
// a second customer base. SignupForm/SignupShell and the rest of the
// wizard are left in place (dormant), not deleted, in case any part of the
// flow is reused for Founder Platform staff invitations later.
export default function SignupPage() {
  redirect("https://www.3stoneai.com/workspace");
}
