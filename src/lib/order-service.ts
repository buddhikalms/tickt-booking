import { OrderStatus, Prisma, TicketStatus } from "@prisma/client";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  type PaymentProvider,
  getActivePaymentProvider,
  parseCheckoutReference,
  storeCheckoutReference,
} from "@/lib/payment-provider";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { createSumUpHostedCheckout, getSumUpCheckout } from "@/lib/sumup";
import { generateTicketCode } from "@/lib/ticket-code";
import { sendTicketsEmail } from "@/lib/ticket-email";
import { checkoutSchema } from "@/lib/validators";

type CheckoutInput = {
  eventId: string;
  email: string;
  selections: Array<{ ticketTypeId: string; quantity: number }>;
  userId?: string | null;
};

type SyncSource = "success" | "admin" | "dashboard" | "webhook";

type SyncResult = {
  ok: boolean;
  paid: boolean;
  status: OrderStatus | null;
  message: string;
  orderId?: string;
  synced?: boolean;
};

export async function createCheckoutSession(input: CheckoutInput) {
  const parsed = checkoutSchema.parse(input);
  const chosen = parsed.selections.filter((selection) => selection.quantity > 0);
  if (chosen.length === 0) {
    throw new Error("Please select at least one ticket.");
  }

  const event = await prisma.event.findUnique({
    where: { id: parsed.eventId, isPublished: true },
    include: { ticketTypes: true },
  });

  if (!event) {
    throw new Error("Event not found.");
  }

  const ticketTypeMap = new Map(event.ticketTypes.map((ticketType) => [ticketType.id, ticketType]));
  const normalizedItems = chosen.map((item) => {
    const ticketType = ticketTypeMap.get(item.ticketTypeId);
    if (!ticketType || !ticketType.isActive) {
      throw new Error("Invalid ticket type");
    }
    return {
      ticketTypeId: ticketType.id,
      quantity: item.quantity,
      unitPriceCents: ticketType.priceCents,
      name: ticketType.name,
      currency: ticketType.currency,
    };
  });

  const totalCents = normalizedItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
  const currency = normalizedItems[0].currency.toLowerCase();

  const order = await prisma.$transaction(async (tx) => {
    return tx.order.create({
      data: {
        userId: input.userId ?? null,
        email: parsed.email,
        status: OrderStatus.PENDING,
        totalCents,
        currency: currency.toUpperCase(),
        items: {
          create: normalizedItems.map((item) => ({
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
          })),
        },
      },
      include: { items: true },
    });
  });

  const provider = getActivePaymentProvider();

  if (provider === "stripe") {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: parsed.email,
      success_url: `${getEnv().APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getEnv().APP_URL}/events/${event.id}`,
      metadata: {
        orderId: order.id,
        eventId: event.id,
      },
      line_items: normalizedItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency,
          unit_amount: item.unitPriceCents,
          product_data: {
            name: `${event.title} - ${item.name}`,
          },
        },
      })),
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: storeCheckoutReference("stripe", session.id) },
    });

    return {
      provider,
      checkoutId: session.id,
      url: session.url,
    };
  }

  const ticketCount = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
  const checkout = await createSumUpHostedCheckout({
    checkoutReference: order.id,
    amountCents: totalCents,
    currency: currency.toUpperCase(),
    description: `${event.title} (${ticketCount} ticket${ticketCount > 1 ? "s" : ""})`,
    redirectUrl: `${getEnv().APP_URL}/success?provider=sumup&order_id=${order.id}`,
    webhookUrl: `${getEnv().APP_URL}/api/sumup/webhook`,
  });

  if (!checkout.id || !checkout.hosted_checkout_url) {
    throw new Error("SumUp checkout URL was not returned.");
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: storeCheckoutReference("sumup", checkout.id) },
  });

  return {
    provider,
    checkoutId: checkout.id,
    url: checkout.hosted_checkout_url,
  };
}

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function fulfillCheckoutSession(
  tx: TxClient,
  event: { id: string; type: string },
  sessionId: string,
  paymentReferenceId?: string | null,
  provider: PaymentProvider = "stripe",
) {
  const alreadyProcessed = await tx.webhookEvent.findUnique({
    where: { stripeEventId: event.id },
  });
  if (alreadyProcessed) {
    logger.info("Webhook already processed", { stripeEventId: event.id });
    return { duplicate: true };
  }

  await tx.webhookEvent.create({
    data: {
      stripeEventId: event.id,
      type: event.type,
    },
  });

  const order = await tx.order.findUnique({
    where: { stripeSessionId: storeCheckoutReference(provider, sessionId) },
    include: {
      items: {
        include: {
          ticketType: true,
        },
      },
      tickets: true,
    },
  });

  if (!order) {
    throw new Error(`Order not found for ${provider} checkout ${sessionId}`);
  }

  if (order.status === OrderStatus.PAID && order.tickets.length > 0) {
    logger.info("Order already fulfilled", { orderId: order.id });
    return { duplicate: true };
  }

  for (const item of order.items) {
    const projected = item.ticketType.sold + item.quantity;
    if (projected > item.ticketType.quantity) {
      throw new Error(`Not enough inventory for ticket type ${item.ticketTypeId}`);
    }
    await tx.ticketType.update({
      where: { id: item.ticketTypeId },
      data: { sold: { increment: item.quantity } },
    });
  }

  await tx.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.PAID,
      stripePaymentIntentId: paymentReferenceId ?? order.stripePaymentIntentId,
    },
  });

  const ticketCreates: Prisma.TicketCreateManyInput[] = [];
  for (const item of order.items) {
    for (let i = 0; i < item.quantity; i += 1) {
      ticketCreates.push({
        orderId: order.id,
        eventId: item.ticketType.eventId,
        ticketTypeId: item.ticketTypeId,
        status: TicketStatus.VALID,
        code: generateTicketCode(),
      });
    }
  }

  await tx.ticket.createMany({ data: ticketCreates });

  const issuedTickets = await tx.ticket.findMany({
    where: { orderId: order.id },
    include: { event: true, ticketType: true },
  });

  const paidOrder = await tx.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.PAID },
  });

  return { duplicate: false, order: paidOrder, issuedTickets };
}

