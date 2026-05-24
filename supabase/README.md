# Supabase Schema And Migrations

`schema.sql` is the readable schema reference for the app. Ordered migration files live in `migrations/` and should be applied in filename order for new environments.

Current migration set:

- `migrations/0001_initial_schema.sql` — initial marketplace, Nursys fields, ledger, credential wallet, share links, RLS policies, functions, and triggers.

When changing the database:

1. Add a new migration file with the next numeric prefix.
2. Keep changes additive when possible.
3. Update `schema.sql` so it remains a full reference for fresh manual setup.
4. Include RLS policies, indexes, triggers, grants, and storage assumptions in the same migration as the table or function they support.

The app expects RLS to remain enabled. Route handlers that use the service-role client should be limited to public share pages, cron jobs, or integration endpoints with explicit secret verification.
