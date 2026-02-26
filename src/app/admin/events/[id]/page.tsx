import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { EventForm } from "../event-form";

function toInputDate(date: Date) {
  const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
  return iso.slice(0, 16);
}

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit Event</h1>
      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            eventId={event.id}
            defaultValues={{
              title: event.title,
              description: event.description,
              venue: event.venue,
              address: event.address,
              startsAt: toInputDate(event.startsAt),
              endsAt: toInputDate(event.endsAt),
              coverImage: event.coverImage ?? "",
              isPublished: event.isPublished,
            }}
          />
        </CardContent>
      </Card>
    </section>
  );
}
