import { describe, expect, it, vi } from "vitest";
import { fulfillCheckoutSession } from "@/lib/order-service";

describe("fulfillCheckoutSession", () => {
  it("returns duplicate when webhook event already processed", async () => {
    type DuplicateTx = {
      webhookEvent: {
        findUnique: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
      };
    };

    const tx = {
      webhookEvent: {
        findUnique: vi.fn().mockResolvedValue({ id: "existing" }),
        create: vi.fn(),
      },
    } as unknown as DuplicateTx;

    const result = await fulfillCheckoutSession(
      tx,
      { id: "evt_1", type: "checkout.session.completed" },
      "cs_test",
      "pi_test",
    );

    expect(result).toEqual({ duplicate: true });
    expect(tx.webhookEvent.create).not.toHaveBeenCalled();
  });
});
