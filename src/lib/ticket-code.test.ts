import { describe, expect, it } from "vitest";
import { generateTicketCode } from "@/lib/ticket-code";

describe("generateTicketCode", () => {
  it("creates unguessable-looking codes with prefix", () => {
    const code = generateTicketCode("ABC");
    expect(code.startsWith("ABC_")).toBe(true);
    expect(code.length).toBeGreaterThan(20);
  });

  it("creates unique codes over many iterations", () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      set.add(generateTicketCode());
    }
    expect(set.size).toBe(1000);
  });
});
