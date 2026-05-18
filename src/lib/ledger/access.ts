import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type Role = 'nurse' | 'hospital' | 'admin'
export type LedgerSupabase = Awaited<ReturnType<typeof createClient>>

export interface AuthContext {
  supabase: LedgerSupabase
  userId: string
  role: Role
}

export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: profile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (error || !profile) return NextResponse.json({ error: 'No user profile' }, { status: 403 })

  return { supabase, userId: user.id, role: profile.role as Role }
}

export function isErrorResponse(v: unknown): v is NextResponse {
  return v instanceof NextResponse
}

export async function loadContractForOwner(
  ctx: AuthContext,
  contractId: string,
): Promise<{ user_id: string; placement_id: string | null; status: string } | NextResponse> {
  const { data, error } = await ctx.supabase
    .from('ledger_contracts')
    .select('user_id, placement_id, status')
    .eq('id', contractId)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (ctx.role === 'admin') return data
  if (ctx.role === 'nurse' && data.user_id === ctx.userId) return data
  // Hospital read-only on placement-linked contracts is enforced by RLS;
  // mutating endpoints must reject hospitals explicitly.
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
