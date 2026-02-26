"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Slide = {
  id: string;
  title: string;
  venue: string;
  startsAtLabel: string;
  coverImage: string;
  minPriceLabel: string;
};

type Props = {
  slides: Slide[];
};

export function HomeHeroSlider({ slides }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-950">
        <p className="text-sm text-slate-500 dark:text-slate-400">No featured events yet.</p>
      </div>
    );
  }

  const active = slides[activeIndex];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/60 shadow-2xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70">
      <div className="relative h-[360px] md:h-[420px]">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ${
              index === activeIndex ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-105"
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.coverImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/55 to-cyan-900/20" />
          </div>
        ))}

        <div className="relative flex h-full flex-col justify-end p-6 text-white md:p-8">
          <Badge variant="secondary" className="mb-3 w-fit bg-white/15 text-white backdrop-blur">
            Featured Event
          </Badge>
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight md:text-4xl">{active.title}</h2>
          <div className="mt-4 grid gap-2 text-sm text-white/90 md:grid-cols-3">
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {active.startsAtLabel}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {active.venue}
            </p>
            <p className="font-medium">From {active.minPriceLabel}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild className="bg-white text-slate-900 hover:bg-slate-100">
              <Link href={`/events/${active.id}`}>Explore Event</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
              <Link href={`/checkout?eventId=${active.id}`}>Book Tickets</Link>
            </Button>
          </div>
        </div>

        {slides.length > 1 ? (
          <>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="absolute left-4 top-4 border-white/30 bg-white/10 text-white hover:bg-white/20"
              onClick={() => setActiveIndex((current) => (current - 1 + slides.length) % slides.length)}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="absolute right-4 top-4 border-white/30 bg-white/10 text-white hover:bg-white/20"
              onClick={() => setActiveIndex((current) => (current + 1) % slides.length)}
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        ) : null}
      </div>

      {slides.length > 1 ? (
        <div className="flex justify-center gap-2 p-4">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-7 bg-cyan-500" : "w-2.5 bg-slate-300 dark:bg-slate-700"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
