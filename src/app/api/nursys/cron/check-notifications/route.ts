import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  nursysConfigured,
  submitNotificationLookup,
  getNotificationLookupResult,
  STATUS_CHANGE_TRIGGERS_RECHECK,
} from '@/lib/nursys'

// Cron-driven notification sweep. Hits NCSBN /notificationlookup for a recent
// window, polls until complete (bounded), and clears license_verified for any
// nurse whose status changed so /api/nursys/verify will re-run Phase 1+2.
//
// Auth: Authorization: Bearer ${CRON_SECRET}.
// Schedule: see vercel.json (daily). Manual trigger is also fine for backfills.

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization') || ''
  return header === `Bearer ${secret}`
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// Vercel Cron triggers via GET with Authorization: Bearer ${CRON_SECRET}.
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!nursysConfigured()) {
    return NextResponse.json({ error: 'Nursys not configured' }, { status: 400 })
  }

  // Default window: yesterday → today. Caller can override for backfills via query params.
  const url = new URL(req.url)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const startDate = url.searchParams.get('startDate') || ymd(yesterday)
  const endDate = url.searchParams.get('endDate') || ymd(today)

  const submit = await submitNotificationLookup({ startDate, endDate })
  if (!submit.TransactionSuccessFlag) {
    return NextResponse.json({
      error: 'Nursys rejected the notification lookup submission',
      transactionErrors: submit.TransactionErrors,
    }, { status: 502 })
  }
  const transactionId = submit.TransactionId

  // Poll with backoff until complete or we hit the function deadline.
  // Leave ~5s of headroom for DB writes after the loop exits.
  const deadline = Date.now() + 50_000
  let result: Awaited<ReturnType<typeof getNotificationLookupResult>> | null = null
  let waitMs = 3_000
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, waitMs))
    result = await getNotificationLookupResult(transactionId)
    if (result.ProcessingCompleteFlag) break
    waitMs = Math.min(waitMs * 1.5, 10_000)
  }

  if (!result || !result.ProcessingCompleteFlag) {
    return NextResponse.json({
      status: 'still_processing',
      transactionId,
      note: 'Lookup did not complete within the cron window. Re-poll via /api/nursys/notifications?transactionId=...',
    }, { status: 202 })
  }

  const events = result.NotificationLookupResponses || []
  const flagged: Array<{ recordId: string; reason: string }> = []
  const supabase = await createClient()

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
      .update({
        license_verified: false,
        license_verified_at: null,
        nursys_lookup_transaction_id: null,
      } as never)
      .eq('id', ev.RecordId)
  }

  return NextResponse.json({
    status: 'complete',
    window: { startDate, endDate },
    transactionId,
    totalEvents: events.length,
    flagged,
  })
}
