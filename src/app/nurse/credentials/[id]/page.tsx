export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import { freshnessFor, daysUntilExpiry, type CredentialRow, type CredentialFreshness } from '@/lib/ledger/credentials/types'
import DeleteCredentialButton from '@/components/credentials/DeleteCredentialButton'
import EditCredentialForm from '@/components/credentials/EditCredentialForm'
import ShareCredentialModal from '@/components/credentials/ShareCredentialModal'
import VerifyCredentialButton from '@/components/credentials/VerifyCredentialButton'
import { ArrowLeft, ExternalLink, ShieldCheck, Clock, ShieldAlert, AlertTriangle } from 'lucide-react'

const FRESH_META: Record<CredentialFreshness, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  active: { bg: 'var(--sage-50)', color: 'var(--sage)', label: 'ACTIVE', icon: <ShieldCheck className="w-5 h-5" /> },
  expiring_soon: { bg: 'var(--gold-50)', color: 'var(--ink)', label: 'EXPIRING SOON', icon: <Clock className="w-5 h-5" /> },
  expired: { bg: 'var(--tang-50)', color: 'var(--tang-mid)', label: 'EXPIRED', icon: <ShieldAlert className="w-5 h-5" /> },
  unknown: { bg: 'var(--g100)', color: 'var(--g600)', label: 'NO EXPIRY', icon: <AlertTriangle className="w-5 h-5" /> },
}

export default async function NurseCredentialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('credentials')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) notFound()
  const credential = data as CredentialRow
  const fresh = freshnessFor(credential.expires_at)
  const days = daysUntilExpiry(credential.expires_at)
  const meta = FRESH_META[fresh]

  const sub =
    fresh === 'expired'
      ? `Expired ${Math.abs(days ?? 0)} days ago`
      : fresh === 'expiring_soon'
        ? `${days} days to renewal · ${credential.expires_at}`
        : fresh === 'active'
          ? `Valid through ${credential.expires_at}`
          : 'No expiration on file'

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" userName={user.email?.split('@')[0]} />
      <main className="max-w-3xl mx-auto w-full px-4 py-10 lg:py-14">
        <Link href="/nurse/credentials" className="inline-flex items-center gap-1.5 text-sm no-underline group" style={{ color: 'var(--g600)' }}>
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Back to credentials
        </Link>

        <div className="rounded-3xl border p-7 mt-4 mb-6" style={{ borderColor: 'var(--g100)', background: 'white' }}>
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg, color: meta.color }}>
              {meta.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[10px] font-bold tracking-[1.2px] uppercase px-2 py-1 rounded-md" style={{ background: meta.bg, color: meta.color }}>
                  {meta.label}
                </span>
                {credential.requires_review && (
                  <span className="text-[10px] font-bold tracking-[1.2px] uppercase px-2 py-1 rounded-md" style={{ background: 'var(--plum-50)', color: 'var(--plum)' }}>
                    needs verification
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl leading-[1.1]" style={{ color: 'var(--ink)' }}>
                {credential.display_name ?? credential.type}
              </h1>
              <div className="text-xs mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5" style={{ color: 'var(--g600)' }}>
                <span className="font-mono">{credential.type}</span>
                {credential.issuer && <span>· {credential.issuer}</span>}
                {credential.card_number && <span>· #{credential.card_number}</span>}
              </div>
              <div className="text-sm mt-3" style={{ color: 'var(--ink)' }}>{sub}</div>
              {credential.document_url && (
                <a href={credential.document_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold no-underline hover:underline" style={{ color: 'var(--plum)' }}>
                  <ExternalLink className="w-4 h-4" />
                  View uploaded document
                </a>
              )}
            </div>
          </div>
        </div>

        <EditCredentialForm credential={credential} />

        <div className="mt-6 flex flex-wrap gap-3">
          <ShareCredentialModal credentialId={credential.id} />
          <VerifyCredentialButton credential={credential} />
          <DeleteCredentialButton id={credential.id} />
        </div>
      </main>
    </div>
  )
}
