import { z } from "zod";

export const checkoutSchema = z.object({
  eventId: z.string().min(1),
  email: z.string().email(),
  selections: z
    .array(
      z.object({
        ticketTypeId: z.string().min(1),
        quantity: z.number().int().min(0).max(20),
      }),
    )
    .min(1),
});

export const eventSchema = z
  .object({
    title: z.string().min(3),
    description: z.string().min(10),
    venue: z.string().min(2),
    address: z.string().min(2),
    startsAt: z.string(),
    endsAt: z.string(),
    coverImage: z.string().url().optional().or(z.literal("")),
    isPublished: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const starts = new Date(value.startsAt);
    const ends = new Date(value.endsAt);
    if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) {
      ctx.addIssue({ code: "custom", path: ["startsAt"], message: "Invalid date" });
      return;
    }
    if (ends <= starts) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End date must be after start date" });
    }
  });

export const ticketTypeSchema = z.object({
  name: z.string().min(2),
  priceCents: z.number().int().min(1),
  currency: z.string().min(3).max(3),
  quantity: z.number().int().min(1),
  isActive: z.boolean(),
});
