import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  nursysConfigured,
  submitManageNurseList,
  getManageNurseListResult,
  submitNurseLookup,
  getNurseLookupResult,
  isLicenseCurrentlyValid,
  practiceSettingToNursys,
  type ManageNurseListRequest,
} from '@/lib/nursys'

// Submit a nurse to Nursys e-Notify. Returns a TransactionId; the caller
// must poll GET /api/nursys/verify?transactionId=... after ~5 minutes.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    nurseProfileId,
    licenseNumber, licenseState, licenseType, ncsbnId,
    email,
    address1, address2, city, state, zip,
    lastFourSSN, birthYear,
    practiceSettingLabel,
    locationList,
  } = body

  if (!nurseProfileId) {
    return NextResponse.json({ error: 'Missing nurseProfileId' }, { status: 400 })
  }

  if (!nursysConfigured()) {
    // Dev fallback: accept any 5+ char license.
    const verified = typeof licenseNumber === 'string'
      && licenseNumber.length >= 5
      && typeof licenseState === 'string'
      && licenseState.length === 2

    if (verified) {
      const supabase = await createClient()
      await supabase
        .from('nurse_profiles')
        .update({ license_verified: true })
        .eq('id', nurseProfileId)
    }
    return NextResponse.json({ verified, source: 'dev_fallback' })
  }

  // Validate Nursys-required fields before making the call so we return
  // a helpful error instead of a cryptic 400 from NCSBN.
  const missing: string[] = []
  if (!address1) missing.push('address1')
  if (!city) missing.push('city')
  if (!state) missing.push('state')
  if (!zip) missing.push('zip')
  if (!lastFourSSN) missing.push('lastFourSSN')
  if (!birthYear) missing.push('birthYear')
  if (!practiceSettingLabel) missing.push('practiceSettingLabel')
  const hasLicenseMatch = ncsbnId || (licenseState && licenseType && licenseNumber)
  if (!hasLicenseMatch) missing.push('ncsbnId OR (licenseState + licenseType + licenseNumber)')

  if (missing.length > 0) {
    return NextResponse.json({
      error: 'Nursys requires additional fields to enroll this nurse.',
      missing,
    }, { status: 400 })
  }

  const { HospitalPracticeSetting, HospitalPracticeSettingOther } = practiceSettingToNursys(practiceSettingLabel)

  const request: ManageNurseListRequest = {
    SubmissionActionCode: 'A',
    JurisdictionAbbreviation: licenseState,
    LicenseNumber: licenseNumber || '',
    LicenseType: licenseType,
    NcsbnId: ncsbnId || '',
    Email: email,
    Address1: address1,
    Address2: address2 || '',
    City: city,
    State: state,
    Zip: zip,
    LastFourSSN: lastFourSSN,
    BirthYear: String(birthYear),
    HospitalPracticeSetting,
    HospitalPracticeSettingOther,
    NotificationsEnabled: 'Y',
    RemindersEnabled: 'Y',
    LocationList: locationList || '001',
    RecordId: nurseProfileId,
  }

  try {
    const txn = await submitManageNurseList([request])

    if (!txn.TransactionSuccessFlag) {
      return NextResponse.json({
        error: 'Nursys rejected the submission',
        transactionErrors: txn.TransactionErrors,
        transactionId: txn.TransactionId,
      }, { status: 400 })
    }

    // Persist Nursys-required fields + transaction id.
    // Requires the ALTER TABLE block in supabase/schema.sql.
    const supabase = await createClient()
    await supabase
      .from('nurse_profiles')
      .update({
        address1,
        address2: address2 || null,
        ssn_last_four: lastFourSSN,
        birth_year: Number(birthYear),
        practice_setting: practiceSettingLabel,
        ncsbn_id: ncsbnId || null,
        nursys_transaction_id: txn.TransactionId,
        nursys_enrolled_at: new Date().toISOString(),
      } as never)
      .eq('id', nurseProfileId)

    return NextResponse.json({
      status: 'submitted',
      transactionId: txn.TransactionId,
      transactionDate: txn.TransactionDate,
      source: 'nursys',
      note: 'Poll GET /api/nursys/verify?transactionId=... after 5 minutes.',
    })
  } catch (err: any) {
    console.error('Nursys submit error:', err)
    return NextResponse.json({
      error: err?.message || 'Verification service unavailable',
      body: err?.body,
    }, { status: err?.status || 500 })
  }
}

