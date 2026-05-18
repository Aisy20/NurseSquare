export const EXTRACTOR_SYSTEM_PROMPT = `You are a pay package extractor for US travel nurse contracts. Read the input message or document and return a JSON object matching the PayPackage schema via the provided tool. Fields not present in the input must be null, not guessed. Convert annual or hourly references to weekly where possible. Distinguish taxable hourly wage from tax-free stipends. If the recruiter mentions a range, use the midpoint and note this in raw_notes. All currency must be returned in cents (multiply dollars by 100). Output via the provided tool only, no preamble.

When the source mentions certifications (BLS, ACLS, PALS, NIHSS, NRP, TNCC, CCRN, etc.) that the nurse must hold, include them as exact strings in required_credentials. Otherwise return an empty array.

extraction_confidence reflects how complete and unambiguous the source was. Casual SMS with only partial figures should score lower (0.4 to 0.7); a signed contract with every field present should score higher (0.85+).`

export interface FewShot {
  source_type: 'sms' | 'email' | 'voice' | 'manual'
  description: string
  input: string
  output: Record<string, unknown>
}

export const FEW_SHOTS: FewShot[] = [
  {
    source_type: 'sms',
    description: 'Casual SMS with partial figures',
    input: `Hey! Got an ICU gig in Austin TX starting 6/2 thru 8/25. $32/hr taxable + $1400/wk housing + $350/wk meals. 36hr guarantee, 3x12s nights. Lmk!`,
    output: {
      taxable_hourly_rate_cents: 3200,
      weekly_housing_stipend_cents: 140000,
      weekly_meals_stipend_cents: 35000,
      weekly_travel_stipend_cents: null,
      weekly_gross_estimate_cents: null,
      weekly_net_estimate_cents: null,
      guaranteed_hours_per_week: 36,
      shift_type: 'night',
      shift_length_hours: 12,
      start_date: '2026-06-02',
      end_date: '2026-08-25',
      contract_length_weeks: 13,
      location_city: 'Austin',
      location_state: 'TX',
      facility_name: null,
      specialty: 'ICU',
      sign_on_bonus_cents: null,
      completion_bonus_cents: null,
      cancellation_terms: null,
      overtime_rate_cents: null,
      holiday_pay: null,
      required_credentials: [],
      extraction_confidence: 0.55,
      raw_notes: 'No facility name, no cancellation terms, no bonuses mentioned.',
    },
  },
  {
    source_type: 'email',
    description: 'Formal email offer with ranges',
    input: `Subject: ER Travel RN — Miami, FL — Offer

Hi Jane,

Pleased to extend the following offer for a 13-week ER assignment at South Bay Regional Medical Center, Miami, FL:

- Taxable hourly: $36 to $40 (we will start you at $38)
- Weekly housing stipend: $1,650
- Weekly M&IE stipend: $385
- Weekly travel: $250
- Guaranteed hours: 36 per week, 3x12 day shifts
- Start: 7/14/2026, end: 10/12/2026
- Sign-on bonus: $1,500 paid first check
- Completion bonus: $2,000
- OT after 40 hrs at $57/hr
- Holiday pay: 1.5x for federal holidays worked
- Cancellation: 7 days written notice required on either side
- Required: BLS, ACLS, NIHSS

Estimated weekly gross: ~$3,653

Best,
Mark`,
    output: {
      taxable_hourly_rate_cents: 3800,
      weekly_housing_stipend_cents: 165000,
      weekly_meals_stipend_cents: 38500,
      weekly_travel_stipend_cents: 25000,
      weekly_gross_estimate_cents: 365300,
      weekly_net_estimate_cents: null,
      guaranteed_hours_per_week: 36,
      shift_type: 'day',
      shift_length_hours: 12,
      start_date: '2026-07-14',
      end_date: '2026-10-12',
      contract_length_weeks: 13,
      location_city: 'Miami',
      location_state: 'FL',
      facility_name: 'South Bay Regional Medical Center',
      specialty: 'ER',
      sign_on_bonus_cents: 150000,
      completion_bonus_cents: 200000,
      cancellation_terms: '7 days written notice required on either side',
      overtime_rate_cents: 5700,
      holiday_pay: '1.5x for federal holidays worked',
      required_credentials: ['BLS', 'ACLS', 'NIHSS'],
      extraction_confidence: 0.92,
      raw_notes: 'Hourly range $36-$40 stated; using starting rate $38.',
    },
  },
  {
    source_type: 'manual',
    description: 'Signed contract PDF text excerpt',
    input: `TRAVEL NURSE STAFFING AGREEMENT
Facility: South Bay Regional Medical Center, Miami, FL
Specialty: Emergency Department
Term: 14 July 2026 through 12 October 2026 (13 weeks)
Position: Registered Nurse, 12-hour day shifts, 3 shifts per week (36 hours guaranteed)
Compensation:
  Taxable hourly: $38.00
  Weekly housing: $1,300.00
  Weekly meals: $385.00
  Weekly travel: $250.00
  Sign-on bonus: $0 (waived per amendment dated 7/2)
  Completion bonus: $2,000.00 contingent on completion of all scheduled shifts
Overtime: 1.5x base after 40 hours per week ($57.00/hr)
Holiday Pay: Holidays worked paid at 1.5x base
Cancellation: Either party may terminate with 48 hours written notice. Sign-on or completion bonuses forfeited on early termination by traveler.
Required credentials on first day: BLS, ACLS, NIHSS, fit test, drug screen clearance.`,
    output: {
      taxable_hourly_rate_cents: 3800,
      weekly_housing_stipend_cents: 130000,
      weekly_meals_stipend_cents: 38500,
      weekly_travel_stipend_cents: 25000,
      weekly_gross_estimate_cents: null,
      weekly_net_estimate_cents: null,
      guaranteed_hours_per_week: 36,
      shift_type: 'day',
      shift_length_hours: 12,
      start_date: '2026-07-14',
      end_date: '2026-10-12',
      contract_length_weeks: 13,
      location_city: 'Miami',
      location_state: 'FL',
      facility_name: 'South Bay Regional Medical Center',
      specialty: 'Emergency Department',
      sign_on_bonus_cents: 0,
      completion_bonus_cents: 200000,
      cancellation_terms: 'Either party may terminate with 48 hours written notice. Sign-on or completion bonuses forfeited on early termination by traveler.',
      overtime_rate_cents: 5700,
      holiday_pay: 'Holidays worked paid at 1.5x base',
      required_credentials: ['BLS', 'ACLS', 'NIHSS'],
      extraction_confidence: 0.95,
      raw_notes: 'Sign-on bonus zeroed via amendment 7/2.',
    },
  },
]
