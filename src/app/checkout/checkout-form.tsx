"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { startCheckoutAction } from "@/app/checkout/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  eventId: string;
  defaultEmail: string;
  eventTitle: string;
  eventDateLabel: string;
  venueLabel: string;
  ticketTypes: Array<{
    id: string;
    name: string;
    priceCents: number;
    currency: string;
    remaining: number;
  }>;
  initialQuantities?: Record<string, number>;
};

export function CheckoutForm({
  eventId,
  defaultEmail,
  eventTitle,
  eventDateLabel,
  venueLabel,
  ticketTypes,
  initialQuantities,
}: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    () =>
      Object.fromEntries(
        ticketTypes.map((type) => [type.id, Math.max(0, Math.min(initialQuantities?.[type.id] ?? 0, type.remaining))]),
      ),
  );
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: defaultEmail },
  });

  const total = useMemo(() => {
    return ticketTypes.reduce((sum, type) => sum + (quantities[type.id] ?? 0) * type.priceCents, 0);
  }, [quantities, ticketTypes]);

  function submit(data: FormValues) {
    const items = ticketTypes.map((type) => ({
      ticketTypeId: type.id,
      quantity: quantities[type.id] ?? 0,
    }));

    if (!items.some((item) => item.quantity > 0)) {
      toast.error("Select at least one ticket.");
      return;
    }

    const formData = new FormData();
    formData.set("eventId", eventId);
    formData.set("email", data.email);
    formData.set("items", JSON.stringify(items));

    startTransition(async () => {
      const result = await startCheckoutAction(undefined, formData);
      if (result?.ok && result.url) {
        window.location.assign(result.url);
        return;
      }
      toast.error(result?.error ?? "Unable to start checkout");
    });
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(submit)}>
      <div className="rounded-xl border border-cyan-200/60 bg-gradient-to-r from-cyan-50 to-sky-50 p-4 dark:border-cyan-900/40 dark:from-cyan-950/30 dark:to-sky-950/30">
        <p className="text-sm font-semibold">{eventTitle}</p>
        <p className="text-xs text-slate-600 dark:text-slate-300">{eventDateLabel}</p>
        <p className="text-xs text-slate-600 dark:text-slate-300">{venueLabel}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Buyer Email</Label>
        <Input id="email" {...form.register("email")} />
        {form.formState.errors.email && (
          <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-3">
        {ticketTypes.map((type) => (
          <div key={type.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div>
              <p className="font-semibold">{type.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {formatCurrency(type.priceCents, type.currency)} | Remaining {type.remaining}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setQuantities((prev) => ({
                    ...prev,
                    [type.id]: Math.max((prev[type.id] ?? 0) - 1, 0),
                  }))
                }
              >
                -
              </Button>
              <Input
                type="number"
                min={0}
                max={Math.min(type.remaining, 20)}
                value={quantities[type.id] ?? 0}
                onChange={(e) =>
                  setQuantities((prev) => ({
                    ...prev,
                    [type.id]: Math.max(0, Math.min(Number(e.target.value) || 0, Math.min(type.remaining, 20))),
                  }))
                }
                className="w-16 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setQuantities((prev) => ({
                    ...prev,
                    [type.id]: Math.min((prev[type.id] ?? 0) + 1, Math.min(type.remaining, 20)),
                  }))
                }
              >
                +
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">
        Total: <strong className="text-base">{formatCurrency(total, ticketTypes[0]?.currency ?? "USD")}</strong>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Redirecting..." : "Proceed to Stripe Checkout"}
      </Button>
    </form>
  );
}
