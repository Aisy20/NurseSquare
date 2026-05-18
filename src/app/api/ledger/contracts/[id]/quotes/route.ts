import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isErrorResponse, loadContractForOwner } from '@/lib/ledger/access'
import { extractPayPackage } from '@/lib/ledger/extractor'
import { SourceTypeSchema } from '@/lib/ledger/types'
import { computeAndPersistDiffIfReady } from '@/lib/ledger/persist'

const CreateQuoteSchema = z.object({
  source_type: SourceTypeSchema,
  raw_content: z.string().min(1),
  received_at: z.iso.datetime().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  const { id: contractId } = await params
  const owner = await loadContractForOwner(ctx, contractId)
  if (isErrorResponse(owner)) return owner

  const body = CreateQuoteSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const result = await extractPayPackage({
    rawContent: body.data.raw_content,
    sourceType: body.data.source_type,
    userId: ctx.userId,
    contractId,
    onCall: async (log) => {
      await ctx.supabase.from('ledger_llm_calls').insert(log)
    },
  })

  const { data: quote, error } = await ctx.supabase
    .from('ledger_quotes')
    .insert({
      contract_id: contractId,
      source_type: body.data.source_type,
      raw_content: body.data.raw_content,
      extracted_payload: result.payload,
      confidence_score: result.payload.extraction_confidence,
      requires_review: result.needsReview,
      received_at: body.data.received_at ?? new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await computeAndPersistDiffIfReady(ctx, contractId, quote.id)

  return NextResponse.json({ quote }, { status: 201 })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  const { id: contractId } = await params

  const { data, error } = await ctx.supabase
    .from('ledger_quotes')
    .select('*')
    .eq('contract_id', contractId)
    .order('received_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quotes: data ?? [] })
}
