import { NextResponse } from 'next/server'
import { requireAuth, isErrorResponse } from '@/lib/ledger/access'
import { loadTaxHomeStatus } from '@/lib/taxhome/load'

export async function GET() {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx

  const status = await loadTaxHomeStatus(ctx)
  return NextResponse.json({ status })
}
