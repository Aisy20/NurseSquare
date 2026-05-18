export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import CredentialCard from '@/components/credentials/CredentialCard'
import { freshnessFor, type CredentialRow } from '@/lib/ledger/credentials/types'

export default async function NurseCredentialsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('credentials')
    .select('*')
    .eq('user_id', user.id)
    .order('expires_at', { ascending: true, nullsFirst: false })

  const credentials = (data ?? []) as CredentialRow[]
  const expired = credentials.filter((c) => freshnessFor(c.expires_at) === 'expired')
  const expiring = credentials.filter((c) => freshnessFor(c.expires_at) === 'expiring_soon')
  const active = credentials.filter((c) => freshnessFor(c.expires_at) === 'active')
  const undated = credentials.filter((c) => freshnessFor(c.expires_at) === 'unknown')

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" userName={user.email?.split('@')[0]} />
      <main className="max-w-[1100px] mx-auto w-full px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl" style={{ color: 'var(--ink)' }}>Credentialing Wallet</h1>
            <p className="text-sm mt-2" style={{ color: 'var(--g600)' }}>Upload your certifications once. We track expirations and cross-reference what each contract requires.</p>
          </div>
          <Link href="/nurse/credentials/new" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white no-underline" style={{ background: 'var(--tang)' }}>
            Add credential
          </Link>
        </div>

        {credentials.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed p-12 text-center" style={{ borderColor: 'var(--g200)' }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--ink)' }}>No credentials yet</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--g600)' }}>Upload a PDF of your BLS, ACLS, RN license, or any other certification. We will extract the expiration date automatically.</p>
            <Link href="/nurse/credentials/new" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white no-underline" style={{ background: 'var(--tang)' }}>
              Add your first credential
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {expired.length > 0 && <Section title={`Expired (${expired.length})`} items={expired} />}
            {expiring.length > 0 && <Section title={`Expiring within 60 days (${expiring.length})`} items={expiring} />}
            {active.length > 0 && <Section title={`Active (${active.length})`} items={active} />}
            {undated.length > 0 && <Section title={`No expiration on file (${undated.length})`} items={undated} />}
          </div>
        )}
      </main>
    </div>
  )
}

function Section({ title, items }: { title: string; items: CredentialRow[] }) {
  return (
    <section>
      <h2 className="text-sm font-bold tracking-wider mb-3" style={{ color: 'var(--g600)' }}>{title.toUpperCase()}</h2>
      <div className="grid gap-3">
        {items.map((c) => <CredentialCard key={c.id} credential={c} />)}
      </div>
    </section>
  )
}
