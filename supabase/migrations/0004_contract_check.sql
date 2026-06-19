-- 0004_contract_check
-- Contract Check v0: turn a single recruiter pay quote into an instant assessment.
--
-- Two additive changes, both idempotent:
--   1. ledger_contracts.bill_rate_capture — the latest quote's blended hourly rate
--      divided by the disclosed bill rate (a fraction, e.g. 0.7600 = 76% capture).
--      NULL when the bill rate was never disclosed. Red flags themselves are
--      computed on read, not stored.
--   2. gsa_per_diem_rates — locality lodging + M&IE ceilings used by the
--      "stipend over GSA per-diem" red flag. Keyed by GSA fiscal year.
--      Conventions: locality = '*' is a state default; state = '*' is the
--      CONUS standard fallback. We only extract the assignment city, so rows
--      are matched case-insensitively on locality = the quote's city, falling
--      back to the state default, then the CONUS standard.
--      Seed values are representative FY2026 figures — refresh annually from
--      https://www.gsa.gov/travel/plan-book/per-diem-rates (county-level keying
--      is a future refinement).

ALTER TABLE ledger_contracts
  ADD COLUMN IF NOT EXISTS bill_rate_capture NUMERIC(5,4);

CREATE TABLE IF NOT EXISTS gsa_per_diem_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fiscal_year INT NOT NULL,
  state CHAR(2) NOT NULL,          -- '*' = CONUS standard (any state)
  locality TEXT NOT NULL,          -- '*' = state default; otherwise a city/locality name
  lodging_cents INT NOT NULL,      -- max nightly lodging per GSA
  mie_cents INT NOT NULL,          -- daily meals & incidental expenses per GSA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (fiscal_year, state, locality)
);

ALTER TABLE gsa_per_diem_rates ENABLE ROW LEVEL SECURITY;

-- Reference data: readable by any authenticated user, never written from the app.
DROP POLICY IF EXISTS "Authenticated can read GSA per-diem rates" ON gsa_per_diem_rates;
CREATE POLICY "Authenticated can read GSA per-diem rates" ON gsa_per_diem_rates
  FOR SELECT USING (auth.role() = 'authenticated');

INSERT INTO gsa_per_diem_rates (fiscal_year, state, locality, lodging_cents, mie_cents) VALUES
  (2026, '*',  '*',              11000, 6800),  -- CONUS standard fallback
  (2026, 'CA', 'San Francisco',  25800, 9200),
  (2026, 'CA', 'Los Angeles',    18200, 8000),
  (2026, 'NY', 'New York',       29000, 9200),
  (2026, 'TX', 'Austin',         13700, 8000),
  (2026, 'TX', 'Houston',        12300, 8000),
  (2026, 'TX', 'Dallas',         14500, 8000),
  (2026, 'FL', 'Miami',          19000, 8000),
  (2026, 'IL', 'Chicago',        21000, 8000),
  (2026, 'WA', 'Seattle',        19500, 8600),
  (2026, 'MA', 'Boston',         26000, 9200),
  (2026, 'AZ', 'Phoenix',        13500, 8000),
  (2026, 'CO', 'Denver',         19900, 8000),
  (2026, 'DC', 'Washington',     25700, 9200)
ON CONFLICT (fiscal_year, state, locality) DO NOTHING;
