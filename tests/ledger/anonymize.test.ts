import { describe, it, expect } from 'vitest'
import { anonymizeDeltas, hashLabel, redactString } from '../../src/lib/ledger/anonymize'
import type { FieldDeltas } from '../../src/lib/ledger/diff'

function emptyDeltas(): FieldDeltas {
  const num = { quoted: null, signed: null, delta: null, pct: null, flag: 'unknown' as const }
  const cat = { quoted: null, signed: null, changed: false }
  const txt = { quoted: null, signed: null, material_change: false, reason: null }
  const date = { quoted: null, signed: null, days_shifted: null, flag: 'unknown' as const }
  return {
    taxable_hourly_rate_cents: num, weekly_housing_stipend_cents: num, weekly_meals_stipend_cents: num,
    weekly_travel_stipend_cents: num, weekly_gross_estimate_cents: num, weekly_net_estimate_cents: num,
    guaranteed_hours_per_week: num, sign_on_bonus_cents: num, completion_bonus_cents: num,
    overtime_rate_cents: num, contract_length_weeks: num, shift_length_hours: num,
    start_date: date, end_date: date,
    shift_type: cat, location_city: cat, location_state: cat, facility_name: cat, specialty: cat,
    cancellation_terms: txt, holiday_pay: txt,
    any_worse: false, any_material_change: false,
  }
}

describe('anonymize', () => {
  it('hashLabel is deterministic and namespaced', () => {
    expect(hashLabel('Vanderbilt UMC', 'FAC')).toMatch(/^FAC-[A-F0-9]{6}$/)
    expect(hashLabel('Vanderbilt UMC', 'FAC')).toBe(hashLabel('vanderbilt umc', 'FAC'))
  })

  it('redactString replaces all instances case-insensitive', () => {
    const r = redactString('Working with Vanderbilt and vanderbilt staff.', { facilityName: 'Vanderbilt' })
    expect(r).not.toMatch(/Vanderbilt/i)
    expect(r).toMatch(/FAC-[A-F0-9]{6}/)
  })

  it('anonymizeDeltas hashes facility_name in CategoricalDelta', () => {
    const d = emptyDeltas()
    d.facility_name = { quoted: 'Vanderbilt UMC', signed: 'Vanderbilt UMC', changed: false }
    const r = anonymizeDeltas(d, { facilityName: 'Vanderbilt UMC' })
    expect(r.facility_name.quoted).toMatch(/^FAC-/)
    expect(r.facility_name.signed).toMatch(/^FAC-/)
  })

  it('anonymizeDeltas scrubs names from cancellation_terms text', () => {
    const d = emptyDeltas()
    d.cancellation_terms = {
      quoted: 'Per Acme Staffing, 14-day notice required.',
      signed: 'Per Acme Staffing, 48-hour notice with forfeiture.',
      material_change: true,
      reason: 'Notice cut from 14 days to 48h by Acme Staffing.',
    }
    const r = anonymizeDeltas(d, { agencyName: 'Acme Staffing' })
    expect(r.cancellation_terms.quoted).not.toMatch(/Acme/)
    expect(r.cancellation_terms.reason).not.toMatch(/Acme/)
  })
})
