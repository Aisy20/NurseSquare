import { describe, it, expect } from 'vitest'
import type { PayPackage } from '../../src/lib/ledger/types'
import type { PerDiemRate } from '../../src/lib/ledger/gsa'
import type { TaxHomeStatus } from '../../src/lib/taxhome/compute'
import {
  computeBlendedRate,
  computeBillRateCapture,
  flagLowBaseHighStipend,
  flagStipendOverGsa,
  flagBlendedNoBreakdown,
  flagMissingBillRate,
  assessQuote,
} from '../../src/lib/ledger/contract-check'

// Full PayPackage with everything null; tests override the fields they exercise.
function pkg(overrides: Partial<PayPackage> = {}): PayPackage {
  return {
    taxable_hourly_rate_cents: null,
    weekly_housing_stipend_cents: null,
    weekly_meals_stipend_cents: null,
    weekly_travel_stipend_cents: null,
    one_time_travel_reimbursement_cents: null,
    one_time_return_reimbursement_cents: null,
    weekly_gross_estimate_cents: null,
    weekly_net_estimate_cents: null,
    weekly_net_estimate_cents_low: null,
    weekly_net_estimate_cents_high: null,
    guaranteed_hours_per_week: null,
    shift_type: null,
    shift_length_hours: null,
    start_date: null,
    end_date: null,
    contract_length_weeks: null,
    location_city: null,
    location_state: null,
    facility_name: null,
    specialty: null,
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
    bill_rate_cents: null,
    holiday_pay: null,
    required_credentials: [],
    extraction_confidence: 0.9,
    raw_notes: null,
    ...overrides,
  }
}

const perDiem = (lodging: number, mie: number): PerDiemRate => ({
  lodging_cents: lodging,
  mie_cents: mie,
  resolved: 'test',
})

describe('computeBlendedRate', () => {
  it('blends taxable wage + weekly stipends over guaranteed hours', () => {
    // 32*36 = 11520 taxable + 1400 + 350 = 29020 weekly; /36 = 806.1 -> 806 (cents math below)
    const p = pkg({
      taxable_hourly_rate_cents: 3200,
      weekly_housing_stipend_cents: 140000,
      weekly_meals_stipend_cents: 35000,
      guaranteed_hours_per_week: 36,
    })
    // (3200*36 + 140000 + 35000) / 36 = 290200/36 = 8061.1 -> 8061
    expect(computeBlendedRate(p)).toBe(8061)
  })

  it('includes weekly travel but not one-time reimbursements', () => {
    const p = pkg({
      taxable_hourly_rate_cents: 3000,
      weekly_travel_stipend_cents: 25000,
      one_time_travel_reimbursement_cents: 75000,
      guaranteed_hours_per_week: 36,
    })
    // (3000*36 + 25000) / 36 = 133000/36 = 3694.4 -> 3694 (one-time excluded)
    expect(computeBlendedRate(p)).toBe(3694)
  })

  it('returns null when guaranteed hours are missing or zero', () => {
    expect(computeBlendedRate(pkg({ taxable_hourly_rate_cents: 3200 }))).toBeNull()
    expect(computeBlendedRate(pkg({ taxable_hourly_rate_cents: 3200, guaranteed_hours_per_week: 0 }))).toBeNull()
  })

  it('returns null when there is no compensation to blend', () => {
    expect(computeBlendedRate(pkg({ guaranteed_hours_per_week: 36 }))).toBeNull()
  })
})

describe('computeBillRateCapture', () => {
  it('divides blended by bill rate, rounded to 4 decimals', () => {
    expect(computeBillRateCapture(6800, 9200)).toBe(0.7391) // 0.73913 -> 0.7391
  })

  it('returns null when bill rate is missing', () => {
    expect(computeBillRateCapture(6800, null)).toBeNull()
  })

  it('returns null when bill rate is non-positive', () => {
    expect(computeBillRateCapture(6800, 0)).toBeNull()
  })

  it('returns null when blended rate is unknown', () => {
    expect(computeBillRateCapture(null, 9200)).toBeNull()
  })
})

