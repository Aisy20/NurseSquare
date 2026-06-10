# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Stack and commands

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4. Backend is Supabase (Postgres + Auth + RLS). External integrations: Stripe (payments/escrow), Resend (email), Checkr (background checks), Nursys/NCSBN e-Notify (RN license verification), Anthropic Claude (AI pay package extraction), Postmark (inbound email), Twilio (inbound SMS/voice).

- `npm run dev` — local dev server. The `.env.local` template uses `NEXT_PUBLIC_APP_URL=http://localhost:3001`, but `next dev` defaults to `:3000`. Pass `-p 3001` if email links / OAuth callbacks need to match.
- `npm run build` / `npm run start` — production build / serve.
- `npm run lint` — ESLint via `eslint-config-next` (core-web-vitals + typescript).
- `npm test` — vitest unit tests (`tests/**/*.test.ts`). Run a single file: `npx vitest run tests/ledger/diff.test.ts`.
- `npm run test:watch` — vitest in watch mode.
- `npm run test:e2e` — Playwright against `:3001` (auto-starts dev server; use `E2E_BASE_URL` to point at an external server instead).
- `npm run seed:test` — seed test accounts for e2e flows (`scripts/seed-test-accounts.ts`).
- `npm run extract` — dev utility to test AI pay package extraction against a local file (`scripts/extract.ts`).
- Path alias: `@/*` → `./src/*`.

Coverage thresholds (vitest) apply only to `src/lib/ledger/**`: 70% lines/statements/functions, 60% branches.

## Next.js 16 specifics that diverge from your training data

- **Middleware is renamed to "proxy".** The entry file is `src/proxy.ts` (not `middleware.ts`), exporting `proxy(request)` (not `middleware`). Same matcher config shape.
- React 19 + Next 16 means many APIs in `node_modules/next/dist/docs/01-app/` may have moved or changed signatures. Per `AGENTS.md`, consult those docs before writing new framework code.

## Roles and route protection

Three user roles live in `public.users.role`: `nurse`, `hospital`, `admin`. Each role has its own top-level route tree:

- `/nurse/*` — nurse dashboard, applications, profile, verify-license, payments, ledger, credentials, tax-home
- `/hospital/*` — employer dashboard, post-job, applicants, billing, profile
- `/admin/*` — admin tools (users, jobs, payments, nursys)
- `/auth/*` — login, register (split into `/auth/register/nurse` and `/auth/register/hospital`), forgot/reset password
- `/share/*` — public anonymous sharing pages (no auth required)

`src/proxy.ts` → `src/lib/supabase/middleware.ts:updateSession` is the gatekeeper. It:
1. Refreshes the Supabase session cookie on every request.
2. Redirects unauthenticated users hitting `/nurse|/hospital|/admin` to `/auth/login`.
3. Redirects already-logged-in users hitting `/auth/*` to their role's dashboard (`/nurse/dashboard` for nurses, `/hospital/dashboard` otherwise) by reading `users.role`.

If you add a new protected top-level segment, update the `protectedNursePaths` / `protectedHospitalPaths` / `protectedAdminPaths` arrays in `middleware.ts` — the matcher in `proxy.ts` only excludes static assets.

## Supabase: four clients, do not mix

Pick the right factory for the context — they are not interchangeable:

- `@/lib/supabase/client.ts` — `createClient()` for **client components** (browser, uses `createBrowserClient`).
- `@/lib/supabase/server.ts` — `async createClient()` for **server components and route handlers** (reads `cookies()` from `next/headers`).
- `@/lib/supabase/middleware.ts` — `updateSession(request)` for the **proxy/edge** path only.
- `@/lib/supabase/service.ts` — `createServiceClient()` for **admin/server operations that must bypass RLS** (uses `SUPABASE_SERVICE_ROLE_KEY`). Never expose this to the browser.

