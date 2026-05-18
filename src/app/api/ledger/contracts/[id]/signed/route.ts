import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isErrorResponse, loadContractForOwner } from '@/lib/ledger/access'
import { extractPayPackageFromPdf } from '@/lib/ledger/extractor'
import { computeAndPersistDiffIfReady } from '@/lib/ledger/persist'

const MAX_PDF_BYTES = 10 * 1024 * 1024

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  const { id: contractId } = await params
  const owner = await loadContractForOwner(ctx, contractId)
  if (isErrorResponse(owner)) return owner

  const form = await req.formData().catch(() => null)
  const file = form?.get('pdf')
  if (!(file instanceof File)) return NextResponse.json({ error: 'pdf field required (multipart/form-data)' }, { status: 400 })
  if (file.size > MAX_PDF_BYTES) return NextResponse.json({ error: 'PDF too large (max 10MB)' }, { status: 413 })
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Only application/pdf accepted' }, { status: 415 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const storagePath = `ledger/${ctx.userId}/${contractId}/signed-${Date.now()}.pdf`

  const { error: uploadErr } = await ctx.supabase.storage
    .from('ledger-contracts')
    .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: false })
  if (uploadErr) return NextResponse.json({ error: `upload: ${uploadErr.message}` }, { status: 500 })

  const { data: signedUrl } = await ctx.supabase.storage
    .from('ledger-contracts')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365)

  const result = await extractPayPackageFromPdf({
    pdfBase64: buffer.toString('base64'),
    userId: ctx.userId,
    contractId,
    purpose: 'extract_signed',
    onCall: async (log) => {
      await ctx.supabase.from('ledger_llm_calls').insert(log)
    },
  })

  const { data: signed, error } = await ctx.supabase
    .from('ledger_signed_contracts')
    .upsert(
      {
        contract_id: contractId,
        pdf_url: signedUrl?.signedUrl ?? storagePath,
        extracted_payload: result.payload,
        confidence_score: result.payload.extraction_confidence,
        parsed_at: new Date().toISOString(),
      },
      { onConflict: 'contract_id' },
    )
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await ctx.supabase
    .from('ledger_contracts')
    .update({ status: 'signed', signed_at: new Date().toISOString() })
    .eq('id', contractId)

  const diff = await computeAndPersistDiffIfReady(ctx, contractId)
  return NextResponse.json({ signed_contract: signed, diff }, { status: 201 })
}
