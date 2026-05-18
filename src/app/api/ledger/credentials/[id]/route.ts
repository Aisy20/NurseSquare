import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isErrorResponse } from '@/lib/ledger/access'
import { canonicalizeType, CredentialStatusSchema } from '@/lib/ledger/credentials/types'

const PatchSchema = z.object({
  type: z.string().optional(),
  display_name: z.string().nullable().optional(),
  status: CredentialStatusSchema.optional(),
  issued_at: z.iso.date().nullable().optional(),
  expires_at: z.iso.date().nullable().optional(),
  issuer: z.string().nullable().optional(),
  card_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

async function loadOwned(ctx: Awaited<ReturnType<typeof requireAuth>>, id: string) {
  if (isErrorResponse(ctx)) return ctx
  const { data, error } = await ctx.supabase
    .from('credentials')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (ctx.role !== 'admin' && data.user_id !== ctx.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return data
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params
  const row = await loadOwned(ctx, id)
  if (row instanceof NextResponse) return row
  return NextResponse.json({ credential: row })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params
  const row = await loadOwned(ctx, id)
  if (row instanceof NextResponse) return row

  const body = PatchSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const update: Record<string, unknown> = { ...body.data }
  if (body.data.type) update.type = canonicalizeType(body.data.type)

  const { data, error } = await ctx.supabase
    .from('credentials')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ credential: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params
  const row = await loadOwned(ctx, id)
  if (row instanceof NextResponse) return row

  if (row.document_path) {
    await ctx.supabase.storage.from('credentials').remove([row.document_path])
  }
  const { error } = await ctx.supabase.from('credentials').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
