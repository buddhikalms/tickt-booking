import { getEnv } from "@/lib/env";

const SUMUP_API_BASE = "https://api.sumup.com/v0.1";

type SumUpTransaction = {
  id?: string;
  status?: string;
  transaction_code?: string;
};

export type SumUpCheckout = {
  id: string;
  status?: string;
  hosted_checkout_url?: string;
  checkout_reference?: string;
  transactions?: SumUpTransaction[];
};

type CreateSumUpHostedCheckoutInput = {
  checkoutReference: string;
  amountCents: number;
  currency: string;
  description: string;
  redirectUrl: string;
  webhookUrl: string;
};

function getSumUpHeaders() {
  const env = getEnv();
  if (!env.SUMUP_API_KEY) {
    throw new Error("SUMUP_API_KEY is missing.");
  }
  return {
    Authorization: `Bearer ${env.SUMUP_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function createSumUpHostedCheckout(input: CreateSumUpHostedCheckoutInput) {
  const env = getEnv();
  if (!env.SUMUP_MERCHANT_CODE) {
    throw new Error("SUMUP_MERCHANT_CODE is missing.");
  }

  const amount = Number((input.amountCents / 100).toFixed(2));

  const response = await fetch(`${SUMUP_API_BASE}/checkouts`, {
    method: "POST",
    headers: getSumUpHeaders(),
    body: JSON.stringify({
      checkout_reference: input.checkoutReference,
      amount,
      currency: input.currency.toUpperCase(),
      description: input.description,
      merchant_code: env.SUMUP_MERCHANT_CODE,
      redirect_url: input.redirectUrl,
      return_url: input.webhookUrl,
      hosted_checkout: {
        enabled: true,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`SumUp checkout create failed (${response.status}): ${details || "unknown error"}`);
  }

  return (await response.json()) as SumUpCheckout;
}

export async function getSumUpCheckout(checkoutId: string) {
  const response = await fetch(`${SUMUP_API_BASE}/checkouts/${encodeURIComponent(checkoutId)}`, {
    method: "GET",
    headers: getSumUpHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`SumUp checkout fetch failed (${response.status}): ${details || "unknown error"}`);
  }

  return (await response.json()) as SumUpCheckout;
}
