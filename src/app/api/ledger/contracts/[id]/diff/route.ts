import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isErrorResponse } from '@/lib/ledger/access'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  const { id: contractId } = await params

  const { data, error } = await ctx.supabase
    .from('ledger_diffs')
    .select('*')
    .eq('contract_id', contractId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ diff: null }, { status: 200 })
  return NextResponse.json({ diff: data })
}
