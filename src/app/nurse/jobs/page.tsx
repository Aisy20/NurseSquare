export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import JobBoard from '@/components/jobs/JobBoard'

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
  if (user) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    userRole = profile?.role ?? null
    userName = user.email?.split('@')[0] ?? null
    if (userRole === 'nurse') {
      const { data: np } = await supabase.from('nurse_profiles').select('full_name').eq('user_id', user.id).single()
      userName = np?.full_name ?? userName
    }
  }

  const params = await searchParams
  const { specialty, state, q } = params

  let query = supabase
    .from('job_postings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (specialty) query = query.eq('specialty_required', specialty)
  if (state) query = query.eq('state', state)
  if (q) query = query.ilike('title', `%${q}%`)

  const { data: jobsData } = await query

  const employerIds = [...new Set((jobsData ?? []).map((j: any) => j.employer_id))]
  let employerMap: Record<string, any> = {}
  if (employerIds.length) {
    const { data: employers } = await supabase
      .from('public_employers')
      .select('id, org_name, city, state, type')
      .in('id', employerIds)
    employerMap = Object.fromEntries((employers ?? []).map((e: any) => [e.id, e]))
  }
  const jobs = (jobsData ?? []).map((j: any) => ({
    ...j,
    employer_profiles: employerMap[j.employer_id] ?? null,
  }))

  return (
    <JobBoard
      jobs={jobs}
      params={params}
      user={user}
      userRole={userRole}
      userName={userName}
    />
  )
}
