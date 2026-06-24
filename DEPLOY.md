# Deployment & Environments

How NurseSquare is hosted (DigitalOcean App Platform + Supabase) and the step-by-step to set it up. Config-as-code lives in `.do/app.yaml` (prod), `.do/app.staging.yaml` (staging), `.node-version`, and `.github/workflows/cron-*.yml`.

## Environment strategy

| Layer | Dev / Local | Staging (optional) | Production |
|---|---|---|---|
| **Hosting** | `npm run dev` on your machine | DO App Platform (`staging` branch) | DO App Platform (`main` branch) |
| **Supabase** | **Dev** project | Dev project | **Prod** project |
| **Stripe** | TEST keys (`sk_test_`) | TEST keys | LIVE keys (`sk_live_`) |
| **Nursys** | **blank → dev fallback** | blank → dev fallback | **real, rotated creds** |
| **Resend** | dev key / restricted | dev key | prod key |
| **Checkr** | sandbox keys | sandbox keys | live keys |
| **CRON_SECRET** | dev value | staging value | prod value (distinct) |

Key rules:
- **Two Supabase projects** (dev + prod) — isolates data and lets you test migrations on dev first. Free tier allows 2.
- **Stripe is one account**, test vs live keys — not two accounts.
- ⚠️ **Nursys enrollment is billable per-nurse.** Only prod gets real credentials; dev/staging leave `NURSYS_*` blank so the built-in fallback runs (accepts any 5+ char license, no NCSBN call).
- Never put prod secrets in `.env.local`.

**Branching:** feature branches → local; `staging` branch → staging app; `main` → prod app. Both DO apps have `deploy_on_push: true`.

---

## Part A — Supabase

### A1. Projects
- **Dev:** create/keep a project for development. Point `.env.local` at it.
- **Prod:** a separate project. Its keys go only into DO's prod env (Part B), never into the repo.

### A2. Load schema (each project, once)
`supabase/schema.sql` is the source of truth and includes the bottom `ALTER TABLE` block that adds the Nursys columns — without it the verify route throws.
- Supabase → **SQL Editor** → paste all of `supabase/schema.sql` → Run.
- Apply migrations in order: `0002_public_employers_view.sql`, then `0003_license_type_nursys_codes.sql`.

### A3. Migration workflow (the reason for two projects)
For every schema change:
1. Add a numbered file under `supabase/migrations/`.
2. Apply it to **dev**, exercise the affected feature.
3. Only then apply the same SQL to **prod**.

`0003` is the current outstanding one (renames `LPN→PN`/`NP→CNP`, widens the `license_type` CHECK to the A.2 codes). Run it on dev, verify a PN/CNP enrollment, then prod.

> Supabase CLI alternative (only if remote migration history is in sync):
> ```bash
> supabase link --project-ref <ref>
> supabase db push
> ```

### A4. Keys (Settings → API) — for DO env vars
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (secret)

### A5. Auth URLs (Settings → Authentication → URL Configuration)
Set **after** the app has a domain (Part C). Per project:
- **Site URL:** the env's app URL.
- **Redirect URLs:** add `https://<that-domain>/**`. Missing this breaks login / password reset.

---

## Part B — DigitalOcean App Platform

### B1. Prereqs
- Code on GitHub ✅
- Merge to `main` for prod (the spec deploys `branch: main`), or create a `staging` branch for the staging app.
- CLI: `brew install doctl && doctl auth init` (or do everything in the dashboard).

### B2. Create the app(s)
```bash
doctl apps create --spec .do/app.yaml            # production
doctl apps create --spec .do/app.staging.yaml    # staging (optional)
```

### B3. Set real env values (dashboard → app → Settings → env vars)
Replace every `REPLACE_ME`:
- Supabase trio from A4 (prod project for prod app; dev project for staging)
- Stripe keys (live for prod, test for staging) — `STRIPE_WEBHOOK_SECRET` comes in C2
- `RESEND_API_KEY`, `CRON_SECRET`, `ANTHROPIC_API_KEY`, `POSTMARK_INBOUND_SECRET`, `TWILIO_AUTH_TOKEN`
- **Prod only:** `NURSYS_API_USERNAME` + the **rotated** `NURSYS_API_PASSWORD` (staging omits these → fallback)
- Confirm `NEXT_PUBLIC_*` are **build-time** scoped (spec already sets `RUN_AND_BUILD_TIME`)

### B4. Deploy & domain
- First deploy yields `https://<app>.ondigitalocean.app`.
- Add a custom domain (Settings → Domains, TLS automatic), then set `NEXT_PUBLIC_APP_URL` to it and **redeploy** (build-time var).

---

## Part C — Wire external services to the new domain

### C1. Supabase auth URLs (deferred A5)
Set Site URL + `https://<domain>/**` redirect for each project/environment.

### C2. Webhooks
- **Stripe** → endpoint `https://<domain>/api/stripe/webhook`; copy its signing secret into the app's `STRIPE_WEBHOOK_SECRET` → redeploy. (Test-mode endpoint for staging, live for prod.)
- **Postmark** inbound → `…/api/ledger/webhooks/postmark`
- **Twilio** SMS → `…/api/ledger/webhooks/twilio`
- **Checkr** → `…/api/checkr/...`

### C3. Cron (replaces vercel.json; App Platform has no scheduler)
GitHub → Settings → Secrets and variables → Actions:
- Variable `PROD_BASE_URL` = `https://<domain>` (no trailing slash)
- Secret `CRON_SECRET` = the app's `CRON_SECRET`

The workflows (`cron-nursys-notifications.yml` @ 06:00 UTC, `cron-credentials-expiry.yml` @ 14:00 UTC) GET the endpoints with `Authorization: Bearer ${CRON_SECRET}`.

---

## Part D — Verify production
- [ ] Load site, log in (confirms Supabase env + auth URLs)
- [ ] Verify-license flow with a real license (confirms Nursys from DO)
- [ ] Actions tab → run each cron workflow manually once
- [ ] Stripe test-mode payment → webhook updates the placement

---

## Part E — Decommission Vercel
- [ ] Point DNS at DO, confirm prod healthy
- [ ] Delete `vercel.json` (now inert) and pause/delete the Vercel project

---

## Ongoing ops
- **Nursys password:** rotate every 90 days (`/admin/nursys` UI, `npm run nursys:rotate`, or the e-Notify Settings tab), then update `NURSYS_API_PASSWORD` in DO + `.env.local` and redeploy. Confirm with `npm run nursys:ping`.
- **Migrations:** always dev → prod (Part A3).
- **Secrets:** distinct values per environment; never cross-load.
