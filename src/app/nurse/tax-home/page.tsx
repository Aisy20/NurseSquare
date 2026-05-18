export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import { computeTaxHomeStatus, type ContractWindow } from '@/lib/taxhome/compute'
import TaxHomeStateForm from '@/components/taxhome/TaxHomeStateForm'

const FLAG_STYLES = {
  safe: { bg: 'var(--sage-50)', color: 'var(--sage)', label: 'LOOKS SAFE' },
  warning: { bg: 'var(--gold-50)', color: 'var(--ink)', label: 'WARNING' },
  risk: { bg: 'var(--tang-50)', color: 'var(--tang-mid)', label: 'AT RISK' },
}

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
  const flagStyle = FLAG_STYLES[status.flag]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" userName={user.email?.split('@')[0]} />
      <main className="max-w-[1100px] mx-auto w-full px-4 sm:px-8 py-10">
        <div className="mb-8">
          <h1 className="font-display text-4xl" style={{ color: 'var(--ink)' }}>Tax-Home Tracker</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--g600)' }}>
            Estimate your exposure to losing tax-free stipend eligibility based on where you have worked. Folk-wisdom heuristics only; consult a tax pro before relying on this for filings.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <section className="space-y-6">
            <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--g100)', background: 'white' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[11px] font-bold tracking-wider" style={{ color: 'var(--g400)' }}>CURRENT STATUS</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: 'var(--ink)' }}>
                    {status.taxHomeState ?? 'Tax home not set'}
                  </div>
                </div>
                <span className="text-[11px] font-bold tracking-wider px-3 py-1.5 rounded-lg" style={{ background: flagStyle.bg, color: flagStyle.color }}>
                  {flagStyle.label}
                </span>
              </div>
              {status.reasons.length > 0 && (
                <ul className="space-y-2 text-sm" style={{ color: 'var(--ink)' }}>
                  {status.reasons.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              )}
              {status.reasons.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--g600)' }}>No concerns flagged from your current contract history.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Stat label="Away from home (last 365d)" value={`${status.daysAwayLast365}d`} />
              <Stat label="At home (last 365d, est.)" value={`${status.daysAtHomeLast365}d`} />
              <Stat label="Away from home (last 730d)" value={`${status.daysAwayLast730}d`} />
            </div>

            <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--g100)', background: 'white' }}>
              <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--ink)' }}>Days by state · last 24 months</h2>
              {status.topStatesLast730.length === 0 ? (
                <p className="text-sm italic" style={{ color: 'var(--g600)' }}>No contract data yet. Add contracts in the Pay Ledger to populate this.</p>
              ) : (
                <table className="w-full">
                  <tbody>
                    {status.topStatesLast730.map((s) => (
                      <tr key={s.state} style={{ borderBottom: '1px solid var(--g100)' }}>
                        <td className="py-2 text-sm font-mono" style={{ color: 'var(--ink)' }}>{s.state}</td>
                        <td className="py-2 text-sm text-right font-mono" style={{ color: 'var(--g800)' }}>{s.days} days</td>
                        <td className="py-2 text-xs text-right" style={{ color: s.days > 365 ? 'var(--tang-mid)' : s.days >= 330 ? 'var(--ink)' : 'var(--g400)' }}>
                          {s.days > 365 ? 'over 12-month limit' : s.days >= 330 ? 'approaching limit' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <TaxHomeStateForm currentState={profile?.tax_home_state ?? null} />
            <div className="rounded-2xl border p-5 text-xs" style={{ borderColor: 'var(--g100)', background: 'var(--cream-mid)', color: 'var(--g600)' }}>
              <p className="font-bold mb-2" style={{ color: 'var(--ink)' }}>How this is calculated</p>
              <ul className="space-y-1">
                <li>• Days summed from start_date / end_date / location_state on your ledger contracts.</li>
                <li>• 12-month-in-one-metro rule of thumb uses state grouping (not metro). Real IRS analysis is metro-based.</li>
                <li>• Days at tax home is estimated as 365 minus days away. Does not account for trips home during a contract.</li>
                <li>• This tool surfaces risk signals only. The actual stipend eligibility test is fact-specific (duplicate expenses, nexus, presence).</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <div className="text-[11px] font-bold tracking-wider" style={{ color: 'var(--g400)' }}>{label.toUpperCase()}</div>
      <div className="text-2xl font-bold mt-1" style={{ color: 'var(--ink)' }}>{value}</div>
    </div>
  )
}
