import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { EventsTable } from "./events-table";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({ orderBy: { startsAt: "desc" } });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Events</h1>
        <Button asChild>
          <Link href="/admin/events/new">Create Event</Link>
        </Button>
      </div>
      <EventsTable
        data={events.map((event) => ({
          id: event.id,
          title: event.title,
          venue: event.venue,
          startsAt: format(event.startsAt, "PPP p"),
          isPublished: event.isPublished,
        }))}
      />
    </section>
  );
}
