import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { nursysConfigured, retrieveDocuments } from '@/lib/nursys'

// Fetch discipline / board-notification documents from Nursys.
// Document IDs come from Nurse Lookup responses (§3.3, still TBD).
// GET /api/nursys/documents?ids=<id1>,<id2>  (max 5)
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'hospital') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!nursysConfigured()) {
    return NextResponse.json({ error: 'Nursys not configured' }, { status: 400 })
  }

  const idsParam = new URL(req.url).searchParams.get('ids')
  if (!idsParam) return NextResponse.json({ error: 'Missing ids' }, { status: 400 })

  const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean)
  if (ids.length === 0) return NextResponse.json({ error: 'No valid ids' }, { status: 400 })
  if (ids.length > 5) return NextResponse.json({ error: 'Max 5 ids per call' }, { status: 400 })

  try {
    const result = await retrieveDocuments(ids)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({
      error: err?.message || 'Document retrieval failed',
      body: err?.body,
    }, { status: err?.status || 500 })
  }
}
