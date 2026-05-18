import Link from 'next/link'
import { canonicalizeType, freshnessFor, daysUntilExpiry, type CredentialRow } from '@/lib/ledger/credentials/types'

interface Props {
  required: string[]
  userCredentials: CredentialRow[]
}

interface MatchRow {
  required: string
  canonical: string
  credential: CredentialRow | null
  status: 'missing' | 'expired' | 'expiring_soon' | 'active' | 'no_expiry'
  detail: string
}

function classify(required: string, credentials: CredentialRow[]): MatchRow {
  const canonical = canonicalizeType(required)
  const match = credentials.find((c) => canonicalizeType(c.type) === canonical)
  if (!match) return { required, canonical, credential: null, status: 'missing', detail: 'Not in your wallet' }
  const fresh = freshnessFor(match.expires_at)
  const days = daysUntilExpiry(match.expires_at)
  if (fresh === 'expired') return { required, canonical, credential: match, status: 'expired', detail: `Expired ${Math.abs(days ?? 0)} days ago` }
  if (fresh === 'expiring_soon') return { required, canonical, credential: match, status: 'expiring_soon', detail: `${days} days to renewal` }
  if (fresh === 'active') return { required, canonical, credential: match, status: 'active', detail: `Valid through ${match.expires_at}` }
  return { required, canonical, credential: match, status: 'no_expiry', detail: 'No expiration on file' }
}

const STYLES: Record<MatchRow['status'], { bg: string; color: string; label: string }> = {
  missing: { bg: 'var(--tang-50)', color: 'var(--tang-mid)', label: 'MISSING' },
  expired: { bg: 'var(--tang-50)', color: 'var(--tang-mid)', label: 'EXPIRED' },
  expiring_soon: { bg: 'var(--gold-50)', color: 'var(--ink)', label: 'EXPIRING SOON' },
  active: { bg: 'var(--sage-50)', color: 'var(--sage)', label: 'OK' },
  no_expiry: { bg: 'var(--g100)', color: 'var(--g600)', label: 'NO EXPIRY' },
}

export default function RequiredCredentialsPanel({ required, userCredentials }: Props) {
  if (required.length === 0) return null
  const rows = required.map((r) => classify(r, userCredentials))
  const blocking = rows.filter((r) => r.status === 'missing' || r.status === 'expired').length

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Required credentials</h3>
        {blocking > 0 && (
          <span className="text-[11px] font-bold tracking-wider px-2 py-1 rounded" style={{ background: 'var(--tang-50)', color: 'var(--tang-mid)' }}>
            {blocking} BLOCKING
          </span>
        )}
      </div>
      <div className="space-y-2">
        {rows.map((row) => {
          const s = STYLES[row.status]
          return (
            <div key={row.required} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0" style={{ borderColor: 'var(--g100)' }}>
              <div>
                <span className="font-mono text-xs" style={{ color: 'var(--ink)' }}>{row.required}</span>
                <span className="ml-2 text-xs" style={{ color: 'var(--g600)' }}>{row.detail}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                {row.credential ? (
                  <Link href={`/nurse/credentials/${row.credential.id}`} className="text-xs underline" style={{ color: 'var(--plum)' }}>View</Link>
                ) : (
                  <Link href={`/nurse/credentials/new`} className="text-xs underline" style={{ color: 'var(--plum)' }}>Add</Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
