import { createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { syncOrderFromSumUpSession } from "@/lib/order-service";

type SumUpWebhookPayload = {
  id?: string;
  checkout_id?: string;
  event_type?: string;
};

function verifySignature(payload: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const incoming = signature.trim().toLowerCase();
  if (incoming.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(incoming), Buffer.from(expected));
}

export async function POST(request: Request) {
  const env = getEnv();
  if (!env.SUMUP_API_KEY || !env.SUMUP_MERCHANT_CODE) {
    return NextResponse.json(
      { error: "sumup_not_configured" },
      { status: 503 },
    );
  }

  const rawPayload = await request.text();
  const signature = (await headers()).get("x-payload-signature");

  if (env.SUMUP_WEBHOOK_SECRET) {
    if (!signature || !verifySignature(rawPayload, signature, env.SUMUP_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
    }
  }

  let payload: SumUpWebhookPayload;
  try {
    payload = JSON.parse(rawPayload) as SumUpWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const checkoutId =
    typeof payload.id === "string"
      ? payload.id
      : typeof payload.checkout_id === "string"
        ? payload.checkout_id
        : "";

  if (!checkoutId) {
    return NextResponse.json({ error: "missing_checkout_id" }, { status: 400 });
  }

  if (payload.event_type && payload.event_type !== "CHECKOUT_STATUS_CHANGED") {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    await syncOrderFromSumUpSession(checkoutId, "webhook");
  } catch (error) {
    logger.error("SumUp webhook processing failed", { error, checkoutId });
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
