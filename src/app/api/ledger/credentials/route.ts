import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isErrorResponse } from '@/lib/ledger/access'
import { extractCredential } from '@/lib/ledger/credentials/extractor'
import { canonicalizeType, CredentialStatusSchema } from '@/lib/ledger/credentials/types'

const MAX_BYTES = 10 * 1024 * 1024

const ManualCreateSchema = z.object({
  type: z.string().min(1),
  display_name: z.string().optional(),
  status: CredentialStatusSchema.optional(),
  issued_at: z.iso.date().optional(),
  expires_at: z.iso.date().optional(),
  issuer: z.string().optional(),
  card_number: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET() {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx

  const { data, error } = await ctx.supabase
    .from('credentials')
    .select('*')
    .order('expires_at', { ascending: true, nullsFirst: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ credentials: data ?? [] })
}

export async function POST(req: NextRequest) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  if (ctx.role !== 'nurse' && ctx.role !== 'admin') {
    return NextResponse.json({ error: 'Only nurses can store credentials' }, { status: 403 })
  }

  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.startsWith('multipart/form-data')) {
    return handleMultipart(ctx, req)
  }

  const body = ManualCreateSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const type = canonicalizeType(body.data.type)
  const { data, error } = await ctx.supabase
    .from('credentials')
    .insert({
      user_id: ctx.userId,
      type,
      display_name: body.data.display_name ?? null,
      status: body.data.status ?? 'pending',
      issued_at: body.data.issued_at ?? null,
      expires_at: body.data.expires_at ?? null,
      issuer: body.data.issuer ?? null,
      card_number: body.data.card_number ?? null,
      notes: body.data.notes ?? null,
    })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ credential: data }, { status: 201 })
}

type AuthContext = Awaited<ReturnType<typeof requireAuth>> extends infer T
  ? T extends { supabase: unknown }
    ? T
    : never
  : never

async function handleMultipart(ctx: AuthContext, req: NextRequest) {
  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 })
  const file = form.get('document')
  if (!(file instanceof File)) return NextResponse.json({ error: 'document field required' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 })
  const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
  if (!allowed.includes(file.type)) return NextResponse.json({ error: 'PDF or image only' }, { status: 415 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const isPdf = file.type === 'application/pdf'

  const result = await extractCredential({
    pdfBase64: isPdf ? buffer.toString('base64') : undefined,
    imageBase64: isPdf ? undefined : buffer.toString('base64'),
    imageMediaType: isPdf ? undefined : (file.type as 'image/png' | 'image/jpeg' | 'image/webp'),
    userId: ctx.userId,
    onCall: async (log) => { await ctx.supabase.from('ledger_llm_calls').insert(log) },
  })

  const canonical = canonicalizeType(result.payload.type)
  const ext = isPdf ? 'pdf' : file.type.split('/')[1]
  const path = `${ctx.userId}/${canonical.toLowerCase()}-${Date.now()}.${ext}`

  const { error: upErr } = await ctx.supabase.storage
    .from('credentials')
    .upload(path, buffer, { contentType: file.type, upsert: false })
  if (upErr) return NextResponse.json({ error: `upload: ${upErr.message}` }, { status: 500 })

  const { data: signedUrl } = await ctx.supabase.storage
    .from('credentials')
    .createSignedUrl(path, 60 * 60 * 24 * 365)

  const manualType = (form.get('type') as string | null) ?? null
  const manualExpiresAt = (form.get('expires_at') as string | null) ?? null

  const { data, error } = await ctx.supabase
    .from('credentials')
    .insert({
      user_id: ctx.userId,
      type: manualType ? canonicalizeType(manualType) : canonical,
      display_name: result.payload.display_name,
      status: 'pending',
      issued_at: result.payload.issued_at,
      expires_at: manualExpiresAt ?? result.payload.expires_at,
      issuer: result.payload.issuer,
      card_number: result.payload.card_number,
      document_url: signedUrl?.signedUrl ?? null,
      document_path: path,
      extraction_confidence: result.payload.extraction_confidence,
      requires_review: result.needsReview,
      notes: result.payload.raw_notes,
    })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ credential: data, extraction: result.payload }, { status: 201 })
}
