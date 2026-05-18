import QuoteCard from './QuoteCard'
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

interface SignedContract {
  id: string
  pdf_url: string
  parsed_at: string | null
  confidence_score: number | null
}

export default function ContractTimeline({ quotes, signed }: { quotes: Quote[]; signed: SignedContract | null }) {
  const items = [...quotes].sort((a, b) => +new Date(b.received_at) - +new Date(a.received_at))
  return (
    <div className="space-y-4">
      {signed && (
        <div className="rounded-2xl border-2 p-5" style={{ borderColor: 'var(--plum)', background: 'white' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider px-2 py-1 rounded" style={{ background: 'var(--plum)', color: 'white' }}>SIGNED CONTRACT</span>
            <span className="text-xs" style={{ color: 'var(--g600)' }}>{signed.parsed_at ? new Date(signed.parsed_at).toLocaleString() : ''}</span>
          </div>
          <a className="text-sm underline" style={{ color: 'var(--plum)' }} href={signed.pdf_url} target="_blank" rel="noreferrer">View PDF</a>
        </div>
      )}
      {items.length === 0 && !signed && (
        <p className="text-sm italic" style={{ color: 'var(--g600)' }}>No quotes yet. Forward a recruiter email or paste a quote to begin.</p>
      )}
      {items.map((q) => <QuoteCard key={q.id} quote={q} />)}
    </div>
  )
}
