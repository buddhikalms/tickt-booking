"use server";

import { auth } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/order-service";
import { z } from "zod";

const formSchema = z.object({
  eventId: z.string().min(1),
  email: z.string().email(),
  items: z.array(z.object({ ticketTypeId: z.string(), quantity: z.number().int().min(0).max(20) })),
});

export async function startCheckoutAction(_: unknown, formData: FormData) {
  try {
    const rawItems = formData.get("items");
    const parsedItems = typeof rawItems === "string" ? JSON.parse(rawItems) : [];

    const payload = formSchema.parse({
      eventId: String(formData.get("eventId") ?? ""),
      email: String(formData.get("email") ?? ""),
      items: parsedItems,
    });

    const session = await auth();
    const stripeSession = await createCheckoutSession({
      eventId: payload.eventId,
      email: payload.email,
      selections: payload.items,
      userId: session?.user?.id,
    });

    if (!stripeSession.url) {
      return { ok: false, error: "Unable to create checkout URL." };
    }

    return { ok: true, url: stripeSession.url };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start checkout.";
    return { ok: false, error: message };
  }
}
