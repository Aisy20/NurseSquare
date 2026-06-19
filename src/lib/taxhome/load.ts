import type { AuthContext } from '@/lib/ledger/access'
import { computeTaxHomeStatus, type ContractWindow, type TaxHomeStatus } from './compute'

/**
 * Load the nurse's tax-home status: their declared tax-home state plus every
 * ledger contract window, fed through the pure computeTaxHomeStatus. Shared by
 * the tax-home health-check route and Contract Check so both surface the same
 * day-count assessment.
 */
export async function loadTaxHomeStatus(ctx: AuthContext): Promise<TaxHomeStatus> {
  const { data: user } = await ctx.supabase
    .from('users')
    .select('tax_home_state')
    .eq('id', ctx.userId)
    .single()

  const { data: contracts } = await ctx.supabase
    .from('ledger_contracts')
    .select('start_date, end_date, location_state')
    .eq('user_id', ctx.userId)

  return computeTaxHomeStatus(
    (contracts ?? []) as ContractWindow[],
    user?.tax_home_state ?? null,
  )
}
