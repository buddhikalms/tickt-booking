import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEventById } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event || !event.isPublished) {
    return {
      title: "Event Not Found",
      description: "The requested event could not be found.",
    };
  }

  return {
    title: event.title,
    description: event.description.slice(0, 150),
    openGraph: {
      title: event.title,
      description: event.description.slice(0, 150),
      type: "article",
      images: event.coverImage ? [event.coverImage] : [],
    },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event || !event.isPublished) {
    notFound();
  }

  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.startsAt.toISOString(),
    endDate: event.endsAt.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: event.address,
    },
    image: event.coverImage ? [event.coverImage] : [],
    description: event.description,
    offers: event.ticketTypes
      .filter((type) => type.isActive)
      .map((type) => ({
        "@type": "Offer",
        priceCurrency: type.currency,
        price: (type.priceCents / 100).toFixed(2),
        availability: "https://schema.org/InStock",
      })),
  };

  return (
    <section className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <div
        className="relative animate-fade-in-up overflow-hidden rounded-3xl border border-slate-200/70 shadow-2xl dark:border-slate-800"
        style={{
          backgroundImage: `url(${event.coverImage ?? "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/50 to-cyan-900/30" />
        <div className="relative z-10 p-8 text-white md:p-10">
          <Badge className="mb-4 w-fit bg-white/15 text-white backdrop-blur" variant="secondary">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            Premium Experience
          </Badge>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">{event.title}</h1>
          <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {format(event.startsAt, "PPP p")} - {format(event.endsAt, "PPP p")}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {event.venue} | {event.address}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="animate-fade-in-up border-slate-200/80 shadow-lg lg:col-span-2 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl">About This Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed text-slate-700 dark:text-slate-200">{event.description}</p>
            <div className="grid gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
              <p><strong>Venue:</strong> {event.venue}</p>
              <p><strong>Address:</strong> {event.address}</p>
              <p><strong>Starts:</strong> {format(event.startsAt, "PPP p")}</p>
              <p><strong>Ends:</strong> {format(event.endsAt, "PPP p")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up h-fit border-slate-200/80 shadow-lg dark:border-slate-800">
          <CardHeader>
            <CardTitle>Book Tickets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {event.ticketTypes.filter((type) => type.isActive).map((type) => (
              <div
                key={type.id}
                className="rounded-xl border border-slate-200 p-3 transition-all hover:shadow-md dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{type.name}</p>
                  <Badge variant="secondary">{formatCurrency(type.priceCents, type.currency)}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Remaining: {Math.max(type.quantity - type.sold, 0)}
                </p>
                <Button asChild className="mt-3 w-full" size="sm">
                  <Link href={`/checkout?eventId=${event.id}&ticketTypeId=${type.id}&qty=1`}>
                    Quick Book {type.name}
                  </Link>
                </Button>
              </div>
            ))}
            <Button asChild className="w-full" variant="outline">
              <Link href={`/checkout?eventId=${event.id}`}>Choose Tickets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
