export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Star, Shield, CheckCircle } from 'lucide-react'

export default async function ApplicantsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: employerProfile } = await supabase
    .from('employer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!employerProfile) redirect('/hospital/profile')

  const { data: jobIds } = await supabase
    .from('job_postings')
    .select('id')
    .eq('employer_id', employerProfile.id)

  const ids = jobIds?.map(j => j.id) || []

  const { data: applications } = await supabase
    .from('applications')
    .select('*, nurse_profiles(*), job_postings(title, weekly_rate, duration_weeks, specialty_required)')
    .in('job_id', ids)
    .order('applied_at', { ascending: false })

  const statusBadge = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
    const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      pending: 'warning', reviewing: 'info', offered: 'success',
      accepted: 'success', rejected: 'danger', withdrawn: 'default',
    }
    return map[status] || 'default'
  }

  const byStatus = (status: string) => applications?.filter(a => a.status === status) || []

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar userRole="hospital" userName={employerProfile.org_name} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Link href="/hospital/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium no-underline mb-6 transition-opacity hover:opacity-70"
          style={{ color: 'var(--tang-mid)' }}>
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Applicant Management</h1>

        {/* Summary tabs */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-1">
          {[
            { label: 'All', count: applications?.length || 0 },
            { label: 'Pending', count: byStatus('pending').length },
            { label: 'Reviewing', count: byStatus('reviewing').length },
            { label: 'Offered', count: byStatus('offered').length },
            { label: 'Accepted', count: byStatus('accepted').length },
          ].map(tab => (
            <div key={tab.label} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm whitespace-nowrap">
              <span className="font-medium text-gray-700">{tab.label}</span>
              <span className="bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs font-bold">{tab.count}</span>
            </div>
          ))}
        </div>

        {applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app: any) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                      {app.nurse_profiles?.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{app.nurse_profiles?.full_name}</h3>
                        <Badge variant={statusBadge(app.status)}>{app.status}</Badge>
                        {app.nurse_profiles?.license_verified && (
                          <span className="flex items-center gap-1 text-xs text-green-700">
                            <CheckCircle className="w-3 h-3" /> Licensed
                          </span>
                        )}
                        {app.nurse_profiles?.background_check_status === 'passed' && (
                          <span className="flex items-center gap-1 text-xs text-blue-700">
                            <Shield className="w-3 h-3" /> BGC
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {app.nurse_profiles?.specialty} · {app.nurse_profiles?.years_exp}y exp ·{' '}
                        {formatCurrency(app.nurse_profiles?.hourly_rate || 0)}/hr
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied for: <span className="font-medium">{app.job_postings?.title}</span> · {formatDate(app.applied_at)}
                      </p>
                      {app.cover_note && (
                        <p className="text-xs text-gray-500 mt-2 italic line-clamp-1">&ldquo;{app.cover_note}&rdquo;</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    {app.nurse_profiles?.rating_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-semibold">{app.nurse_profiles?.rating_avg?.toFixed(1)}</span>
                      </div>
                    )}
                    <Link
                      href={`/hospital/applicants/${app.id}`}
                      className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Review Application
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500">No applications yet. Post a job to start receiving applications.</p>
            <Link href="/hospital/post-job" className="mt-3 inline-block text-blue-600 font-semibold hover:text-blue-800">
              Post a job →
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
