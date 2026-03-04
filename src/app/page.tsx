import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, ShieldCheck, Sparkles, TicketCheck } from "lucide-react";
import { HomeHeroSlider } from "@/components/home-hero-slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublishedEvents } from "@/lib/queries";
import { DEFAULT_CURRENCY, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Temple Tickets | Buddhist Temple Events",
  description:
    "Reserve seats for temple programs, meditation retreats, and dhamma gatherings with secure checkout and instant ticket delivery.",
  keywords: [
    "buddhist temple events",
    "temple ticket booking",
    "meditation retreat tickets",
    "dhamma program registration",
  ],
  openGraph: {
    title: "Temple Tickets | Buddhist Temple Events",
    description: "Discover and book temple programs with a warm, mobile-friendly experience.",
    type: "website",
  },
};

export default async function HomePage() {
  const events = await getPublishedEvents();
  const featuredSlides = events.slice(0, 5).map((event) => ({
    id: event.id,
    title: event.title,
    venue: event.venue,
    startsAtLabel: format(event.startsAt, "PPP p"),
    coverImage:
      event.coverImage ??
      "https://images.unsplash.com/photo-1533000759938-aa0ba70beceb?w=1200",
    minPriceLabel: formatCurrency(
      event.ticketTypes.length
        ? Math.min(...event.ticketTypes.map((type) => type.priceCents))
        : 0,
      event.ticketTypes[0]?.currency ?? DEFAULT_CURRENCY,
    ),
  }));

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Temple Tickets",
    url: process.env.APP_URL ?? "http://localhost:3000",
    description:
      "Booking platform for Buddhist temple events with secure checkout and instant ticket delivery.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${process.env.APP_URL ?? "http://localhost:3000"}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  if (events.length === 0) {
    return (
      <div className="animate-fade-in-up rounded-2xl border border-dashed border-amber-300 p-10 text-center dark:border-amber-800">
        <h1 className="text-2xl font-semibold">No upcoming temple events</h1>
        <p className="mt-2 text-sm text-amber-950/85 dark:text-amber-50/85">
          Check back soon for newly announced programs and ceremonies.
        </p>
      </div>
    );
  }

  const featureItems = [
    {
      title: "Instant E-Tickets",
      description: "Receive your PDF ticket instantly with embedded QR and barcode access.",
      icon: TicketCheck,
    },
    {
      title: "Secure Offering Checkout",
      description: "Secure online checkout for reliable and transparent temple program payments.",
      icon: ShieldCheck,
    },
    {
      title: "Temple Programs",
      description: "Manage dhamma talks, meditation retreats, and community events in one place.",
      icon: Sparkles,
    },
    {
      title: "Mobile Friendly",
      description: "Smooth booking on any phone so devotees can register quickly.",
      icon: CalendarDays,
    },
  ];

  return (
    <section className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 p-6 shadow-xl animate-gradient-shift dark:border-amber-900/70 dark:from-amber-950/40 dark:via-amber-900/25 dark:to-orange-950/25 md:p-8">
        <div className="animate-soft-float absolute -left-10 top-16 h-44 w-44 rounded-full bg-amber-300/35 blur-3xl dark:bg-amber-500/25" />
        <div className="animate-soft-float absolute -right-10 -top-12 h-44 w-44 rounded-full bg-orange-300/30 blur-3xl dark:bg-orange-600/25" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_1fr]">
          <div className="animate-fade-in-up">
            <Badge variant="secondary" className="mb-4">
              Buddhist Temple Community
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-amber-950 md:text-5xl dark:text-amber-50">
              Book Temple Programs with Peaceful Simplicity
            </h1>
            <p className="mt-4 max-w-2xl text-amber-900/85 dark:text-amber-100/85">
              Register for pujas, meditation sessions, and community gatherings with secure checkout and instant confirmation.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={`/events/${events[0].id}`}>View Featured Program</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">My Bookings</Link>
              </Button>
            </div>
          </div>
          <HomeHeroSlider slides={featuredSlides} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {featureItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.title}
              className="animate-fade-in-up shadow-sm transition-transform duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">{item.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Upcoming Temple Events</h2>
            <p className="text-sm text-amber-950/85 dark:text-amber-50/85">
              Explore programs and reserve your seat in advance.
            </p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event, index) => (
            <Card
              key={event.id}
              className="animate-fade-in-up overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div
                className="relative h-48 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${
                    event.coverImage ??
                    "https://images.unsplash.com/photo-1533000759938-aa0ba70beceb?w=1200"
                  })`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-amber-950/70 via-amber-950/15 to-transparent" />
                <p className="absolute bottom-3 left-3 rounded-md bg-amber-50/95 px-2 py-1 text-xs font-semibold text-amber-900">
                  {format(event.startsAt, "PPP")}
                </p>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {event.venue} | {format(event.startsAt, "p")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-3 text-sm text-amber-950/90 dark:text-amber-50/90">
                  {event.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {event.ticketTypes.slice(0, 3).map((type) => (
                    <Badge key={type.id} variant="secondary">
                      {type.name} {formatCurrency(type.priceCents, type.currency)}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline">
                    <Link href={`/events/${event.id}`}>Details</Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/checkout?eventId=${event.id}`}>Book</Link>
                  </Button>
                </div>
                {event.ticketTypes[0] ? (
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/checkout?eventId=${event.id}&ticketTypeId=${event.ticketTypes[0].id}&qty=1`}>
                      Quick Book {event.ticketTypes[0].name}
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
