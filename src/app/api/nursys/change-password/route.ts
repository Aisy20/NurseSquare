import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { changePassword, nursysConfigured } from '@/lib/nursys'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!nursysConfigured()) {
    return NextResponse.json({ error: 'Nursys not configured' }, { status: 400 })
  }

  const { newPassword } = await req.json()
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 12) {
    return NextResponse.json({ error: 'newPassword must be at least 12 characters' }, { status: 400 })
  }

  try {
    const result = await changePassword(newPassword)
    return NextResponse.json({
      ok: true,
      result,
      warning: 'Password rotated in Nursys. You must update NURSYS_API_PASSWORD in env and redeploy before the next request.',
    })
  } catch (err: any) {
    return NextResponse.json({
      error: err?.message || 'Change password failed',
      body: err?.body,
    }, { status: err?.status || 500 })
  }
}
