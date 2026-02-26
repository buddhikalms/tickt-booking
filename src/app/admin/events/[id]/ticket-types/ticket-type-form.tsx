"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { saveTicketTypeAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ticketTypeSchema } from "@/lib/validators";

type Values = z.infer<typeof ticketTypeSchema>;

export function TicketTypeForm({
  eventId,
  ticketTypeId,
  defaults,
}: {
  eventId: string;
  ticketTypeId?: string;
  defaults?: Partial<Values>;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<Values>({
    resolver: zodResolver(ticketTypeSchema),
    defaultValues: {
      name: defaults?.name ?? "",
      priceCents: defaults?.priceCents ?? 0,
      currency: defaults?.currency ?? "USD",
      quantity: defaults?.quantity ?? 100,
      isActive: defaults?.isActive ?? true,
    },
  });

  const onSubmit = (values: Values) => {
    const formData = new FormData();
    formData.set("name", values.name);
    formData.set("priceCents", String(values.priceCents));
    formData.set("currency", values.currency);
    formData.set("quantity", String(values.quantity));
    formData.set("isActive", values.isActive ? "true" : "false");

    startTransition(async () => {
      try {
        await saveTicketTypeAction(eventId, ticketTypeId ?? null, formData);
        toast.success("Ticket type saved.");
      } catch {
        toast.error("Unable to save ticket type.");
      }
    });
  };

  return (
    <form className="grid gap-3 md:grid-cols-6" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="md:col-span-2">
        <Label>Name</Label>
        <Input {...form.register("name")} />
      </div>
      <div>
        <Label>Price (cents)</Label>
        <Input type="number" {...form.register("priceCents", { valueAsNumber: true })} />
      </div>
      <div>
        <Label>Currency</Label>
        <Input {...form.register("currency")} />
      </div>
      <div>
        <Label>Quantity</Label>
        <Input type="number" {...form.register("quantity", { valueAsNumber: true })} />
      </div>
      <div className="flex items-end gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register("isActive")} /> Active
        </label>
        <Button type="submit" disabled={isPending}>
          Save
        </Button>
      </div>
    </form>
  );
}
