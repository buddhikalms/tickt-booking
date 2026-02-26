import { prisma } from "@/lib/prisma";

export async function getPublishedEvents() {
  return prisma.event.findMany({
    where: { isPublished: true },
    include: {
      ticketTypes: {
        where: { isActive: true },
        orderBy: { priceCents: "asc" },
      },
    },
    orderBy: { startsAt: "asc" },
  });
}

export async function getEventById(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      ticketTypes: { orderBy: { priceCents: "asc" } },
    },
  });
}
