export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'

export default async function NurseLedgerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: contracts } = await supabase
    .from('ledger_contracts')
    .select('id, status, specialty, location_city, location_state, start_date, end_date, signed_at, ledger_agencies(name), ledger_recruiters(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" userName={user.email?.split('@')[0]} />
      <main className="max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-12 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl" style={{ color: 'var(--ink)' }}>Pay-Package Ledger</h1>
            <p className="text-sm mt-2" style={{ color: 'var(--g600)' }}>Catch bait-and-switch by diffing what recruiters quoted against what you signed.</p>
          </div>
          <CreateContractButton />
        </div>

        {contracts && contracts.length > 0 ? (
          <div className="grid gap-4">
            {contracts.map((c) => (
              <Link key={c.id} href={`/nurse/ledger/${c.id}`} className="block rounded-2xl border p-5 hover:shadow-md transition no-underline" style={{ borderColor: 'var(--g100)', background: 'white', color: 'var(--ink)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold">{c.specialty ?? 'Untitled contract'} {c.location_city ? `· ${c.location_city}, ${c.location_state}` : ''}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--g600)' }}>
                      {c.ledger_recruiters && Array.isArray(c.ledger_recruiters) ? '' : ''}
                      {c.start_date ? `${c.start_date} → ${c.end_date ?? '?'}` : 'Dates TBD'}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-dashed p-12 text-center" style={{ borderColor: 'var(--g200)' }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--ink)' }}>No contracts yet</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--g600)' }}>Start by creating a contract thread. Then paste quotes you receive or upload a signed contract.</p>
            <CreateContractButton />
          </div>
        )}
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    open: { bg: 'var(--plum-50)', color: 'var(--plum)' },
    signed: { bg: 'var(--sage-50)', color: 'var(--sage)' },
    completed: { bg: 'var(--g100)', color: 'var(--g600)' },
    cancelled: { bg: 'var(--tang-50)', color: 'var(--tang-mid)' },
    archived: { bg: 'var(--g100)', color: 'var(--g400)' },
  }
  const s = map[status] ?? map.open
  return <span className="text-[11px] font-bold tracking-wider px-2 py-1 rounded" style={{ background: s.bg, color: s.color }}>{status.toUpperCase()}</span>
}

function CreateContractButton() {
  return (
    <form action="/nurse/ledger/new" method="get">
      <button className="px-5 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: 'var(--tang)' }}>
        New contract
      </button>
    </form>
  )
}
