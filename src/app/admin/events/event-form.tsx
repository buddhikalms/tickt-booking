"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { saveEventAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { eventSchema } from "@/lib/validators";

type Values = z.infer<typeof eventSchema>;

type Props = {
  eventId?: string;
  defaultValues?: Partial<Values>;
};

export function EventForm({ eventId, defaultValues }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<Values>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      venue: defaultValues?.venue ?? "",
      address: defaultValues?.address ?? "",
      startsAt: defaultValues?.startsAt ?? "",
      endsAt: defaultValues?.endsAt ?? "",
      coverImage: defaultValues?.coverImage ?? "",
      isPublished: defaultValues?.isPublished ?? false,
    },
  });

  const onSubmit = (values: Values) => {
    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("description", values.description);
    formData.set("venue", values.venue);
    formData.set("address", values.address);
    formData.set("startsAt", values.startsAt);
    formData.set("endsAt", values.endsAt);
    formData.set("coverImage", values.coverImage ?? "");
    formData.set("isPublished", values.isPublished ? "true" : "false");

    startTransition(async () => {
      try {
        await saveEventAction(eventId ?? null, formData);
        toast.success("Event saved.");
        router.push("/admin/events");
        router.refresh();
      } catch {
        toast.error("Failed to save event.");
      }
    });
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register("title")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...form.register("description")} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="venue">Venue</Label>
          <Input id="venue" {...form.register("venue")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...form.register("address")} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startsAt">Starts At</Label>
          <Input id="startsAt" type="datetime-local" {...form.register("startsAt")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endsAt">Ends At</Label>
          <Input id="endsAt" type="datetime-local" {...form.register("endsAt")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="coverImage">Cover Image URL</Label>
        <Input id="coverImage" {...form.register("coverImage")} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("isPublished")} />
        Published
      </label>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Event"}
      </Button>
    </form>
  );
}
