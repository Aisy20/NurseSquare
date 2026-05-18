import { z } from 'zod'

export const CredentialStatusSchema = z.enum(['pending', 'verified', 'expired', 'rejected'])
export type CredentialStatus = z.infer<typeof CredentialStatusSchema>

export const CredentialExtractionSchema = z.object({
  type: z.string().nullable(),
  display_name: z.string().nullable(),
  issuer: z.string().nullable(),
  card_number: z.string().nullable(),
  issued_at: z.iso.date().nullable(),
  expires_at: z.iso.date().nullable(),
  extraction_confidence: z.number().min(0).max(1),
  raw_notes: z.string().nullable(),
})
export type CredentialExtraction = z.infer<typeof CredentialExtractionSchema>

/**
 * Canonical credential types used by the ledger extractor's
 * required_credentials output. Storing user credentials under the same
 * canonical type lets the contract detail page cross-reference them
 * with a case-insensitive match.
 */
export const CANONICAL_CREDENTIAL_TYPES = [
  'RN_LICENSE',
  'BLS',
  'ACLS',
  'PALS',
  'NIHSS',
  'NRP',
  'TNCC',
  'ENPC',
  'CCRN',
  'CEN',
  'CFRN',
  'CPN',
  'CMSRN',
  'OCN',
  'RNC_OB',
  'RNC_NIC',
  'TB_TEST',
  'MMR',
  'VARICELLA',
  'TDAP',
  'HEP_B',
  'INFLUENZA_VAX',
  'COVID_VAX',
  'N95_FIT_TEST',
  'DRUG_SCREEN',
  'OTHER',
] as const

export type CanonicalCredentialType = (typeof CANONICAL_CREDENTIAL_TYPES)[number]

const TYPE_ALIASES: Record<string, CanonicalCredentialType> = {
  'rn': 'RN_LICENSE',
  'rn license': 'RN_LICENSE',
  'nursing license': 'RN_LICENSE',
  'basic life support': 'BLS',
  'cpr': 'BLS',
  'advanced cardiac life support': 'ACLS',
  'pediatric advanced life support': 'PALS',
  'nih stroke scale': 'NIHSS',
  'neonatal resuscitation': 'NRP',
  'trauma nursing core course': 'TNCC',
  'emergency nursing pediatric course': 'ENPC',
  'critical care registered nurse': 'CCRN',
  'certified emergency nurse': 'CEN',
  'ppd': 'TB_TEST',
  'quantiferon': 'TB_TEST',
  'tuberculosis': 'TB_TEST',
  'tb skin test': 'TB_TEST',
  'measles': 'MMR',
  'mumps': 'MMR',
  'rubella': 'MMR',
  'chickenpox': 'VARICELLA',
  'tetanus': 'TDAP',
  'pertussis': 'TDAP',
  'hepatitis b': 'HEP_B',
  'flu': 'INFLUENZA_VAX',
  'flu shot': 'INFLUENZA_VAX',
  'influenza': 'INFLUENZA_VAX',
  'covid': 'COVID_VAX',
  'covid-19': 'COVID_VAX',
  'sars-cov-2': 'COVID_VAX',
  'n-95': 'N95_FIT_TEST',
  'n95 fit': 'N95_FIT_TEST',
}

export function canonicalizeType(raw: string | null | undefined): CanonicalCredentialType {
  if (!raw) return 'OTHER'
  const trimmed = raw.trim()
  const upper = trimmed.toUpperCase().replace(/[-\s]/g, '_')
  if ((CANONICAL_CREDENTIAL_TYPES as readonly string[]).includes(upper)) {
    return upper as CanonicalCredentialType
  }
  const lower = trimmed.toLowerCase()
  if (TYPE_ALIASES[lower]) return TYPE_ALIASES[lower]
  for (const [alias, canonical] of Object.entries(TYPE_ALIASES)) {
    if (lower.includes(alias)) return canonical
  }
  return 'OTHER'
}

export interface CredentialRow {
  id: string
  user_id: string
  type: string
  display_name: string | null
  status: CredentialStatus
  issued_at: string | null
  expires_at: string | null
  issuer: string | null
  card_number: string | null
  document_url: string | null
  document_path: string | null
  extraction_confidence: number | null
  requires_review: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type CredentialFreshness = 'active' | 'expiring_soon' | 'expired' | 'unknown'

const EXPIRING_SOON_DAYS = 60

export function freshnessFor(expiresAt: string | null, now: Date = new Date()): CredentialFreshness {
  if (!expiresAt) return 'unknown'
  const exp = new Date(`${expiresAt}T00:00:00Z`)
  if (Number.isNaN(exp.getTime())) return 'unknown'
  const diffDays = Math.floor((exp.getTime() - now.getTime()) / 86_400_000)
  if (diffDays < 0) return 'expired'
  if (diffDays <= EXPIRING_SOON_DAYS) return 'expiring_soon'
  return 'active'
}

export function daysUntilExpiry(expiresAt: string | null, now: Date = new Date()): number | null {
  if (!expiresAt) return null
  const exp = new Date(`${expiresAt}T00:00:00Z`)
  if (Number.isNaN(exp.getTime())) return null
  return Math.floor((exp.getTime() - now.getTime()) / 86_400_000)
}
