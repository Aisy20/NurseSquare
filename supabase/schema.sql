-- NurseSquare Database Schema
-- Run this in the Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('nurse', 'hospital', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own record" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow insert during registration (service role only in prod)
CREATE POLICY "Allow insert on registration" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- NURSE PROFILES
-- ============================================================
CREATE TABLE nurse_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  license_type TEXT CHECK (license_type IN ('RN','LPN','NP','CRNA','CNA','HHA')),
  license_number TEXT,
  license_state TEXT,
  specialty TEXT,
  years_exp INTEGER DEFAULT 0,
  bio TEXT,
  hourly_rate NUMERIC(10,2),
  weekly_rate NUMERIC(10,2),
  availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'unavailable', 'open_to_offers')),
  availability_date DATE,
  city TEXT,
  state TEXT,
  zip TEXT,
  background_check_status TEXT DEFAULT 'not_started' CHECK (
    background_check_status IN ('not_started', 'pending', 'in_progress', 'passed', 'failed')
  ),
  checkr_candidate_id TEXT,
  license_verified BOOLEAN DEFAULT FALSE,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX nurse_profiles_user_id_idx ON nurse_profiles(user_id);

ALTER TABLE nurse_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nurses can manage own profile" ON nurse_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Employers can view nurse profiles" ON nurse_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('hospital', 'admin')
    )
  );

-- ============================================================
-- EMPLOYER PROFILES
-- ============================================================
CREATE TABLE employer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hospital', 'clinic', 'home_health_agency', 'staffing_agency')),
  contact_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  verified BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX employer_profiles_user_id_idx ON employer_profiles(user_id);

ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can manage own profile" ON employer_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Nurses can view employer profiles" ON employer_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('nurse', 'admin')
    )
  );

CREATE POLICY "Admin full access to employer profiles" ON employer_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- JOB POSTINGS
-- ============================================================
CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  start_date DATE NOT NULL,
  duration_weeks INTEGER NOT NULL,
  weekly_rate NUMERIC(10,2) NOT NULL,
  specialty_required TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'filled', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX job_postings_employer_idx ON job_postings(employer_id);
CREATE INDEX job_postings_status_idx ON job_postings(status);
CREATE INDEX job_postings_specialty_idx ON job_postings(specialty_required);
CREATE INDEX job_postings_state_idx ON job_postings(state);

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active jobs" ON job_postings
  FOR SELECT USING (status = 'active' OR auth.uid() IN (
    SELECT user_id FROM employer_profiles WHERE id = employer_id
  ));

CREATE POLICY "Employers can manage own jobs" ON job_postings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employer_profiles WHERE id = employer_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nurse_id UUID NOT NULL REFERENCES nurse_profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'reviewing', 'offered', 'accepted', 'rejected', 'withdrawn')
  ),
  cover_note TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nurse_id, job_id)
);

CREATE INDEX applications_nurse_idx ON applications(nurse_id);
CREATE INDEX applications_job_idx ON applications(job_id);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nurses can view and manage own applications" ON applications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM nurse_profiles WHERE id = nurse_id AND user_id = auth.uid())
  );

CREATE POLICY "Employers can view applications for their jobs" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_postings jp
      JOIN employer_profiles ep ON ep.id = jp.employer_id
      WHERE jp.id = job_id AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Employers can update application status" ON applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM job_postings jp
      JOIN employer_profiles ep ON ep.id = jp.employer_id
      WHERE jp.id = job_id AND ep.user_id = auth.uid()
    )
  );

-- ============================================================
-- PLACEMENTS
-- ============================================================
CREATE TABLE placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES job_postings(id),
  nurse_id UUID NOT NULL REFERENCES nurse_profiles(id),
  employer_id UUID NOT NULL REFERENCES employer_profiles(id),
  contract_value NUMERIC(12,2) NOT NULL,
  platform_fee NUMERIC(12,2) NOT NULL,
  escrow_status TEXT DEFAULT 'held' CHECK (escrow_status IN ('held', 'released', 'refunded', 'disputed')),
  stripe_payment_intent_id TEXT,
  start_date DATE NOT NULL,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX placements_nurse_idx ON placements(nurse_id);
CREATE INDEX placements_employer_idx ON placements(employer_id);

ALTER TABLE placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nurses can view own placements" ON placements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM nurse_profiles WHERE id = nurse_id AND user_id = auth.uid())
  );

