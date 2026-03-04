import { format } from "date-fns";
import type { Event, Order, OrderItem, Ticket, TicketType } from "@prisma/client";
import { getEnv } from "@/lib/env";
import { getResend } from "@/lib/mailer";
import { calculateOrderTotals } from "@/lib/pricing";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/utils";

type TicketWithDetails = Ticket & {
  ticketType: TicketType;
  event: Event;
};

type OrderWithItems = Order & {
  items: OrderItem[];
};

const EMAIL_TEMPLATE_NAME = "Sri Sambuddha Viharaya Tickets";

function resolveAdminRecipient() {
  const env = getEnv();
  return env.ADMIN_NOTIFICATION_EMAIL ?? env.EMAIL_FROM;
}

export async function sendAdminTicketNotificationEmail(order: OrderWithItems, tickets: TicketWithDetails[]) {
  if (tickets.length === 0) return;

  const env = getEnv();
  const firstEvent = tickets[0].event;
  const subtotalCents = order.items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
  const totals = calculateOrderTotals(subtotalCents);
  const ticketRowsHtml = tickets
    .slice(0, 8)
    .map(
      (ticket) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;">${ticket.ticketType.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;">${ticket.code}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;">${format(ticket.event.startsAt, "PPP p")}</td>
      </tr>`,
    )
    .join("");

  const { data, error } = await getResend().emails.send({
    from: env.EMAIL_FROM,
    to: resolveAdminRecipient(),
    subject: `Tickets - ${firstEvent.title}`,
    html: `
      <div style="margin:0;background:#f8fafc;padding:24px 12px;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:24px;background:linear-gradient(120deg,#0f172a,#334155);color:#ffffff;">
              <p style="margin:0;font-size:12px;opacity:.8;letter-spacing:.8px;text-transform:uppercase;">${EMAIL_TEMPLATE_NAME}</p>
              <h1 style="margin:8px 0 0;font-size:24px;line-height:1.2;">A new ticket order was issued</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:12px;color:#92400e;font-weight:700;letter-spacing:.6px;text-transform:uppercase;">Template: ${EMAIL_TEMPLATE_NAME}</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;">
                <tr>
                  <td style="font-size:13px;color:#64748b;">Order ID</td>
                  <td style="font-size:14px;font-weight:600;color:#0f172a;">${order.id}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#64748b;">Customer</td>
                  <td style="font-size:14px;font-weight:600;color:#0f172a;">${order.email}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#64748b;">Event</td>
                  <td style="font-size:14px;font-weight:600;color:#0f172a;">${firstEvent.title}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#64748b;">Venue</td>
                  <td style="font-size:14px;font-weight:600;color:#0f172a;">${firstEvent.venue}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#64748b;">Ticket Count</td>
                  <td style="font-size:14px;font-weight:600;color:#0f172a;">${tickets.length}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#64748b;">Subtotal</td>
                  <td style="font-size:14px;font-weight:600;color:#0f172a;">${formatCurrency(totals.subtotalCents, order.currency)}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#64748b;">Gateway Charge</td>
                  <td style="font-size:14px;font-weight:600;color:#0f172a;">${formatCurrency(totals.gatewayFeeCents, order.currency)}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#64748b;">Total</td>
                  <td style="font-size:14px;font-weight:700;color:#0f172a;">${formatCurrency(order.totalCents, order.currency)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;">Issued Tickets</p>
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
                tickets.length > 8
                  ? `<p style="margin:8px 0 0;font-size:12px;color:#64748b;">+ ${tickets.length - 8} more ticket(s) on the order.</p>`
                  : ""
              }
              <p style="margin:16px 0 0;">
                <a href="${env.APP_URL}/admin/orders" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:600;">Open Admin Orders</a>
              </p>
            </td>
          </tr>
        </table>
      </div>
    `,
  });

  if (error || !data?.id) {
    logger.error("Failed to send admin ticket notification email", {
      orderId: order.id,
      error: error?.message ?? "Unknown Resend API error",
    });
    throw new Error("ADMIN_EMAIL_SEND_FAILED");
  }

  logger.info("Admin ticket notification email sent", {
    orderId: order.id,
    messageId: data.id,
    recipient: resolveAdminRecipient(),
  });
}
