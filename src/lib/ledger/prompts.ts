export const EXTRACTOR_SYSTEM_PROMPT = `You are a pay package extractor for US travel nurse contracts. Read the input message or document and return a JSON object matching the PayPackage schema via the provided tool. Fields not present in the input must be null, not guessed. Convert annual or hourly references to weekly where possible. Distinguish taxable hourly wage from tax-free stipends. All currency must be returned in cents (multiply dollars by 100). Output via the provided tool only, no preamble.

ONE-TIME vs WEEKLY TRAVEL: Use weekly_travel_stipend_cents only when the document explicitly pays travel every week. Lump-sum travel payments tied to first or last paycheck go to one_time_travel_reimbursement_cents (outbound) and one_time_return_reimbursement_cents (return). Do not divide a lump sum by weeks to fake a weekly figure.

BONUSES: Capture sign-on, completion, extension (paid if the traveler extends the contract), and referral bonuses as separate fields. Referral bonuses are commonly quoted as a range; populate referral_bonus_cents_min and referral_bonus_cents_max. If a single value is given, set both to the same amount.

OVERTIME BASIS: overtime_basis = 'taxable_hourly' when the doc states 1.5x the taxable wage only. 'blended' when it states 1.5x the blended or combined rate (taxable plus stipends, which yields a much higher rate, e.g. ~$67 for a $32 base). 'unknown' if unstated.

NET PAY RANGES: If the source gives a range (e.g. "$2,420 to $2,520"), populate weekly_net_estimate_cents_low and _high. Leave weekly_net_estimate_cents null. For hourly-rate ranges, use the midpoint for taxable_hourly_rate_cents and note this in raw_notes.

POLICIES: call_off_policy captures the rules around shift cancellations by the facility (e.g. "1 free cancel per 4-week period"). floating_policy captures which units the traveler may be floated to.

CERTIFICATIONS: When the source mentions credentials (BLS, ACLS, PALS, NIHSS, NRP, TNCC, CCRN, etc.) the nurse must hold, include them as exact strings in required_credentials. Otherwise return an empty array.

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
      one_time_travel_reimbursement_cents: null,
      one_time_return_reimbursement_cents: null,
      weekly_gross_estimate_cents: null,
      weekly_net_estimate_cents: null,
      weekly_net_estimate_cents_low: null,
      weekly_net_estimate_cents_high: null,
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
      extension_bonus_cents: null,
      referral_bonus_cents_min: null,
      referral_bonus_cents_max: null,
      cancellation_terms: null,
      call_off_policy: null,
      floating_policy: null,
      overtime_rate_cents: null,
      overtime_basis: null,
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
      one_time_travel_reimbursement_cents: null,
      one_time_return_reimbursement_cents: null,
      weekly_gross_estimate_cents: 365300,
      weekly_net_estimate_cents: null,
      weekly_net_estimate_cents_low: null,
      weekly_net_estimate_cents_high: null,
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
      extension_bonus_cents: null,
      referral_bonus_cents_min: null,
      referral_bonus_cents_max: null,
      cancellation_terms: '7 days written notice required on either side',
      call_off_policy: null,
      floating_policy: null,
      overtime_rate_cents: 5700,
      overtime_basis: 'taxable_hourly',
      holiday_pay: '1.5x for federal holidays worked',
      required_credentials: ['BLS', 'ACLS', 'NIHSS'],
      extraction_confidence: 0.92,
      raw_notes: 'Hourly range $36-$40 stated; using starting rate $38. OT $57 = 1.5x taxable $38.',
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
      one_time_travel_reimbursement_cents: null,
      one_time_return_reimbursement_cents: null,
      weekly_gross_estimate_cents: null,
      weekly_net_estimate_cents: null,
      weekly_net_estimate_cents_low: null,
      weekly_net_estimate_cents_high: null,
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
      extension_bonus_cents: null,
      referral_bonus_cents_min: null,
      referral_bonus_cents_max: null,
      cancellation_terms: 'Either party may terminate with 48 hours written notice. Sign-on or completion bonuses forfeited on early termination by traveler.',
      call_off_policy: null,
      floating_policy: null,
      overtime_rate_cents: 5700,
      overtime_basis: 'taxable_hourly',
      holiday_pay: 'Holidays worked paid at 1.5x base',
      required_credentials: ['BLS', 'ACLS', 'NIHSS'],
      extraction_confidence: 0.95,
      raw_notes: 'Sign-on bonus zeroed via amendment 7/2.',
    },
  },
  {
    source_type: 'email',
    description: 'Formal offer with one-time travel reimbursements, blended OT, extension bonus, call-off policy',
    input: `Offer summary - Pinnacle Healthcare Staffing - ICU - Phoenix AZ
Facility: Mercy General Medical Center
Term: 1/19/2026 - 4/19/2026 (13 weeks)
Nights, 12hr, 3/wk, 36 guaranteed
Taxable: $32/hr ($1,152/wk)
Housing: $1,200/wk
M&IE: $364/wk
Estimated weekly gross: $2,716. Net estimate (PA filer): $2,420 to $2,520.
Sign-on: $1,000 after 4th shift
Completion: $1,500
Extension: $750 if traveler extends 13+ weeks
Referral: $500 to $750 per referred RN completing 8+ weeks
Travel out: $750 one-time, first paycheck
Travel back: $500 one-time, final paycheck
Overtime: 1.5x blended rate, approximately $67.80/hr
Holiday pay: 1.5x taxable on federal holidays
Cancellation: 14 days pre-start; mid-assignment by traveler 14 days written notice, forfeits completion bonus.
Call-off: facility may cancel up to 1 shift per 4-week period without compensation.
Float: may float to PCU and Step-Down at comparable acuity.
Required: BLS, ACLS, CCRN (preferred)`,
    output: {
      taxable_hourly_rate_cents: 3200,
      weekly_housing_stipend_cents: 120000,
      weekly_meals_stipend_cents: 36400,
      weekly_travel_stipend_cents: null,
      one_time_travel_reimbursement_cents: 75000,
      one_time_return_reimbursement_cents: 50000,
      weekly_gross_estimate_cents: 271600,
      weekly_net_estimate_cents: null,
      weekly_net_estimate_cents_low: 242000,
      weekly_net_estimate_cents_high: 252000,
      guaranteed_hours_per_week: 36,
      shift_type: 'night',
      shift_length_hours: 12,
      start_date: '2026-01-19',
      end_date: '2026-04-19',
      contract_length_weeks: 13,
      location_city: 'Phoenix',
      location_state: 'AZ',
      facility_name: 'Mercy General Medical Center',
      specialty: 'ICU',
      sign_on_bonus_cents: 100000,
      completion_bonus_cents: 150000,
      extension_bonus_cents: 75000,
      referral_bonus_cents_min: 50000,
      referral_bonus_cents_max: 75000,
      cancellation_terms: '14 days pre-start; mid-assignment by traveler requires 14 days written notice, forfeits completion bonus.',
      call_off_policy: 'Facility may cancel up to 1 shift per 4-week period without compensation.',
      floating_policy: 'May float to PCU and Step-Down at comparable acuity.',
      overtime_rate_cents: 6780,
      overtime_basis: 'blended',
      holiday_pay: '1.5x taxable on federal holidays.',
      required_credentials: ['BLS', 'ACLS'],
      extraction_confidence: 0.95,
      raw_notes: 'CCRN is preferred, not required, so excluded from required_credentials. OT $67.80 = 1.5x blended.',
    },
  },
]
