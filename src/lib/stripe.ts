import Stripe from "stripe";

const globalForStripe = globalThis as unknown as { stripe?: Stripe };

export function getStripe() {
  if (!globalForStripe.stripe) {
    globalForStripe.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return globalForStripe.stripe;
}
