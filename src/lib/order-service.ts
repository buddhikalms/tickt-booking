import { OrderStatus, Prisma, TicketStatus } from "@prisma/client";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { generateTicketCode } from "@/lib/ticket-code";
import { sendTicketsEmail } from "@/lib/ticket-email";
import { checkoutSchema } from "@/lib/validators";

type CheckoutInput = {
  eventId: string;
  email: string;
  selections: Array<{ ticketTypeId: string; quantity: number }>;
  userId?: string | null;
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
    data: { stripeSessionId: session.id },
  });

  return session;
}

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function fulfillCheckoutSession(
  tx: TxClient,
  event: { id: string; type: string },
  sessionId: string,
  stripePaymentIntentId?: string | null,
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
    where: { stripeSessionId: sessionId },
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
    throw new Error(`Order not found for session ${sessionId}`);
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
      stripePaymentIntentId: stripePaymentIntentId ?? order.stripePaymentIntentId,
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
  stripePaymentIntentId?: string | null,
) {
  return prisma.$transaction((tx) => fulfillCheckoutSession(tx, event, sessionId, stripePaymentIntentId));
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

export async function syncOrderFromStripeSession(
  sessionId: string,
  source: "success" | "admin" | "dashboard" = "success",
) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  const order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
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
