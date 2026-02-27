"use server";

import { OrderStatus, Role, TicketStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTicketsForOrder, syncOrderFromStoredCheckoutReference } from "@/lib/order-service";
import { eventSchema, ticketTypeSchema } from "@/lib/validators";

export async function saveEventAction(eventId: string | null, formData: FormData) {
  await requireRole([Role.ADMIN, Role.STAFF]);

  const parsed = eventSchema.parse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    venue: String(formData.get("venue") ?? ""),
    address: String(formData.get("address") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
    coverImage: String(formData.get("coverImage") ?? ""),
    isPublished: String(formData.get("isPublished") ?? "") === "true",
  });

  const data = {
    title: parsed.title,
    description: parsed.description,
    venue: parsed.venue,
    address: parsed.address,
    startsAt: new Date(parsed.startsAt),
    endsAt: new Date(parsed.endsAt),
    coverImage: parsed.coverImage || null,
    isPublished: parsed.isPublished,
  };

  if (eventId) {
    await prisma.event.update({ where: { id: eventId }, data });
  } else {
    await prisma.event.create({ data });
  }

  revalidatePath("/admin/events");
}

export async function saveTicketTypeAction(eventId: string, ticketTypeId: string | null, formData: FormData) {
  await requireRole([Role.ADMIN, Role.STAFF]);

  const parsed = ticketTypeSchema.parse({
    name: String(formData.get("name") ?? ""),
    priceCents: Number(formData.get("priceCents") ?? 0),
    currency: String(formData.get("currency") ?? "USD"),
    quantity: Number(formData.get("quantity") ?? 0),
    isActive: String(formData.get("isActive") ?? "") === "true",
  });

  const data = { ...parsed, currency: parsed.currency.toUpperCase() };
  if (ticketTypeId) {
    const existing = await prisma.ticketType.findUnique({ where: { id: ticketTypeId } });
    if (!existing || existing.eventId !== eventId) {
      throw new Error("Ticket type not found for event.");
    }
    await prisma.ticketType.update({
      where: { id: ticketTypeId },
      data,
    });
  } else {
    await prisma.ticketType.create({
      data: { ...data, eventId },
    });
  }

  revalidatePath(`/admin/events/${eventId}/ticket-types`);
  revalidatePath(`/events/${eventId}`);
}

export async function resendOrderTicketsAction(orderId: string) {
  await requireRole([Role.ADMIN, Role.STAFF]);
  await sendTicketsForOrder(orderId);
}

export async function syncOrderPaymentAction(orderId: string) {
  await requireRole([Role.ADMIN, Role.STAFF]);
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { stripeSessionId: true },
  });
  if (!order?.stripeSessionId) {
    throw new Error("Order has no checkout reference.");
  }

  await syncOrderFromStoredCheckoutReference(order.stripeSessionId, "admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/tickets");
  revalidatePath("/dashboard");
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
  await requireRole([Role.ADMIN, Role.STAFF]);
  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
  revalidatePath("/admin/orders");
}

export async function cancelTicketAction(ticketId: string) {
  await requireRole([Role.ADMIN, Role.STAFF]);
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: TicketStatus.CANCELLED },
  });
  revalidatePath("/admin/tickets");
}
