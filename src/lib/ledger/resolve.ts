import type { LedgerSupabase } from './access'

export async function resolveAgency(supabase: LedgerSupabase, name?: string | null): Promise<string | null> {
  if (!name) return null
  const trimmed = name.trim()
  if (!trimmed) return null
  const normalized = trimmed.toLowerCase()
  const existing = await supabase.from('ledger_agencies').select('id').eq('normalized_name', normalized).maybeSingle()
  if (existing.data) return existing.data.id as string
  const created = await supabase
    .from('ledger_agencies')
    .insert({ name: trimmed, normalized_name: normalized })
    .select('id')
    .single()
  return (created.data?.id ?? null) as string | null
}

export async function resolveRecruiter(
  supabase: LedgerSupabase,
  agencyId: string | null,
  name?: string | null,
  email?: string | null,
  phone?: string | null,
): Promise<string | null> {
  const trimmedName = name?.trim() || null
  const trimmedEmail = email?.trim() || null
  if (!trimmedName && !trimmedEmail) return null
  if (trimmedEmail) {
    const found = await supabase.from('ledger_recruiters').select('id').ilike('email', trimmedEmail).maybeSingle()
    if (found.data) return found.data.id as string
  }
  const created = await supabase
    .from('ledger_recruiters')
    .insert({
      agency_id: agencyId,
      name: trimmedName ?? trimmedEmail ?? 'Unknown',
      email: trimmedEmail,
      phone: phone?.trim() || null,
    })
    .select('id')
    .single()
  return (created.data?.id ?? null) as string | null
}
