import nodemailer from "nodemailer";
import { getEnv } from "@/lib/env";

const globalForMailer = globalThis as unknown as {
  transporter?: nodemailer.Transporter;
};

export function getMailer() {
  if (!globalForMailer.transporter) {
    const env = getEnv();
    globalForMailer.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE === "true",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return globalForMailer.transporter;
}
