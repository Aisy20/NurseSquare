import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isErrorResponse } from '@/lib/ledger/access'
import { isAhaVerifiable, verifyWithAha } from '@/lib/ledger/credentials/aha'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params

  const { data: credential } = await ctx.supabase
    .from('credentials')
    .select('*')
    .eq('id', id)
    .single()
  if (!credential) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (credential.user_id !== ctx.userId && ctx.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isAhaVerifiable(credential.type)) {
    return NextResponse.json({
      error: `Only AHA credentials (BLS, ACLS, PALS) support verify-with-AHA. ${credential.type} not supported.`,
    }, { status: 400 })
  }

  const result = await verifyWithAha({
    type: credential.type,
    card_number: credential.card_number,
    issuer: credential.issuer,
  })

  const update: Record<string, unknown> = {
    verification_source: result.source,
    notes: result.detail ?? credential.notes,
  }
  if (result.verified) update.status = 'verified'
  else if (result.status === 'rejected') update.status = 'rejected'

  const { data, error } = await ctx.supabase
    .from('credentials')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ credential: data, verification: result })
}