All four fall back to placeholder URL/key strings when env vars are missing or malformed, so the app boots in CI and dev without crashing — production deploys must have `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set or auth silently no-ops.

RLS is enabled on every table; `supabase/schema.sql` is the source of truth for both the schema and the policies. Two triggers do non-obvious work that downstream code relies on:
- `on_auth_user_created` (on `auth.users` INSERT) auto-creates the `public.users` row, copying `raw_user_meta_data->>'role'`. Registration must set that metadata at signup time.
- `after_review_insert` recomputes `nurse_profiles.rating_avg` and `rating_count`. Don't write those columns directly.

The `nurse_profiles` table has Nursys-only columns (`address1`, `ssn_last_four`, `birth_year`, `practice_setting`, `ncsbn_id`, `nursys_transaction_id`, `nursys_lookup_transaction_id`, `nursys_enrolled_at`, `license_verified_at`, `license_status_detail`) added via the `ALTER TABLE` block at the bottom of `schema.sql`. New Supabase projects must run that block or the verify route will throw on update.

## Ledger: AI-powered pay package tracking

The most architecturally novel subsystem. Lives in `src/lib/ledger/` + `src/app/api/ledger/*` + `src/app/nurse/ledger/`.

Nurses forward recruiter offers via **email** (Postmark inbound webhook) or **SMS/voice** (Twilio webhook). Each message auto-creates a `ledger_contracts` row and triggers AI extraction. Later, the nurse uploads the signed PDF, which triggers a second extraction and a diff comparing the quoted vs signed pay package.

### Ingest channels
- **Email**: `POST /api/ledger/webhooks/postmark` — verified via Basic Auth (`POSTMARK_INBOUND_SECRET`). Routes by `users.forwarding_email` to find the owning nurse.
- **SMS/voice**: `POST /api/ledger/webhooks/twilio` — verified via HMAC-SHA1 Twilio signature (`TWILIO_AUTH_TOKEN`).
- Both use `extractPayPackage()` from `src/lib/ledger/extractor.ts` and log every Claude call to `ledger_llm_calls`.

### AI models (`src/lib/ledger/types.ts: LEDGER_MODELS`)
- **Extraction** (`extract_quote`, `extract_signed`): `claude-sonnet-4-6` — forced tool use against `submit_pay_package`. Uses prompt caching on the system prompt (`cache_control: { type: 'ephemeral' }`). Retries up to 3× with exponential backoff on rate limits. Flags `needsReview` when `extraction_confidence < 0.6`.
- **Text diff** (`diff_text`): `claude-haiku-4-5-20251001` — forced tool use against `report_text_diff` to judge whether two contract clauses materially differ in meaning.

### Contract flow and diff
`computeAndPersistDiffIfReady()` in `src/lib/ledger/persist.ts` is called after any quote or signed upload. When both a quote and a signed contract exist on the same `ledger_contract`, it calls `computeDiff()` from `src/lib/ledger/diff.ts`, which:
- Compares numeric fields (money, hours) with `WORSE_CENTS_THRESHOLD = 2500` / `WORSE_PCT_THRESHOLD = 3`
- Compares dates with `DATE_SHIFT_DAYS_THRESHOLD = 7` days
- Calls Claude Haiku for text fields (`cancellation_terms`, `call_off_policy`, `floating_policy`, `holiday_pay`)
- Sets `any_worse` / `any_material_change` summary flags

### Route auth pattern
Ledger API routes use `requireAuth()` from `src/lib/ledger/access.ts` instead of calling Supabase directly. It returns either an `AuthContext` or a `NextResponse` error — use `isErrorResponse()` to narrow before continuing. `loadContractForOwner()` enforces owner/admin access on individual contracts.

### Sharing
Contracts (`/api/ledger/contracts/[id]/share`) and credentials (`/api/ledger/credentials/[id]/share`) generate slug tokens stored in the DB. Public pages at `/share/[slug]` and `/share/credential/[slug]` render anonymized data via `src/lib/ledger/anonymize.ts` (strips PII) — no auth required.

### Credentials subsystem
`src/lib/ledger/credentials/` handles nurse credential storage. AHA verification logic lives in `src/lib/ledger/credentials/aha.ts`. A second cron (`vercel.json`: `0 14 * * *`) hits `/api/ledger/credentials/cron/expiry-reminders` to notify nurses of expiring credentials.

### Tax home
`src/lib/taxhome/compute.ts` provides tax home determination logic, surfaced at `/nurse/tax-home` and `/api/ledger/tax-home/*`.

## Nursys license verification (2-phase async state machine)

The most non-obvious subsystem. Lives in `src/lib/nursys.ts` + `src/app/api/nursys/*`.

Verifying a nurse's license is **not** a single API call. It is a 2-phase async dance against NCSBN's e-Notify API, polled by the client:

1. **Phase 1 — Manage Nurse List (enrollment).** `POST /api/nursys/verify` calls `submitManageNurseList` and stores the returned `TransactionId` in `nurse_profiles.nursys_transaction_id`. Phase 1 only confirms NCSBN can match the identity — it does **not** mean the license is valid.
2. **Phase 2 — Nurse Lookup (status).** When the client polls `GET /api/nursys/verify?nurseProfileId=...`, the route checks for an existing lookup transaction; if none, it polls Phase 1 to completion and then submits a Nurse Lookup, storing `nursys_lookup_transaction_id`. On the next poll it reads the lookup result and applies `isLicenseCurrentlyValid` to the license matching the enrolled `license_state` + `license_number`. Only then is `license_verified` set to true.

Critical invariant: Phase 2 fails closed — if NCSBN returns licenses but none match the enrolled state/number, verification fails rather than picking `NurseLookupLicenses[0]`. Don't "fix" this by falling back; the user could be verified against the wrong jurisdiction.

**Add / Remove lifecycle.** `POST /api/nursys/verify` submits a `SubmissionActionCode='A'` (Add) to enroll a nurse on the NCSBN list. The admin-only `POST /api/nursys/remove` submits `'R'` (Remove) to un-enroll — without this, NCSBN keeps the nurse on the list indefinitely and may bill per-nurse. The remove route also clears local Nursys state (`license_verified`, transaction IDs, `nursys_enrolled_at`) but intentionally keeps the license number/state intact since they're still the nurse's identity.

**Notification sweep cron.** `vercel.json` schedules `/api/nursys/cron/check-notifications` daily at 06:00 UTC. It calls `submitNotificationLookup` for a 1-day window, polls within the function deadline, and clears `license_verified` (forcing re-verification) on any nurse whose change matches `STATUS_CHANGE_TRIGGERS_RECHECK` in `lib/nursys.ts`. The route requires `Authorization: Bearer ${CRON_SECRET}`.

**Dev fallback.** When `nursysConfigured()` is false (any of `NURSYS_BASE_URL`/`NURSYS_API_USERNAME`/`NURSYS_API_PASSWORD` missing), `POST /api/nursys/verify` accepts any 5+ char license + 2-char state and sets `license_verified=true`. This is intentional for local dev — do not let it ship to production behind a real Nursys integration.

**Practice setting mapping is a known TODO.** `practiceSettingToNursys()` currently sends every label as `HospitalPracticeSetting=0` ("Other") with the label text in `HospitalPracticeSettingOther`. The real NCSBN ID mapping from the spec appendix has not been wired in.

**Password rotation.** `lib/nursys.ts` reads env vars at call time (not at import) so `/api/nursys/change-password` can rotate the Nursys password without a process restart.

**Admin surface.** `/admin/nursys` (page + `NursysAdminTools.tsx`) wraps four admin-only endpoints: `POST/GET /api/nursys/notifications` (manual backfill of the notification sweep — same logic as the cron, but for arbitrary date windows), `GET /api/nursys/documents?ids=…` (discipline/board docs, max 5 IDs/call, also accessible to `hospital`), `POST /api/nursys/remove`, and `POST /api/nursys/change-password`.

## Stripe: platform fee + escrow + tiered cancellation

`src/lib/stripe.ts` centralizes the money math. `PLATFORM_FEE_PERCENT = 0.15`. `calculateCancellationFee` is tiered by hours-before-start (≥168h: 0, ≥72h: 25%, ≥24h: 50%, <24h: 100% of weekly rate) — change these together with whatever UI/contract text quotes them.

Webhook (`/api/stripe/webhook`) keys off `payment_intent.metadata.placement_id` and `payment_intent.metadata.application_id`. Whoever creates a PaymentIntent must populate that metadata or the webhook silently no-ops.

The Stripe SDK is pinned to `apiVersion: '2026-03-25.dahlia'`. Don't bump this without checking that response shapes the codebase relies on still match.

## Email and other integrations

- **Resend** (`src/lib/resend.ts`) — `sendEmail()` + `emailTemplates` object with templated HTML for application/placement/welcome flows. All `from:` is hardcoded to `noreply@nursesquare.com`.
- **Checkr** (`/api/checkr/*`) — webhook verifies `x-checkr-signature` as an HMAC-SHA256 of the raw body using `CHECKR_WEBHOOK_SECRET`. On `report.completed` it maps `data.object.status === 'clear'` → `passed`, anything else → `failed`. Lookup is by `nurse_profiles.checkr_candidate_id`.
- **PDFKit** is used to generate onboarding checklists at `/api/onboarding/generate-pdf`.

## Required env vars

Production needs all of: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`, `NURSYS_BASE_URL`, `NURSYS_API_USERNAME`, `NURSYS_API_PASSWORD`, `CRON_SECRET`, `ANTHROPIC_API_KEY` (ledger AI extraction). Optional: `CHECKR_API_KEY`, `CHECKR_WEBHOOK_SECRET`, `CHECKR_PACKAGE_SLUG`, `POSTMARK_INBOUND_SECRET`, `TWILIO_AUTH_TOKEN` (both optional — their webhook routes return 503 when unset).
