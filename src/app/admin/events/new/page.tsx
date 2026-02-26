import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventForm } from "../event-form";

export default function NewEventPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Create Event</h1>
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm />
        </CardContent>
      </Card>
    </section>
  );
}
