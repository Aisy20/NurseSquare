export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Briefcase, Users, DollarSign, Clock, Plus, ArrowRight, CheckCircle } from 'lucide-react'

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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar userRole="hospital" userName={employerProfile.org_name} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {isWelcome && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-green-900">Welcome to NurseSquare, {employerProfile.org_name}!</p>
              <p className="text-sm text-green-700 mt-1">
                Post your first job to start connecting with verified travel nurses.{' '}
                <Link href="/hospital/post-job" className="font-semibold underline">Post a job now →</Link>
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">{employerProfile.org_name}</p>
          </div>
          <Link href="/hospital/post-job">
            <button className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              <Plus className="w-4 h-4" />
              Post a Job
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Jobs', value: activeJobs, icon: Briefcase, color: 'blue' },
            { label: 'New Applicants', value: applications?.length || 0, icon: Users, color: 'green' },
            { label: 'Active Placements', value: placements?.filter(p => p.escrow_status === 'held').length || 0, icon: Clock, color: 'yellow' },
            { label: 'Total Spent', value: formatCurrency(totalSpent), icon: DollarSign, color: 'purple' },
          ].map(stat => (
            <Card key={stat.label} padding="sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${stat.color}-100`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active jobs */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Your Jobs</h2>
              <Link href="/hospital/post-job" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <Plus className="w-3 h-3" /> New job
              </Link>
            </div>

            {jobs && jobs.length > 0 ? (
              <div className="space-y-3">
                {jobs.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{job.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{job.city}, {job.state} · {job.specialty_required}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={job.status === 'active' ? 'success' : 'default'}>{job.status}</Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(job.weekly_rate)}/wk
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No jobs posted yet</p>
                <Link href="/hospital/post-job" className="mt-2 inline-block text-sm text-blue-600 font-semibold">
                  Post your first job →
                </Link>
              </div>
            )}
          </Card>

          {/* New applicants */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">New Applicants</h2>
              <Link href="/hospital/applicants" className="text-sm text-blue-600 hover:text-blue-800">
                View all <ArrowRight className="inline w-3 h-3" />
              </Link>
            </div>

            {applications && applications.length > 0 ? (
              <div className="space-y-3">
                {applications.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{app.nurse_profiles?.full_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {app.nurse_profiles?.specialty} · Applied for {app.job_postings?.title}
                      </p>
                    </div>
                    <Link
                      href={`/hospital/applicants/${app.id}`}
                      className="text-xs text-blue-600 font-semibold hover:text-blue-800"
                    >
                      Review →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No pending applicants</p>
                <p className="text-xs text-gray-400 mt-1">Post a job to start receiving applications</p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
