import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  nursysConfigured,
  submitManageNurseList,
  practiceSettingToNursys,
  type ManageNurseListRequest,
} from '@/lib/nursys'

// Submit a Remove ('R') for a nurse so NCSBN stops monitoring the license.
// Use when a nurse leaves the platform or asks to be unenrolled. Without
// this call NCSBN keeps the nurse on the list indefinitely (and may bill
// per-nurse).
//
// Admin-only. The corresponding 'A' (Add) lives in /api/nursys/verify.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profileRow?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!nursysConfigured()) {
    return NextResponse.json({ error: 'Nursys not configured' }, { status: 400 })
  }

  const { nurseProfileId } = await req.json()
  if (!nurseProfileId) {
    return NextResponse.json({ error: 'Missing nurseProfileId' }, { status: 400 })
  }

  const { data: nurse } = await supabase
    .from('nurse_profiles')
    .select('*')
    .eq('id', nurseProfileId)
    .single()

  if (!nurse) {
    return NextResponse.json({ error: 'Nurse profile not found' }, { status: 404 })
  }

  const n = nurse as Record<string, unknown>

  // 'R' identifies the nurse by SSN+birth+license. Required address fields
  // are still required by the request type, so we re-send what's on file.
  const required = ['address1', 'city', 'state', 'zip', 'ssn_last_four', 'birth_year', 'license_state', 'license_number']
  const missing = required.filter(k => !n[k])
  if (missing.length > 0) {
    return NextResponse.json({
      error: 'Nurse is missing fields needed to identify the NCSBN record',
      missing,
    }, { status: 400 })
  }

  const { HospitalPracticeSetting, HospitalPracticeSettingOther } = practiceSettingToNursys(
    (n.practice_setting as string) || 'Other'
  )

  const request: ManageNurseListRequest = {
    SubmissionActionCode: 'R',
    JurisdictionAbbreviation: n.license_state as string,
    LicenseNumber: n.license_number as string,
    LicenseType: (n.license_type as string) || '',
    NcsbnId: (n.ncsbn_id as string) || '',
    Address1: n.address1 as string,
    Address2: (n.address2 as string) || '',
    City: n.city as string,
    State: n.state as string,
    Zip: n.zip as string,
    LastFourSSN: n.ssn_last_four as string,
    BirthYear: String(n.birth_year),
    HospitalPracticeSetting,
    HospitalPracticeSettingOther,
    NotificationsEnabled: 'N',
    RemindersEnabled: 'N',
    RecordId: nurseProfileId,
  }

  try {
    const txn = await submitManageNurseList([request])

    if (!txn.TransactionSuccessFlag) {
      return NextResponse.json({
        error: 'Nursys rejected the remove submission',
        transactionErrors: txn.TransactionErrors,
        transactionId: txn.TransactionId,
      }, { status: 400 })
    }

    // Clear the local Nursys state so we don't keep treating this nurse as
    // enrolled. Keep the license fields intact — they're still the nurse's
    // identity even after we stop monitoring.
    await supabase
      .from('nurse_profiles')
      .update({
        license_verified: false,
        license_verified_at: null,
        nursys_transaction_id: null,
        nursys_lookup_transaction_id: null,
        nursys_enrolled_at: null,
        license_status_detail: null,
      } as never)
      .eq('id', nurseProfileId)

    return NextResponse.json({
      status: 'submitted',
      transactionId: txn.TransactionId,
      transactionDate: txn.TransactionDate,
    })
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number; body?: unknown }
    return NextResponse.json({
      error: e?.message || 'Remove failed',
      body: e?.body,
    }, { status: e?.status || 500 })
  }
}
