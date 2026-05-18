export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'

export default async function AdminLedgerReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const [{ data: flagged }, { data: recentDiffs }, { data: costStats }] = await Promise.all([
    supabase
      .from('ledger_quotes')
      .select('id, contract_id, source_type, confidence_score, received_at, raw_content')
      .eq('requires_review', true)
      .order('received_at', { ascending: false })
      .limit(50),
    supabase
      .from('ledger_diffs')
      .select('id, contract_id, computed_at, field_deltas')
      .order('computed_at', { ascending: false })
      .limit(20),
    supabase
      .from('ledger_llm_calls')
      .select('purpose, prompt_tokens, completion_tokens, status, called_at')
      .order('called_at', { ascending: false })
      .limit(100),
  ])

  const totalIn = (costStats ?? []).reduce((s, r) => s + (r.prompt_tokens ?? 0), 0)
  const totalOut = (costStats ?? []).reduce((s, r) => s + (r.completion_tokens ?? 0), 0)
  const errorRate = costStats && costStats.length > 0
    ? ((costStats.filter((r) => r.status !== 'ok').length / costStats.length) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="admin" userName={user.email?.split('@')[0]} />
      <main className="max-w-[1280px] mx-auto w-full px-4 sm:px-8 py-10">
        <h1 className="font-display text-4xl mb-2" style={{ color: 'var(--ink)' }}>Ledger Review</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--g600)' }}>Low-confidence extractions, recent diffs, LLM cost.</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <Stat label="Flagged quotes" value={(flagged ?? []).length} />
          <Stat label="Last 100 calls in tokens" value={totalIn.toLocaleString()} />
          <Stat label="Last 100 calls out tokens" value={totalOut.toLocaleString()} />
          <Stat label="Error rate (last 100)" value={`${errorRate}%`} />
        </div>

        <section className="mb-12">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--ink)' }}>Needs review</h2>
          {flagged && flagged.length > 0 ? (
            <div className="space-y-2">
              {flagged.map((q) => (
                <Link key={q.id} href={`/nurse/ledger/${q.contract_id}`} className="block rounded-xl border p-4 no-underline" style={{ borderColor: 'var(--g100)', background: 'white', color: 'var(--ink)' }}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs" style={{ color: 'var(--g600)' }}>{q.source_type} · conf {q.confidence_score?.toFixed(2)} · {new Date(q.received_at).toLocaleString()}</span>
                    <span className="text-xs underline" style={{ color: 'var(--plum)' }}>Open contract</span>
                  </div>
                  <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--g600)' }}>{q.raw_content.slice(0, 200)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm italic" style={{ color: 'var(--g600)' }}>Nothing flagged.</p>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--ink)' }}>Recent diffs</h2>
          <div className="space-y-2">
            {(recentDiffs ?? []).map((d) => {
              const deltas = d.field_deltas as { any_worse?: boolean; any_material_change?: boolean }
              return (
                <Link key={d.id} href={`/nurse/ledger/${d.contract_id}/diff`} className="flex items-center justify-between rounded-xl border p-4 no-underline" style={{ borderColor: 'var(--g100)', background: 'white', color: 'var(--ink)' }}>
                  <span className="text-xs font-mono" style={{ color: 'var(--g600)' }}>{new Date(d.computed_at).toLocaleString()}</span>
                  <span className="text-[11px] font-bold tracking-wider px-2 py-1 rounded" style={{ background: deltas.any_worse ? 'var(--tang-50)' : 'var(--g100)', color: deltas.any_worse ? 'var(--tang-mid)' : 'var(--g600)' }}>
                    {deltas.any_worse ? 'WORSE' : deltas.any_material_change ? 'CHANGES' : 'SAME'}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <div className="text-[11px] font-bold tracking-wider" style={{ color: 'var(--g400)' }}>{label.toUpperCase()}</div>
      <div className="text-2xl font-bold mt-1" style={{ color: 'var(--ink)' }}>{value}</div>
    </div>
  )
}
