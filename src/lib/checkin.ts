import { TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function extractTicketLookup(rawInput: string) {
  const value = rawInput.trim();
  if (!value) {
    return { code: null, id: null };
  }

  // New payload format from QR/barcode.
  if (value.startsWith("TID:")) {
    return { code: null, id: value.slice(4).trim() };
  }

  // Backward compatibility for old QR payloads that encoded full URLs.
  try {
    const url = new URL(value);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const ticketCode = pathParts[pathParts.length - 1];
    if (ticketCode) {
      return { code: ticketCode, id: null };
    }
  } catch {
  }

  // Manual or scanned plain value. Could be either code or id.
  return { code: value, id: value };
}

export async function checkInTicket(rawInput: string, userId: string) {
  const lookup = extractTicketLookup(rawInput);
  let ticket = null;

  if (lookup.id) {
    ticket = await prisma.ticket.findUnique({
      where: { id: lookup.id },
      include: { event: true, ticketType: true },
    });
  }
  if (!ticket && lookup.code) {
    ticket = await prisma.ticket.findUnique({
      where: { code: lookup.code },
      include: { event: true, ticketType: true },
    });
  }

  if (!ticket) {
    return { ok: false, message: "Ticket not found." };
  }
  if (ticket.status === TicketStatus.CANCELLED) {
    return { ok: false, message: "Ticket is cancelled." };
  }
  if (ticket.status === TicketStatus.USED) {
    return { ok: false, message: "Ticket already used." };
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: TicketStatus.USED,
      checkedInAt: new Date(),
      checkedInBy: userId,
    },
  });

  return { ok: true, message: "Check-in successful.", ticket };
}
