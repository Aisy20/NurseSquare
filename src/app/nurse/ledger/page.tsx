export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import PageHero from '@/components/ui/PageHero'
import StatCard from '@/components/ui/StatCard'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import { FileText, ArrowUpRight } from 'lucide-react'

const STATUS_TONE: Record<string, { bg: string; color: string }> = {
  open: { bg: 'var(--plum-50)', color: 'var(--plum)' },
  signed: { bg: 'var(--sage-50)', color: 'var(--sage)' },
  completed: { bg: 'var(--g100)', color: 'var(--g600)' },
  cancelled: { bg: 'var(--tang-50)', color: 'var(--tang-mid)' },
  archived: { bg: 'var(--g100)', color: 'var(--g400)' },
}

export default async function NurseLedgerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: contracts } = await supabase
    .from('ledger_contracts')
    .select('id, status, specialty, location_city, location_state, start_date, end_date, signed_at, ledger_agencies(name), ledger_recruiters(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const rows = contracts ?? []
  const counts = rows.reduce(
    (acc, c) => {
      acc.total++
      if (c.status === 'open') acc.open++
      else if (c.status === 'signed') acc.signed++
      return acc
    },
    { total: 0, open: 0, signed: 0 },
  )

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" userName={user.email?.split('@')[0]} />
      <main className="max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-12 py-10 lg:py-14">
        <PageHero
          eyebrow="Pay-Package Ledger"
          title="Catch the bait-and-switch"
          titleAccent="before you sign."
          subtitle="Paste recruiter quotes or upload offer PDFs. NurseSquare extracts the structured pay package, then diffs it against your signed contract so the gap shows up before payroll does."
          actions={
            <div className="flex gap-2">
              <Link href="/nurse/contract-check"><Button variant="primary" size="md">Contract Check</Button></Link>
              <Link href="/nurse/ledger/new"><Button variant="tang" size="md">New contract</Button></Link>
            </div>
          }
        />

        {rows.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            <StatCard label="Contracts tracked" value={counts.total} tone="plum" />
            <StatCard label="In negotiation" value={counts.open} sub="open status" />
            <StatCard label="Signed" value={counts.signed} sub="diff available" />
            <StatCard label="Diff coverage" value={`${counts.total > 0 ? Math.round((counts.signed / counts.total) * 100) : 0}%`} sub="signed / total" />
          </div>
        )}

        {rows.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-6 h-6" />}
            title="No contracts yet"
            description="Start by uploading a recruiter offer PDF. We will auto-fill the specialty, location, and pay package."
            action={<Link href="/nurse/ledger/new"><Button variant="tang" size="md">Upload your first offer</Button></Link>}
          />
        ) : (
          <div className="grid gap-3">
            {rows.map((c) => {
              const tone = STATUS_TONE[c.status] ?? STATUS_TONE.open
              return (
                <Link
                  key={c.id}
                  href={`/nurse/ledger/${c.id}`}
                  className="group flex items-center justify-between rounded-2xl border p-5 hover:shadow-md transition-all no-underline"
                  style={{ borderColor: 'var(--g100)', background: 'white', color: 'var(--ink)' }}
                >
                  <div>
                    <div className="text-sm font-bold tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>
                      {c.specialty ?? 'Untitled contract'}
                      {c.location_city && (
                        <span style={{ color: 'var(--g400)' }}> · {c.location_city}, {c.location_state}</span>
                      )}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--g600)' }}>
                      {c.start_date ? `${c.start_date} → ${c.end_date ?? 'TBD'}` : 'Dates TBD'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold tracking-[1px] uppercase px-2.5 py-1 rounded-md" style={{ background: tone.bg, color: tone.color }}>
                      {c.status}
                    </span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--plum)' }} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
