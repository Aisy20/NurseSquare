import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, emailTemplates } from '@/lib/resend'
import { daysUntilExpiry } from '@/lib/ledger/credentials/types'
import { verifyBearerToken } from '@/lib/http/bearer'

const THRESHOLDS = [30, 14, 7, 0]

interface CredentialRow {
  id: string
  user_id: string
  type: string
  display_name: string | null
  expires_at: string
  reminders_sent: Record<string, string> | null
  users: { email: string | null } | { email: string | null }[] | null
}

function getEmail(row: CredentialRow): string | null {
  if (!row.users) return null
  if (Array.isArray(row.users)) return row.users[0]?.email ?? null
  return row.users.email ?? null
}

export async function GET(req: NextRequest) {
  const auth = verifyBearerToken(req.headers.get('authorization'), process.env.CRON_SECRET)
  if (auth === 'missing_secret') return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  if (auth !== 'authorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const today = new Date()
  const horizon = new Date(today.getTime() + 31 * 86_400_000).toISOString().slice(0, 10)

  const { data: rows, error } = await supabase
    .from('credentials')
    .select('id, user_id, type, display_name, expires_at, reminders_sent, users(email)')
    .not('expires_at', 'is', null)
    .lte('expires_at', horizon)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const raw of (rows ?? []) as CredentialRow[]) {
    const email = getEmail(raw)
    if (!email) { skipped++; continue }

    const days = daysUntilExpiry(raw.expires_at, today)
    if (days === null) { skipped++; continue }

    const reminders = raw.reminders_sent ?? {}
    const credentialName = raw.display_name || raw.type
    const newReminders = { ...reminders }
    let didSend = false

    for (const threshold of THRESHOLDS) {
      const key = String(threshold)
      if (days <= threshold && !newReminders[key]) {
        try {
          await sendEmail({
            to: email,
            subject: days <= 0
              ? `Credential expired: ${credentialName}`
              : `${credentialName} expires in ${days} days`,
            html: emailTemplates.credentialExpiringSoon({
              credentialName,
              expiresAt: raw.expires_at,
              daysUntil: days,
              credentialId: raw.id,
            }),
          })
          newReminders[key] = new Date().toISOString()
          didSend = true
          sent++
        } catch (err) {
          errors.push(`${raw.id} threshold ${key}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
    }

    if (didSend) {
      const update: Record<string, unknown> = { reminders_sent: newReminders }
      if (days <= 0) update.status = 'expired'
      await supabase.from('credentials').update(update).eq('id', raw.id)
    }
  }

  return NextResponse.json({ checked: rows?.length ?? 0, sent, skipped, errors })
}
