export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import { formatCurrency } from '@/lib/utils'
import { MapPin, Clock, Building2, Search, ArrowRight } from 'lucide-react'
import { SPECIALTIES, US_STATES } from '@/lib/utils'

interface SearchParams {
  specialty?: string
  state?: string
  q?: string
}

export default async function NurseJobsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole = null
  let userName = null
  let nurseProfile = null

  if (user) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    userRole = profile?.role
    userName = user.email?.split('@')[0]
    if (userRole === 'nurse') {
      const { data: np } = await supabase.from('nurse_profiles').select('*').eq('user_id', user.id).single()
      nurseProfile = np
      userName = np?.full_name ?? userName
    }
  }

  const params = await searchParams
  const { specialty, state, q } = params

  let query = supabase
    .from('job_postings')
    .select('*, employer_profiles(org_name, city, state, type)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (specialty) query = query.eq('specialty_required', specialty)
  if (state) query = query.eq('state', state)
  if (q) query = query.ilike('title', `%${q}%`)

  const { data: jobs } = await query

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole={userRole as 'nurse' | 'hospital' | 'admin' | null} userName={userName} />

      <main className="flex-1 max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-10 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-[36px]" style={{ color: 'var(--ink)' }}>Browse Jobs</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--g600)' }}>
            {jobs?.length || 0} positions available · No account required to browse
          </p>
        </div>

        {/* Filters */}
        <form className="flex flex-col sm:flex-row gap-3 mb-8 rounded-2xl border p-4"
          style={{ background: 'white', borderColor: 'var(--g100)' }}>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--g400)' }} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search job titles..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--g200)', color: 'var(--ink)' }}
            />
          </div>
          <select
            name="specialty"
            defaultValue={specialty}
            className="px-3 py-2.5 rounded-xl border text-sm focus:outline-none bg-white"
            style={{ borderColor: 'var(--g200)', color: 'var(--g800)' }}
          >
            <option value="">All specialties</option>
            {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            name="state"
            defaultValue={state}
            className="px-3 py-2.5 rounded-xl border text-sm focus:outline-none bg-white"
            style={{ borderColor: 'var(--g200)', color: 'var(--g800)' }}
          >
            <option value="">All states</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px"
            style={{ background: 'var(--plum)' }}>
            Filter
          </button>
        </form>

        {/* Job list */}
        {jobs && jobs.length > 0 ? (
          <div className="grid gap-4">
            {jobs.map((job: any) => (
              <div key={job.id} className="rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: 'white', borderColor: 'var(--g100)' }}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: 'var(--plum-50)', color: 'var(--plum-mid)' }}>
                        {job.specialty_required}
                      </span>
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                        style={{ background: 'var(--cream-mid)', color: 'var(--g600)' }}>
                        {job.duration_weeks}w contract
                      </span>
                      {job.start_date && (
                        <span className="text-xs" style={{ color: 'var(--g400)' }}>
                          Starts {new Date(job.start_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--ink)' }}>{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--g600)' }}>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {job.employer_profiles?.org_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.city}, {job.state}
                      </span>
                    </div>
                    {job.description && (
                      <p className="text-sm mt-3 line-clamp-2" style={{ color: 'var(--g400)' }}>{job.description}</p>
                    )}
                  </div>

                  <div className="sm:text-right shrink-0">
                    <div className="font-display text-2xl" style={{ color: 'var(--ink)' }}>
                      {formatCurrency(job.weekly_rate)}
                    </div>
                    <div className="text-sm mb-1" style={{ color: 'var(--g400)' }}>per week</div>
                    <div className="text-xs flex items-center sm:justify-end gap-1 mb-3" style={{ color: 'var(--g400)' }}>
                      <Clock className="w-3 h-3" />
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
                    <Link href={`/nurse/jobs/${job.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl text-white no-underline transition-all hover:-translate-y-px"
                      style={{ background: 'var(--plum)' }}>
                      View & Apply <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-2xl border" style={{ background: 'white', borderColor: 'var(--g100)' }}>
            <Search className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--g200)' }} />
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--g800)' }}>No jobs found</h3>
            <p className="text-sm" style={{ color: 'var(--g400)' }}>Try adjusting your filters or check back soon.</p>
          </div>
        )}

        {/* Guest CTA */}
        {!user && (
          <div className="mt-10 rounded-2xl p-8 text-center" style={{ background: 'var(--plum-deep)' }}>
            <p className="font-display text-2xl text-white mb-2">Ready to apply?</p>
            <p className="text-sm mb-5" style={{ color: 'var(--plum-100)' }}>Create a free account to apply directly to any job.</p>
            <Link href="/auth/register/nurse"
              className="inline-flex items-center gap-2 font-bold px-7 py-3 rounded-[14px] text-white no-underline"
              style={{ background: 'var(--tang)' }}>
              Join as a nurse <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
