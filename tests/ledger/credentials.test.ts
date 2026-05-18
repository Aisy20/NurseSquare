import { describe, it, expect } from 'vitest'
import {
  canonicalizeType,
  freshnessFor,
  daysUntilExpiry,
  CANONICAL_CREDENTIAL_TYPES,
} from '../../src/lib/ledger/credentials/types'

describe('canonicalizeType', () => {
  it('passes through canonical types as-is', () => {
    expect(canonicalizeType('BLS')).toBe('BLS')
    expect(canonicalizeType('ACLS')).toBe('ACLS')
    expect(canonicalizeType('CCRN')).toBe('CCRN')
  })

  it('uppercases lowercase short forms', () => {
    expect(canonicalizeType('bls')).toBe('BLS')
    expect(canonicalizeType('acls')).toBe('ACLS')
  })

  it('maps common aliases', () => {
    expect(canonicalizeType('Basic Life Support')).toBe('BLS')
    expect(canonicalizeType('CPR')).toBe('BLS')
    expect(canonicalizeType('Advanced Cardiac Life Support')).toBe('ACLS')
    expect(canonicalizeType('PPD')).toBe('TB_TEST')
    expect(canonicalizeType('QuantiFERON')).toBe('TB_TEST')
    expect(canonicalizeType('COVID-19 Vaccination')).toBe('COVID_VAX')
    expect(canonicalizeType('Flu shot')).toBe('INFLUENZA_VAX')
  })

  it('handles hyphenated and spaced inputs', () => {
    expect(canonicalizeType('rn-license')).toBe('RN_LICENSE')
    expect(canonicalizeType('TB Test')).toBe('TB_TEST')
  })

  it('returns OTHER for unrecognized strings', () => {
    expect(canonicalizeType('Pyxis Training')).toBe('OTHER')
    expect(canonicalizeType('')).toBe('OTHER')
    expect(canonicalizeType(null)).toBe('OTHER')
    expect(canonicalizeType(undefined)).toBe('OTHER')
  })

  it('catalog includes all standard travel-nurse cert types', () => {
    for (const t of ['BLS', 'ACLS', 'PALS', 'NIHSS', 'NRP', 'TNCC', 'CCRN', 'RN_LICENSE', 'TB_TEST', 'COVID_VAX', 'OTHER']) {
      expect(CANONICAL_CREDENTIAL_TYPES).toContain(t)
    }
  })
})

describe('freshnessFor', () => {
  const NOW = new Date('2026-05-18T00:00:00Z')

  it('returns active when expiry is more than 60 days out', () => {
    expect(freshnessFor('2026-09-01', NOW)).toBe('active')
  })

  it('returns expiring_soon when expiry is within 60 days', () => {
    expect(freshnessFor('2026-06-01', NOW)).toBe('expiring_soon')
    expect(freshnessFor('2026-07-17', NOW)).toBe('expiring_soon')
  })

  it('returns expired for past dates', () => {
    expect(freshnessFor('2026-01-01', NOW)).toBe('expired')
  })

  it('returns unknown when expiry is null or unparseable', () => {
    expect(freshnessFor(null, NOW)).toBe('unknown')
    expect(freshnessFor('not-a-date', NOW)).toBe('unknown')
  })
})

describe('daysUntilExpiry', () => {
  const NOW = new Date('2026-05-18T00:00:00Z')
  it('computes days correctly', () => {
    expect(daysUntilExpiry('2026-05-28', NOW)).toBe(10)
    expect(daysUntilExpiry('2026-05-08', NOW)).toBe(-10)
  })
  it('returns null when no date', () => {
    expect(daysUntilExpiry(null, NOW)).toBeNull()
  })
})
