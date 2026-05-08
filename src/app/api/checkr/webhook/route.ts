import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Map Checkr's report.status to our background_check_status enum.
// `consider` means "non-disqualifying flag, needs human review" — not a hard
// fail. We surface it as `pending` so the nurse isn't permanently locked out
// while an admin reviews the report.
function mapReportStatus(checkrStatus: string): 'passed' | 'failed' | 'pending' {
  if (checkrStatus === 'clear') return 'passed'
  if (checkrStatus === 'consider') return 'pending'
  return 'failed'
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-checkr-signature')
  const webhookSecret = process.env.CHECKR_WEBHOOK_SECRET

  // Fail closed: missing secret or missing signature both reject. Previously
  // the route accepted any payload when either was absent, which let anyone
  // mark a nurse as `passed` if CHECKR_WEBHOOK_SECRET dropped from env.
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  // Constant-time compare so signature validation doesn't leak via timing.
  const sigBuf = Buffer.from(signature, 'utf8')
  const expBuf = Buffer.from(expected, 'utf8')
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  const { type, data } = event
  const candidateId: string | undefined = data?.object?.candidate_id

  // Only act on events that affect background_check_status. Anything else
  // (candidate.created, etc.) we acknowledge without DB writes.
  let nextStatus: 'passed' | 'failed' | 'pending' | 'in_progress' | 'not_started' | null = null
  switch (type) {
    case 'report.completed':
      nextStatus = mapReportStatus(data.object.status)
      break
    case 'report.suspended':
      // Checkr halted the report (typically due to candidate non-response).
      nextStatus = 'failed'
      break
    case 'report.disputed':
      // Candidate disputed a finding. Hold in `pending` while it's resolved.
      nextStatus = 'pending'
      break
    case 'invitation.expired':
      // Candidate never completed the invitation. Reset so they can retry.
      nextStatus = 'not_started'
      break
  }

  if (nextStatus && candidateId) {
    const supabase = await createClient()
    await supabase
      .from('nurse_profiles')
      .update({ background_check_status: nextStatus })
      .eq('checkr_candidate_id', candidateId)
  }

  return NextResponse.json({ received: true })
}