export async function processCheckoutSessionCompleted(
  event: { id: string; type: string },
  sessionId: string,
  paymentReferenceId?: string | null,
  provider: PaymentProvider = "stripe",
) {
  return prisma.$transaction((tx) =>
    fulfillCheckoutSession(tx, event, sessionId, paymentReferenceId, provider),
  );
}

export async function sendTicketsForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      tickets: {
        include: {
          event: true,
          ticketType: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }
  if (order.status !== OrderStatus.PAID) {
    throw new Error("Order is not paid");
  }

  await sendTicketsEmail(order, order.tickets);
}

async function syncOrderFromStripeCheckout(
  sessionId: string,
  source: SyncSource = "success",
): Promise<SyncResult> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  const order = await prisma.order.findUnique({
    where: { stripeSessionId: storeCheckoutReference("stripe", sessionId) },
    include: { tickets: true },
  });
  if (!order) {
    return {
      ok: false,
      paid: false,
      status: null,
      message: "Order not found for Stripe session.",
    };
  }

  const isPaid = session.payment_status === "paid" || session.status === "complete";
  if (!isPaid) {
    return {
      ok: true,
      paid: false,
      status: order.status,
      message: "Payment is not completed yet.",
    };
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const result = await processCheckoutSessionCompleted(
    { id: `manual_${source}_${session.id}`, type: "manual.checkout.session.completed" },
    session.id,
    paymentIntentId,
    "stripe",
  );

  if (!result.duplicate && result.order) {
    await sendTicketsForOrder(result.order.id);
    return {
      ok: true,
      paid: true,
      status: result.order.status,
      message: "Order marked paid and ticket email sent.",
      orderId: result.order.id,
      synced: true,
    };
  }

  if (order.status === OrderStatus.PAID && order.tickets.length > 0) {
    return {
      ok: true,
      paid: true,
      status: order.status,
      message: "Order already fulfilled.",
      orderId: order.id,
      synced: false,
    };
  }

  return {
    ok: true,
    paid: true,
    status: order.status,
    message: "Payment completed, awaiting fulfillment.",
    orderId: order.id,
    synced: false,
  };
}

async function syncOrderFromSumUpCheckout(
  checkoutId: string,
  source: SyncSource = "success",
): Promise<SyncResult> {
  const checkout = await getSumUpCheckout(checkoutId);

  const order = await prisma.order.findUnique({
    where: { stripeSessionId: storeCheckoutReference("sumup", checkoutId) },
    include: { tickets: true },
  });

  if (!order) {
    return {
      ok: false,
      paid: false,
      status: null,
      message: "Order not found for SumUp checkout.",
    };
  }

  const paymentStatus = checkout.status?.toUpperCase() ?? "UNKNOWN";
  if (paymentStatus !== "PAID") {
    return {
      ok: true,
      paid: false,
      status: order.status,
      message: `Payment is ${paymentStatus.toLowerCase()}.`,
    };
  }

  const successfulTransaction = checkout.transactions?.find(
    (transaction) => transaction.status?.toUpperCase() === "SUCCESSFUL",
  );
  const paymentReference =
    successfulTransaction?.transaction_code ?? successfulTransaction?.id ?? null;

  const result = await processCheckoutSessionCompleted(
    { id: `manual_${source}_${checkout.id}`, type: "manual.sumup.checkout.paid" },
    checkout.id,
    paymentReference,
    "sumup",
  );

  if (!result.duplicate && result.order) {
    await sendTicketsForOrder(result.order.id);
    return {
      ok: true,
      paid: true,
      status: result.order.status,
      message: "Order marked paid and ticket email sent.",
      orderId: result.order.id,
      synced: true,
    };
  }

  if (order.status === OrderStatus.PAID && order.tickets.length > 0) {
    return {
      ok: true,
      paid: true,
      status: order.status,
      message: "Order already fulfilled.",
      orderId: order.id,
      synced: false,
    };
  }

  return {
    ok: true,
    paid: true,
    status: order.status,
    message: "Payment completed, awaiting fulfillment.",
    orderId: order.id,
    synced: false,
  };
}

export async function syncOrderFromStripeSession(
  sessionId: string,
  source: SyncSource = "success",
) {
  return syncOrderFromStripeCheckout(sessionId, source);
}

export async function syncOrderFromSumUpSession(
  checkoutId: string,
  source: SyncSource = "success",
) {
  return syncOrderFromSumUpCheckout(checkoutId, source);
}

export async function syncOrderFromStoredCheckoutReference(
  storedReference: string,
  source: SyncSource = "success",
) {
  const parsed = parseCheckoutReference(storedReference);
  if (parsed.provider === "sumup") {
    return syncOrderFromSumUpCheckout(parsed.referenceId, source);
  }
  return syncOrderFromStripeCheckout(parsed.referenceId, source);
}

export async function syncOrderFromOrderId(orderId: string, source: SyncSource = "success") {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { stripeSessionId: true },
  });

  if (!order?.stripeSessionId) {
    return {
      ok: false,
      paid: false,
      status: null,
      message: "Order has no checkout reference.",
    } satisfies SyncResult;
  }

  return syncOrderFromStoredCheckoutReference(order.stripeSessionId, source);
}
