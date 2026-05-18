import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isErrorResponse } from '@/lib/ledger/access'
import { resolveAgency, resolveRecruiter } from '@/lib/ledger/resolve'

const CreateContractSchema = z.object({
  agency_name: z.string().optional(),
  recruiter_name: z.string().optional(),
  recruiter_email: z.string().email().optional(),
  recruiter_phone: z.string().optional(),
  specialty: z.string().optional(),
  location_city: z.string().optional(),
  location_state: z.string().length(2).optional(),
  start_date: z.iso.date().optional(),
  end_date: z.iso.date().optional(),
  placement_id: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx
  if (ctx.role !== 'nurse' && ctx.role !== 'admin') {
    return NextResponse.json({ error: 'Only nurses can create ledger contracts' }, { status: 403 })
  }

  const body = CreateContractSchema.safeParse(await req.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const agencyId = await resolveAgency(ctx.supabase, body.data.agency_name)
  const recruiterId = await resolveRecruiter(
    ctx.supabase,
    agencyId,
    body.data.recruiter_name,
    body.data.recruiter_email,
    body.data.recruiter_phone,
  )

  const { data, error } = await ctx.supabase
    .from('ledger_contracts')
    .insert({
      user_id: ctx.userId,
      agency_id: agencyId,
      recruiter_id: recruiterId,
      specialty: body.data.specialty,
      location_city: body.data.location_city,
      location_state: body.data.location_state,
      start_date: body.data.start_date,
      end_date: body.data.end_date,
      placement_id: body.data.placement_id ?? null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contract: data }, { status: 201 })
}

export async function GET() {
  const ctx = await requireAuth()
  if (isErrorResponse(ctx)) return ctx

  let query = ctx.supabase
    .from('ledger_contracts')
    .select('*, ledger_agencies(name), ledger_recruiters(name, email)')
    .order('created_at', { ascending: false })
  if (ctx.role === 'nurse') query = query.eq('user_id', ctx.userId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contracts: data ?? [] })
}
