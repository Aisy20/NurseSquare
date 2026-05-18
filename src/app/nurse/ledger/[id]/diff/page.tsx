export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import DiffView from '@/components/ledger/DiffView'
import ShareModal from '@/components/ledger/ShareModal'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import type { FieldDeltas } from '@/lib/ledger/diff'
import { ArrowLeft, GitCompare } from 'lucide-react'

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
        <Navbar userRole="nurse" userName={user.email?.split('@')[0]} />
        <main className="max-w-2xl mx-auto px-4 py-20">
          <EmptyState
            icon={<GitCompare className="w-6 h-6" />}
            title="No diff yet"
            description="Add a quote and upload the signed contract on the contract page. The diff is generated automatically once both are present."
            action={<Link href={`/nurse/ledger/${id}`}><Button variant="primary" size="md">Back to contract</Button></Link>}
          />
        </main>
      </div>
    )
  }

  const deltas = diff.field_deltas as FieldDeltas
  const computedAt = new Date(diff.computed_at)

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" userName={user.email?.split('@')[0]} />
      <main className="max-w-[1100px] mx-auto w-full px-4 sm:px-8 py-10 lg:py-14">
        <Link href={`/nurse/ledger/${id}`} className="inline-flex items-center gap-1.5 text-sm no-underline group" style={{ color: 'var(--g600)' }}>
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Back to contract
        </Link>

        <div className="flex items-start justify-between gap-6 flex-wrap mt-4 mb-10">
          <div>
            <div className="text-[10px] font-bold tracking-[1.2px] uppercase mb-2" style={{ color: 'var(--tang)' }}>Quote vs signed</div>
            <h1 className="font-display text-4xl lg:text-5xl leading-[1.05] tracking-[-0.5px]" style={{ color: 'var(--ink)' }}>
              {contract.specialty ?? 'Contract'}
              {contract.location_city && (
                <span style={{ color: 'var(--g400)' }}> · {contract.location_city}, {contract.location_state}</span>
              )}
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--g600)' }}>
              Computed {computedAt.toLocaleDateString('en-US', { dateStyle: 'medium' })} at {computedAt.toLocaleTimeString('en-US', { timeStyle: 'short' })}
            </p>
          </div>
          <ShareModal contractId={id} />
        </div>

        <DiffView deltas={deltas} />
      </main>
    </div>
  )
}
