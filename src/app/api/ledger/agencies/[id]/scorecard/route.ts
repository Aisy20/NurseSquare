import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isErrorResponse } from '@/lib/ledger/access'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params

  const { data: agency } = await ctx.supabase
    .from('ledger_agencies')
    .select('id, name, aggregate_score, contract_count, created_at')
    .eq('id', id)
    .single()
  if (!agency) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: recruiters } = await ctx.supabase
    .from('ledger_recruiters')
    .select('id, name, aggregate_score, contract_count')
    .eq('agency_id', id)
    .order('aggregate_score', { ascending: false })

  return NextResponse.json({ agency, recruiters: recruiters ?? [] })
}
