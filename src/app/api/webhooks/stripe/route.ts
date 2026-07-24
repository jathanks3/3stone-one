import { NextResponse } from "next/server";
import { verifyWebhookEvent, handleWebhookEvent } from "@/server/services/stripeService";

// Stripe signs the raw body — Next.js Route Handlers give us that
// directly via request.text(), never JSON-parsed first (parsing then
// re-serializing would change the byte-for-byte payload the signature
// was computed over, breaking verification).
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const payload = await request.text();

  let event;
  try {
    event = verifyWebhookEvent(payload, signature);
  } catch (e) {
    // Never trust an unverified payload — a bad signature is treated
    // identically whether it's a misconfigured secret or a forged
    // request, since telling them apart doesn't change what to do here.
    console.error("Stripe webhook: signature verification failed", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleWebhookEvent(event);
  } catch (e) {
    console.error(`Stripe webhook: error handling ${event.type}`, e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
