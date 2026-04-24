export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import { MessageSquare, ArrowRight } from 'lucide-react'

export default async function MessagesInboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', user.id)
    .single()

  const role = (profile?.role || null) as 'nurse' | 'hospital' | 'admin' | null
  const userName = profile?.email?.split('@')[0] || null

  let applications: any[] = []

  if (role === 'nurse') {
    const { data: nurseProfile } = await supabase
      .from('nurse_profiles')
      .select('id, full_name')
      .eq('user_id', user.id)
      .single()

    if (nurseProfile) {
      const { data } = await supabase
        .from('applications')
        .select('id, status, applied_at, job_postings(title, employer_profiles(org_name))')
        .eq('nurse_id', nurseProfile.id)
        .order('applied_at', { ascending: false })
      applications = data || []
    }
  } else if (role === 'hospital') {
    const { data: employerProfile } = await supabase
      .from('employer_profiles')
      .select('id, org_name')
      .eq('user_id', user.id)
      .single()

    if (employerProfile) {
      const { data: jobs } = await supabase
        .from('job_postings')
        .select('id')
        .eq('employer_id', employerProfile.id)

      const jobIds = (jobs || []).map(j => j.id)

      if (jobIds.length > 0) {
        const { data } = await supabase
          .from('applications')
          .select('id, status, applied_at, nurse_profiles(full_name), job_postings(title)')
          .in('job_id', jobIds)
          .order('applied_at', { ascending: false })
        applications = data || []
      }
    }
  }

  const applicationIds = applications.map(a => a.id)

  const threadMap = new Map<string, { count: number; lastBody: string; lastAt: string; unreadFromOther: number }>()

  if (applicationIds.length > 0) {
    const { data: messages } = await supabase
      .from('messages')
      .select('application_id, sender_id, body, read_at, created_at')
      .in('application_id', applicationIds)
      .order('created_at', { ascending: false })

    for (const msg of messages || []) {
      const existing = threadMap.get(msg.application_id)
      if (!existing) {
        threadMap.set(msg.application_id, {
          count: 1,
          lastBody: msg.body,
          lastAt: msg.created_at,
          unreadFromOther: msg.sender_id !== user.id && !msg.read_at ? 1 : 0,
        })
      } else {
        existing.count += 1
        if (msg.sender_id !== user.id && !msg.read_at) existing.unreadFromOther += 1
      }
    }
  }

  const sorted = applications.sort((a, b) => {
    const at = threadMap.get(a.id)?.lastAt || a.applied_at
    const bt = threadMap.get(b.id)?.lastAt || b.applied_at
    return new Date(bt).getTime() - new Date(at).getTime()
  })

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole={role} userName={userName} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="font-display text-[32px] mb-1" style={{ color: 'var(--ink)' }}>Messages</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--g600)' }}>
          {role === 'nurse'
            ? 'Conversations with hospitals about your applications.'
            : role === 'hospital'
            ? 'Conversations with nurses who applied to your jobs.'
            : 'Your conversations.'}
        </p>

        <Card>
          {sorted.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--g400)' }} />
              <p className="text-sm mb-4" style={{ color: 'var(--g600)' }}>
                {role === 'nurse'
                  ? 'No applications yet. Once you apply to a job, you can message the hospital here.'
                  : 'No applicants yet. Once nurses apply to your jobs, you can message them here.'}
              </p>
              <Link href={role === 'nurse' ? '/nurse/jobs' : '/hospital/post-job'}
                className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl text-white no-underline"
                style={{ background: role === 'nurse' ? 'var(--plum)' : 'var(--tang)' }}>
                {role === 'nurse' ? 'Browse jobs' : 'Post a job'} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--g100)' }}>
              {sorted.map((a: any) => {
                const thread = threadMap.get(a.id)
                const peerName = role === 'nurse'
                  ? a.job_postings?.employer_profiles?.org_name || 'Hospital'
                  : a.nurse_profiles?.full_name || 'Nurse'
                const jobTitle = a.job_postings?.title
                const hasUnread = (thread?.unreadFromOther || 0) > 0
                return (
                  <Link key={a.id} href={`/messages/${a.id}`}
                    className="block py-4 first:pt-0 last:pb-0 no-underline transition-colors hover:bg-[var(--cream-mid)] rounded-xl -mx-3 px-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{peerName}</p>
                          {hasUnread && (
                            <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--tang)' }} />
                          )}
                        </div>
                        <p className="text-xs mb-1" style={{ color: 'var(--g600)' }}>{jobTitle}</p>
                        <p className="text-sm truncate" style={{ color: thread?.lastBody ? 'var(--g600)' : 'var(--g400)', fontStyle: thread?.lastBody ? 'normal' : 'italic' }}>
                          {thread?.lastBody || 'No messages yet — start the conversation'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs" style={{ color: 'var(--g400)' }}>
                          {formatDate(thread?.lastAt || a.applied_at)}
                        </p>
                        {thread?.count ? (
                          <p className="text-xs mt-1" style={{ color: hasUnread ? 'var(--tang)' : 'var(--g400)' }}>
                            {thread.count} message{thread.count === 1 ? '' : 's'}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