describe('flagLowBaseHighStipend', () => {
  it('flags a low taxable base paired with inflated stipends', () => {
    const f = flagLowBaseHighStipend(
      pkg({
        taxable_hourly_rate_cents: 2000, // $20, below $25 floor
        weekly_housing_stipend_cents: 150000,
        weekly_meals_stipend_cents: 70000,
        guaranteed_hours_per_week: 36,
      }),
    )
    expect(f?.code).toBe('LOW_BASE_HIGH_STIPEND')
    expect(f?.severity).toBe('high')
  })

  it('flags on low taxable share even when the base is above the floor', () => {
    const f = flagLowBaseHighStipend(
      pkg({
        taxable_hourly_rate_cents: 3000, // $30, above floor
        weekly_housing_stipend_cents: 200000,
        weekly_meals_stipend_cents: 100000,
        guaranteed_hours_per_week: 36, // taxable 108000 / total 408000 = 0.26 < 0.30
      }),
    )
    expect(f?.code).toBe('LOW_BASE_HIGH_STIPEND')
  })

  it('flags on a sub-floor base even when the taxable share is healthy', () => {
    const f = flagLowBaseHighStipend(
      pkg({
        taxable_hourly_rate_cents: 2000,
        weekly_housing_stipend_cents: 20000,
        guaranteed_hours_per_week: 36, // taxable 72000 / total 92000 = 0.78
      }),
    )
    expect(f?.code).toBe('LOW_BASE_HIGH_STIPEND')
  })

  it('does not flag a healthy base/stipend mix', () => {
    expect(
      flagLowBaseHighStipend(
        pkg({
          taxable_hourly_rate_cents: 4500,
          weekly_housing_stipend_cents: 120000,
          weekly_meals_stipend_cents: 30000,
          guaranteed_hours_per_week: 36,
        }),
      ),
    ).toBeNull()
  })

  it('does not flag when there are no stipends to inflate', () => {
    expect(
      flagLowBaseHighStipend(pkg({ taxable_hourly_rate_cents: 2000, guaranteed_hours_per_week: 36 })),
    ).toBeNull()
  })
})

describe('flagStipendOverGsa', () => {
  const gsa = perDiem(10000, 8000) // lodging 700/wk ceiling, mie 560/wk ceiling

  it('flags housing strictly above the lodging ceiling', () => {
    const flags = flagStipendOverGsa(pkg({ weekly_housing_stipend_cents: 70001 }), gsa)
    expect(flags.map((f) => f.code)).toEqual(['STIPEND_OVER_GSA_HOUSING'])
  })

  it('flags meals strictly above the M&IE ceiling', () => {
    const flags = flagStipendOverGsa(pkg({ weekly_meals_stipend_cents: 60000 }), gsa)
    expect(flags.map((f) => f.code)).toEqual(['STIPEND_OVER_GSA_MEALS'])
  })

  it('flags both when both exceed their ceilings', () => {
    const flags = flagStipendOverGsa(
      pkg({ weekly_housing_stipend_cents: 90000, weekly_meals_stipend_cents: 60000 }),
      gsa,
    )
    expect(flags.map((f) => f.code).sort()).toEqual(['STIPEND_OVER_GSA_HOUSING', 'STIPEND_OVER_GSA_MEALS'])
  })

  it('does not flag a stipend exactly at the ceiling', () => {
    const flags = flagStipendOverGsa(
      pkg({ weekly_housing_stipend_cents: 70000, weekly_meals_stipend_cents: 56000 }),
      gsa,
    )
    expect(flags).toEqual([])
  })

  it('does not flag stipends under the ceiling', () => {
    const flags = flagStipendOverGsa(
      pkg({ weekly_housing_stipend_cents: 50000, weekly_meals_stipend_cents: 40000 }),
      gsa,
    )
    expect(flags).toEqual([])
  })

  it('returns no flags when the per-diem ceiling is unknown', () => {
    expect(flagStipendOverGsa(pkg({ weekly_housing_stipend_cents: 999999 }), null)).toEqual([])
  })
})

