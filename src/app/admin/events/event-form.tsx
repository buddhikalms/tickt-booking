"use client";

import { useState, useTransition } from "react";
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
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultValues?.coverImage ?? null);
  const [removeCoverImage, setRemoveCoverImage] = useState(false);
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
    formData.set("removeCoverImage", removeCoverImage ? "true" : "false");
    if (coverImageFile) {
      formData.set("coverImageFile", coverImageFile);
    }
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
        <input type="hidden" {...form.register("coverImage")} />
        <Label htmlFor="coverImageFile">Cover Image</Label>
        <Input
          id="coverImageFile"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setCoverImageFile(file);
            if (!file) {
              setPreviewUrl(removeCoverImage ? null : (defaultValues?.coverImage ?? null));
              return;
            }

            setRemoveCoverImage(false);

            const reader = new FileReader();
            reader.onload = () => {
              setPreviewUrl(typeof reader.result === "string" ? reader.result : null);
            };
            reader.readAsDataURL(file);
          }}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">Upload JPG, PNG, or WEBP up to 5MB.</p>
        {previewUrl ? (
          <div
            className="h-40 rounded-xl border border-slate-200 bg-cover bg-center dark:border-slate-800"
            style={{ backgroundImage: `url(${previewUrl})` }}
          />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No cover image selected
          </div>
        )}
        {(coverImageFile || defaultValues?.coverImage) ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={removeCoverImage}
              onChange={(event) => {
                const checked = event.target.checked;
                setRemoveCoverImage(checked);
                if (checked) {
                  setCoverImageFile(null);
                  setPreviewUrl(null);
                } else if (!coverImageFile) {
                  setPreviewUrl(defaultValues?.coverImage ?? null);
                }
              }}
            />
            Remove cover image
          </label>
        ) : null}
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
