export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import DiffView from '@/components/ledger/DiffView'
import ShareModal from '@/components/ledger/ShareModal'
import type { FieldDeltas } from '@/lib/ledger/diff'

export default async function NurseLedgerDiffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: contract } = await supabase
    .from('ledger_contracts')
    .select('id, specialty, location_city, location_state, ledger_agencies(name), ledger_recruiters(name)')
    .eq('id', id)
    .single()
  if (!contract) notFound()

  const { data: diff } = await supabase
    .from('ledger_diffs')
    .select('field_deltas, computed_at')
    .eq('contract_id', id)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!diff) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
        <Navbar userRole="nurse" />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl mb-4" style={{ color: 'var(--ink)' }}>No diff yet</h1>
          <p className="text-sm" style={{ color: 'var(--g600)' }}>Add a quote and upload a signed contract to generate a diff.</p>
          <Link href={`/nurse/ledger/${id}`} className="mt-6 inline-block underline" style={{ color: 'var(--plum)' }}>Back to contract</Link>
        </main>
      </div>
    )
  }

  const deltas = diff.field_deltas as FieldDeltas

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" userName={user.email?.split('@')[0]} />
      <main className="max-w-[1100px] mx-auto w-full px-4 sm:px-8 py-10">
        <Link href={`/nurse/ledger/${id}`} className="text-sm no-underline" style={{ color: 'var(--g600)' }}>← Back to contract</Link>
        <div className="flex items-center justify-between mt-3 mb-8">
          <div>
            <h1 className="font-display text-4xl" style={{ color: 'var(--ink)' }}>Quote vs Signed</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--g600)' }}>
              {contract.specialty ?? 'Contract'} {contract.location_city ? `· ${contract.location_city}, ${contract.location_state}` : ''}
            </p>
          </div>
          <ShareModal contractId={id} />
        </div>
        <DiffView deltas={deltas} />
      </main>
    </div>
  )
}
