export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MapPin, Clock, Briefcase, MessageSquare } from 'lucide-react'

export default async function NurseApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: nurseProfile } = await supabase
    .from('nurse_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: applications } = await supabase
    .from('applications')
    .select('*, job_postings(*, employer_profiles(org_name))')
    .eq('nurse_id', nurseProfile?.id || '')
    .order('applied_at', { ascending: false })

  const statusBadge = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
    const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      pending: 'warning', reviewing: 'info', offered: 'success',
      accepted: 'success', rejected: 'danger', withdrawn: 'default',
    }
    return map[status] || 'default'
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar userRole="nurse" userName={nurseProfile?.full_name} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Link href="/nurse/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium no-underline mb-6 transition-opacity hover:opacity-70"
          style={{ color: 'var(--plum)' }}>
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Applications</h1>
        <p className="text-gray-500 mb-8">{applications?.length || 0} total applications</p>

        {applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app: any) => {
              const job = app.job_postings
              return (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="info">{job?.specialty_required}</Badge>
                        <Badge variant={statusBadge(app.status)}>{app.status}</Badge>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{job?.title}</h3>
                      <p className="text-sm text-gray-600">{job?.employer_profiles?.org_name}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />{job?.city}, {job?.state}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />{job?.duration_weeks}w contract
                        </span>
                      </div>
                      {app.cover_note && (
                        <p className="text-xs text-gray-400 mt-2 italic line-clamp-1">&ldquo;{app.cover_note}&rdquo;</p>
                      )}
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(job?.weekly_rate || 0)}/wk</p>
                      <p className="text-xs text-gray-500 mt-1">Applied {formatDate(app.applied_at)}</p>
                      {app.status === 'offered' && (
                        <div className="mt-2 bg-green-50 border border-green-200 text-green-800 text-xs rounded-lg px-3 py-1.5 font-semibold">
                          You have an offer!
                        </div>
                      )}
                      <Link href={`/messages/${app.id}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold no-underline"
                        style={{ color: 'var(--plum)' }}>
                        <MessageSquare className="w-3.5 h-3.5" /> Message hospital
                      </Link>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No applications yet</h3>
            <p className="text-gray-500 mt-1">Browse jobs and apply directly to hospitals.</p>
            <Link href="/nurse/jobs" className="mt-4 inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Browse Jobs
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
