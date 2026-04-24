export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, Clock, CheckCircle, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react'

export default async function NursePaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: nurseProfile } = await supabase
    .from('nurse_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!nurseProfile) redirect('/nurse/profile')

  const { data: placements } = await supabase
    .from('placements')
    .select('*, job_postings(title, city, state, duration_weeks, weekly_rate, employer_profiles(org_name))')
    .eq('nurse_id', nurseProfile.id)
    .order('created_at', { ascending: false })

  const released = placements?.filter(p => p.escrow_status === 'released') || []
  const held = placements?.filter(p => p.escrow_status === 'held') || []
  const refunded = placements?.filter(p => p.escrow_status === 'refunded') || []

  const totalEarned = released.reduce((s, p) => s + (p.contract_value - p.platform_fee), 0)
  const inEscrow = held.reduce((s, p) => s + (p.contract_value - p.platform_fee), 0)
  const lifetimeGross = (placements || []).reduce((s, p) => s + p.contract_value, 0)

  const statusMap: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; label: string; icon: any }> = {
    held: { variant: 'warning', label: 'In escrow', icon: Clock },
    released: { variant: 'success', label: 'Released', icon: CheckCircle },
    refunded: { variant: 'danger', label: 'Refunded', icon: AlertCircle },
    disputed: { variant: 'danger', label: 'Disputed', icon: AlertCircle },
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" userName={nurseProfile.full_name} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <h1 className="font-display text-[32px] mb-1" style={{ color: 'var(--ink)' }}>Payments & earnings</h1>
          <p className="text-sm" style={{ color: 'var(--g600)' }}>
            Escrow protects every placement. Funds release 48 hours after your start date.
          </p>
        </div>

        {/* Summary */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--g600)' }}>
              <CheckCircle className="w-4 h-4" style={{ color: 'var(--sage)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider">Total earned</span>
            </div>
            <p className="font-display text-[32px]" style={{ color: 'var(--ink)' }}>
              {formatCurrency(totalEarned)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--g400)' }}>From {released.length} released placement{released.length === 1 ? '' : 's'}</p>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--g600)' }}>
              <Clock className="w-4 h-4" style={{ color: 'var(--tang)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider">In escrow</span>
            </div>
            <p className="font-display text-[32px]" style={{ color: 'var(--ink)' }}>
              {formatCurrency(inEscrow)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--g400)' }}>{held.length} upcoming placement{held.length === 1 ? '' : 's'}</p>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--g600)' }}>
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--plum)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider">Lifetime contracts</span>
            </div>
            <p className="font-display text-[32px]" style={{ color: 'var(--ink)' }}>
              {formatCurrency(lifetimeGross)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--g400)' }}>{placements?.length || 0} total placement{placements?.length === 1 ? '' : 's'}</p>
          </Card>
        </div>

        {/* List */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-base" style={{ color: 'var(--ink)' }}>Placement history</h2>
            <Link href="/nurse/jobs" className="text-sm font-medium no-underline flex items-center gap-1"
              style={{ color: 'var(--plum)' }}>
              Find more jobs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!placements || placements.length === 0 ? (
            <div className="text-center py-10">
              <DollarSign className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--g400)' }} />
              <p className="text-sm mb-4" style={{ color: 'var(--g600)' }}>No placements yet.</p>
              <Link href="/nurse/jobs"
                className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl text-white no-underline"
                style={{ background: 'var(--plum)' }}>
                Browse jobs <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--g100)' }}>
              {placements.map(p => {
                const st = statusMap[p.escrow_status] || statusMap.held
                const Icon = st.icon
                const netEarnings = p.contract_value - p.platform_fee
                return (
                  <div key={p.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--ink)' }}>
                            {p.job_postings?.title || 'Placement'}
                          </h3>
                          <Badge variant={st.variant}>
                            <Icon className="w-3 h-3 inline mr-1" />
                            {st.label}
                          </Badge>
                        </div>
                        <p className="text-xs mb-2" style={{ color: 'var(--g600)' }}>
                          {p.job_postings?.employer_profiles?.org_name || 'Employer'}
                          {p.job_postings?.city && ` · ${p.job_postings.city}, ${p.job_postings.state}`}
                          {p.job_postings?.duration_weeks && ` · ${p.job_postings.duration_weeks}w`}
                        </p>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs" style={{ color: 'var(--g600)' }}>
                          <span>Start: <strong style={{ color: 'var(--ink)' }}>{formatDate(p.start_date)}</strong></span>
                          {p.released_at && (
                            <span>Released: <strong style={{ color: 'var(--ink)' }}>{formatDate(p.released_at)}</strong></span>
                          )}
                          <span>Contract: <strong style={{ color: 'var(--ink)' }}>{formatCurrency(p.contract_value)}</strong></span>
                          <span>Platform fee: <strong style={{ color: 'var(--ink)' }}>-{formatCurrency(p.platform_fee)}</strong></span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-xl" style={{ color: 'var(--ink)' }}>
                          {formatCurrency(netEarnings)}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--g400)' }}>
                          Net earnings
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {refunded.length > 0 && (
          <p className="text-xs mt-6 text-center" style={{ color: 'var(--g400)' }}>
            {refunded.length} refunded placement{refunded.length === 1 ? '' : 's'} not shown in totals above.
          </p>
        )}
      </main>
    </div>
  )
}
