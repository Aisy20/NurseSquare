export const dynamic = 'force-dynamic'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import ContractTimeline from '@/components/ledger/ContractTimeline'
import AddQuoteForm from '@/components/ledger/AddQuoteForm'
import UploadSignedForm from '@/components/ledger/UploadSignedForm'
import RequiredCredentialsPanel from '@/components/credentials/RequiredCredentialsPanel'
import type { CredentialRow } from '@/lib/ledger/credentials/types'
import Button from '@/components/ui/Button'
import { ArrowLeft, BarChart3 } from 'lucide-react'

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

  const [{ data: quotes }, { data: signed }, { data: diff }, { data: credentials }] = await Promise.all([
    supabase.from('ledger_quotes').select('*').eq('contract_id', id).order('received_at', { ascending: false }),
    supabase.from('ledger_signed_contracts').select('*').eq('contract_id', id).maybeSingle(),
    supabase.from('ledger_diffs').select('id').eq('contract_id', id).order('computed_at', { ascending: false }).maybeSingle(),
    supabase.from('credentials').select('*').eq('user_id', user.id),
  ])

  const agency = (contract.ledger_agencies as { name?: string } | null)?.name
  const recruiter = (contract.ledger_recruiters as { name?: string } | null)?.name

  const required = new Set<string>()
  for (const q of quotes ?? []) {
    const payload = q.extracted_payload as { required_credentials?: string[] } | null
    if (Array.isArray(payload?.required_credentials)) {
      for (const c of payload.required_credentials) required.add(c)
    }
  }
  const signedPayload = (signed?.extracted_payload as { required_credentials?: string[] } | null) ?? null
  if (Array.isArray(signedPayload?.required_credentials)) {
    for (const c of signedPayload.required_credentials) required.add(c)
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" userName={user.email?.split('@')[0]} />
      <main className="max-w-[1100px] mx-auto w-full px-4 sm:px-8 py-10 lg:py-14">
        <Link href="/nurse/ledger" className="inline-flex items-center gap-1.5 text-sm no-underline group" style={{ color: 'var(--g600)' }}>
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Back to ledger
        </Link>

        <div className="flex items-start justify-between gap-6 flex-wrap mt-4 mb-8">
          <div className="max-w-2xl">
            <div className="text-[10px] font-bold tracking-[1.2px] uppercase mb-2" style={{ color: 'var(--tang)' }}>
              {contract.status}
            </div>
            <h1 className="font-display text-4xl lg:text-5xl leading-[1.05] tracking-[-0.5px]" style={{ color: 'var(--ink)' }}>
              {contract.specialty ?? 'Untitled contract'}
              {contract.location_city && (
                <span style={{ color: 'var(--g400)' }}> · {contract.location_city}, {contract.location_state}</span>
              )}
            </h1>
            <div className="text-sm mt-3 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: 'var(--g600)' }}>
              {agency && <span><span style={{ color: 'var(--g400)' }}>Agency:</span> {agency}</span>}
              {recruiter && <span><span style={{ color: 'var(--g400)' }}>Recruiter:</span> {recruiter}</span>}
              {contract.start_date && (
                <span>
                  <span style={{ color: 'var(--g400)' }}>Term:</span> {contract.start_date} → {contract.end_date ?? 'TBD'}
                </span>
              )}
            </div>
          </div>
          {diff && (
            <Link href={`/nurse/ledger/${id}/diff`}>
              <Button variant="tang" size="md">
                <BarChart3 className="w-4 h-4 mr-1.5" />
                View diff
              </Button>
            </Link>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-6">
            {required.size > 0 && (
              <RequiredCredentialsPanel required={Array.from(required)} userCredentials={(credentials ?? []) as CredentialRow[]} />
            )}
            <ContractTimeline quotes={quotes ?? []} signed={signed ?? null} />
          </div>
          <div className="space-y-4">
            <AddQuoteForm contractId={id} />
            {!signed && <UploadSignedForm contractId={id} />}
          </div>
        </div>
      </main>
    </div>
  )
}
