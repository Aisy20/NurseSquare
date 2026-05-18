import { formatCents } from '@/lib/ledger/currency'
import type { PayPackage } from '@/lib/ledger/types'

interface Quote {
  id: string
  source_type: 'email' | 'sms' | 'voice' | 'manual'
  received_at: string
  confidence_score: number | null
  requires_review: boolean
  raw_content: string
  extracted_payload: PayPackage | null
}

const SOURCE_LABEL: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
  voice: 'Voice transcript',
  manual: 'Manually entered',
}

export default function QuoteCard({ quote }: { quote: Quote }) {
  const p = quote.extracted_payload
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold tracking-wider px-2 py-1 rounded" style={{ background: 'var(--plum-50)', color: 'var(--plum)' }}>
            {SOURCE_LABEL[quote.source_type]}
          </span>
          <span className="text-xs" style={{ color: 'var(--g600)' }}>{new Date(quote.received_at).toLocaleString()}</span>
        </div>
        {quote.requires_review && (
          <span className="text-[11px] font-bold tracking-wider px-2 py-1 rounded" style={{ background: 'var(--tang-50)', color: 'var(--tang-mid)' }}>
            Please verify
          </span>
        )}
      </div>

      {p && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Field label="Hourly" value={formatCents(p.taxable_hourly_rate_cents)} />
          <Field label="Housing" value={formatCents(p.weekly_housing_stipend_cents)} />
          <Field label="Meals" value={formatCents(p.weekly_meals_stipend_cents)} />
          <Field label="Travel" value={formatCents(p.weekly_travel_stipend_cents)} />
          <Field label="Sign-on" value={formatCents(p.sign_on_bonus_cents)} />
          <Field label="Completion" value={formatCents(p.completion_bonus_cents)} />
          <Field label="Guaranteed hrs" value={p.guaranteed_hours_per_week?.toString() ?? '--'} />
          <Field label="Confidence" value={p.extraction_confidence.toFixed(2)} />
        </div>
      )}

      <details className="text-xs" style={{ color: 'var(--g600)' }}>
        <summary className="cursor-pointer">Raw content</summary>
        <pre className="mt-2 whitespace-pre-wrap p-3 rounded-lg overflow-x-auto" style={{ background: 'var(--cream-mid)' }}>{quote.raw_content}</pre>
      </details>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--g400)' }}>{label.toUpperCase()}</div>
      <div className="text-sm font-mono" style={{ color: 'var(--ink)' }}>{value}</div>
    </div>
  )
}
