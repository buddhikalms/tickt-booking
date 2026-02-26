import { Resend } from "resend";

const globalForResend = globalThis as unknown as { resend?: Resend };

export function getResend() {
  if (!globalForResend.resend) {
    globalForResend.resend = new Resend(process.env.RESEND_API_KEY ?? "re_test_placeholder");
  }
  return globalForResend.resend;
}
