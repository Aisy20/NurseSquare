# NurseSquare

NurseSquare is a Next.js 16 app for direct nurse hiring and travel-nurse contract tooling. It combines a nurse/hospital marketplace with Supabase-backed auth, Nursys license checks, Stripe placement payments, AI pay-package extraction, contract diffing, credential tracking, and tax-home risk monitoring.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4
- Supabase Auth, Postgres, RLS, Storage
- Stripe for payment intents and escrow state
- Anthropic for pay-package and credential extraction
- Resend for transactional email
- Optional Checkr, Twilio, Postmark, and Nursys integrations

## Local Setup

Install dependencies:

```bash
npm install
```

Create local environment variables:

```bash
cp .env.local.example .env.local
```

Start the app:

```bash
npm run dev -- -p 3001
```

The example environment uses `NEXT_PUBLIC_APP_URL=http://localhost:3001`, so port `3001` is the least surprising default for auth links, email links, and webhook URLs.

## Commands

```bash
npm run dev          # local dev server
npm run build        # production build
npm run start        # serve production build
npm run lint         # ESLint
npm test             # Vitest unit tests
npm run test:e2e     # Playwright e2e tests
npm run extract      # run scripts/extract.ts with .env.local
```

## App Structure

- `src/app` contains App Router pages and route handlers.
- `src/components` contains UI, layout, credential, ledger, tax-home, and marketing components.
- `src/lib/supabase` contains browser, server, service-role, and proxy Supabase clients.
- `src/lib/ledger` contains pay-package extraction, persistence, diffing, anonymization, and credential logic.
- `src/lib/nursys.ts` contains the Nursys/NCSBN e-Notify client and license validity rules.
- `src/lib/taxhome/compute.ts` contains pure tax-home status computation.
- `supabase/schema.sql` is the developer-readable schema reference.
- `supabase/migrations` contains ordered migration files for new database environments.

## Auth And Roles

Roles live in `public.users.role` and are one of:

- `nurse`
- `hospital`
- `admin`

Next.js 16 uses `src/proxy.ts` instead of `middleware.ts`. The proxy calls `src/lib/supabase/middleware.ts:updateSession`, refreshes auth cookies, redirects unauthenticated protected routes to `/auth/login`, and redirects signed-in users away from `/auth/*`.

Protected route roots:

- `/nurse/*`
- `/hospital/*`
- `/admin/*`

## Database

Apply migrations in order from `supabase/migrations`. The current first migration is copied from `supabase/schema.sql`:

```bash
supabase db reset
```

or paste/run the SQL in Supabase SQL editor for hosted projects.

RLS is enabled throughout the schema. Important triggers:

- `on_auth_user_created` inserts `public.users` rows from Supabase Auth metadata.
- `after_review_insert` recomputes nurse review aggregates.
- `*_updated_at` triggers maintain timestamp columns.
- Ledger aggregate triggers update recruiter and agency scores.

## Environment Variables

Required for production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `ANTHROPIC_API_KEY`
- `NURSYS_BASE_URL`
- `NURSYS_API_USERNAME`
- `NURSYS_API_PASSWORD`
- `CRON_SECRET`

Optional:

- `CHECKR_API_KEY`
- `CHECKR_WEBHOOK_SECRET`
- `CHECKR_PACKAGE_SLUG`
- `TWILIO_AUTH_TOKEN`
- `POSTMARK_INBOUND_SECRET`
- `AHA_API_KEY`
- `AHA_API_BASE_URL`

## Integration Notes

Nursys verification is a two-phase async workflow:

1. Manage Nurse List enrolls the nurse and stores a transaction ID.
2. Nurse Lookup confirms the specific enrolled license state and number.

The app intentionally fails closed if the returned license does not match the enrolled jurisdiction and license number.

The pay-package ledger stores currency as integer cents. Numeric/date/category diffing is deterministic; text clause comparison uses an Anthropic tool call and logs usage in `ledger_llm_calls`.

## Testing

Unit tests are in `tests/**/*.test.ts` and focus on pure ledger, credential, anonymization, and tax-home behavior.

E2E tests are in `tests/e2e`. Set `E2E_BASE_URL` when running against a non-default server.
