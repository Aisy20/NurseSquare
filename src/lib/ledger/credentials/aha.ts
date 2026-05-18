import { canonicalizeType, type CanonicalCredentialType } from './types'

export const AHA_TYPES: CanonicalCredentialType[] = ['BLS', 'ACLS', 'PALS']

export function isAhaVerifiable(type: string): boolean {
  return AHA_TYPES.includes(canonicalizeType(type))
}

export interface AhaVerificationResult {
  verified: boolean
  status: 'verified' | 'rejected' | 'pending' | 'unknown'
  source: string
  detail: string | null
  raw?: unknown
}

export function ahaConfigured(): boolean {
  return Boolean(process.env.AHA_API_KEY && process.env.AHA_API_BASE_URL)
}

/**
 * In dev (no AHA_API_KEY), returns a deterministic stub so the UI can
 * be exercised without paying for the integration. In production this
 * is where a real POST to api.heart.org/ecards/verify would live; the
 * AHA eCard API requires partnership credentials.
 */
export async function verifyWithAha(input: {
  type: string
  card_number: string | null
  issuer: string | null
}): Promise<AhaVerificationResult> {
  if (!ahaConfigured()) {
    if (!input.card_number) {
      return {
        verified: false,
        status: 'unknown',
        source: 'AHA (dev stub)',
        detail: 'Card number missing; cannot verify in dev stub mode.',
      }
    }
    return {
      verified: true,
      status: 'verified',
      source: 'AHA (dev stub)',
      detail: `Dev mode: verification skipped. Set AHA_API_KEY and AHA_API_BASE_URL to call the real eCard API. Card #${input.card_number}.`,
    }
  }

  // Real integration. See https://www.heart.org/en/cpr/ecard for the
  // partner onboarding path. Sketched as a TODO because the eCard API
  // requires an approved AHA partner account; do not call from here
  // without confirming response shape.
  throw new Error('AHA real-mode integration not yet implemented. Use dev stub by leaving AHA_API_KEY unset.')
}
