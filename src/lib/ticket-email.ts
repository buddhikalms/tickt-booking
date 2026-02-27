import { format } from "date-fns";
import type { Ticket, TicketType, Event, Order } from "@prisma/client";
import { getEnv } from "@/lib/env";
import { getMailer } from "@/lib/mailer";
import { buildBarcodeBuffer, buildQrDataUrl } from "@/lib/ticket-artifacts";
import { logger } from "@/lib/logger";
import { renderTicketsPdf, type TicketPdfItem } from "@/lib/ticket-pdf";

type TicketWithDetails = Ticket & {
  ticketType: TicketType;
  event: Event;
};

export async function sendTicketsEmail(order: Order, tickets: TicketWithDetails[]) {
  if (tickets.length === 0) return;

  const payload: TicketPdfItem[] = await Promise.all(
    tickets.map(async (ticket) => {
      const ticketIdentifier = `TID:${ticket.id}`;
      return {
        ticketCode: ticket.code,
        eventTitle: ticket.event.title,
        eventVenue: ticket.event.venue,
        eventAddress: ticket.event.address,
        eventDate: format(ticket.event.startsAt, "PPP p"),
        buyerEmail: order.email,
        ticketType: ticket.ticketType.name,
        qrDataUrl: await buildQrDataUrl(ticketIdentifier),
        barcodePng: await buildBarcodeBuffer(ticketIdentifier),
      };
    }),
  );

  const pdfBuffer = await renderTicketsPdf(payload);
  const firstEvent = tickets[0].event;
  const firstTicketBarcode = payload[0]?.barcodePng
    ? `data:image/png;base64,${payload[0].barcodePng.toString("base64")}`
    : null;
  const firstTicketQr = payload[0]?.qrDataUrl ?? null;
  const ticketRowsHtml = tickets
    .slice(0, 6)
    .map(
      (ticket) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;">${ticket.ticketType.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;">${ticket.code}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;">${format(ticket.event.startsAt, "PPP p")}</td>
      </tr>`,
    )
    .join("");

  const info = await getMailer().sendMail({
    from: getEnv().EMAIL_FROM,
    to: order.email,
    subject: `Your tickets for ${firstEvent.title}`,
    html: `
      <div style="margin:0;background:#fff7ed;padding:24px 12px;font-family:'Segoe UI',Arial,sans-serif;color:#3f2819;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:24px;background:linear-gradient(120deg,#92400e,#b45309);color:#ffffff;">
              <p style="margin:0;font-size:12px;opacity:.85;letter-spacing:.8px;text-transform:uppercase;">Temple Tickets</p>
              <h1 style="margin:8px 0 0;font-size:24px;line-height:1.2;">Your booking is confirmed</h1>
              <p style="margin:10px 0 0;font-size:14px;opacity:.95;">Thank you for your purchase. Your official ticket PDF is attached to this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px 8px;">
              <p style="margin:0;font-size:14px;color:#475569;">Hi there,</p>
              <p style="margin:8px 0 0;font-size:14px;color:#475569;">
                We are excited to see you at <strong style="color:#0f172a;">${firstEvent.title}</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                <tr>
                  <td style="padding:12px 14px;">
                    <p style="margin:0;font-size:12px;color:#64748b;">Event</p>
                    <p style="margin:2px 0 0;font-size:14px;font-weight:600;">${firstEvent.title}</p>
                  </td>
                  <td style="padding:12px 14px;">
                    <p style="margin:0;font-size:12px;color:#64748b;">Venue</p>
                    <p style="margin:2px 0 0;font-size:14px;font-weight:600;">${firstEvent.venue}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 0;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;">Tickets (${tickets.length})</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                <thead>
                  <tr style="background:#f1f5f9;">
                    <th align="left" style="padding:10px 12px;font-size:12px;color:#475569;">Type</th>
                    <th align="left" style="padding:10px 12px;font-size:12px;color:#475569;">Code</th>
                    <th align="left" style="padding:10px 12px;font-size:12px;color:#475569;">Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${ticketRowsHtml}
                </tbody>
              </table>
              ${
                tickets.length > 6
                  ? `<p style="margin:8px 0 0;font-size:12px;color:#64748b;">+ ${tickets.length - 6} more ticket(s) in attached PDF.</p>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px 24px;">
              ${
                firstTicketBarcode
                  ? `<div style="margin-bottom:12px;padding:12px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">
                      <p style="margin:0 0 8px;font-size:12px;color:#64748b;">Primary Ticket Barcode</p>
                      <img src="${firstTicketBarcode}" alt="Ticket barcode" style="display:block;max-width:280px;height:auto;" />
                      ${
                        firstTicketQr
                          ? `<img src="${firstTicketQr}" alt="Ticket QR" style="display:block;margin-top:10px;width:92px;height:92px;border:1px solid #e2e8f0;border-radius:8px;" />`
                          : ""
                      }
                    </div>`
                  : ""
              }
              <a href="${getEnv().APP_URL}/dashboard" style="display:inline-block;background:#92400e;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:600;">Open My Dashboard</a>
              <p style="margin:12px 0 0;font-size:12px;color:#64748b;">
                Bring this ticket PDF to the event. QR/barcode is required for check-in.
              </p>
            </td>
          </tr>
        </table>
      </div>
    `,
    attachments: [
      {
        filename: `tickets-${order.id}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (info.rejected?.length) {
    logger.error("Failed to send ticket email", { orderId: order.id, rejected: info.rejected });
    throw new Error("EMAIL_SEND_FAILED");
  }

  logger.info("Ticket email sent", {
    orderId: order.id,
    email: order.email,
    ticketCount: tickets.length,
    messageId: info.messageId,
  });
}
