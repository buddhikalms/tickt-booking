import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { processCheckoutSessionCompleted, sendTicketsForOrder } from "@/lib/order-service";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const env = getEnv();
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
  }

  const payload = await request.text();
  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    logger.error("Stripe signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      const result = await processCheckoutSessionCompleted(
        { id: event.id, type: event.type },
        session.id,
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
      );
      if (!result.duplicate && result.order) {
        await sendTicketsForOrder(result.order.id, { notifyAdmin: true });
      }
    } catch (error) {
      logger.error("Webhook processing failed", { error, eventId: event.id, sessionId: session.id });
      return NextResponse.json({ error: "processing_failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
