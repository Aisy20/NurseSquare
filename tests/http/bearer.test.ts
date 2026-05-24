import { describe, expect, it } from 'vitest'
import { verifyBearerToken } from '@/lib/http/bearer'

describe('verifyBearerToken', () => {
  it('authorizes an exact bearer token match', () => {
    expect(verifyBearerToken('Bearer secret-value', 'secret-value')).toBe('authorized')
  })

  it('rejects missing or malformed credentials', () => {
    expect(verifyBearerToken(null, 'secret-value')).toBe('unauthorized')
    expect(verifyBearerToken('Basic secret-value', 'secret-value')).toBe('unauthorized')
    expect(verifyBearerToken('Bearer wrong-value', 'secret-value')).toBe('unauthorized')
  })

  it('distinguishes missing server configuration', () => {
    expect(verifyBearerToken('Bearer secret-value', undefined)).toBe('missing_secret')
    expect(verifyBearerToken('Bearer secret-value', '')).toBe('missing_secret')
  })
})
