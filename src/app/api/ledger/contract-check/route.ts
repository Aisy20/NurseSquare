import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  requireAuth,
  isErrorResponse,
  loadContractForOwner,
  type AuthContext,
} from '@/lib/ledger/access'
import { extractPayPackage } from '@/lib/ledger/extractor'
import { PayPackageSchema, SourceTypeSchema, type PayPackage } from '@/lib/ledger/types'
import { assessQuote, type Assessment } from '@/lib/ledger/contract-check'
import { gsaFiscalYear, resolvePerDiem, type PerDiemRow } from '@/lib/ledger/gsa'
import { loadTaxHomeStatus } from '@/lib/taxhome/load'

const SubmitSchema = z.object({
  source_type: SourceTypeSchema,
  raw_content: z.string().min(1),
})

/**
 * Run the deterministic assessment for a contract's pay package, persist the
 * bill-rate capture on the contract, and return the assessment. Shared by the
 * POST (new quote) and GET (re-assess an existing thread, e.g. after a PDF
 * upload) paths.
 */
async function runAssessment(
  ctx: AuthContext,
  contractId: string,
  pkg: PayPackage,
): Promise<Assessment> {
  const fiscalYear = gsaFiscalYear(pkg.start_date ? new Date(`${pkg.start_date}T00:00:00Z`) : new Date())
  const { data: rateRows } = await ctx.supabase
    .from('gsa_per_diem_rates')
    .select('fiscal_year, state, locality, lodging_cents, mie_cents')
    .eq('fiscal_year', fiscalYear)
  const perDiem = resolvePerDiem((rateRows ?? []) as PerDiemRow[], {
    state: pkg.location_state,
    city: pkg.location_city,
    fiscalYear,
  })
  const taxHome = await loadTaxHomeStatus(ctx)

  const assessment = assessQuote({ pkg, perDiem, taxHome })

  await ctx.supabase
    .from('ledger_contracts')
    .update({ bill_rate_capture: assessment.bill_rate_capture })
    .eq('id', contractId)

  return assessment
}

export async function POST(req: NextRequest) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  if (ctx.role !== 'nurse' && ctx.role !== 'admin') {
    return NextResponse.json({ error: 'Only nurses can run a contract check' }, { status: 403 })
  }

  const body = SubmitSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const result = await extractPayPackage({
    rawContent: body.data.raw_content,
    sourceType: body.data.source_type,
    userId: ctx.userId,
    onCall: async (log) => {
      await ctx.supabase.from('ledger_llm_calls').insert(log)
    },
  })

  const { data: contract, error: contractError } = await ctx.supabase
    .from('ledger_contracts')
    .insert({
      user_id: ctx.userId,
      specialty: result.payload.specialty,
      location_city: result.payload.location_city,
      location_state: result.payload.location_state,
      start_date: result.payload.start_date,
      end_date: result.payload.end_date,
    })
    .select('*')
    .single()
  if (contractError) return NextResponse.json({ error: contractError.message }, { status: 500 })

  const { data: quote, error: quoteError } = await ctx.supabase
    .from('ledger_quotes')
    .insert({
      contract_id: contract.id,
      source_type: body.data.source_type,
      raw_content: body.data.raw_content,
      extracted_payload: result.payload,
      confidence_score: result.payload.extraction_confidence,
      requires_review: result.needsReview,
    })
    .select('*')
    .single()
  if (quoteError) return NextResponse.json({ error: quoteError.message }, { status: 500 })

  const assessment = await runAssessment(ctx, contract.id, result.payload)

  return NextResponse.json(
    { contract_id: contract.id, quote, needs_review: result.needsReview, assessment },
    { status: 201 },
  )
}

export async function GET(req: NextRequest) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx

  const contractId = req.nextUrl.searchParams.get('contractId')
  if (!contractId) return NextResponse.json({ error: 'contractId required' }, { status: 400 })

  const owner = await loadContractForOwner(ctx, contractId)
  if (isErrorResponse(owner)) return owner

  const { data: quote } = await ctx.supabase
    .from('ledger_quotes')
    .select('*')
    .eq('contract_id', contractId)
    .not('extracted_payload', 'is', null)
    .order('received_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!quote?.extracted_payload) {
    return NextResponse.json({ error: 'No extracted quote for this contract' }, { status: 404 })
  }

  const pkg = PayPackageSchema.parse(quote.extracted_payload)
  const assessment = await runAssessment(ctx, contractId, pkg)

  return NextResponse.json({ contract_id: contractId, quote, assessment })
}
