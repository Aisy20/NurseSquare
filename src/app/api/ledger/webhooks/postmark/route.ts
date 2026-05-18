import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractPayPackage } from '@/lib/ledger/extractor'
import { verifyPostmarkBasicAuth } from '@/lib/ledger/webhook-verify'
import { computeAndPersistDiffIfReady } from '@/lib/ledger/persist'
import type { AuthContext } from '@/lib/ledger/access'

interface PostmarkInbound {
  From: string
  FromName?: string
  To?: string
  ToFull?: { Email: string }[]
  Subject?: string
  TextBody?: string
  HtmlBody?: string
  MessageID?: string
}

export async function POST(req: NextRequest) {
  const secret = process.env.POSTMARK_INBOUND_SECRET
  if (!secret) return NextResponse.json({ error: 'Postmark webhook not configured' }, { status: 503 })

  if (!verifyPostmarkBasicAuth(req.headers.get('authorization'), secret)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const payload = (await req.json().catch(() => null)) as PostmarkInbound | null
  if (!payload?.From || !payload.TextBody) {
    return NextResponse.json({ error: 'Malformed payload' }, { status: 400 })
  }

  const recipient = payload.ToFull?.[0]?.Email?.toLowerCase() ?? payload.To?.toLowerCase()
  if (!recipient) return NextResponse.json({ error: 'No recipient' }, { status: 400 })

  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('forwarding_email', recipient)
    .maybeSingle()

  if (!user) return NextResponse.json({ error: 'Unknown forwarding address' }, { status: 404 })

  const subject = payload.Subject ?? ''
  const rawContent = `From: ${payload.FromName ?? payload.From} <${payload.From}>\nSubject: ${subject}\n\n${payload.TextBody}`

  const { data: contract } = await supabase
    .from('ledger_contracts')
    .insert({ user_id: user.id, status: 'open', specialty: subject.length ? subject.slice(0, 80) : null })
    .select('id')
    .single()
  if (!contract) return NextResponse.json({ error: 'Could not create contract' }, { status: 500 })

  const ctx: AuthContext = { supabase, userId: user.id, role: user.role }
  const result = await extractPayPackage({
    rawContent,
    sourceType: 'email',
    userId: user.id,
    contractId: contract.id,
    onCall: async (log) => { await supabase.from('ledger_llm_calls').insert(log) },
  })

  const { data: quote } = await supabase
    .from('ledger_quotes')
    .insert({
      contract_id: contract.id,
      source_type: 'email',
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
