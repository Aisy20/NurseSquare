import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const { jobId, nurseName } = await req.json()

  const supabase = await createClient()

  const { data: job } = await supabase
    .from('job_postings')
    .select('title, employer_profiles(user_id, users(email))')
    .eq('id', jobId)
    .single()

  if (!job) return NextResponse.json({ ok: false })

  const employerEmail = (job.employer_profiles as any)?.users?.email
  if (employerEmail) {
    await sendEmail({
      to: employerEmail,
      subject: `New application for ${job.title}`,
      html: emailTemplates.applicationReceived(nurseName, job.title),
    })
  }

  return NextResponse.json({ ok: true })
}
