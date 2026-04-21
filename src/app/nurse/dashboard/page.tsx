export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Briefcase, CheckCircle, Clock, DollarSign, AlertCircle,
  ArrowRight, Star, Shield
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

  const totalEarnings = placements
    ?.filter(p => p.escrow_status === 'released')
    .reduce((sum, p) => sum + (p.contract_value - p.platform_fee), 0) || 0

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar userRole="nurse" userName={nurseProfile.full_name} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {isWelcome && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-blue-900">Welcome to NurseSquare, {nurseProfile.full_name.split(' ')[0]}!</p>
              <p className="text-sm text-blue-700 mt-1">
                Complete your profile and run your background check to start applying for jobs.
              </p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {nurseProfile.full_name.split(' ')[0]}</p>
        </div>

        {/* Checklist */}
        {!profileComplete && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Complete your profile to start applying
            </h3>
            <div className="space-y-2">
              {[
                { done: !!nurseProfile.license_number, label: 'Add your nursing license', href: '/nurse/profile' },
                { done: nurseProfile.license_verified, label: 'License verified via Nursys', href: '/nurse/profile' },
                { done: nurseProfile.background_check_status === 'passed', label: 'Complete background check ($20–30 via Checkr)', href: '/nurse/profile#background-check' },
                { done: !!nurseProfile.bio, label: 'Write a bio', href: '/nurse/profile' },
              ].map(item => (
                <Link key={item.label} href={item.href} className="flex items-center gap-3 hover:text-blue-700 group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    item.done ? 'border-green-500 bg-green-500' : 'border-gray-300 group-hover:border-blue-500'
                  }`}>
                    {item.done && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                  {!item.done && <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />}
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Applications', value: applications?.length || 0, icon: Briefcase, color: 'blue' },
            { label: 'Active Placements', value: placements?.filter(p => p.escrow_status === 'held').length || 0, icon: Clock, color: 'yellow' },
            { label: 'Completed', value: placements?.filter(p => p.escrow_status === 'released').length || 0, icon: CheckCircle, color: 'green' },
            { label: 'Total Earned', value: formatCurrency(totalEarnings), icon: DollarSign, color: 'purple' },
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile status */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Profile Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">License</span>
                  <Badge variant={nurseProfile.license_verified ? 'success' : 'warning'}>
                    {nurseProfile.license_verified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Background Check</span>
                  <Badge variant={
                    nurseProfile.background_check_status === 'passed' ? 'success' :
                    nurseProfile.background_check_status === 'failed' ? 'danger' :
                    nurseProfile.background_check_status === 'in_progress' ? 'info' : 'warning'
                  }>
                    {nurseProfile.background_check_status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Availability</span>
                  <Badge variant={nurseProfile.availability === 'available' ? 'success' : 'default'}>
                    {nurseProfile.availability.replace('_', ' ')}
                  </Badge>
                </div>
                {nurseProfile.rating_count > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold">{nurseProfile.rating_avg.toFixed(1)}</span>
                      <span className="text-xs text-gray-500">({nurseProfile.rating_count})</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href="/nurse/profile" className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1">
                  Edit profile <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </Card>

            {nurseProfile.background_check_status === 'not_started' && (
              <Card className="border-blue-200 bg-blue-50">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900 text-sm">Run background check</p>
                    <p className="text-xs text-blue-700 mt-1">Required to apply for jobs. $20–30 via Checkr.</p>
                    <Link href="/nurse/profile#background-check" className="mt-2 inline-block text-xs font-semibold text-blue-700 underline">
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
                <h3 className="font-semibold text-gray-900">Recent Applications</h3>
                <Link href="/nurse/applications" className="text-sm text-blue-600 hover:text-blue-800">
                  View all →
                </Link>
              </div>

              {applications && applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.map((app: any) => (
                    <div key={app.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{app.job_postings?.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {app.job_postings?.employer_profiles?.org_name} · {app.job_postings?.city}, {app.job_postings?.state}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(app.applied_at)}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={statusBadge(app.status)}>{app.status}</Badge>
                        <p className="text-xs font-semibold text-gray-700 mt-1">
                          {formatCurrency(app.job_postings?.weekly_rate || 0)}/wk
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No applications yet</p>
                  <Link href="/nurse/jobs" className="mt-3 inline-block text-sm text-blue-600 font-semibold hover:text-blue-800">
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
