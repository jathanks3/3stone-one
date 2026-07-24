"use server";

import { headers } from "next/headers";
import { requestPasswordReset } from "@/server/services/authService";

export interface RequestResetFormState {
  submittedEmail?: string;
  // Present only when the email matched a real account AND delivery
  // isn't actually configured — never shown once Google Workspace SMTP
  // is live (see emailService.ts), since handing out the raw link at
  // that point would let anyone with page access reset a password
  // without ever touching the real mailbox.
  devResetToken?: string;
}

// Anti-enumeration by design (mirrors loginAction): the returned state's
// shape never reveals whether the email matched a real account with a
// password set — devResetToken is simply absent in that case, and the
// UI's confirmation message is identical either way.
export async function requestResetAction(
  _prevState: RequestResetFormState,
  formData: FormData
): Promise<RequestResetFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const headerList = await headers();

  const { resetToken, delivered } = await requestPasswordReset(email, {
    ipAddress: headerList.get("x-forwarded-for"),
    userAgent: headerList.get("user-agent"),
  });

  return { submittedEmail: email, devResetToken: delivered ? undefined : resetToken };
}
