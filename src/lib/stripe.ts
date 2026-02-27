import Stripe from "stripe";

const globalForStripe = globalThis as unknown as { stripe?: Stripe };

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is missing.");
  }
  if (!globalForStripe.stripe) {
    globalForStripe.stripe = new Stripe(key, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return globalForStripe.stripe;
}
