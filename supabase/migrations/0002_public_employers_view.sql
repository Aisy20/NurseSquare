-- 0002_public_employers_view
-- Safe public-read path for employer org info on the public job board.
--
-- The job board (/nurse/jobs) is browsable without an account. employer_profiles
-- holds sensitive contact/billing columns (phone, address, stripe_customer_id),
-- and RLS is row-level (not column-level), so we expose only the safe columns
-- through a view rather than loosening the base table's policies.
--
-- security_invoker = false (the default) makes the view run with its owner's
-- privileges, bypassing employer_profiles RLS. It is scoped to employers with
-- at least one active posting — exactly the orgs shown on the public board.

CREATE OR REPLACE VIEW public_employers
WITH (security_invoker = false) AS
  SELECT ep.id, ep.org_name, ep.type, ep.city, ep.state, ep.verified
  FROM employer_profiles ep
  WHERE EXISTS (
    SELECT 1 FROM job_postings jp
    WHERE jp.employer_id = ep.id AND jp.status = 'active'
  );

GRANT SELECT ON public_employers TO anon, authenticated;
