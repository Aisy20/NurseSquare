export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import DiffView from '@/components/ledger/DiffView'
import { anonymizeDeltas } from '@/lib/ledger/anonymize'
import type { FieldDeltas } from '@/lib/ledger/diff'

export default async function PublicSharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data: link } = await supabase
    .rpc('increment_ledger_share_view', { p_slug: slug })
    .maybeSingle() as { data: { id: string; diff_id: string; expires_at: string | null; view_count: number } | null }

  if (!link) notFound()

  const { data: diff } = await supabase
    .from('ledger_diffs')
    .select('field_deltas, contract_id')
    .eq('id', link.diff_id)
    .single()

  if (!diff) notFound()

  const { data: contract } = await supabase
    .from('ledger_contracts')
    .select('specialty, location_state, ledger_agencies(name), ledger_recruiters(name), ledger_signed_contracts:ledger_signed_contracts(extracted_payload)')
    .eq('id', diff.contract_id)
    .single()

  const agencyName = (contract?.ledger_agencies as { name?: string } | null)?.name
  const recruiterName = (contract?.ledger_recruiters as { name?: string } | null)?.name
  const facilityName = ((contract?.ledger_signed_contracts as { extracted_payload?: { facility_name?: string } }[] | null)?.[0]?.extracted_payload?.facility_name) ?? null

  const redacted = anonymizeDeltas(diff.field_deltas as FieldDeltas, { agencyName, recruiterName, facilityName })

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <header className="border-b" style={{ borderColor: 'var(--g100)', background: 'white' }}>
        <div className="max-w-[1100px] mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold tracking-wider" style={{ color: 'var(--tang)' }}>NURSESQUARE · PAY LEDGER</div>
            <h1 className="font-display text-2xl mt-1" style={{ color: 'var(--ink)' }}>Quoted vs Signed</h1>
          </div>
          <span className="text-xs" style={{ color: 'var(--g600)' }}>{contract?.specialty ?? '—'} · {contract?.location_state ?? '—'}</span>
        </div>
      </header>
      <main className="max-w-[1100px] mx-auto w-full px-4 py-10">
        <div className="rounded-2xl border p-4 mb-6 text-xs" style={{ borderColor: 'var(--g100)', background: 'var(--cream-mid)', color: 'var(--g600)' }}>
          Agency, recruiter, and facility names are hashed. This is an anonymized share. Visit nursesquare.com to track your own contracts.
        </div>
        <DiffView deltas={redacted} />
      </main>
    </div>
  )
}
