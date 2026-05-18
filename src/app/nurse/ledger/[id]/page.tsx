export const dynamic = 'force-dynamic'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import ContractTimeline from '@/components/ledger/ContractTimeline'
import AddQuoteForm from '@/components/ledger/AddQuoteForm'
import UploadSignedForm from '@/components/ledger/UploadSignedForm'

export default async function NurseLedgerContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: contract } = await supabase
    .from('ledger_contracts')
    .select('*, ledger_agencies(name), ledger_recruiters(name, email)')
    .eq('id', id)
    .single()

  if (!contract) notFound()

  const [{ data: quotes }, { data: signed }, { data: diff }] = await Promise.all([
    supabase.from('ledger_quotes').select('*').eq('contract_id', id).order('received_at', { ascending: false }),
    supabase.from('ledger_signed_contracts').select('*').eq('contract_id', id).maybeSingle(),
    supabase.from('ledger_diffs').select('id').eq('contract_id', id).order('computed_at', { ascending: false }).maybeSingle(),
  ])

  const agency = (contract.ledger_agencies as { name?: string } | null)?.name
  const recruiter = (contract.ledger_recruiters as { name?: string } | null)?.name

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" userName={user.email?.split('@')[0]} />
      <main className="max-w-[1100px] mx-auto w-full px-4 sm:px-8 py-10">
        <Link href="/nurse/ledger" className="text-sm no-underline" style={{ color: 'var(--g600)' }}>← Back to ledger</Link>

        <div className="flex items-start justify-between mt-3 mb-6">
          <div>
            <h1 className="font-display text-3xl" style={{ color: 'var(--ink)' }}>
              {contract.specialty ?? 'Contract'} {contract.location_city ? `· ${contract.location_city}, ${contract.location_state}` : ''}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--g600)' }}>
              {agency && <>Agency: {agency} · </>}
              {recruiter && <>Recruiter: {recruiter} · </>}
              {contract.start_date ? `${contract.start_date} → ${contract.end_date ?? 'TBD'}` : 'Dates TBD'}
            </p>
          </div>
          {diff && (
            <Link href={`/nurse/ledger/${id}/diff`} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white no-underline" style={{ background: 'var(--tang)' }}>
              View diff
            </Link>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <ContractTimeline quotes={quotes ?? []} signed={signed ?? null} />
          <div className="space-y-4">
            <AddQuoteForm contractId={id} />
            {!signed && <UploadSignedForm contractId={id} />}
          </div>
        </div>
      </main>
    </div>
  )
}
