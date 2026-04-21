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
  license_number TEXT,
  license_state TEXT,
  specialty TEXT,
  years_exp INTEGER DEFAULT 0,
  bio TEXT,
  hourly_rate NUMERIC(10,2),
  availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'unavailable', 'open_to_offers')),
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
