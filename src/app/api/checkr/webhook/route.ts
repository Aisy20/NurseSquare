import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-checkr-signature')
  const webhookSecret = process.env.CHECKR_WEBHOOK_SECRET

  if (webhookSecret && signature) {
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')

    if (signature !== expected) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const event = JSON.parse(body)
  const { type, data } = event

  if (type === 'report.completed') {
    const supabase = await createClient()
    const status = data.object.status === 'clear' ? 'passed' : 'failed'

    await supabase
      .from('nurse_profiles')
      .update({ background_check_status: status })
      .eq('checkr_candidate_id', data.object.candidate_id)
  }

  return NextResponse.json({ received: true })
}
