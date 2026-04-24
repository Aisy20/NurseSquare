import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  nursysConfigured,
  submitNotificationLookup,
  getNotificationLookupResult,
  STATUS_CHANGE_TRIGGERS_RECHECK,
} from '@/lib/nursys'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), supabase: null as any }
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), supabase: null as any }
  return { error: null, supabase }
}

// Step 1 — submit a notification lookup. Returns a TransactionId.
export async function POST(req: NextRequest) {
  const { error, supabase: _supabase } = await requireAdmin()
  if (error) return error
  if (!nursysConfigured()) {
    return NextResponse.json({ error: 'Nursys not configured' }, { status: 400 })
  }

  const { startDate, endDate } = await req.json().catch(() => ({}))
  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate required (YYYY-MM-DD)' }, { status: 400 })
  }

  try {
    const txn = await submitNotificationLookup({ startDate, endDate })
    if (!txn.TransactionSuccessFlag) {
      return NextResponse.json({
        error: 'Nursys rejected the notification lookup submission',
        transactionErrors: txn.TransactionErrors,
      }, { status: 400 })
    }
    return NextResponse.json({
      status: 'submitted',
      transactionId: txn.TransactionId,
      transactionDate: txn.TransactionDate,
      note: 'Poll GET /api/nursys/notifications?transactionId=... after a few minutes.',
    })
  } catch (err: any) {
    return NextResponse.json({
      error: err?.message || 'Notification submit failed',
      body: err?.body,
    }, { status: err?.status || 500 })
  }
}

// Step 2 — retrieve the results. Any status change on an enrolled nurse
// flips that nurse's license_verified=false so we re-run Nurse Lookup.
export async function GET(req: NextRequest) {
  const { error, supabase } = await requireAdmin()
  if (error) return error
  if (!nursysConfigured()) {
    return NextResponse.json({ error: 'Nursys not configured' }, { status: 400 })
  }

  const transactionId = new URL(req.url).searchParams.get('transactionId')
  if (!transactionId) {
    return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 })
  }

  try {
    const result = await getNotificationLookupResult(transactionId)

    if (!result.ProcessingCompleteFlag) {
      return NextResponse.json({ status: 'processing' })
    }

    const events = result.NotificationLookupResponses || []
    const flagged: Array<{ recordId: string; reason: string }> = []

    for (const ev of events) {
      const triggers = [
        ev.LicenseStatusChange,
        ev.DisciplineStatusChange,
        ev.DisciplineStatusChangeOther,
      ].filter(Boolean) as string[]

      const needsRecheck = triggers.some(t => STATUS_CHANGE_TRIGGERS_RECHECK.includes(t))
      if (!needsRecheck || !ev.RecordId) continue

      flagged.push({ recordId: ev.RecordId, reason: triggers.join('; ') })

      await supabase
        .from('nurse_profiles')
        .update({ license_verified: false } as never)
        .eq('id', ev.RecordId)
    }

    return NextResponse.json({
      status: 'complete',
      totalEvents: events.length,
      flaggedForRecheck: flagged,
      raw: result,
    })
  } catch (err: any) {
    return NextResponse.json({
      error: err?.message || 'Notification lookup failed',
      body: err?.body,
    }, { status: err?.status || 500 })
  }
}
