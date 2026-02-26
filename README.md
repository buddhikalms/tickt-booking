# Ticket Booking + Event Management (Next.js + Prisma + MySQL)

Production-ready event ticketing platform with:
- Public event browsing and Stripe Checkout
- Idempotent Stripe webhook-based ticket issuance
- QR + barcode ticket generation and PDF email delivery via Gmail SMTP
- Admin panel for events, ticket types, orders, tickets, and check-in
- Role-based auth (`ADMIN`, `STAFF`, `CUSTOMER`) with Auth.js (NextAuth)

## Stack
- Next.js (App Router), TypeScript
- Prisma + MySQL
- Auth.js / NextAuth credentials + role-based session
- Stripe Checkout + webhook (`checkout.session.completed`)
- Gmail SMTP email
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
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICELESS_MODE=true`
- `SMTP_HOST` (`smtp.gmail.com`)
- `SMTP_PORT` (`465`)
- `SMTP_SECURE` (`true`)
- `SMTP_USER` (your Gmail address)
- `SMTP_PASS` (Google App Password)
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

## Google OAuth Setup
1. Open Google Cloud Console and create OAuth 2.0 Web credentials.
2. Authorized redirect URI:
   - `http://localhost:3000/api/auth/callback/google`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.
4. Restart dev server after updating env.

## Gmail SMTP Email Setup
- Enable 2-Step Verification on your Gmail account.
- Generate a Google App Password and set it as `SMTP_PASS`.
- Set `SMTP_USER` to your Gmail address.
- Use `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`.
- Keep `EMAIL_FROM` aligned with your Gmail address/domain policy.

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
  - `/success?session_id=...`
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
  - `POST /api/admin/checkin`

## Notes
- Webhook idempotency is enforced via `WebhookEvent` (`stripeEventId` unique).
- Prices are always loaded from DB during checkout creation.
- Ticket codes are random, high-entropy, and non-sequential.
