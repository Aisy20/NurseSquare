import { describe, it, expect } from 'vitest'
import { gsaFiscalYear, resolvePerDiem, type PerDiemRow } from '../../src/lib/ledger/gsa'

describe('gsaFiscalYear', () => {
  it('keeps Jan–Sep in the same calendar year', () => {
    expect(gsaFiscalYear(new Date('2026-01-15T00:00:00Z'))).toBe(2026)
    expect(gsaFiscalYear(new Date('2026-09-30T00:00:00Z'))).toBe(2026)
  })

  it('rolls Oct–Dec into the next fiscal year', () => {
    expect(gsaFiscalYear(new Date('2026-10-01T00:00:00Z'))).toBe(2027)
    expect(gsaFiscalYear(new Date('2026-12-31T00:00:00Z'))).toBe(2027)
  })
})

const ROWS: PerDiemRow[] = [
  { fiscal_year: 2026, state: '*', locality: '*', lodging_cents: 11000, mie_cents: 6800 },
  { fiscal_year: 2026, state: 'TX', locality: '*', lodging_cents: 12000, mie_cents: 7400 },
  { fiscal_year: 2026, state: 'TX', locality: 'Austin', lodging_cents: 13700, mie_cents: 8000 },
  { fiscal_year: 2027, state: '*', locality: '*', lodging_cents: 11500, mie_cents: 6900 },
]

describe('resolvePerDiem', () => {
  it('matches an exact city (case-insensitive)', () => {
    const r = resolvePerDiem(ROWS, { state: 'tx', city: 'austin', fiscalYear: 2026 })
    expect(r).toMatchObject({ lodging_cents: 13700, mie_cents: 8000, resolved: 'Austin' })
  })

  it('falls back to the state default when the city is unknown', () => {
    const r = resolvePerDiem(ROWS, { state: 'TX', city: 'Lubbock', fiscalYear: 2026 })
    expect(r).toMatchObject({ lodging_cents: 12000, resolved: 'state-default' })
  })

  it('falls back to the CONUS standard when the state is unknown', () => {
    const r = resolvePerDiem(ROWS, { state: 'WY', city: 'Casper', fiscalYear: 2026 })
    expect(r).toMatchObject({ lodging_cents: 11000, resolved: 'conus-standard' })
  })

  it('falls back to CONUS when state/city are null', () => {
    const r = resolvePerDiem(ROWS, { state: null, city: null, fiscalYear: 2026 })
    expect(r?.resolved).toBe('conus-standard')
  })

  it('scopes the lookup to the requested fiscal year', () => {
    const r = resolvePerDiem(ROWS, { state: 'WY', city: null, fiscalYear: 2027 })
    expect(r).toMatchObject({ lodging_cents: 11500, resolved: 'conus-standard' })
  })

  it('returns null when no row exists for the year (not even CONUS)', () => {
    expect(resolvePerDiem(ROWS, { state: 'TX', city: 'Austin', fiscalYear: 2030 })).toBeNull()
  })
})
