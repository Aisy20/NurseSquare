export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import StatCard from '@/components/ui/StatCard'
import { formatCurrency } from '@/lib/utils'
import { Briefcase, Users, DollarSign, Clock, Plus, ArrowRight, CheckCircle, Building2 } from 'lucide-react'

export default async function HospitalDashboard({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const params = await searchParams
  const isWelcome = params.welcome === 'true'

  const { data: employerProfile } = await supabase
    .from('employer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!employerProfile) redirect('/hospital/profile')

  const [{ data: jobs }, { data: applications }, { data: placements }] = await Promise.all([
    supabase.from('job_postings')
      .select('*, applications(count)')
      .eq('employer_id', employerProfile.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('applications')
      .select('*, nurse_profiles(full_name, specialty, rating_avg), job_postings(title)')
      .in('job_id',
        (await supabase.from('job_postings').select('id').eq('employer_id', employerProfile.id)).data?.map(j => j.id) || []
      )
      .eq('status', 'pending')
      .order('applied_at', { ascending: false })
      .limit(5),
    supabase.from('placements')
      .select('*')
      .eq('employer_id', employerProfile.id),
  ])

  const totalSpent = placements?.reduce((sum, p) => sum + p.contract_value, 0) || 0
  const activeJobs = jobs?.filter(j => j.status === 'active').length || 0

  return (
    <div className="role-bg-hospital flex flex-col min-h-screen">
      <Navbar userRole="hospital" userName={employerProfile.org_name} />

      <main className="container-shell w-full flex-1 py-8 lg:py-10">
        {isWelcome && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border p-5" style={{ background: 'var(--sage-50)', borderColor: 'rgba(58,168,118,0.25)' }}>
            <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--sage)' }} />
            <div>
              <p className="font-semibold" style={{ color: 'var(--ink)' }}>Welcome to NurseSquare, {employerProfile.org_name}.</p>
              <p className="text-sm mt-1" style={{ color: 'var(--g600)' }}>
                Post your first job to start connecting with verified travel nurses.{' '}
                <Link href="/hospital/post-job" className="font-semibold underline" style={{ color: 'var(--plum)' }}>Post a job now →</Link>
              </p>
            </div>
          </div>
        )}

        <section className="role-panel-hospital mb-8 rounded-lg border p-6 shadow-[var(--shadow-md)] lg:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase" style={{ background: 'white', color: 'var(--hospital-accent)' }}>
                <Building2 className="h-3.5 w-3.5" />
                Hiring workspace
              </div>
              <h1 className="text-[32px] font-bold leading-tight md:text-[42px]" style={{ color: 'var(--ink)' }}>
                {employerProfile.org_name}
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7" style={{ color: 'var(--g600)' }}>
                Manage open roles, review applicants, and keep payment and placement activity in one operational view.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/hospital/post-job">
                <Button variant="tang">
                  <Plus className="mr-2 h-4 w-4" />
                  Post a job
                </Button>
              </Link>
              <Link href="/hospital/nurses"><Button variant="outline">Browse nurses</Button></Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active jobs" value={activeJobs} icon={Briefcase} tone="plum" />
          <StatCard label="New applicants" value={applications?.length || 0} icon={Users} tone="success" />
          <StatCard label="Active placements" value={placements?.filter(p => p.escrow_status === 'held').length || 0} icon={Clock} />
          <StatCard label="Total spent" value={formatCurrency(totalSpent)} icon={DollarSign} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active jobs */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold" style={{ color: 'var(--ink)' }}>Your jobs</h2>
              <Link href="/hospital/post-job" className="flex items-center gap-1 text-sm font-semibold no-underline" style={{ color: 'var(--plum)' }}>
                <Plus className="w-3 h-3" /> New job
              </Link>
            </div>

            {jobs && jobs.length > 0 ? (
              <div className="space-y-3">
                {jobs.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between gap-4 rounded-xl border p-4" style={{ borderColor: 'var(--g100)' }}>
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--ink)' }}>{job.title}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--g600)' }}>{job.city}, {job.state} · {job.specialty_required}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={job.status === 'active' ? 'success' : 'default'}>{job.status}</Badge>
                      <p className="text-xs mt-2" style={{ color: 'var(--g600)' }}>
                        {formatCurrency(job.weekly_rate)}/wk
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--g400)' }} />
                <p className="text-sm" style={{ color: 'var(--g600)' }}>No jobs posted yet</p>
                <Link href="/hospital/post-job" className="mt-2 inline-block text-sm font-semibold no-underline" style={{ color: 'var(--plum)' }}>
                  Post your first job →
                </Link>
              </div>
            )}
          </Card>

          {/* New applicants */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold" style={{ color: 'var(--ink)' }}>New applicants</h2>
              <Link href="/hospital/applicants" className="text-sm font-semibold no-underline" style={{ color: 'var(--plum)' }}>
                View all <ArrowRight className="inline w-3 h-3" />
              </Link>
            </div>

            {applications && applications.length > 0 ? (
              <div className="space-y-3">
                {applications.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between gap-4 rounded-xl border p-4" style={{ borderColor: 'var(--g100)' }}>
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--ink)' }}>{app.nurse_profiles?.full_name}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--g600)' }}>
                        {app.nurse_profiles?.specialty} · Applied for {app.job_postings?.title}
                      </p>
                    </div>
                    <Link
                      href={`/hospital/applicants/${app.id}`}
                      className="text-xs font-semibold no-underline"
                      style={{ color: 'var(--plum)' }}
                    >
                      Review →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--g400)' }} />
                <p className="text-sm" style={{ color: 'var(--g600)' }}>No pending applicants</p>
                <p className="text-xs mt-1" style={{ color: 'var(--g400)' }}>Post a job to start receiving applications</p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
