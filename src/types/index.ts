export type UserRole = 'nurse' | 'hospital' | 'admin'

export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
}

export type LicenseType = 'RN' | 'LPN' | 'NP' | 'CRNA' | 'CNA' | 'HHA'

export interface NurseProfile {
  id: string
  user_id: string
  full_name: string
  license_type?: LicenseType | null
  license_number: string
  license_state: string
  specialty: string
  years_exp: number
  bio: string
  hourly_rate: number
  weekly_rate?: number | null
  availability: string
  availability_date?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  background_check_status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'not_started'
  checkr_candidate_id?: string | null
  license_verified: boolean
  license_verified_at?: string | null
  rating_avg: number
  rating_count?: number
  featured: boolean
  profile_photo_url?: string
  // Nursys verification fields (see supabase/schema.sql ALTER TABLE block)
  address1?: string | null
  address2?: string | null
  ssn_last_four?: string | null
  birth_year?: number | null
  practice_setting?: string | null
  ncsbn_id?: string | null
  nursys_transaction_id?: string | null
  nursys_lookup_transaction_id?: string | null
  nursys_enrolled_at?: string | null
  license_status_detail?: NursysLicenseStatusDetail | null
  created_at: string
  updated_at?: string
}

export interface NursysLicenseStatusDetail {
  licenseStatus: string
  active: string
  compact: string
  expirationDate: string | null | undefined
  disciplineCount: number
  authorizedStates: string[]
}

export interface EmployerProfile {
  id: string
  user_id: string
  org_name: string
  type: 'hospital' | 'clinic' | 'home_health_agency' | 'staffing_agency'
  contact_name: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  verified: boolean
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise'
  stripe_customer_id?: string
  created_at: string
}

export type JobStatus = 'draft' | 'active' | 'filled' | 'cancelled' | 'expired'
export type Specialty =
  | 'ICU'
  | 'ER'
  | 'Med-Surg'
  | 'OR'
  | 'L&D'
  | 'Pediatrics'
  | 'Oncology'
  | 'Telemetry'
  | 'PACU'
  | 'Home Health'
  | 'Psych'
  | 'Other'

export interface JobPosting {
  id: string
  employer_id: string
  title: string
  location: string
  city: string
  state: string
  start_date: string
  duration_weeks: number
  weekly_rate: number
  specialty_required: Specialty
  description: string
  requirements: string
  status: JobStatus
  created_at: string
  employer_profiles?: EmployerProfile
}

export type ApplicationStatus = 'pending' | 'reviewing' | 'offered' | 'accepted' | 'rejected' | 'withdrawn'

export interface Application {
  id: string
  nurse_id: string
  job_id: string
  status: ApplicationStatus
  cover_note?: string
  applied_at: string
  job_postings?: JobPosting
  nurse_profiles?: NurseProfile
}

export type EscrowStatus = 'held' | 'released' | 'refunded' | 'disputed'

export interface Placement {
  id: string
  job_id: string
  nurse_id: string
  employer_id: string
  contract_value: number
  platform_fee: number
  escrow_status: EscrowStatus
  stripe_payment_intent_id?: string
  start_date: string
  released_at?: string
  created_at: string
}

export interface Review {
  id: string
  placement_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string
  created_at: string
}

export type SubscriptionTier = 'basic' | 'pro' | 'enterprise'

export interface Subscription {
  id: string
  employer_id: string
  tier: SubscriptionTier
  price: number
  billing_cycle: 'monthly' | 'annual'
  stripe_subscription_id: string
  status: 'active' | 'cancelled' | 'past_due'
  created_at: string
}

export interface OnboardingChecklist {
  id: string
  job_id: string
  employer_id: string
  parking: string
  report_to: string
  dress_code: string
  unit_protocols: string
  badge_pickup: string
  additional_notes?: string
  pdf_url?: string
  created_at: string
}
