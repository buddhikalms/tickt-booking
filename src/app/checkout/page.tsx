import { format } from "date-fns";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getEventById } from "@/lib/queries";
import { resolveCurrency } from "@/lib/utils";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string; ticketTypeId?: string; qty?: string }>;
}) {
  const { eventId, ticketTypeId, qty } = await searchParams;
  if (!eventId) {
    redirect("/");
  }
  const event = await getEventById(eventId);
  if (!event || !event.isPublished) {
    redirect("/");
  }

  const session = await auth();
  const selectedQty = Math.max(1, Math.min(Number(qty) || 1, 20));
  const initialQuantities = ticketTypeId ? { [ticketTypeId]: selectedQty } : undefined;

  return (
    <section className="mx-auto max-w-3xl animate-fade-in-up">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Secure Checkout</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckoutForm
            eventId={event.id}
            defaultEmail={session?.user?.email ?? ""}
            eventTitle={event.title}
            eventDateLabel={format(event.startsAt, "PPP p")}
            venueLabel={`${event.venue} - ${event.address}`}
            initialQuantities={initialQuantities}
            ticketTypes={event.ticketTypes
              .filter((type) => type.isActive)
              .map((type) => ({
                id: type.id,
                name: type.name,
                priceCents: type.priceCents,
                currency: resolveCurrency(type.currency),
                remaining: Math.max(type.quantity - type.sold, 0),
              }))}
          />
        </CardContent>
      </Card>
    </section>
  );
}
