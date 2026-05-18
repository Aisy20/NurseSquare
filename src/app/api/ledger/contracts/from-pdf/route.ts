import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isErrorResponse } from '@/lib/ledger/access'
import { extractPayPackageFromPdf } from '@/lib/ledger/extractor'
import { resolveAgency, resolveRecruiter } from '@/lib/ledger/resolve'

const MAX_PDF_BYTES = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  if (ctx.role !== 'nurse' && ctx.role !== 'admin') {
    return NextResponse.json({ error: 'Only nurses can create ledger contracts' }, { status: 403 })
  }

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 })
  const file = form.get('pdf')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'pdf field required (multipart/form-data)' }, { status: 400 })
  }
  if (file.size > MAX_PDF_BYTES) return NextResponse.json({ error: 'PDF too large (max 10MB)' }, { status: 413 })
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Only application/pdf accepted' }, { status: 415 })

  const agencyName = ((form.get('agency_name') as string | null) ?? '').trim() || null
  const recruiterName = ((form.get('recruiter_name') as string | null) ?? '').trim() || null
  const recruiterEmail = ((form.get('recruiter_email') as string | null) ?? '').trim() || null

  const buffer = Buffer.from(await file.arrayBuffer())

  const result = await extractPayPackageFromPdf({
    pdfBase64: buffer.toString('base64'),
    userId: ctx.userId,
    purpose: 'extract_quote',
    onCall: async (log) => { await ctx.supabase.from('ledger_llm_calls').insert(log) },
  })

  const agencyId = await resolveAgency(ctx.supabase, agencyName)
  const recruiterId = await resolveRecruiter(ctx.supabase, agencyId, recruiterName, recruiterEmail)

  const { data: contract, error } = await ctx.supabase
    .from('ledger_contracts')
    .insert({
      user_id: ctx.userId,
      agency_id: agencyId,
      recruiter_id: recruiterId,
      specialty: result.payload.specialty,
      location_city: result.payload.location_city,
      location_state: result.payload.location_state,
      start_date: result.payload.start_date,
      end_date: result.payload.end_date,
    })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await ctx.supabase.from('ledger_quotes').insert({
    contract_id: contract.id,
    source_type: 'manual',
    raw_content: `[PDF upload: ${file.name} · ${file.size} bytes]`,
    extracted_payload: result.payload,
    confidence_score: result.payload.extraction_confidence,
    requires_review: result.needsReview,
  })

  return NextResponse.json({ contract }, { status: 201 })
}
