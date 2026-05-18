import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isErrorResponse } from '@/lib/ledger/access'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params

  const { data: recruiter } = await ctx.supabase
    .from('ledger_recruiters')
    .select('id, name, email, aggregate_score, contract_count, ledger_agencies(id, name)')
    .eq('id', id)
    .single()
  if (!recruiter) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: ratings } = await ctx.supabase
    .from('ledger_recruiter_ratings')
    .select('accuracy_score, notes, created_at')
    .eq('recruiter_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ recruiter, recent_ratings: ratings ?? [] })
}
