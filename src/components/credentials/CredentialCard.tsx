import Link from 'next/link'
import { ArrowUpRight, ShieldCheck, Clock, AlertTriangle, ShieldAlert } from 'lucide-react'
import { daysUntilExpiry, freshnessFor, type CredentialRow, type CredentialFreshness } from '@/lib/ledger/credentials/types'

const FRESHNESS_STYLE: Record<CredentialFreshness, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  active: { bg: 'var(--sage-50)', color: 'var(--sage)', label: 'ACTIVE', icon: <ShieldCheck className="w-4 h-4" /> },
  expiring_soon: { bg: 'var(--gold-50)', color: 'var(--ink)', label: 'EXPIRING SOON', icon: <Clock className="w-4 h-4" /> },
  expired: { bg: 'var(--tang-50)', color: 'var(--tang-mid)', label: 'EXPIRED', icon: <ShieldAlert className="w-4 h-4" /> },
  unknown: { bg: 'var(--g100)', color: 'var(--g600)', label: 'NO EXPIRY', icon: <AlertTriangle className="w-4 h-4" /> },
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
          ? `Valid through ${credential.expires_at}`
          : 'No expiration on file'

  return (
    <Link
      href={`/nurse/credentials/${credential.id}`}
      className="group flex items-center justify-between rounded-2xl border p-5 hover:shadow-md transition-all no-underline"
      style={{ borderColor: 'var(--g100)', background: 'white', color: 'var(--ink)' }}
    >
      <div className="flex items-start gap-4 min-w-0">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: s.bg, color: s.color }}
        >
          {s.icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold truncate" style={{ fontFamily: 'var(--font-sora)' }}>
            {credential.display_name ?? credential.type}
          </div>
          <div className="text-xs mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5" style={{ color: 'var(--g600)' }}>
            <span className="font-mono">{credential.type}</span>
            {credential.issuer && <span>· {credential.issuer}</span>}
            {credential.card_number && <span>· #{credential.card_number}</span>}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--g600)' }}>{subtitle}</div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-3">
        <span className="text-[10px] font-bold tracking-[1px] uppercase px-2.5 py-1 rounded-md" style={{ background: s.bg, color: s.color }}>
          {s.label}
        </span>
        {credential.requires_review && (
          <span className="text-[9px] font-bold tracking-[1px] uppercase px-2 py-0.5 rounded-md" style={{ background: 'var(--plum-50)', color: 'var(--plum)' }}>
            verify
          </span>
        )}
        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--plum)' }} />
      </div>
    </Link>
  )
}
