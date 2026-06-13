/**
 * Rotate the Nursys e-Notify API password (§3.3).
 *
 * DESTRUCTIVE: on success the CURRENT password stops working immediately. You
 * MUST update NURSYS_API_PASSWORD in .env.local AND your production env right
 * after, or every subsequent call returns 401.
 *
 * Run `npm run nursys:ping` first to confirm the current password authenticates.
 *
 * Usage — provide the new password via env var to keep it out of shell history:
 *   NURSYS_NEW_PASSWORD='Str0ngNewPass!' npm run nursys:rotate
 * or (visible in shell history, less safe):
 *   npm run nursys:rotate -- 'Str0ngNewPass!'
 *
 * New password rules (§3.3): 8–50 chars, ≥1 lowercase, ≥1 uppercase, ≥1 digit,
 * and different from the current password. changePassword() enforces these.
 */
import { nursysConfigured, changePassword } from '../src/lib/nursys'

async function main() {
  if (!nursysConfigured()) {
    console.error('✗ Nursys not configured — set NURSYS_* in .env.local')
    process.exit(1)
  }

  const newPassword = process.env.NURSYS_NEW_PASSWORD ?? process.argv[2]
  if (!newPassword) {
    console.error('Usage: NURSYS_NEW_PASSWORD=\'<new>\' npm run nursys:rotate')
    console.error('   or: npm run nursys:rotate -- \'<new>\'')
    process.exit(1)
  }

  console.log('→ POST /changepassword')
  try {
    const res: any = await changePassword(newPassword)
    const txn = res?.Transaction
    if (txn?.TransactionSuccessFlag) {
      console.log(`✓ Password rotated. TransactionId=${txn.TransactionId}`)
      console.log('\n⚠  DO THIS NOW or the next API call will 401:')
      console.log('   1) Set NURSYS_API_PASSWORD in .env.local to the new password.')
      console.log('   2) Set the same value in your production env (Vercel) and redeploy.')
      console.log('   3) Re-run `npm run nursys:ping` to confirm the new password works.')
    } else {
      console.error('✗ Rotation rejected:', JSON.stringify(txn?.TransactionErrors ?? res))
      process.exit(1)
    }
  } catch (err: any) {
    console.error('✗ Request failed:', err?.message)
    if (err?.status === 401) console.error('  → current password wrong; run `npm run nursys:ping` first')
    if (err?.status === 403) console.error('  → rate-limited or IP not allowlisted')
    if (err?.body) console.error('  body:', JSON.stringify(err.body))
    process.exit(1)
  }
}

main()