// Poll the verification status for a nurse profile.
// Runs a 2-phase state machine: Manage Nurse List (identity) → Nurse Lookup (license is active).
export async function GET(req: NextRequest) {
  const nurseProfileId = new URL(req.url).searchParams.get('nurseProfileId')
  if (!nurseProfileId) {
    return NextResponse.json({ error: 'Missing nurseProfileId' }, { status: 400 })
  }
  if (!nursysConfigured()) {
    return NextResponse.json({ error: 'Nursys not configured' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('nurse_profiles')
    .select('*')
    .eq('id', nurseProfileId)
    .single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const p = profile as any

  if (p.license_verified) {
    return NextResponse.json({ status: 'verified', detail: p.license_status_detail || null })
  }

  try {
    // ── Phase 2: Nurse Lookup — if we've already kicked this off, poll it.
    if (p.nursys_lookup_transaction_id) {
      const lookup = await getNurseLookupResult(p.nursys_lookup_transaction_id)
      const done = lookup.ProcessingComplete ?? lookup.ProcessingCompleteFlag
      if (!done) {
        return NextResponse.json({ status: 'checking_license_status' })
      }

      const item = lookup.NurseLookupResponses?.[0]
      if (!item) {
        return NextResponse.json({ status: 'failed', reason: 'No nurse lookup response returned' })
      }
      if (!item.SuccessFlag) {
        return NextResponse.json({
          status: 'failed',
          reason: item.Errors?.map(e => e.ErrorMessage).join('; ') || 'Nurse lookup failed',
        })
      }

      // Match on the exact license the nurse enrolled with. Fail closed if there's
      // no match — falling back to NurseLookupLicenses[0] could verify against a
      // different state's license than the one claimed.
      const enrolled = (item.NurseLookupLicenses || []).find(l =>
        l.LicenseNumber === p.license_number && l.JurisdictionAbbreviation === p.license_state
      )

      if (!enrolled) {
        const licenseCount = item.NurseLookupLicenses?.length || 0
        return NextResponse.json({
          status: 'failed',
          reason: licenseCount === 0
            ? 'No license records returned for this nurse'
            : `No license matching ${p.license_state}/${p.license_number} in NCSBN response (${licenseCount} other licenses found)`,
        })
      }

      const validity = isLicenseCurrentlyValid(enrolled)
      const detail = {
        licenseStatus: enrolled.LicenseStatus,
        active: enrolled.Active,
        compact: enrolled.CompactStatus,
        expirationDate: enrolled.LicenseExpirationDate,
        disciplineCount: enrolled.NurseLookupDisciplines?.length || 0,
        authorizedStates: [
          ...(item.NurseLookupRNAuthorizationsToPractice || []).filter(a => a.AuthorizationToPracticeCode === 'Y' || a.AuthorizationToPracticeCode === 'R').map(a => a.StateAbbreviation),
          ...(item.NurseLookupPNAuthorizationsToPractice || []).filter(a => a.AuthorizationToPracticeCode === 'Y' || a.AuthorizationToPracticeCode === 'R').map(a => a.StateAbbreviation),
        ],
      }

      await supabase
        .from('nurse_profiles')
        .update({
          license_verified: validity.valid,
          license_verified_at: validity.valid ? new Date().toISOString() : null,
          license_status_detail: detail,
          ncsbn_id: item.NcsbnId || p.ncsbn_id,
        } as never)
        .eq('id', nurseProfileId)

      return validity.valid
        ? NextResponse.json({ status: 'verified', detail })
        : NextResponse.json({ status: 'failed', reason: validity.reason, detail })
    }

    // ── Phase 1: Manage Nurse List — poll enrollment.
    if (!p.nursys_transaction_id) {
      return NextResponse.json({ status: 'not_submitted' })
    }

    const enrollment = await getManageNurseListResult(p.nursys_transaction_id)
    if (!enrollment.ProcessingCompleteFlag) {
      return NextResponse.json({ status: 'processing_enrollment' })
    }

    const r = enrollment.ManageNurseListResponses?.[0]
    if (!r) {
      return NextResponse.json({ status: 'failed', reason: 'No enrollment response returned' })
    }
    if (!r.SuccessFlag) {
      return NextResponse.json({
        status: 'failed',
        reason: r.Errors?.map(e => e.ErrorMessage).join('; ') || 'Enrollment rejected',
      })
    }

    // Identity matched at NCSBN — now submit a Nurse Lookup to check status.
    const lookupTxn = await submitNurseLookup([{
      JurisdictionAbbreviation: p.license_state,
      LicenseNumber: p.license_number,
      LicenseType: p.license_type,
      NcsbnId: p.ncsbn_id || '',
      RecordId: nurseProfileId,
    }])

    if (!lookupTxn.TransactionSuccessFlag) {
      return NextResponse.json({
        status: 'failed',
        reason: 'Nurse Lookup submission rejected',
        transactionErrors: lookupTxn.TransactionErrors,
      })
    }

    await supabase
      .from('nurse_profiles')
      .update({ nursys_lookup_transaction_id: lookupTxn.TransactionId } as never)
      .eq('id', nurseProfileId)

    return NextResponse.json({
      status: 'checking_license_status',
      lookupTransactionId: lookupTxn.TransactionId,
    })
  } catch (err: any) {
    return NextResponse.json({
      error: err?.message || 'Lookup failed',
      body: err?.body,
    }, { status: err?.status || 500 })
  }
}
