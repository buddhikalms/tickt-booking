"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { OrderStatus, Role, TicketStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CURRENCY } from "@/lib/utils";
import { sendTicketsForOrder, syncOrderFromStoredCheckoutReference } from "@/lib/order-service";
import { eventSchema, ticketTypeSchema } from "@/lib/validators";

const COVER_IMAGE_UPLOAD_DIR = join(process.cwd(), "public", "uploads", "events");
const COVER_IMAGE_PUBLIC_PREFIX = "/uploads/events/";
const MAX_COVER_IMAGE_BYTES = 5 * 1024 * 1024;
const COVER_IMAGE_EXTENSIONS = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

function isManagedCoverImage(pathname: string | null | undefined) {
  return Boolean(pathname?.startsWith(COVER_IMAGE_PUBLIC_PREFIX));
}

async function deleteManagedCoverImage(pathname: string | null | undefined) {
  if (!isManagedCoverImage(pathname)) return;

  const filePath = join(process.cwd(), "public", pathname!.replace(/^\//, ""));
  await unlink(filePath).catch(() => undefined);
}

async function storeCoverImage(file: File) {
  if (file.size > MAX_COVER_IMAGE_BYTES) {
    throw new Error("COVER_IMAGE_TOO_LARGE");
  }

  const extension = COVER_IMAGE_EXTENSIONS.get(file.type);
  if (!extension) {
    throw new Error("INVALID_COVER_IMAGE_TYPE");
  }

  await mkdir(COVER_IMAGE_UPLOAD_DIR, { recursive: true });

  const filename = `${randomUUID()}${extension}`;
  const filePath = join(COVER_IMAGE_UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, buffer);

  return `${COVER_IMAGE_PUBLIC_PREFIX}${filename}`;
}

export async function saveEventAction(eventId: string | null, formData: FormData) {
  await requireRole([Role.ADMIN, Role.STAFF]);

  const existingEvent = eventId
    ? await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, coverImage: true },
      })
    : null;

  if (eventId && !existingEvent) {
    throw new Error("EVENT_NOT_FOUND");
  }

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
  const removeCoverImage = String(formData.get("removeCoverImage") ?? "") === "true";
  const coverImageFile = formData.get("coverImageFile");
  const hasUploadedCoverImage = coverImageFile instanceof File && coverImageFile.size > 0;

  let nextCoverImage = parsed.coverImage || null;
  if (removeCoverImage) {
    nextCoverImage = null;
  }

  if (hasUploadedCoverImage) {
    nextCoverImage = await storeCoverImage(coverImageFile);
  }

  const data = {
    title: parsed.title,
    description: parsed.description,
    venue: parsed.venue,
    address: parsed.address,
    startsAt: new Date(parsed.startsAt),
    endsAt: new Date(parsed.endsAt),
    coverImage: nextCoverImage,
    isPublished: parsed.isPublished,
  };

  if (eventId) {
    await prisma.event.update({ where: { id: eventId }, data });
  } else {
    const createdEvent = await prisma.event.create({ data });
    revalidatePath(`/events/${createdEvent.id}`);
  }

  const previousCoverImage = existingEvent?.coverImage ?? null;
  if (previousCoverImage && previousCoverImage !== nextCoverImage) {
    await deleteManagedCoverImage(previousCoverImage);
  }

  revalidatePath("/admin/events");
  revalidatePath("/");
  if (eventId) {
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/admin/events/${eventId}`);
  }
}

export async function saveTicketTypeAction(eventId: string, ticketTypeId: string | null, formData: FormData) {
  await requireRole([Role.ADMIN, Role.STAFF]);

  const parsed = ticketTypeSchema.parse({
    name: String(formData.get("name") ?? ""),
    priceCents: Number(formData.get("priceCents") ?? 0),
    currency: String(formData.get("currency") ?? DEFAULT_CURRENCY),
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
