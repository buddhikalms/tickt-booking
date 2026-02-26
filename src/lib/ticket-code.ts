import { randomBytes } from "node:crypto";

export function generateTicketCode(prefix = "TKT") {
  const raw = randomBytes(20).toString("base64url").replace(/[^a-zA-Z0-9]/g, "");
  return `${prefix}_${raw.slice(0, 24).toUpperCase()}`;
}
