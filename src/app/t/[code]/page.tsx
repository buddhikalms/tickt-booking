import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function TicketLandingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { code },
    include: { event: true, ticketType: true },
  });

  if (!ticket) {
    notFound();
  }

  const variant =
    ticket.status === "VALID" ? "success" : ticket.status === "USED" ? "warning" : "destructive";

  return (
    <section className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Ticket Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant={variant}>{ticket.status}</Badge>
          <p className="text-sm"><strong>Code:</strong> {ticket.code}</p>
          <p className="text-sm"><strong>Event:</strong> {ticket.event.title}</p>
          <p className="text-sm"><strong>Date:</strong> {format(ticket.event.startsAt, "PPP p")}</p>
          <p className="text-sm"><strong>Ticket Type:</strong> {ticket.ticketType.name}</p>
          {ticket.checkedInAt ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Checked in at {format(ticket.checkedInAt, "PPP p")}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
