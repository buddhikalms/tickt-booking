# Ticket Booking + Event Management (Next.js + Prisma + MySQL)

Production-ready event ticketing platform with:
- Public event browsing and online checkout (Stripe or SumUp)
- Idempotent webhook-based ticket issuance
- QR + barcode ticket generation and PDF email delivery via Resend
- Admin panel for events, ticket types, orders, tickets, and check-in
- Role-based auth (`ADMIN`, `STAFF`, `CUSTOMER`) with Auth.js (NextAuth)

## Stack
- Next.js (App Router), TypeScript
- Prisma + MySQL
- Auth.js / NextAuth credentials + role-based session
- Stripe Checkout or SumUp Hosted Checkout + webhook
- Resend email delivery
- Tailwind CSS + reusable UI primitives
- Zod + React Hook Form
- TanStack Table
- `qrcode`, `bwip-js`, `@react-pdf/renderer`
- Vitest tests

## Setup
1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Set required env vars in `.env`:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `PAYMENT_PROVIDER` (`auto`, `stripe`, `sumup`)
- Stripe (if using Stripe):
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICELESS_MODE=true`
- SumUp (if using SumUp):
  - `SUMUP_API_KEY`
  - `SUMUP_MERCHANT_CODE`
  - `SUMUP_WEBHOOK_SECRET` (optional but recommended)
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `APP_URL`

4. Generate Prisma client and run migration:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Seed an admin user and sample event data:
```bash
npm run prisma:seed
```

6. Start dev server:
```bash
npm run dev
```

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`

## Stripe Local Webhook
1. Start app on `http://localhost:3000`
2. In a separate shell:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
3. Copy the webhook secret and set `STRIPE_WEBHOOK_SECRET`.

## SumUp Setup
1. Create a SumUp app and obtain:
   - API key (`SUMUP_API_KEY`)
   - merchant code (`SUMUP_MERCHANT_CODE`)
2. Configure webhook URL:
   - `http://localhost:3000/api/sumup/webhook`
3. Set `PAYMENT_PROVIDER=sumup` to force SumUp, or keep `auto`.

## Google OAuth Setup
1. Open Google Cloud Console and create OAuth 2.0 Web credentials.
2. Authorized redirect URI:
   - `http://localhost:3000/api/auth/callback/google`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.
4. Restart dev server after updating env.

## Resend Email Setup
- Create an API key in the Resend dashboard and set it as `RESEND_API_KEY`.
- Verify the sending domain or sender identity you plan to use for `EMAIL_FROM`.
- Keep `EMAIL_FROM` aligned with the verified sender in Resend.

## Auth / Admin
- Login page: `/login`
- Supports Google OAuth and credentials login.
- Admin pages: `/admin/*` (requires `ADMIN` or `STAFF`)
- Seed defaults:
  - `SEED_ADMIN_EMAIL=admin@example.com`
  - `SEED_ADMIN_PASSWORD=ChangeMe123!`

## Core Routes
- Public:
  - `/`
  - `/events/[id]`
  - `/checkout?eventId=...`
  - `/success?session_id=...` (Stripe)
  - `/success?provider=sumup&order_id=...` (SumUp)
  - `/t/[code]`
- Admin:
  - `/admin`
  - `/admin/events`
  - `/admin/events/[id]`
  - `/admin/events/[id]/ticket-types`
  - `/admin/orders`
  - `/admin/tickets`
  - `/admin/checkin`
- API:
  - `POST /api/stripe/webhook`
  - `POST /api/sumup/webhook`
  - `POST /api/admin/checkin`

## Notes
- Webhook idempotency is enforced via `WebhookEvent` (`stripeEventId` unique).
- Prices are always loaded from DB during checkout creation.
- `PAYMENT_PROVIDER=auto` chooses Stripe when both are configured, SumUp when only SumUp is configured, and Stripe when only Stripe is configured.
- Ticket codes are random, high-entropy, and non-sequential.
