import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { TicketTypeForm } from "./ticket-type-form";

export default async function TicketTypesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { ticketTypes: { orderBy: { createdAt: "desc" } } },
  });
  if (!event) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Ticket Types: {event.title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create Ticket Type</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketTypeForm eventId={event.id} />
        </CardContent>
      </Card>
      <div className="space-y-3">
        {event.ticketTypes.map((ticketType) => (
          <Card key={ticketType.id}>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{ticketType.name}</p>
                  <p className="text-sm text-slate-500">
                    {formatCurrency(ticketType.priceCents, ticketType.currency)} | Sold {ticketType.sold}/{ticketType.quantity}
                  </p>
                </div>
                <Badge variant={ticketType.isActive ? "success" : "secondary"}>
                  {ticketType.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <TicketTypeForm
                eventId={event.id}
                ticketTypeId={ticketType.id}
                defaults={{
                  name: ticketType.name,
                  priceCents: ticketType.priceCents,
                  currency: ticketType.currency,
                  quantity: ticketType.quantity,
                  isActive: ticketType.isActive,
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