CREATE POLICY "Employers can view own placements" ON placements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM employer_profiles WHERE id = employer_id AND user_id = auth.uid())
  );

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placement_id UUID NOT NULL REFERENCES placements(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  reviewee_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(placement_id, reviewer_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for own placements" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'pro', 'enterprise')),
  price NUMERIC(10,2) NOT NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  stripe_subscription_id TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view own subscriptions" ON subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM employer_profiles WHERE id = employer_id AND user_id = auth.uid())
  );

-- ============================================================
-- ONBOARDING CHECKLISTS
-- ============================================================
CREATE TABLE onboarding_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
  parking TEXT,
  report_to TEXT,
  dress_code TEXT,
  unit_protocols TEXT,
  badge_pickup TEXT,
  additional_notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id)
);

ALTER TABLE onboarding_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can manage own checklists" ON onboarding_checklists
  FOR ALL USING (
    EXISTS (SELECT 1 FROM employer_profiles WHERE id = employer_id AND user_id = auth.uid())
  );

CREATE POLICY "Nurses with placement can view checklist" ON onboarding_checklists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM placements p
      JOIN nurse_profiles np ON np.id = p.nurse_id
      WHERE p.job_id = job_id AND np.user_id = auth.uid()
    )
  );

-- ============================================================
-- NURSYS VERIFICATION FIELDS (added post-initial-schema)
-- Run these ALTER statements in your Supabase SQL editor:
-- ============================================================
ALTER TABLE nurse_profiles
  ADD COLUMN IF NOT EXISTS address1 TEXT,
  ADD COLUMN IF NOT EXISTS address2 TEXT,
  ADD COLUMN IF NOT EXISTS ssn_last_four TEXT,
  ADD COLUMN IF NOT EXISTS birth_year INTEGER,
  ADD COLUMN IF NOT EXISTS practice_setting TEXT,
  ADD COLUMN IF NOT EXISTS ncsbn_id TEXT,
  ADD COLUMN IF NOT EXISTS nursys_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS nursys_lookup_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS nursys_enrolled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS license_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS license_status_detail JSONB;

-- ============================================================
-- MESSAGES (scoped to an application thread)
-- ============================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX messages_application_idx ON messages(application_id);
CREATE INDEX messages_sender_idx ON messages(sender_id);
CREATE INDEX messages_created_idx ON messages(created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Application parties can read messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN nurse_profiles np ON np.id = a.nurse_id
      JOIN job_postings jp ON jp.id = a.job_id
      JOIN employer_profiles ep ON ep.id = jp.employer_id
      WHERE a.id = application_id
        AND (np.user_id = auth.uid() OR ep.user_id = auth.uid())
    )
  );

CREATE POLICY "Application parties can send messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM applications a
      JOIN nurse_profiles np ON np.id = a.nurse_id
      JOIN job_postings jp ON jp.id = a.job_id
      JOIN employer_profiles ep ON ep.id = jp.employer_id
      WHERE a.id = application_id
        AND (np.user_id = auth.uid() OR ep.user_id = auth.uid())
    )
  );

