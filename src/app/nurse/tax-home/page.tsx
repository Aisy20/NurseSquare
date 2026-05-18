export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import PageHero from '@/components/ui/PageHero'
import StatCard from '@/components/ui/StatCard'
import { computeTaxHomeStatus, type ContractWindow } from '@/lib/taxhome/compute'
import TaxHomeStateForm from '@/components/taxhome/TaxHomeStateForm'
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react'

const FLAG_META = {
  safe: {
    bg: 'var(--sage-50)',
    color: 'var(--sage)',
    label: 'LOOKS SAFE',
    icon: <ShieldCheck className="w-6 h-6" />,
    headline: 'No red flags from your contract history.',
  },
  warning: {
    bg: 'var(--gold-50)',
    color: 'var(--ink)',
    label: 'WATCH OUT',
    icon: <AlertTriangle className="w-6 h-6" />,
    headline: 'Some signals to consider with a tax pro.',
  },
  risk: {
    bg: 'var(--tang-50)',
    color: 'var(--tang-mid)',
    label: 'AT RISK',
    icon: <ShieldAlert className="w-6 h-6" />,
    headline: 'Heuristic flags that warrant attention.',
  },
} as const

export default async function NurseTaxHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: contracts }] = await Promise.all([
    supabase.from('users').select('tax_home_state').eq('id', user.id).single(),
    supabase
      .from('ledger_contracts')
      .select('start_date, end_date, location_state')
      .eq('user_id', user.id),
  ])

  const status = computeTaxHomeStatus(
    (contracts ?? []) as ContractWindow[],
    profile?.tax_home_state ?? null,
  )
  const meta = FLAG_META[status.flag]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" userName={user.email?.split('@')[0]} />
      <main className="max-w-[1100px] mx-auto w-full px-4 sm:px-8 py-10 lg:py-14">
        <PageHero
          eyebrow="Tax-Home Tracker"
          title="Hold the stipend"
          titleAccent="defense line."
          subtitle="Estimate your exposure to losing tax-free stipend eligibility based on where you have worked and where your tax home is. Heuristics only; consult a tax pro before relying on this for filings."
        />

        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <section className="space-y-5">
            <div
              className="rounded-3xl p-7 border"
              style={{
                borderColor: status.flag === 'risk' ? 'var(--tang)' : status.flag === 'warning' ? 'var(--gold)' : 'var(--sage)',
                background: 'white',
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] font-bold tracking-[1.2px] uppercase px-2 py-1 rounded-md" style={{ background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--g600)' }}>
                      Tax home: <span className="font-mono font-bold" style={{ color: 'var(--ink)' }}>{status.taxHomeState ?? 'not set'}</span>
                    </span>
                  </div>
                  <h2 className="font-display text-2xl mt-3" style={{ color: 'var(--ink)' }}>{meta.headline}</h2>
                  {status.reasons.length > 0 && (
                    <ul className="space-y-2 mt-4 text-sm" style={{ color: 'var(--ink)' }}>
                      {status.reasons.map((r, i) => (
                        <li key={i} className="flex gap-2"><span style={{ color: 'var(--tang)' }}>•</span> <span>{r}</span></li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard label="Away · 365d" value={`${status.daysAwayLast365}d`} sub="across all contracts" />
              <StatCard label="At home · 365d" value={`${status.daysAtHomeLast365}d`} sub="estimated" tone={status.daysAtHomeLast365 < 30 ? 'warning' : 'default'} />
              <StatCard label="Away · 730d" value={`${status.daysAwayLast730}d`} sub="rolling 24 months" />
            </div>

            <div className="rounded-2xl border" style={{ borderColor: 'var(--g100)', background: 'white' }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--g100)', background: 'var(--cream-mid)' }}>
                <div>
                  <div className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--tang)' }}>Days by state</div>
                  <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--ink)' }}>Rolling 24-month window</div>
                </div>
              </div>
              {status.topStatesLast730.length === 0 ? (
                <p className="text-sm italic px-5 py-6" style={{ color: 'var(--g600)' }}>No contract data yet. Add contracts in the Pay Ledger to populate this.</p>
              ) : (
                <table className="w-full">
                  <tbody>
                    {status.topStatesLast730.map((s) => {
                      const ratio = Math.min(1, s.days / 365)
                      const tone = s.days > 365 ? 'var(--tang)' : s.days >= 330 ? 'var(--gold)' : 'var(--sage)'
                      return (
                        <tr key={s.state} style={{ borderBottom: '1px solid var(--g100)' }}>
                          <td className="py-3 px-5 text-sm font-mono font-bold" style={{ color: 'var(--ink)', width: '60px' }}>{s.state}</td>
                          <td className="py-3 pr-5 w-full">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--g100)' }}>
                                <div className="h-full rounded-full" style={{ width: `${ratio * 100}%`, background: tone }} />
                              </div>
                              <span className="text-sm font-mono whitespace-nowrap" style={{ color: 'var(--g800)' }}>{s.days}d</span>
                            </div>
                            {s.days > 365 && (
                              <div className="text-[10px] font-bold tracking-[1px] uppercase mt-1" style={{ color: 'var(--tang-mid)' }}>over 12-month rule</div>
                            )}
                            {s.days >= 330 && s.days <= 365 && (
                              <div className="text-[10px] font-bold tracking-[1px] uppercase mt-1" style={{ color: 'var(--ink)' }}>approaching limit</div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <TaxHomeStateForm currentState={profile?.tax_home_state ?? null} />
            <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--g100)', background: 'var(--cream-mid)' }}>
              <h3 className="text-[10px] font-bold tracking-[1.2px] uppercase mb-2" style={{ color: 'var(--tang)' }}>How this is calculated</h3>
              <ul className="space-y-2 text-xs" style={{ color: 'var(--g600)' }}>
                <li>• Days summed from contract start, end, and location state.</li>
                <li>• 12-month-in-one-metro rule of thumb uses state grouping; real IRS analysis is metro-based.</li>
                <li>• Days at tax home estimated as 365 minus days away. Does not account for trips home during a contract.</li>
                <li>• Screening tool only. Stipend eligibility is fact-specific (duplicate expenses, nexus, presence).</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
