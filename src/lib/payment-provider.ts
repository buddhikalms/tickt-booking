import { getEnv } from "@/lib/env";

export type PaymentProvider = "stripe" | "sumup";

export function isStripeConfigured() {
  const env = getEnv();
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function isSumUpConfigured() {
  const env = getEnv();
  return Boolean(env.SUMUP_API_KEY && env.SUMUP_MERCHANT_CODE);
}

export function getActivePaymentProvider(): PaymentProvider {
  const env = getEnv();
  const stripeConfigured = isStripeConfigured();
  const sumUpConfigured = isSumUpConfigured();

  if (env.PAYMENT_PROVIDER === "stripe") {
    if (!stripeConfigured) {
      throw new Error("PAYMENT_PROVIDER=stripe but STRIPE_SECRET_KEY is missing.");
    }
    return "stripe";
  }

  if (env.PAYMENT_PROVIDER === "sumup") {
    if (!sumUpConfigured) {
      throw new Error("PAYMENT_PROVIDER=sumup but SUMUP_API_KEY or SUMUP_MERCHANT_CODE is missing.");
    }
    return "sumup";
  }

  if (sumUpConfigured && !stripeConfigured) {
    return "sumup";
  }
  if (stripeConfigured && !sumUpConfigured) {
    return "stripe";
  }
  if (stripeConfigured && sumUpConfigured) {
    return "stripe";
  }

  throw new Error(
    "No payment provider configured. Set Stripe keys, SumUp keys, or PAYMENT_PROVIDER with matching credentials.",
  );
}

export function storeCheckoutReference(provider: PaymentProvider, referenceId: string) {
  return provider === "sumup" ? `sumup:${referenceId}` : referenceId;
}

export function parseCheckoutReference(storedReference: string): { provider: PaymentProvider; referenceId: string } {
  if (storedReference.startsWith("sumup:")) {
    return { provider: "sumup", referenceId: storedReference.slice("sumup:".length) };
  }
  if (storedReference.startsWith("stripe:")) {
    return { provider: "stripe", referenceId: storedReference.slice("stripe:".length) };
  }
  return { provider: "stripe", referenceId: storedReference };
}
