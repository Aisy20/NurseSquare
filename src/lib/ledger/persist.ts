import type { AuthContext } from './access'
import { computeDiff, defaultTextComparator } from './diff'
import { PayPackageSchema } from './types'

export async function computeAndPersistDiffIfReady(
  ctx: AuthContext,
  contractId: string,
  quoteId?: string,
) {
  const { data: signed } = await ctx.supabase
    .from('ledger_signed_contracts')
    .select('id, extracted_payload')
    .eq('contract_id', contractId)
    .maybeSingle()
  if (!signed?.extracted_payload) return null

  const quoteQuery = ctx.supabase
    .from('ledger_quotes')
    .select('id, extracted_payload, received_at')
    .eq('contract_id', contractId)
    .not('extracted_payload', 'is', null)
    .order('received_at', { ascending: false })
    .limit(1)

  const { data: latestQuote } = quoteId
    ? await ctx.supabase.from('ledger_quotes').select('id, extracted_payload, received_at').eq('id', quoteId).single()
    : await quoteQuery.maybeSingle()

  if (!latestQuote?.extracted_payload) return null

  const quoted = PayPackageSchema.parse(latestQuote.extracted_payload)
  const signedPkg = PayPackageSchema.parse(signed.extracted_payload)

  const deltas = await computeDiff({
    quoted,
    signed: signedPkg,
    compareText: defaultTextComparator({
      contractId,
      userId: ctx.userId,
      onCall: async (log) => {
        await ctx.supabase.from('ledger_llm_calls').insert(log)
      },
    }),
  })

  const { data, error } = await ctx.supabase
    .from('ledger_diffs')
    .upsert(
      {
        contract_id: contractId,
        quote_id: latestQuote.id,
        signed_contract_id: signed.id,
        field_deltas: deltas,
      },
      { onConflict: 'quote_id,signed_contract_id' },
    )
    .select('*')
    .single()

  if (error) throw new Error(`persist diff: ${error.message}`)
  return data
}
