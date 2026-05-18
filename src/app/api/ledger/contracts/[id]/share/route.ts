import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { z } from 'zod'
import { requireAuth, isErrorResponse, loadContractForOwner } from '@/lib/ledger/access'

const ShareSchema = z.object({
  expires_in_days: z.number().int().min(1).max(365).optional(),
})

function generateSlug() {
  return crypto.randomBytes(9).toString('base64url')
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  const { id: contractId } = await params
  const owner = await loadContractForOwner(ctx, contractId)
  if (isErrorResponse(owner)) return owner

  const body = ShareSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const { data: diff } = await ctx.supabase
    .from('ledger_diffs')
    .select('id')
    .eq('contract_id', contractId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!diff) return NextResponse.json({ error: 'No diff available yet for this contract' }, { status: 409 })

  const expiresAt = body.data.expires_in_days
    ? new Date(Date.now() + body.data.expires_in_days * 86_400_000).toISOString()
    : null

  const { data: link, error } = await ctx.supabase
    .from('ledger_share_links')
    .insert({
      diff_id: diff.id,
      slug: generateSlug(),
      created_by: ctx.userId,
      expires_at: expiresAt,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
  return NextResponse.json({ share_link: { ...link, url: `${base}/share/${link.slug}` } }, { status: 201 })
}
