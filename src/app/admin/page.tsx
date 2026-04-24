export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users, Briefcase, DollarSign, TrendingUp, ArrowRight, AlertCircle, Shield } from 'lucide-react'

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const [
    { count: nurseCount },
    { count: hospitalCount },
    { count: jobCount },
    { count: activeJobCount },
    { count: applicationCount },
    { data: placements },
    { data: recentJobs },
    { data: recentApplications },
  ] = await Promise.all([
    supabase.from('nurse_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('employer_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('job_postings').select('id', { count: 'exact', head: true }),
    supabase.from('job_postings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('applications').select('id', { count: 'exact', head: true }),
    supabase.from('placements').select('*, job_postings(title), employer_profiles(org_name), nurse_profiles(full_name)').order('created_at', { ascending: false }).limit(10),
    supabase.from('job_postings').select('id, title, city, state, status, created_at, employer_profiles(org_name)').order('created_at', { ascending: false }).limit(6),
    supabase.from('applications').select('id, status, applied_at, nurse_profiles(full_name), job_postings(title)').order('applied_at', { ascending: false }).limit(6),
  ])

  const gmv = (placements || []).reduce((s, p) => s + p.contract_value, 0)
  const fees = (placements || []).reduce((s, p) => s + p.platform_fee, 0)
  const escrowHeld = (placements || []).filter(p => p.escrow_status === 'held').reduce((s, p) => s + p.contract_value, 0)

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="admin" userName={profile.email?.split('@')[0]} />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5" style={{ color: 'var(--plum)' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--plum)' }}>Admin</span>
        </div>
        <h1 className="font-display text-[32px] mb-1" style={{ color: 'var(--ink)' }}>Platform overview</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--g600)' }}>Marketplace health at a glance.</p>

        {/* KPIs */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--g600)' }}>
              <Users className="w-4 h-4" style={{ color: 'var(--plum)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider">Nurses</span>
            </div>
            <p className="font-display text-[28px]" style={{ color: 'var(--ink)' }}>{nurseCount || 0}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--g400)' }}>Verified profiles</p>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--g600)' }}>
              <Users className="w-4 h-4" style={{ color: 'var(--tang)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider">Hospitals</span>
            </div>
            <p className="font-display text-[28px]" style={{ color: 'var(--ink)' }}>{hospitalCount || 0}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--g400)' }}>Employer accounts</p>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--g600)' }}>
              <Briefcase className="w-4 h-4" style={{ color: 'var(--sage)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider">Jobs</span>
            </div>
            <p className="font-display text-[28px]" style={{ color: 'var(--ink)' }}>{activeJobCount || 0}<span className="text-sm font-normal" style={{ color: 'var(--g400)' }}> / {jobCount || 0}</span></p>
            <p className="text-xs mt-1" style={{ color: 'var(--g400)' }}>Active / total</p>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--g600)' }}>
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--plum)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider">Applications</span>
            </div>
            <p className="font-display text-[28px]" style={{ color: 'var(--ink)' }}>{applicationCount || 0}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--g400)' }}>All time</p>
          </Card>
        </div>

        {/* Revenue */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <Card>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--g600)' }}>
              <DollarSign className="w-4 h-4" style={{ color: 'var(--plum)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider">GMV</span>
            </div>
            <p className="font-display text-[28px]" style={{ color: 'var(--ink)' }}>{formatCurrency(gmv)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--g400)' }}>{placements?.length || 0} placement{placements?.length === 1 ? '' : 's'}</p>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--g600)' }}>
              <DollarSign className="w-4 h-4" style={{ color: 'var(--tang)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider">Platform revenue</span>
            </div>
            <p className="font-display text-[28px]" style={{ color: 'var(--ink)' }}>{formatCurrency(fees)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--g400)' }}>Placement fees collected</p>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--g600)' }}>
              <AlertCircle className="w-4 h-4" style={{ color: 'var(--tang-mid)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider">In escrow</span>
            </div>
            <p className="font-display text-[28px]" style={{ color: 'var(--ink)' }}>{formatCurrency(escrowHeld)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--g400)' }}>Held, awaiting release</p>
          </Card>
        </div>

        {/* Admin nav */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { href: '/admin/users', label: 'Users', desc: 'All nurses and hospitals', icon: Users, color: 'var(--plum)' },
            { href: '/admin/jobs', label: 'Jobs', desc: 'All postings', icon: Briefcase, color: 'var(--sage)' },
            { href: '/admin/payments', label: 'Payments', desc: 'Placements & escrow', icon: DollarSign, color: 'var(--tang)' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="rounded-2xl border p-5 no-underline transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ background: 'white', borderColor: 'var(--g100)' }}>
              <div className="flex items-center justify-between mb-2">
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
                <ArrowRight className="w-4 h-4" style={{ color: 'var(--g400)' }} />
              </div>
              <h3 className="font-semibold text-base" style={{ color: 'var(--ink)' }}>{item.label}</h3>
              <p className="text-xs" style={{ color: 'var(--g600)' }}>{item.desc}</p>
            </Link>
          ))}
        </div>

        {/* Recent activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base" style={{ color: 'var(--ink)' }}>Recent jobs</h2>
              <Link href="/admin/jobs" className="text-xs font-semibold no-underline" style={{ color: 'var(--plum)' }}>View all →</Link>
            </div>
            {!recentJobs || recentJobs.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--g400)' }}>No jobs yet.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--g100)' }}>
                {recentJobs.map((j: any) => (
                  <div key={j.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate" style={{ color: 'var(--ink)' }}>{j.title}</p>
                        <p className="text-xs" style={{ color: 'var(--g600)' }}>
                          {j.employer_profiles?.org_name} · {j.city}, {j.state}
                        </p>
                      </div>
                      <Badge variant={j.status === 'active' ? 'success' : j.status === 'filled' ? 'info' : 'default'}>{j.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base" style={{ color: 'var(--ink)' }}>Recent applications</h2>
              <Link href="/admin/users" className="text-xs font-semibold no-underline" style={{ color: 'var(--plum)' }}>View all →</Link>
            </div>
            {!recentApplications || recentApplications.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--g400)' }}>No applications yet.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--g100)' }}>
                {recentApplications.map((a: any) => (
                  <div key={a.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate" style={{ color: 'var(--ink)' }}>
                          {a.nurse_profiles?.full_name} → {a.job_postings?.title}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--g600)' }}>{formatDate(a.applied_at)}</p>
                      </div>
                      <Badge variant={
                        a.status === 'accepted' ? 'success' :
                        a.status === 'rejected' ? 'danger' :
                        a.status === 'offered' ? 'success' : 'warning'
                      }>{a.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