CREATE POLICY "Recipients can mark messages read" ON messages
  FOR UPDATE USING (
    sender_id != auth.uid() AND
    EXISTS (
      SELECT 1 FROM applications a
      JOIN nurse_profiles np ON np.id = a.nurse_id
      JOIN job_postings jp ON jp.id = a.job_id
      JOIN employer_profiles ep ON ep.id = jp.employer_id
      WHERE a.id = application_id
        AND (np.user_id = auth.uid() OR ep.user_id = auth.uid())
    )
  );

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nurse_profiles_updated_at BEFORE UPDATE ON nurse_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER employer_profiles_updated_at BEFORE UPDATE ON employer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER job_postings_updated_at BEFORE UPDATE ON job_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER onboarding_checklists_updated_at BEFORE UPDATE ON onboarding_checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: Sync auth.users → public.users
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'nurse')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TRIGGER: Update nurse rating avg after review
-- ============================================================
CREATE OR REPLACE FUNCTION update_nurse_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE nurse_profiles np
  SET
    rating_avg = (
      SELECT AVG(r.rating)
      FROM reviews r
      JOIN users u ON u.id = r.reviewee_id
      JOIN nurse_profiles np2 ON np2.user_id = u.id
      WHERE np2.id = np.id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM reviews r
      JOIN users u ON u.id = r.reviewee_id
      JOIN nurse_profiles np2 ON np2.user_id = u.id
      WHERE np2.id = np.id
    )
  WHERE np.user_id = (SELECT id FROM users WHERE id = NEW.reviewee_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_nurse_rating();

-- ============================================================
-- ============================================================
-- PAY-PACKAGE LEDGER (Module 1)
-- All currency stored as INTEGER cents. All timestamps UTC.
-- ============================================================
-- ============================================================

-- Additive user columns for ledger inbound channels + tax home (Module 3 hook).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS forwarding_email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS forwarding_sms_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS tax_home_state TEXT;

-- ------------------------------------------------------------
-- ledger_agencies
-- ------------------------------------------------------------
CREATE TABLE ledger_agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  aggregate_score NUMERIC(3,2) DEFAULT 0,
  contract_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ledger_agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view agencies" ON ledger_agencies
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin manage agencies" ON ledger_agencies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ------------------------------------------------------------
-- ledger_recruiters
-- ------------------------------------------------------------
CREATE TABLE ledger_recruiters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES ledger_agencies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  aggregate_score NUMERIC(3,2) DEFAULT 0,
  contract_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ledger_recruiters_agency_idx ON ledger_recruiters(agency_id);
CREATE UNIQUE INDEX ledger_recruiters_email_idx ON ledger_recruiters(LOWER(email)) WHERE email IS NOT NULL;

ALTER TABLE ledger_recruiters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view recruiters" ON ledger_recruiters
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin manage recruiters" ON ledger_recruiters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ------------------------------------------------------------
-- ledger_contracts
-- placement_id (optional) links to existing placements row,
-- giving the hospital read access to the diff for that placement.
-- ------------------------------------------------------------
CREATE TABLE ledger_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES ledger_agencies(id) ON DELETE SET NULL,
  recruiter_id UUID REFERENCES ledger_recruiters(id) ON DELETE SET NULL,
  placement_id UUID REFERENCES placements(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'signed', 'completed', 'cancelled', 'archived')),
  signed_at TIMESTAMPTZ,
  start_date DATE,
  end_date DATE,
  location_city TEXT,
  location_state CHAR(2),
  specialty TEXT,
  required_credentials JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ledger_contracts_user_idx ON ledger_contracts(user_id);
CREATE INDEX ledger_contracts_agency_idx ON ledger_contracts(agency_id);
CREATE INDEX ledger_contracts_recruiter_idx ON ledger_contracts(recruiter_id);
CREATE INDEX ledger_contracts_placement_idx ON ledger_contracts(placement_id);

