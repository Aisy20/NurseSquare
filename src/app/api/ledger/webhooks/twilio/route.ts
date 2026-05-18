import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractPayPackage } from '@/lib/ledger/extractor'
import { verifyTwilioSignature } from '@/lib/ledger/webhook-verify'
import { computeAndPersistDiffIfReady } from '@/lib/ledger/persist'
import type { AuthContext } from '@/lib/ledger/access'

export async function POST(req: NextRequest) {
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!token) return NextResponse.json({ error: 'Twilio webhook not configured' }, { status: 503 })

  const rawForm = await req.formData()
  const params: Record<string, string> = {}
  rawForm.forEach((v, k) => { params[k] = typeof v === 'string' ? v : '' })

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/ledger/webhooks/twilio`
  if (!verifyTwilioSignature(token, url, params, req.headers.get('x-twilio-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const from = params.From
  const to = params.To
  const body = params.Body
  if (!from || !to || !body) return NextResponse.json({ error: 'Malformed payload' }, { status: 400 })

  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('forwarding_sms_number', to)
    .maybeSingle()

  if (!user) return NextResponse.json({ error: 'Unknown forwarding number' }, { status: 404 })

  const rawContent = `From: ${from}\n\n${body}`

  const { data: contract } = await supabase
    .from('ledger_contracts')
    .insert({ user_id: user.id, status: 'open' })
    .select('id')
    .single()
  if (!contract) return NextResponse.json({ error: 'Could not create contract' }, { status: 500 })

  const ctx: AuthContext = { supabase, userId: user.id, role: user.role }
  const result = await extractPayPackage({
    rawContent,
    sourceType: 'sms',
    userId: user.id,
    contractId: contract.id,
    onCall: async (log) => { await supabase.from('ledger_llm_calls').insert(log) },
  })

  const { data: quote } = await supabase
    .from('ledger_quotes')
    .insert({
      contract_id: contract.id,
      source_type: 'sms',
      raw_content: rawContent,
      extracted_payload: result.payload,
      confidence_score: result.payload.extraction_confidence,
      requires_review: result.needsReview,
    })
    .select('id')
    .single()

  if (quote) await computeAndPersistDiffIfReady(ctx, contract.id, quote.id)

  return NextResponse.json({ received: true, contract_id: contract.id, quote_id: quote?.id })
}
