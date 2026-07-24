import nodemailer from "nodemailer";
import { db } from "@/server/db";

// Google Workspace is the company mailbox (docs/18-architecture-inventory.md) —
// not Resend, not SendGrid. This is a real correction from earlier in this
// project's history, where a few comments assumed Resend before the
// founder's stack-reconciliation charter named Google Workspace explicitly.
//
// DNS is already real and verified at the domain level: 3stoneai.com has
// an MX record pointing at Google, two google-site-verification TXT
// records, and a published DKIM key (google._domainkey.3stoneai.com) —
// confirmed by direct DNS lookup, not assumed. What's missing is an
// application-level credential to actually authenticate an SMTP session
// as a mailbox on that domain: a Google Workspace App Password for a
// sending address (e.g. no-reply@3stoneai.com), which only the founder
// can generate (requires 2FA + access to that mailbox's Google Account
// security settings) — see the Founder Integration Center.
//
// Nothing here ever claims an email was delivered when it wasn't: if
// the credential is missing, sendEmail logs the content (same as every
// stubbed email already did) and returns { delivered: false } — callers
// that show a UI must check that flag, never assume success.

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailResult {
  delivered: boolean;
  stubbed: boolean;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.GOOGLE_WORKSPACE_SMTP_USER && process.env.GOOGLE_WORKSPACE_SMTP_APP_PASSWORD);
}

let _transporter: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    const user = process.env.GOOGLE_WORKSPACE_SMTP_USER;
    const pass = process.env.GOOGLE_WORKSPACE_SMTP_APP_PASSWORD;
    if (!user || !pass) {
      throw new Error("GOOGLE_WORKSPACE_SMTP_USER / GOOGLE_WORKSPACE_SMTP_APP_PASSWORD are not set.");
    }
    // Standard Google Workspace SMTP submission — an App Password (not
    // the account password) works over 465/SSL without any IP
    // allowlisting, which matters on Vercel's serverless egress (no
    // stable IP to allowlist even if Workspace's SMTP relay feature were
    // used instead).
    _transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }
  return _transporter;
}

async function logDelivery(toAddress: string, template: string, status: "sent" | "failed"): Promise<void> {
  await db.emailDeliveryLog.create({
    data: { toAddress, template, provider: "google_workspace", status },
  });
}

// The one function every email-triggering flow in this app calls.
// `template` is a short machine name (e.g. "email_verification",
// "password_reset", "team_invitation") used only for the EmailDeliveryLog
// row — first real writer to that table, which existed schema-only
// before this.
export async function sendEmail(message: EmailMessage, template: string): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    console.log(`[stub email] (${template}) to ${message.to}: ${message.subject}\n${message.text}`);
    return { delivered: false, stubbed: true };
  }

  const from = process.env.GOOGLE_WORKSPACE_SMTP_USER!;
  try {
    await getTransporter().sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    await logDelivery(message.to, template, "sent");
    return { delivered: true, stubbed: false };
  } catch (e) {
    console.error(`sendEmail(${template}) failed`, e);
    await logDelivery(message.to, template, "failed");
    return { delivered: false, stubbed: false };
  }
}

// Founder Integration Center's "Test connection" for Email.
export async function verifyEmailConnection(): Promise<{ verified: true }> {
  await getTransporter().verify();
  return { verified: true };
}
