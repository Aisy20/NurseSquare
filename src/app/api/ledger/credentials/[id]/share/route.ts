import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { z } from 'zod'
import { requireAuth, isErrorResponse } from '@/lib/ledger/access'

const Schema = z.object({
  expires_in_days: z.number().int().min(1).max(365).optional(),
  expose_document: z.boolean().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  const { id } = await params

  const { data: credential } = await ctx.supabase
    .from('credentials')
    .select('id, user_id')
    .eq('id', id)
    .single()
  if (!credential) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (credential.user_id !== ctx.userId && ctx.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = Schema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const slug = crypto.randomBytes(9).toString('base64url')
  const expiresAt = body.data.expires_in_days
    ? new Date(Date.now() + body.data.expires_in_days * 86_400_000).toISOString()
    : null

  const { data: link, error } = await ctx.supabase
    .from('credential_share_links')
    .insert({
      credential_id: id,
      slug,
      created_by: ctx.userId,
      expires_at: expiresAt,
      expose_document: body.data.expose_document ?? false,
    })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
  return NextResponse.json({ share_link: { ...link, url: `${base}/share/credential/${link.slug}` } }, { status: 201 })
}
