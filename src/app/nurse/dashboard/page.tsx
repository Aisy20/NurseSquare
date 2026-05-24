export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import StatCard from '@/components/ui/StatCard'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Briefcase, CheckCircle, Clock, DollarSign, AlertCircle,
  ArrowRight, Star, Shield, UserRound
} from 'lucide-react'

export default async function NurseDashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const params = await searchParams
  const isWelcome = params.welcome === 'true'

  const { data: nurseProfile } = await supabase
    .from('nurse_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const [{ data: applications }, { data: placements }] = await Promise.all([
    supabase.from('applications')
      .select('*, job_postings(title, city, state, weekly_rate, employer_profiles(org_name))')
      .eq('nurse_id', nurseProfile?.id || '')
      .order('applied_at', { ascending: false })
      .limit(5),
    supabase.from('placements')
      .select('*, job_postings(title)')
      .eq('nurse_id', nurseProfile?.id || '')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (!nurseProfile) redirect('/nurse/profile')

  // Nurses keep the full contract; the 15% platform fee is paid by the
  // employer on top, not deducted from the nurse's payout.
  const totalEarnings = placements
    ?.filter(p => p.escrow_status === 'released')
    .reduce((sum, p) => sum + p.contract_value, 0) || 0

  const profileComplete = !!(
    nurseProfile.license_number &&
    nurseProfile.specialty &&
    nurseProfile.bio &&
    nurseProfile.hourly_rate
  )

  const statusBadge = (status: string) => {
    const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      pending: 'warning',
      reviewing: 'info',
      offered: 'success',
      accepted: 'success',
      rejected: 'danger',
      withdrawn: 'default',
    }
    return map[status] || 'default'
  }

  const completionItems = [
    { done: !!nurseProfile.license_number, label: 'Add nursing license', href: '/nurse/profile' },
    { done: nurseProfile.license_verified, label: 'Verify license with Nursys', href: '/nurse/verify-license' },
    { done: nurseProfile.background_check_status === 'passed', label: 'Complete background check', href: '/nurse/profile#background-check' },
    { done: !!nurseProfile.bio, label: 'Write a profile bio', href: '/nurse/profile' },
  ]
  const completedSteps = completionItems.filter((item) => item.done).length

  return (
    <div className="role-bg-nurse flex flex-col min-h-screen">
      <Navbar userRole="nurse" userName={nurseProfile.full_name} />

      <main className="container-shell w-full flex-1 py-8 lg:py-10">
        {isWelcome && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border p-5" style={{ background: 'var(--plum-50)', borderColor: 'var(--plum-100)' }}>
            <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--plum)' }} />
            <div>
              <p className="font-semibold" style={{ color: 'var(--ink)' }}>Welcome to NurseSquare, {nurseProfile.full_name.split(' ')[0]}.</p>
              <p className="text-sm mt-1" style={{ color: 'var(--g600)' }}>
                Complete your profile and run your background check to start applying for jobs.
              </p>
            </div>
          </div>
        )}

        <section className="role-panel-nurse mb-8 rounded-lg border p-6 shadow-[var(--shadow-md)] lg:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase" style={{ background: 'var(--cream-mid)', color: 'var(--g600)' }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: nurseProfile.license_verified ? 'var(--sage)' : 'var(--tang)' }} />
                {nurseProfile.license_verified ? 'Verified nurse profile' : 'Profile setup in progress'}
              </div>
              <h1 className="text-[32px] font-bold leading-tight md:text-[42px]" style={{ color: 'var(--ink)' }}>
                Welcome back, {nurseProfile.full_name.split(' ')[0]}.
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7" style={{ color: 'var(--g600)' }}>
                Track applications, placements, credentials, and pay-package changes from one workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/nurse/jobs"><Button variant="primary">Browse jobs</Button></Link>
              <Link href="/nurse/ledger/new"><Button variant="outline">Add contract</Button></Link>
            </div>
          </div>
        </section>

        {/* Checklist */}
        {!profileComplete && (
          <Card className="mb-8" padding="lg">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold" style={{ color: 'var(--ink)' }}>
                  <AlertCircle className="h-4 w-4" style={{ color: 'var(--tang)' }} />
                  Finish profile setup
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--g600)' }}>
                  {completedSteps} of {completionItems.length} steps complete. Verified profiles appear stronger to hospitals.
                </p>
              </div>
              <div className="h-2 w-full rounded-full md:w-48" style={{ background: 'var(--cream-mid)' }}>
                <div className="h-2 rounded-full" style={{ width: `${(completedSteps / completionItems.length) * 100}%`, background: 'var(--plum)' }} />
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {completionItems.map(item => (
                <Link key={item.label} href={item.href} className="group flex items-center gap-3 rounded-lg border p-3 no-underline transition-colors hover:bg-[var(--cream-mid)]" style={{ borderColor: 'var(--g100)', color: 'var(--ink)' }}>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: item.done ? 'var(--sage)' : 'var(--cream-mid)', color: item.done ? 'white' : 'var(--g400)' }}>
                    {item.done ? <CheckCircle className="h-4 w-4" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-sm font-medium" style={{ color: item.done ? 'var(--g600)' : 'var(--ink)' }}>{item.label}</span>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Applications" value={applications?.length || 0} icon={Briefcase} tone="plum" />
          <StatCard label="Active placements" value={placements?.filter(p => p.escrow_status === 'held').length || 0} icon={Clock} />
          <StatCard label="Completed" value={placements?.filter(p => p.escrow_status === 'released').length || 0} icon={CheckCircle} tone="success" />
          <StatCard label="Total earned" value={formatCurrency(totalEarnings)} icon={DollarSign} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile status */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <h3 className="mb-4 flex items-center gap-2 font-semibold" style={{ color: 'var(--ink)' }}>
                <UserRound className="h-4 w-4" style={{ color: 'var(--plum)' }} />
                Profile status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--g600)' }}>License</span>
                  <Badge variant={nurseProfile.license_verified ? 'success' : 'warning'}>
                    {nurseProfile.license_verified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--g600)' }}>Background check</span>
                  <Badge variant={
                    nurseProfile.background_check_status === 'passed' ? 'success' :
                    nurseProfile.background_check_status === 'failed' ? 'danger' :
                    nurseProfile.background_check_status === 'in_progress' ? 'info' : 'warning'
                  }>
                    {nurseProfile.background_check_status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--g600)' }}>Availability</span>
                  <Badge variant={nurseProfile.availability === 'available' ? 'success' : 'default'}>
                    {nurseProfile.availability.replace('_', ' ')}
                  </Badge>
                </div>
                {nurseProfile.rating_count > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--g600)' }}>Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-[var(--gold)]" style={{ color: 'var(--gold)' }} />
                      <span className="text-sm font-semibold">{nurseProfile.rating_avg.toFixed(1)}</span>
                      <span className="text-xs" style={{ color: 'var(--g400)' }}>({nurseProfile.rating_count})</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--g100)' }}>
                <Link href="/nurse/profile" className="flex items-center gap-1 text-sm font-semibold no-underline" style={{ color: 'var(--plum)' }}>
                  Edit profile <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </Card>

            {nurseProfile.background_check_status === 'not_started' && (
              <Card style={{ background: 'var(--plum-50)' } as React.CSSProperties}>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--plum)' }} />
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>Run background check</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--g600)' }}>Required to apply for jobs. $20-30 via Checkr.</p>
                    <Link href="/nurse/profile#background-check" className="mt-2 inline-block text-xs font-semibold underline" style={{ color: 'var(--plum)' }}>
                      Start background check →
                    </Link>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Recent applications */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold" style={{ color: 'var(--ink)' }}>Recent applications</h3>
                <Link href="/nurse/applications" className="text-sm font-semibold no-underline" style={{ color: 'var(--plum)' }}>
                  View all →
                </Link>
              </div>

              {applications && applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.map((app: any) => (
                    <div key={app.id} className="flex items-center justify-between gap-4 rounded-xl border p-4 last:border" style={{ borderColor: 'var(--g100)' }}>
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--ink)' }}>{app.job_postings?.title}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--g600)' }}>
                          {app.job_postings?.employer_profiles?.org_name} · {app.job_postings?.city}, {app.job_postings?.state}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--g400)' }}>{formatDate(app.applied_at)}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={statusBadge(app.status)}>{app.status}</Badge>
                        <p className="text-xs font-semibold mt-2" style={{ color: 'var(--g800)' }}>
                          {formatCurrency(app.job_postings?.weekly_rate || 0)}/wk
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Briefcase className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--g400)' }} />
                  <p className="text-sm" style={{ color: 'var(--g600)' }}>No applications yet</p>
                  <Link href="/nurse/jobs" className="mt-3 inline-block text-sm font-semibold no-underline" style={{ color: 'var(--plum)' }}>
                    Browse open jobs →
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
