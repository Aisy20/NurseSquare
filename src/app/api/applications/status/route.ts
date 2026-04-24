import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/resend'

const VALID_STATUSES = ['pending', 'reviewing', 'offered', 'accepted', 'rejected', 'withdrawn'] as const

export async function POST(req: NextRequest) {
  const { applicationId, status } = await req.json()

  if (!applicationId || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error: updateErr } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  const { data: app } = await supabase
    .from('applications')
    .select('job_postings(title), nurse_profiles(user_id, users(email))')
    .eq('id', applicationId)
    .single()

  const nurseEmail = (app?.nurse_profiles as any)?.users?.email
  const jobTitle = (app?.job_postings as any)?.title

  if (nurseEmail && jobTitle && process.env.RESEND_API_KEY) {
    sendEmail({
      to: nurseEmail,
      subject: `Application update: ${jobTitle}`,
      html: emailTemplates.applicationStatusUpdate(jobTitle, status),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
