import { Resend } from "resend";
import { getEnv } from "@/lib/env";

const globalForMailer = globalThis as unknown as {
  resend?: Resend;
};

export function getResend() {
  if (!globalForMailer.resend) {
    globalForMailer.resend = new Resend(getEnv().RESEND_API_KEY);
  }

  return globalForMailer.resend;
}
