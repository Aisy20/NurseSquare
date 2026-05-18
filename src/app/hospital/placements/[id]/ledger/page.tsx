export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import DiffView from '@/components/ledger/DiffView'
import type { FieldDeltas } from '@/lib/ledger/diff'

export default async function HospitalPlacementLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: placementId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // RLS gates the rows; if the hospital doesn't own this placement, the joined query returns empty.
  const { data: contract } = await supabase
    .from('ledger_contracts')
    .select('id, specialty, location_city, location_state')
    .eq('placement_id', placementId)
    .maybeSingle()

  if (!contract) notFound()

  const { data: diff } = await supabase
    .from('ledger_diffs')
    .select('field_deltas, computed_at')
    .eq('contract_id', contract.id)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="hospital" userName={user.email?.split('@')[0]} />
      <main className="max-w-[1100px] mx-auto w-full px-4 sm:px-8 py-10">
        <Link href={`/hospital/applicants`} className="text-sm no-underline" style={{ color: 'var(--g600)' }}>← Back</Link>
        <div className="rounded-2xl border p-4 mt-3 mb-6" style={{ borderColor: 'var(--gold)', background: 'var(--gold-50)' }}>
          <p className="text-sm" style={{ color: 'var(--ink)' }}>
            <strong>Read-only view.</strong> The traveler shared this ledger to flag pay-package differences between their original quote and the signed contract.
          </p>
        </div>
        <h1 className="font-display text-3xl mb-1" style={{ color: 'var(--ink)' }}>
          {contract.specialty ?? 'Contract'} {contract.location_city ? `· ${contract.location_city}, ${contract.location_state}` : ''}
        </h1>
        {diff ? <DiffView deltas={diff.field_deltas as FieldDeltas} /> : (
          <p className="text-sm italic mt-6" style={{ color: 'var(--g600)' }}>No diff computed yet.</p>
        )}
      </main>
    </div>
  )
}