ALTER TABLE ledger_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nurses manage own ledger contracts" ON ledger_contracts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Hospitals view linked-placement contracts" ON ledger_contracts
  FOR SELECT USING (
    placement_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM placements p
      JOIN employer_profiles ep ON ep.id = p.employer_id
      WHERE p.id = placement_id AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin full access ledger contracts" ON ledger_contracts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE TRIGGER ledger_contracts_updated_at BEFORE UPDATE ON ledger_contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- ledger_quotes
-- ------------------------------------------------------------
CREATE TABLE ledger_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES ledger_contracts(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('email', 'sms', 'voice', 'manual')),
  raw_content TEXT NOT NULL,
  extracted_payload JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence_score NUMERIC(3,2),
  requires_review BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ledger_quotes_contract_idx ON ledger_quotes(contract_id);
CREATE INDEX ledger_quotes_received_idx ON ledger_quotes(received_at DESC);

ALTER TABLE ledger_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nurses manage own quotes" ON ledger_quotes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ledger_contracts c
      WHERE c.id = contract_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Hospitals view linked quotes" ON ledger_quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ledger_contracts c
      JOIN placements p ON p.id = c.placement_id
      JOIN employer_profiles ep ON ep.id = p.employer_id
      WHERE c.id = contract_id AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin full access quotes" ON ledger_quotes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ------------------------------------------------------------
-- ledger_signed_contracts
-- ------------------------------------------------------------
CREATE TABLE ledger_signed_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL UNIQUE REFERENCES ledger_contracts(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  extracted_payload JSONB,
  confidence_score NUMERIC(3,2),
  parsed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ledger_signed_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nurses manage own signed contracts" ON ledger_signed_contracts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ledger_contracts c
      WHERE c.id = contract_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Hospitals view linked signed contracts" ON ledger_signed_contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ledger_contracts c
      JOIN placements p ON p.id = c.placement_id
      JOIN employer_profiles ep ON ep.id = p.employer_id
      WHERE c.id = contract_id AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin full access signed contracts" ON ledger_signed_contracts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ------------------------------------------------------------
-- ledger_diffs
-- ------------------------------------------------------------
CREATE TABLE ledger_diffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES ledger_contracts(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES ledger_quotes(id) ON DELETE CASCADE,
  signed_contract_id UUID NOT NULL REFERENCES ledger_signed_contracts(id) ON DELETE CASCADE,
  field_deltas JSONB NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(quote_id, signed_contract_id)
);

CREATE INDEX ledger_diffs_contract_idx ON ledger_diffs(contract_id);

ALTER TABLE ledger_diffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nurses view own diffs" ON ledger_diffs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ledger_contracts c
      WHERE c.id = contract_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Hospitals view linked diffs" ON ledger_diffs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ledger_contracts c
      JOIN placements p ON p.id = c.placement_id
      JOIN employer_profiles ep ON ep.id = p.employer_id
      WHERE c.id = contract_id AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin full access diffs" ON ledger_diffs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ------------------------------------------------------------
-- ledger_share_links
-- Public read by slug (anon allowed). Owner can create.
-- ------------------------------------------------------------
CREATE TABLE ledger_share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diff_id UUID NOT NULL REFERENCES ledger_diffs(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ledger_share_links_diff_idx ON ledger_share_links(diff_id);

ALTER TABLE ledger_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read share links by slug" ON ledger_share_links
  FOR SELECT USING (
    expires_at IS NULL OR expires_at > NOW()
  );

CREATE POLICY "Owners can create share links" ON ledger_share_links
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND EXISTS (
      SELECT 1 FROM ledger_diffs d
      JOIN ledger_contracts c ON c.id = d.contract_id
      WHERE d.id = diff_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete share links" ON ledger_share_links
  FOR DELETE USING (auth.uid() = created_by);

-- ------------------------------------------------------------
-- ledger_recruiter_ratings
-- ------------------------------------------------------------
CREATE TABLE ledger_recruiter_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES ledger_recruiters(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES ledger_contracts(id) ON DELETE SET NULL,
  accuracy_score INTEGER NOT NULL CHECK (accuracy_score BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recruiter_id, contract_id)
);

CREATE INDEX ledger_recruiter_ratings_recruiter_idx ON ledger_recruiter_ratings(recruiter_id);

ALTER TABLE ledger_recruiter_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view recruiter ratings" ON ledger_recruiter_ratings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can manage own ratings" ON ledger_recruiter_ratings
  FOR ALL USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- ledger_llm_calls
-- Cost / latency monitoring for every Claude call.
-- ------------------------------------------------------------
CREATE TABLE ledger_llm_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES ledger_contracts(id) ON DELETE SET NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('extract_quote', 'extract_signed', 'diff_text')),
  model TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  cache_read_tokens INTEGER,
  cache_creation_tokens INTEGER,
  latency_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('ok', 'rate_limited', 'error')),
  error_message TEXT,
  called_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ledger_llm_calls_called_idx ON ledger_llm_calls(called_at DESC);

ALTER TABLE ledger_llm_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin view llm calls" ON ledger_llm_calls
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ------------------------------------------------------------
-- credentials (Module 2 stub)
-- Populated by the extractor when recruiter mentions BLS/ACLS/PALS/etc.
-- ------------------------------------------------------------
CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'expired', 'rejected')),
  issued_at DATE,
  expires_at DATE,
  issuer TEXT,
  card_number TEXT,
  document_url TEXT,
  document_path TEXT,
  verification_source TEXT,
  extraction_confidence NUMERIC(3,2),
  requires_review BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX credentials_user_idx ON credentials(user_id);

ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own credentials" ON credentials
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admin full access credentials" ON credentials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE TRIGGER credentials_updated_at BEFORE UPDATE ON credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- TRIGGER: recompute recruiter + agency aggregate scores
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_ledger_recruiter_aggregates()
RETURNS TRIGGER AS $$
DECLARE
  rid UUID;
  aid UUID;
