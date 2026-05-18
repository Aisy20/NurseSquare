export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import { freshnessFor, daysUntilExpiry, type CredentialRow } from '@/lib/ledger/credentials/types'
import DeleteCredentialButton from '@/components/credentials/DeleteCredentialButton'
import EditCredentialForm from '@/components/credentials/EditCredentialForm'

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

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" userName={user.email?.split('@')[0]} />
      <main className="max-w-3xl mx-auto w-full px-4 py-10">
        <Link href="/nurse/credentials" className="text-sm no-underline" style={{ color: 'var(--g600)' }}>← Back to credentials</Link>

        <div className="flex items-start justify-between mt-3 mb-6">
          <div>
            <h1 className="font-display text-3xl" style={{ color: 'var(--ink)' }}>
              {credential.display_name ?? credential.type}
            </h1>
            <p className="text-sm mt-1 font-mono" style={{ color: 'var(--g600)' }}>{credential.type}</p>
          </div>
          <FreshnessBadge fresh={fresh} days={days} expiresAt={credential.expires_at} />
        </div>

        {credential.document_url && (
          <a href={credential.document_url} target="_blank" rel="noreferrer"
            className="inline-block mb-6 underline text-sm" style={{ color: 'var(--plum)' }}>
            View uploaded document
          </a>
        )}

        <EditCredentialForm credential={credential} />

        <div className="mt-6 flex gap-3">
          <DeleteCredentialButton id={credential.id} />
        </div>
      </main>
    </div>
  )
}

function FreshnessBadge({ fresh, days, expiresAt }: { fresh: string; days: number | null; expiresAt: string | null }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: 'var(--sage-50)', color: 'var(--sage)', label: 'ACTIVE' },
    expiring_soon: { bg: 'var(--gold-50)', color: 'var(--ink)', label: 'EXPIRING SOON' },
    expired: { bg: 'var(--tang-50)', color: 'var(--tang-mid)', label: 'EXPIRED' },
    unknown: { bg: 'var(--g100)', color: 'var(--g600)', label: 'NO EXPIRY' },
  }
  const s = map[fresh]
  const sub = fresh === 'expired'
    ? `${Math.abs(days ?? 0)} days ago`
    : fresh === 'expiring_soon' || fresh === 'active'
      ? `${expiresAt}`
      : 'No date'
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-[11px] font-bold tracking-wider px-2 py-1 rounded" style={{ background: s.bg, color: s.color }}>{s.label}</span>
      <span className="text-xs" style={{ color: 'var(--g600)' }}>{sub}</span>
    </div>
  )
}
