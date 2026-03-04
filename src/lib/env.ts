import { z } from "zod";

const optionalNonEmptyString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  PAYMENT_PROVIDER: z.enum(["auto", "stripe", "sumup"]).default("auto"),
  STRIPE_SECRET_KEY: optionalNonEmptyString,
  STRIPE_WEBHOOK_SECRET: optionalNonEmptyString,
  STRIPE_PRICELESS_MODE: z.string().default("true"),
  SUMUP_API_KEY: optionalNonEmptyString,
  SUMUP_MERCHANT_CODE: optionalNonEmptyString,
  SUMUP_WEBHOOK_SECRET: optionalNonEmptyString,
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  ADMIN_NOTIFICATION_EMAIL: optionalNonEmptyString,
  APP_URL: z.string().url(),
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICELESS_MODE: process.env.STRIPE_PRICELESS_MODE,
    SUMUP_API_KEY: process.env.SUMUP_API_KEY,
    SUMUP_MERCHANT_CODE: process.env.SUMUP_MERCHANT_CODE,
    SUMUP_WEBHOOK_SECRET: process.env.SUMUP_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    ADMIN_NOTIFICATION_EMAIL: process.env.ADMIN_NOTIFICATION_EMAIL,
    APP_URL: process.env.APP_URL,
  });

  return cachedEnv;
}
