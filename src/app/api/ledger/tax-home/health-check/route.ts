import { NextResponse } from 'next/server'
import { requireAuth, isErrorResponse } from '@/lib/ledger/access'
import { computeTaxHomeStatus, type ContractWindow } from '@/lib/taxhome/compute'

export async function GET() {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx

  const { data: user } = await ctx.supabase
    .from('users')
    .select('tax_home_state')
    .eq('id', ctx.userId)
    .single()

  const { data: contracts } = await ctx.supabase
    .from('ledger_contracts')
    .select('start_date, end_date, location_state')
    .eq('user_id', ctx.userId)

  const status = computeTaxHomeStatus(
    (contracts ?? []) as ContractWindow[],
    user?.tax_home_state ?? null,
  )
  return NextResponse.json({ status })
}