describe('flagBlendedNoBreakdown', () => {
  it('flags a gross figure quoted with no breakdown', () => {
    const f = flagBlendedNoBreakdown(pkg({ weekly_gross_estimate_cents: 290000 }))
    expect(f?.code).toBe('BLENDED_NO_BREAKDOWN')
    expect(f?.severity).toBe('warning')
  })

  it('flags when a net range is given but components are missing', () => {
    const f = flagBlendedNoBreakdown(pkg({ weekly_net_estimate_cents_low: 240000, weekly_net_estimate_cents_high: 252000 }))
    expect(f?.code).toBe('BLENDED_NO_BREAKDOWN')
  })

  it('does not flag a fully itemized package', () => {
    expect(
      flagBlendedNoBreakdown(
        pkg({
          weekly_gross_estimate_cents: 290000,
          taxable_hourly_rate_cents: 3200,
          weekly_housing_stipend_cents: 140000,
        }),
      ),
    ).toBeNull()
  })

  it('does not flag when no gross/net figure is present', () => {
    expect(flagBlendedNoBreakdown(pkg({ taxable_hourly_rate_cents: 3200 }))).toBeNull()
  })
})

describe('flagMissingBillRate', () => {
  it('flags an undisclosed bill rate', () => {
    const f = flagMissingBillRate(pkg())
    expect(f?.code).toBe('BILL_RATE_UNDISCLOSED')
  })

  it('does not flag when the bill rate is disclosed', () => {
    expect(flagMissingBillRate(pkg({ bill_rate_cents: 9200 }))).toBeNull()
  })
})

describe('assessQuote', () => {
  it('produces blended rate, capture, breakdown, and the expected flags', () => {
    const p = pkg({
      taxable_hourly_rate_cents: 2000,
      weekly_housing_stipend_cents: 150000, // over lodging ceiling below
      weekly_meals_stipend_cents: 70000, // over mie ceiling below
      guaranteed_hours_per_week: 36,
      bill_rate_cents: null, // undisclosed
    })
    const a = assessQuote({ pkg: p, perDiem: perDiem(10000, 8000) })

    expect(a.blended_hourly_cents).toBe(computeBlendedRate(p))
    expect(a.bill_rate_capture).toBeNull()
    expect(a.weekly.total_cents).toBe(2000 * 36 + 150000 + 70000)
    const codes = a.flags.map((f) => f.code).sort()
    expect(codes).toEqual([
      'BILL_RATE_UNDISCLOSED',
      'LOW_BASE_HIGH_STIPEND',
      'STIPEND_OVER_GSA_HOUSING',
      'STIPEND_OVER_GSA_MEALS',
    ])
  })

  it('surfaces tax-home day-count risk from the existing compute logic', () => {
    const taxHome: TaxHomeStatus = {
      asOf: '2026-06-18T00:00:00Z',
      taxHomeState: 'PA',
      daysAwayLast365: 400,
      daysAtHomeLast365: 0,
      daysAwayLast730: 400,
      topStatesLast365: [],
      topStatesLast730: [],
      maxStateDaysLast365: null,
      maxStateDaysLast730: null,
      flag: 'risk',
      reasons: ['Worked 400 days in TX in the last 24 months.'],
    }
    const a = assessQuote({
      pkg: pkg({ taxable_hourly_rate_cents: 4500, guaranteed_hours_per_week: 36, bill_rate_cents: 9000 }),
      perDiem: null,
      taxHome,
    })
    const taxFlag = a.flags.find((f) => f.code === 'TAX_HOME_DAYS')
    expect(taxFlag?.severity).toBe('high')
    expect(taxFlag?.message).toContain('400 days')
  })

  it('returns no flags for a clean, fully-disclosed package', () => {
    const a = assessQuote({
      pkg: pkg({
        taxable_hourly_rate_cents: 4500,
        weekly_housing_stipend_cents: 60000,
        weekly_meals_stipend_cents: 40000,
        guaranteed_hours_per_week: 36,
        bill_rate_cents: 9000,
      }),
      perDiem: perDiem(10000, 8000),
      taxHome: null,
    })
    expect(a.flags).toEqual([])
    expect(a.bill_rate_capture).not.toBeNull()
  })
})
