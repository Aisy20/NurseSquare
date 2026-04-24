export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CheckCircle, CreditCard, DollarSign, Receipt, ArrowRight, Zap } from 'lucide-react'

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '$0',
    tagline: 'Pay only when you hire',
    features: ['Unlimited job postings', '15% placement fee per hire', 'Basic applicant tools', 'Email support'],
    accent: 'var(--g600)',
    bg: 'white',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    priceLabel: '$99/mo',
    tagline: 'For growing hospitals',
    features: ['Everything in Free', 'Reduced 12% placement fee', 'Priority applicant matching', 'Bulk messaging'],
    accent: 'var(--plum)',
    bg: 'var(--plum-50)',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 299,
    priceLabel: '$299/mo',
    tagline: 'For high-volume hiring',
    features: ['Everything in Basic', '10% placement fee', 'Featured job listings', 'Dedicated success manager'],
    accent: 'var(--tang)',
    bg: 'var(--tang-50)',
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    priceLabel: 'Custom',
    tagline: 'For health systems',
    features: ['Everything in Pro', 'Custom placement fee', 'API access + SSO', 'White-glove onboarding'],
    accent: 'var(--ink)',
    bg: 'var(--cream-mid)',
  },
]

export default async function HospitalBillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: employerProfile } = await supabase
    .from('employer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!employerProfile) redirect('/hospital/profile')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('employer_id', employerProfile.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .maybeSingle()

  const { data: placements } = await supabase
    .from('placements')
    .select('id, contract_value, platform_fee, start_date, escrow_status, job_postings(title)')
    .eq('employer_id', employerProfile.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const totalSpent = (placements || []).reduce((s, p) => s + p.contract_value + p.platform_fee, 0)
  const totalFees = (placements || []).reduce((s, p) => s + p.platform_fee, 0)
  const currentTierId = employerProfile.subscription_tier || 'free'

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="hospital" userName={employerProfile.org_name} />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <h1 className="font-display text-[32px] mb-1" style={{ color: 'var(--ink)' }}>Billing & subscription</h1>
          <p className="text-sm" style={{ color: 'var(--g600)' }}>Manage your plan, payment method, and placement history.</p>
        </div>

        {/* Current plan */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--g400)' }}>Current plan</span>
                <Badge variant={subscription ? 'success' : 'default'}>
                  {subscription?.status === 'active' ? 'Active' : currentTierId === 'free' ? 'Free' : 'Inactive'}
                </Badge>
              </div>
              <h2 className="font-display text-[26px] capitalize" style={{ color: 'var(--ink)' }}>
                {currentTierId}
              </h2>
              {subscription && (
                <p className="text-sm mt-1" style={{ color: 'var(--g600)' }}>
                  {formatCurrency(subscription.price)}/{subscription.billing_cycle === 'annual' ? 'year' : 'month'} · Renews automatically
                </p>
              )}
              {!subscription && currentTierId === 'free' && (
                <p className="text-sm mt-1" style={{ color: 'var(--g600)' }}>
                  Pay only when you hire — 15% placement fee.
                </p>
              )}
            </div>
            {subscription && (
              <form action="/api/stripe/portal" method="POST">
                <button type="submit"
                  className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl border transition-all hover:shadow-sm"
                  style={{ borderColor: 'var(--g200)', color: 'var(--ink)', background: 'white' }}>
                  <CreditCard className="w-4 h-4" /> Manage payment method
                </button>
              </form>
            )}
          </div>
        </Card>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--g600)' }}>
              <DollarSign className="w-4 h-4" style={{ color: 'var(--plum)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider">Total spent</span>
            </div>
            <p className="font-display text-[28px]" style={{ color: 'var(--ink)' }}>{formatCurrency(totalSpent)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--g400)' }}>Contracts + platform fees</p>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--g600)' }}>
              <Receipt className="w-4 h-4" style={{ color: 'var(--tang)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider">Placement fees paid</span>
            </div>
            <p className="font-display text-[28px]" style={{ color: 'var(--ink)' }}>{formatCurrency(totalFees)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--g400)' }}>Across {placements?.length || 0} placement{placements?.length === 1 ? '' : 's'}</p>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--g600)' }}>
              <Zap className="w-4 h-4" style={{ color: 'var(--sage)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider">Placements</span>
            </div>
            <p className="font-display text-[28px]" style={{ color: 'var(--ink)' }}>{placements?.length || 0}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--g400)' }}>
              {(placements || []).filter(p => p.escrow_status === 'held').length} in escrow
            </p>
          </Card>
        </div>

        {/* Plans */}
        <div className="mb-4">
          <h2 className="font-semibold text-base mb-1" style={{ color: 'var(--ink)' }}>Plans</h2>
          <p className="text-xs" style={{ color: 'var(--g600)' }}>Upgrade to lower your placement fee and unlock extras.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {TIERS.map(tier => {
            const isCurrent = tier.id === currentTierId
            return (
              <div key={tier.id}
                className="rounded-2xl border p-5 relative transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  background: tier.bg,
                  borderColor: isCurrent ? tier.accent : 'var(--g100)',
                  borderWidth: isCurrent ? 2 : 1,
                }}>
                {tier.recommended && !isCurrent && (
                  <span className="absolute -top-2 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full text-white"
                    style={{ background: tier.accent }}>
                    Recommended
                  </span>
                )}
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: tier.accent }}>{tier.name}</p>
                <p className="font-display text-[24px]" style={{ color: 'var(--ink)' }}>{tier.priceLabel}</p>
                <p className="text-xs mb-4" style={{ color: 'var(--g600)' }}>{tier.tagline}</p>
                <ul className="space-y-1.5 mb-4 text-[13px]" style={{ color: 'var(--g600)' }}>
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: tier.accent }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="w-full text-center font-semibold text-xs py-2 rounded-lg" style={{ background: 'white', color: tier.accent }}>
                    Current plan
                  </div>
                ) : tier.id === 'enterprise' ? (
                  <Link href="/contact"
                    className="block w-full text-center font-semibold text-xs py-2 rounded-lg no-underline"
                    style={{ background: tier.accent, color: 'white' }}>
                    Contact sales
                  </Link>
                ) : (
                  <button disabled
                    className="w-full font-semibold text-xs py-2 rounded-lg text-white opacity-60 cursor-not-allowed"
                    style={{ background: tier.accent }}
                    title="Upgrade flow coming soon">
                    Upgrade
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Placement invoice history */}
        <Card>
          <h2 className="font-semibold text-base mb-5" style={{ color: 'var(--ink)' }}>Placement invoices</h2>
          {!placements || placements.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--g400)' }} />
              <p className="text-sm mb-4" style={{ color: 'var(--g600)' }}>No placements yet.</p>
              <Link href="/hospital/post-job"
                className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl text-white no-underline"
                style={{ background: 'var(--tang)' }}>
                Post a job <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--g400)' }}>
                    <th className="text-left font-semibold py-2 px-2">Job</th>
                    <th className="text-left font-semibold py-2 px-2">Start</th>
                    <th className="text-right font-semibold py-2 px-2">Contract</th>
                    <th className="text-right font-semibold py-2 px-2">Fee</th>
                    <th className="text-right font-semibold py-2 px-2">Total</th>
                    <th className="text-right font-semibold py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--g100)' }}>
                  {placements.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-3 px-2 font-medium" style={{ color: 'var(--ink)' }}>
                        {p.job_postings?.title || 'Placement'}
                      </td>
                      <td className="py-3 px-2" style={{ color: 'var(--g600)' }}>{formatDate(p.start_date)}</td>
                      <td className="py-3 px-2 text-right" style={{ color: 'var(--g600)' }}>{formatCurrency(p.contract_value)}</td>
                      <td className="py-3 px-2 text-right" style={{ color: 'var(--g600)' }}>{formatCurrency(p.platform_fee)}</td>
                      <td className="py-3 px-2 text-right font-semibold" style={{ color: 'var(--ink)' }}>{formatCurrency(p.contract_value + p.platform_fee)}</td>
                      <td className="py-3 px-2 text-right">
                        <Badge variant={
                          p.escrow_status === 'released' ? 'success' :
                          p.escrow_status === 'refunded' ? 'danger' :
                          p.escrow_status === 'disputed' ? 'danger' : 'warning'
                        }>
                          {p.escrow_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
