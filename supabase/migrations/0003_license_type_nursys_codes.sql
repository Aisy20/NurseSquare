-- 0003_license_type_nursys_codes
-- Align nurse_profiles.license_type with the Nursys e-Notify spec Appendix A.2.
--
-- A.2 valid codes: RN, PN, CNM, CRNA, CNS, CNP. Two legacy codes don't match and
-- would be rejected at enrollment with "error 4 — Invalid License Type":
--   LPN -> PN   (Practical / Vocational Nurse)
--   NP  -> CNP  (Certified Nurse Practitioner)
-- CNA and HHA are platform-only aide types (never sent to Nursys) and are kept.
--
-- Order: drop the constraint, migrate the data, then re-add the widened
-- constraint, so the UPDATEs can't trip the old check.

ALTER TABLE nurse_profiles DROP CONSTRAINT IF EXISTS nurse_profiles_license_type_check;

UPDATE nurse_profiles SET license_type = 'PN'  WHERE license_type = 'LPN';
UPDATE nurse_profiles SET license_type = 'CNP' WHERE license_type = 'NP';

ALTER TABLE nurse_profiles
  ADD CONSTRAINT nurse_profiles_license_type_check
  CHECK (license_type IN ('RN','PN','CNM','CRNA','CNS','CNP','CNA','HHA'));
