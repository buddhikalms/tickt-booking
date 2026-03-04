export const PAYMENT_GATEWAY_FEE_RATE = 0.015;
export const PAYMENT_GATEWAY_FIXED_FEE_CENTS = 20;

export function calculateGatewayFeeCents(subtotalCents: number) {
  if (subtotalCents <= 0) {
    return 0;
  }

  return Math.round(subtotalCents * PAYMENT_GATEWAY_FEE_RATE) + PAYMENT_GATEWAY_FIXED_FEE_CENTS;
}

export function calculateOrderTotals(subtotalCents: number) {
  const gatewayFeeCents = calculateGatewayFeeCents(subtotalCents);

  return {
    subtotalCents,
    gatewayFeeCents,
    totalCents: subtotalCents + gatewayFeeCents,
  };
}
