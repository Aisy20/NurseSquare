import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isErrorResponse, loadContractForOwner } from '@/lib/ledger/access'

const RateSchema = z.object({
  accuracy_score: z.number().int().min(1).max(5),
  notes: z.string().max(2000).optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  const { id: contractId } = await params
  const owner = await loadContractForOwner(ctx, contractId)
  if (isErrorResponse(owner)) return owner

  const body = RateSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const { data: contract } = await ctx.supabase
    .from('ledger_contracts')
    .select('recruiter_id')
    .eq('id', contractId)
    .single()

  if (!contract?.recruiter_id) {
    return NextResponse.json({ error: 'Contract has no recruiter to rate' }, { status: 409 })
  }

  const { data, error } = await ctx.supabase
    .from('ledger_recruiter_ratings')
    .upsert(
      {
        user_id: ctx.userId,
        recruiter_id: contract.recruiter_id,
        contract_id: contractId,
        accuracy_score: body.data.accuracy_score,
        notes: body.data.notes,
      },
      { onConflict: 'user_id,recruiter_id,contract_id' },
    )
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rating: data }, { status: 201 })
}
