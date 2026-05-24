import crypto from 'node:crypto'

export type BearerAuthResult = 'authorized' | 'missing_secret' | 'unauthorized'

export function verifyBearerToken(authHeader: string | null, expectedSecret: string | undefined): BearerAuthResult {
  if (!expectedSecret) return 'missing_secret'
  const expectedHeader = `Bearer ${expectedSecret}`
  if (!authHeader) return 'unauthorized'

  const provided = Buffer.from(authHeader, 'utf8')
  const expected = Buffer.from(expectedHeader, 'utf8')
  if (provided.length !== expected.length) return 'unauthorized'

  return crypto.timingSafeEqual(provided, expected) ? 'authorized' : 'unauthorized'
}
