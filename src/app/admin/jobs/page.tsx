export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Shield, ArrowLeft } from 'lucide-react'

export default async function AdminJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const { data: jobs } = await supabase
    .from('job_postings')
    .select('*, employer_profiles(org_name), applications(id)')
    .order('created_at', { ascending: false })

  const byStatus = {
    active: (jobs || []).filter(j => j.status === 'active').length,
    filled: (jobs || []).filter(j => j.status === 'filled').length,
    expired: (jobs || []).filter(j => j.status === 'expired').length,
    draft: (jobs || []).filter(j => j.status === 'draft').length,
    cancelled: (jobs || []).filter(j => j.status === 'cancelled').length,
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="admin" userName={profile.email?.split('@')[0]} />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium no-underline mb-6"
          style={{ color: 'var(--plum)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to overview
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5" style={{ color: 'var(--plum)' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--plum)' }}>Admin</span>
        </div>
        <h1 className="font-display text-[32px] mb-6" style={{ color: 'var(--ink)' }}>All jobs</h1>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {(['active', 'filled', 'draft', 'expired', 'cancelled'] as const).map(s => (
            <Card key={s}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--g400)' }}>{s}</p>
              <p className="font-display text-[24px]" style={{ color: 'var(--ink)' }}>{byStatus[s]}</p>
            </Card>
          ))}
        </div>

        <Card>
          {!jobs || jobs.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--g400)' }}>No jobs posted yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--g400)' }}>
                    <th className="text-left font-semibold py-2 px-2">Title</th>
                    <th className="text-left font-semibold py-2 px-2">Employer</th>
                    <th className="text-left font-semibold py-2 px-2">Location</th>
                    <th className="text-left font-semibold py-2 px-2">Specialty</th>
                    <th className="text-right font-semibold py-2 px-2">Rate</th>
                    <th className="text-right font-semibold py-2 px-2">Duration</th>
                    <th className="text-right font-semibold py-2 px-2">Applicants</th>
                    <th className="text-left font-semibold py-2 px-2">Status</th>
                    <th className="text-right font-semibold py-2 px-2">Posted</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--g100)' }}>
                  {jobs.map((j: any) => (
                    <tr key={j.id}>
                      <td className="py-3 px-2 font-medium" style={{ color: 'var(--ink)' }}>{j.title}</td>
                      <td className="py-3 px-2" style={{ color: 'var(--g600)' }}>{j.employer_profiles?.org_name}</td>
                      <td className="py-3 px-2" style={{ color: 'var(--g600)' }}>{j.city}, {j.state}</td>
                      <td className="py-3 px-2" style={{ color: 'var(--g600)' }}>{j.specialty_required}</td>
                      <td className="py-3 px-2 text-right" style={{ color: 'var(--g600)' }}>{formatCurrency(j.weekly_rate)}/w</td>
                      <td className="py-3 px-2 text-right" style={{ color: 'var(--g600)' }}>{j.duration_weeks}w</td>
                      <td className="py-3 px-2 text-right" style={{ color: 'var(--g600)' }}>{j.applications?.length || 0}</td>
                      <td className="py-3 px-2">
                        <Badge variant={
                          j.status === 'active' ? 'success' :
                          j.status === 'filled' ? 'info' :
                          j.status === 'cancelled' ? 'danger' : 'default'
                        }>{j.status}</Badge>
                      </td>
                      <td className="py-3 px-2 text-right text-xs" style={{ color: 'var(--g600)' }}>{formatDate(j.created_at)}</td>
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
