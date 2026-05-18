import Link from 'next/link'
import { daysUntilExpiry, freshnessFor, type CredentialRow } from '@/lib/ledger/credentials/types'

const FRESHNESS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: 'var(--sage-50)', color: 'var(--sage)', label: 'ACTIVE' },
  expiring_soon: { bg: 'var(--gold-50)', color: 'var(--ink)', label: 'EXPIRING SOON' },
  expired: { bg: 'var(--tang-50)', color: 'var(--tang-mid)', label: 'EXPIRED' },
  unknown: { bg: 'var(--g100)', color: 'var(--g600)', label: 'NO EXPIRY' },
}

export default function CredentialCard({ credential }: { credential: CredentialRow }) {
  const fresh = freshnessFor(credential.expires_at)
  const days = daysUntilExpiry(credential.expires_at)
  const s = FRESHNESS_STYLE[fresh]
  const subtitle =
    fresh === 'expired'
      ? `Expired ${Math.abs(days ?? 0)} days ago`
      : fresh === 'expiring_soon'
        ? `${days} days to renewal`
        : fresh === 'active'
          ? `Expires ${credential.expires_at}`
          : 'No expiration on file'

  return (
    <Link
      href={`/nurse/credentials/${credential.id}`}
      className="block rounded-2xl border p-5 hover:shadow-md transition no-underline"
      style={{ borderColor: 'var(--g100)', background: 'white', color: 'var(--ink)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold">{credential.display_name ?? credential.type}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--g600)' }}>
            <span className="font-mono">{credential.type}</span>
            {credential.issuer && <> · {credential.issuer}</>}
            {credential.card_number && <> · #{credential.card_number}</>}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--g600)' }}>{subtitle}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[11px] font-bold tracking-wider px-2 py-1 rounded" style={{ background: s.bg, color: s.color }}>
            {s.label}
          </span>
          {credential.requires_review && (
            <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded" style={{ background: 'var(--plum-50)', color: 'var(--plum)' }}>
              VERIFY
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
