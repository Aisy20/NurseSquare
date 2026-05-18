import { describe, it, expect, vi } from 'vitest'
import { computeDiff, type TextComparator } from '../../src/lib/ledger/diff'
import type { PayPackage } from '../../src/lib/ledger/types'

const BASE: PayPackage = {
  taxable_hourly_rate_cents: 4000,
  weekly_housing_stipend_cents: 150000,
  weekly_meals_stipend_cents: 38500,
  weekly_travel_stipend_cents: 25000,
  weekly_gross_estimate_cents: 365000,
  weekly_net_estimate_cents: null,
  guaranteed_hours_per_week: 36,
  shift_type: 'night',
  shift_length_hours: 12,
  start_date: '2026-08-04',
  end_date: '2026-11-02',
  contract_length_weeks: 13,
  location_city: 'Nashville',
  location_state: 'TN',
  facility_name: 'Vanderbilt UMC',
  specialty: 'Cardiac ICU',
  sign_on_bonus_cents: 200000,
  completion_bonus_cents: 250000,
  cancellation_terms: '14 days written notice required from either party.',
  overtime_rate_cents: 6000,
  holiday_pay: '1.5x for federal holidays worked.',
  required_credentials: ['BLS', 'ACLS', 'CCRN'],
  extraction_confidence: 0.9,
  raw_notes: null,
}

const noopComparator: TextComparator = async () => ({ material_change: false, reason: null })
const materialComparator: TextComparator = async () => ({ material_change: true, reason: 'shorter notice period' })

function pkg(overrides: Partial<PayPackage>): PayPackage {
  return { ...BASE, ...overrides }
}

describe('computeDiff', () => {
  it('1. identical quoted and signed: no flags', async () => {
    const diff = await computeDiff({ quoted: BASE, signed: BASE, compareText: noopComparator })
    expect(diff.any_worse).toBe(false)
    expect(diff.any_material_change).toBe(false)
    expect(diff.taxable_hourly_rate_cents.flag).toBe('same')
    expect(diff.weekly_housing_stipend_cents.flag).toBe('same')
  })

  it('2. housing cut by $300/wk: flagged worse', async () => {
    const signed = pkg({ weekly_housing_stipend_cents: 120000 })
    const diff = await computeDiff({ quoted: BASE, signed, compareText: noopComparator })
    expect(diff.weekly_housing_stipend_cents).toMatchObject({
      quoted: 150000,
      signed: 120000,
      delta: -30000,
      flag: 'worse',
    })
    expect(diff.any_worse).toBe(true)
  })

  it('3. housing tiny $10 cut: still same (below threshold)', async () => {
    const signed = pkg({ weekly_housing_stipend_cents: 149000 })
    const diff = await computeDiff({ quoted: BASE, signed, compareText: noopComparator })
    expect(diff.weekly_housing_stipend_cents.flag).toBe('same')
    expect(diff.any_worse).toBe(false)
  })

  it('4. exactly $25/wk cut: still same (must be greater than)', async () => {
    const signed = pkg({ weekly_housing_stipend_cents: 147500 })
    const diff = await computeDiff({ quoted: BASE, signed, compareText: noopComparator })
    expect(diff.weekly_housing_stipend_cents.flag).toBe('same')
  })

  it('5. raise of $5/hr taxable: flagged better', async () => {
    const signed = pkg({ taxable_hourly_rate_cents: 4500 })
    const diff = await computeDiff({ quoted: BASE, signed, compareText: noopComparator })
    expect(diff.taxable_hourly_rate_cents.flag).toBe('better')
    expect(diff.any_worse).toBe(false)
  })

  it('6. start date shifted 14 days: flagged shifted', async () => {
    const signed = pkg({ start_date: '2026-08-18' })
    const diff = await computeDiff({ quoted: BASE, signed, compareText: noopComparator })
    expect(diff.start_date).toMatchObject({ days_shifted: 14, flag: 'shifted' })
    expect(diff.any_material_change).toBe(true)
  })

  it('7. start date shifted 3 days: not flagged', async () => {
    const signed = pkg({ start_date: '2026-08-07' })
    const diff = await computeDiff({ quoted: BASE, signed, compareText: noopComparator })
    expect(diff.start_date.flag).toBe('same')
  })

  it('8. cancellation terms semantically worse: material via comparator', async () => {
    const signed = pkg({ cancellation_terms: '48 hours written notice with bonus forfeiture.' })
    const diff = await computeDiff({ quoted: BASE, signed, compareText: materialComparator })
    expect(diff.cancellation_terms.material_change).toBe(true)
    expect(diff.cancellation_terms.reason).toBe('shorter notice period')
    expect(diff.any_material_change).toBe(true)
  })

  it('9. bonus removed: flagged removed', async () => {
    const signed = pkg({ sign_on_bonus_cents: null })
    const diff = await computeDiff({ quoted: BASE, signed, compareText: noopComparator })
    expect(diff.sign_on_bonus_cents.flag).toBe('removed')
  })

  it('10. shift type changed day→night: categorical changed', async () => {
    const quoted = pkg({ shift_type: 'day' })
    const signed = pkg({ shift_type: 'night' })
    const diff = await computeDiff({ quoted, signed, compareText: noopComparator })
    expect(diff.shift_type.changed).toBe(true)
    expect(diff.any_material_change).toBe(true)
  })

  it('passes fieldName into comparator', async () => {
    const spy = vi.fn<TextComparator>(async () => ({ material_change: false, reason: null }))
    await computeDiff({ quoted: BASE, signed: BASE, compareText: spy })
    const names = spy.mock.calls.map((c) => c[2])
    expect(names).toContain('cancellation_terms')
    expect(names).toContain('holiday_pay')
  })
})
