/**
 * Non-destructive connectivity + auth check for the Nursys e-Notify API.
 *
 * Submits a Notification Lookup for a 1-day window — a read-only query that
 * changes NOTHING on your nurse list — then retrieves the result once. Use this
 * BEFORE rotating the password to confirm three things in isolation:
 *   1. credentials authenticate (no 401),
 *   2. the URL + JSON shape are right (you get a TransactionId back),
 *   3. your current IP is allowlisted through NCSBN's WAF (no 403).
 *
 * Usage:
 *   npm run nursys:ping
 *
 * Requires NURSYS_BASE_URL / NURSYS_API_USERNAME / NURSYS_API_PASSWORD in .env.local.
 */
import {
  nursysConfigured,
  submitNotificationLookup,
  getNotificationLookupResult,
} from '../src/lib/nursys'

function todayUtc() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

async function main() {
  if (!nursysConfigured()) {
    console.error('✗ Nursys not configured — set NURSYS_BASE_URL / NURSYS_API_USERNAME / NURSYS_API_PASSWORD in .env.local')
    process.exit(1)
  }

  const day = todayUtc()
  console.log(`→ POST /notificationlookup  StartDate=${day} EndDate=${day}`)

  try {
    const txn = await submitNotificationLookup({ startDate: day, endDate: day })
    console.log(`✓ Authenticated. TransactionId=${txn.TransactionId}  success=${txn.TransactionSuccessFlag}`)
    if (txn.TransactionErrors?.length) {
      console.log('  TransactionErrors:', JSON.stringify(txn.TransactionErrors))
    }

    console.log('  waiting 10s, then retrieving the result once…')
    await new Promise((r) => setTimeout(r, 10_000))
    const result = await getNotificationLookupResult(txn.TransactionId)
    console.log(
      `✓ Retrieved. ProcessingComplete=${result.ProcessingCompleteFlag}  notifications=${result.NotificationLookupResponses?.length ?? 0}`,
    )
    console.log('\nAPI is reachable and your credentials work. Safe to rotate the password next.')
  } catch (err: any) {
    console.error('✗ Request failed:', err?.message)
    if (err?.status === 401) {
      console.error('  → 401 Unauthorized: bad username/password. Check the < > brackets in NURSYS_API_PASSWORD.')
    } else if (err?.status === 403) {
      console.error('  → 403 Forbidden: rate-limited (25/min) OR this machine\'s IP is not allowlisted by NCSBN.')
    }
    if (err?.body) console.error('  body:', JSON.stringify(err.body))
    process.exit(1)
  }
}

main()
