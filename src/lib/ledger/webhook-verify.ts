import crypto from 'node:crypto'

export function verifyPostmarkBasicAuth(authHeader: string | null, expectedSecret: string): boolean {
  if (!authHeader || !authHeader.startsWith('Basic ')) return false
  const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8')
  const idx = decoded.indexOf(':')
  if (idx < 0) return false
  const provided = decoded.slice(idx + 1)
  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(expectedSecret, 'utf8')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export function verifyTwilioSignature(
  authToken: string,
  url: string,
  formParams: Record<string, string>,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false
  const sortedKeys = Object.keys(formParams).sort()
  let payload = url
  for (const k of sortedKeys) payload += k + formParams[k]
  const expected = crypto.createHmac('sha1', authToken).update(payload, 'utf8').digest('base64')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signatureHeader, 'utf8')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
