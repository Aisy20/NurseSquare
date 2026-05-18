import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isErrorResponse } from '@/lib/ledger/access'

const PatchSchema = z.object({
  tax_home_state: z.string().length(2).nullable(),
})

export async function PATCH(req: NextRequest) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx

  const body = PatchSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const { error } = await ctx.supabase
    .from('users')
    .update({ tax_home_state: body.data.tax_home_state })
    .eq('id', ctx.userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tax_home_state: body.data.tax_home_state })
}
