import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isErrorResponse, loadContractForOwner } from '@/lib/ledger/access'

const PatchSchema = z.object({
  status: z.enum(['open', 'signed', 'completed', 'cancelled', 'archived']).optional(),
  specialty: z.string().optional(),
  location_city: z.string().optional(),
  location_state: z.string().length(2).optional(),
  start_date: z.iso.date().optional(),
  end_date: z.iso.date().optional(),
  placement_id: z.string().uuid().nullable().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params

  // RLS scopes the join; selecting * pulls everything the caller is entitled to.
  const { data: contract, error } = await ctx.supabase
    .from('ledger_contracts')
    .select('*, ledger_agencies(*), ledger_recruiters(*), ledger_quotes(*), ledger_signed_contracts(*), ledger_diffs(*)')
    .eq('id', id)
    .single()

  if (error || !contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ contract })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params
  const owner = await loadContractForOwner(ctx, id)
  if (isErrorResponse(owner)) return owner

  const body = PatchSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const update: Record<string, unknown> = { ...body.data }
  if (body.data.status === 'signed' && !owner) update.signed_at = new Date().toISOString()

  const { data, error } = await ctx.supabase
    .from('ledger_contracts')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contract: data })
}
