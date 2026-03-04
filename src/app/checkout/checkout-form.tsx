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
import {
  PAYMENT_GATEWAY_FIXED_FEE_CENTS,
  PAYMENT_GATEWAY_FEE_RATE,
  calculateOrderTotals,
} from "@/lib/pricing";
import { DEFAULT_CURRENCY, formatCurrency } from "@/lib/utils";

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

  const totals = useMemo(() => {
    const subtotalCents = ticketTypes.reduce((sum, type) => sum + (quantities[type.id] ?? 0) * type.priceCents, 0);
    return calculateOrderTotals(subtotalCents);
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
      <div className="theme-banner rounded-xl border p-4">
        <p className="text-sm font-semibold">{eventTitle}</p>
        <p className="theme-muted-text text-xs">{eventDateLabel}</p>
        <p className="theme-muted-text text-xs">{venueLabel}</p>
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
          <div key={type.id} className="theme-panel flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="font-semibold">{type.name}</p>
              <p className="theme-muted-text text-sm">
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
      <div className="theme-panel rounded-xl border p-4 text-sm">
        <div className="flex items-center justify-between">
          <span>Tickets subtotal</span>
          <strong>{formatCurrency(totals.subtotalCents, ticketTypes[0]?.currency ?? DEFAULT_CURRENCY)}</strong>
        </div>
        <div className="theme-muted-text mt-2 flex items-center justify-between">
          <span>
            Payment gateway charge ({(PAYMENT_GATEWAY_FEE_RATE * 100).toFixed(1)}% +{" "}
            {formatCurrency(PAYMENT_GATEWAY_FIXED_FEE_CENTS, ticketTypes[0]?.currency ?? DEFAULT_CURRENCY)})
          </span>
          <strong>{formatCurrency(totals.gatewayFeeCents, ticketTypes[0]?.currency ?? DEFAULT_CURRENCY)}</strong>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-[var(--border-soft)] pt-3 text-base">
          <span>Total</span>
          <strong>{formatCurrency(totals.totalCents, ticketTypes[0]?.currency ?? DEFAULT_CURRENCY)}</strong>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Redirecting..." : "Proceed to Checkout"}
      </Button>
    </form>
  );
}