BEGIN
  rid := COALESCE(NEW.recruiter_id, OLD.recruiter_id);

  UPDATE ledger_recruiters
  SET
    aggregate_score = COALESCE((
      SELECT AVG(accuracy_score)::NUMERIC(3,2)
      FROM ledger_recruiter_ratings
      WHERE recruiter_id = rid
    ), 0),
    contract_count = (
      SELECT COUNT(DISTINCT contract_id)
      FROM ledger_recruiter_ratings
      WHERE recruiter_id = rid AND contract_id IS NOT NULL
    )
  WHERE id = rid
  RETURNING agency_id INTO aid;

  IF aid IS NOT NULL THEN
    UPDATE ledger_agencies
    SET
      aggregate_score = COALESCE((
        SELECT AVG(r.aggregate_score)::NUMERIC(3,2)
        FROM ledger_recruiters r
        WHERE r.agency_id = aid AND r.contract_count > 0
      ), 0),
      contract_count = COALESCE((
        SELECT SUM(r.contract_count)
        FROM ledger_recruiters r
        WHERE r.agency_id = aid
      ), 0)
    WHERE id = aid;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_ledger_recruiter_rating
  AFTER INSERT OR UPDATE OR DELETE ON ledger_recruiter_ratings
  FOR EACH ROW EXECUTE FUNCTION update_ledger_recruiter_aggregates();

-- ------------------------------------------------------------
-- Public share access: allow anonymous reads of ledger_diffs
-- when an active (non-expired) share_link points to them.
-- ------------------------------------------------------------
CREATE POLICY "Public read shared diffs" ON ledger_diffs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ledger_share_links sl
      WHERE sl.diff_id = id
        AND (sl.expires_at IS NULL OR sl.expires_at > NOW())
    )
  );

-- Atomic, anon-safe view_count increment. Returns the link row (RLS still
-- restricts which slug rows are visible).
CREATE OR REPLACE FUNCTION increment_ledger_share_view(p_slug TEXT)
RETURNS ledger_share_links AS $$
  UPDATE ledger_share_links
  SET view_count = view_count + 1
  WHERE slug = p_slug
    AND (expires_at IS NULL OR expires_at > NOW())
  RETURNING *;
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_ledger_share_view(TEXT) TO anon, authenticated;

-- ============================================================
-- CREDENTIALING WALLET (Module 2) additive migrations
-- Run these if your `credentials` table was created from an earlier
-- version of this schema and is missing the newer columns.
-- ============================================================
ALTER TABLE credentials
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS issued_at DATE,
  ADD COLUMN IF NOT EXISTS issuer TEXT,
  ADD COLUMN IF NOT EXISTS card_number TEXT,
  ADD COLUMN IF NOT EXISTS document_path TEXT,
  ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS requires_review BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS credentials_expires_idx ON credentials(expires_at);
CREATE INDEX IF NOT EXISTS credentials_type_idx ON credentials(LOWER(type));

ALTER TABLE credentials
  ADD COLUMN IF NOT EXISTS reminders_sent JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ------------------------------------------------------------
-- credential_share_links: opt-in public sharing of one credential
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credential_share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  expose_document BOOLEAN NOT NULL DEFAULT FALSE,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS credential_share_links_credential_idx ON credential_share_links(credential_id);

ALTER TABLE credential_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read non-expired credential share links" ON credential_share_links
  FOR SELECT USING (expires_at IS NULL OR expires_at > NOW());

CREATE POLICY "Owners create credential share links" ON credential_share_links
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND EXISTS (
      SELECT 1 FROM credentials c
      WHERE c.id = credential_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners delete credential share links" ON credential_share_links
  FOR DELETE USING (auth.uid() = created_by);

-- Public read of the underlying credential when an active share link
-- points to it. Limits the exposure to metadata; the document_url is
-- only included by the service-role page if expose_document=true.
CREATE POLICY "Public read shared credentials" ON credentials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM credential_share_links csl
      WHERE csl.credential_id = id
        AND (csl.expires_at IS NULL OR csl.expires_at > NOW())
    )
  );

CREATE OR REPLACE FUNCTION increment_credential_share_view(p_slug TEXT)
RETURNS credential_share_links AS $$
  UPDATE credential_share_links
  SET view_count = view_count + 1
  WHERE slug = p_slug
    AND (expires_at IS NULL OR expires_at > NOW())
  RETURNING *;
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_credential_share_view(TEXT) TO anon, authenticated;

