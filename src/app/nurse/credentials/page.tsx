export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import PageHero from '@/components/ui/PageHero'
import StatCard from '@/components/ui/StatCard'
import EmptyState from '@/components/ui/EmptyState'
import SectionHeader from '@/components/ui/SectionHeader'
import Button from '@/components/ui/Button'
import CredentialCard from '@/components/credentials/CredentialCard'
import { freshnessFor, type CredentialRow } from '@/lib/ledger/credentials/types'
import { ShieldCheck } from 'lucide-react'

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
      <main className="max-w-[1100px] mx-auto w-full px-4 sm:px-8 py-10 lg:py-14">
        <PageHero
          eyebrow="Credentialing Wallet"
          title="Upload once,"
          titleAccent="renew on time."
          subtitle="Track BLS, ACLS, vaccinations, fit tests, and licenses in one place. We extract expiration dates from the document and email you when renewals approach."
          actions={<Link href="/nurse/credentials/new"><Button variant="tang" size="md">Add credential</Button></Link>}
        />

        {credentials.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            <StatCard label="Total credentials" value={credentials.length} tone="plum" />
            <StatCard label="Active" value={active.length} tone={active.length > 0 ? 'success' : 'default'} />
            <StatCard label="Expiring soon" value={expiring.length} tone={expiring.length > 0 ? 'warning' : 'default'} sub="within 60 days" />
            <StatCard label="Expired" value={expired.length} tone={expired.length > 0 ? 'danger' : 'default'} />
          </div>
        )}

        {credentials.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="w-6 h-6" />}
            title="No credentials yet"
            description="Upload a PDF of your BLS, ACLS, RN license, or any other certification. We extract the expiration automatically."
            action={<Link href="/nurse/credentials/new"><Button variant="tang" size="md">Add your first credential</Button></Link>}
          />
        ) : (
          <div className="space-y-10">
            {expired.length > 0 && <Section title="Expired" eyebrow="action needed" items={expired} />}
            {expiring.length > 0 && <Section title="Expiring within 60 days" eyebrow="renew soon" items={expiring} />}
            {active.length > 0 && <Section title="Active" eyebrow="all good" items={active} />}
            {undated.length > 0 && <Section title="No expiration on file" eyebrow="metadata only" items={undated} />}
          </div>
        )}
      </main>
    </div>
  )
}

function Section({ title, eyebrow, items }: { title: string; eyebrow: string; items: CredentialRow[] }) {
  return (
    <section>
      <SectionHeader eyebrow={eyebrow} title={`${title} · ${items.length}`} />
      <div className="grid gap-3">
        {items.map((c) => <CredentialCard key={c.id} credential={c} />)}
      </div>
    </section>
  )
}
