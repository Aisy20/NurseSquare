// Read env vars at call time so password rotation (see /changepassword) doesn't
// require a process restart to pick up a new value, and so test/dev harnesses
// that set env vars after import still work.
function env() {
  return {
    BASE_URL: process.env.NURSYS_BASE_URL,
    USERNAME: process.env.NURSYS_API_USERNAME,
    PASSWORD: process.env.NURSYS_API_PASSWORD,
  }
}

const REQUEST_TIMEOUT_MS = 30_000

export function nursysConfigured() {
  const { BASE_URL, USERNAME, PASSWORD } = env()
  return Boolean(BASE_URL && USERNAME && PASSWORD)
}

function authHeaders() {
  const { USERNAME, PASSWORD } = env()
  if (!USERNAME || !PASSWORD) throw new Error('Nursys credentials missing')
  // Nursys uses custom headers, not Authorization: Basic.
  return {
    'username': USERNAME,
    'password': PASSWORD,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}

async function call<T = any>(path: string, init: { method: 'GET' | 'POST'; body?: unknown }): Promise<T> {
  const { BASE_URL } = env()
  if (!BASE_URL) throw new Error('NURSYS_BASE_URL not set')
  const res = await fetch(`${BASE_URL}${path}`, {
    method: init.method,
    headers: authHeaders(),
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  const text = await res.text()
  let data: any
  try { data = text ? JSON.parse(text) : {} } catch { data = { raw: text } }
  if (!res.ok) {
    const err: any = new Error(`Nursys ${path} ${res.status}: ${data?.message || text}`)
    err.status = res.status
    err.body = data
    throw err
  }
  return data as T
}

// ============================================================
// Practice settings — user-facing labels.
// TODO(nursys): map each label to the real NCSBN HospitalPracticeSetting ID
// from the spec appendix. Until then every label is sent as "Other" (id=0)
// with the label text placed in HospitalPracticeSettingOther.
// ============================================================
export const PRACTICE_SETTING_LABELS = [
  'Hospital — Acute care',
  'Hospital — Intensive care (ICU)',
  'Hospital — Emergency (ER)',
  'Hospital — Operating room (OR)',
  'Hospital — Labor & delivery',
  'Hospital — Pediatrics',
  'Hospital — Oncology',
  'Hospital — Telemetry / Step-down',
  'Long-term care / Nursing home',
  'Home health',
  'Ambulatory / Outpatient clinic',
  'Hospice / Palliative',
  'Mental health / Psychiatric',
  'Correctional health',
  'School nursing',
  'Occupational / Public health',
  'Telehealth',
  'Other',
] as const

export type PracticeSettingLabel = typeof PRACTICE_SETTING_LABELS[number]

// TODO(nursys): replace this stub with real ID mapping.
export function practiceSettingToNursys(label: string) {
  return { HospitalPracticeSetting: '0', HospitalPracticeSettingOther: label }
}

// ============================================================
// Manage Nurse List (async 2-step flow per spec §3.2)
// ============================================================

export type SubmissionAction = 'A' | 'U' | 'R' // Add | Update | Remove

export interface ManageNurseListRequest {
  SubmissionActionCode: SubmissionAction
  JurisdictionAbbreviation?: string  // e.g. "TX"
  LicenseNumber?: string
  LicenseType?: string               // e.g. "RN", "LPN"
  NcsbnId?: string
  Email?: string
  Address1: string
  Address2?: string
  City: string
  State: string
  Zip: string
  LastFourSSN: string
  BirthYear: string | number
  HospitalPracticeSetting: string    // pipe-delimited IDs, e.g. "1|2|3"
  HospitalPracticeSettingOther?: string
  NotificationsEnabled: 'Y' | 'N'
  RemindersEnabled: 'Y' | 'N'
  LocationList?: string              // pipe-delimited location codes
  RecordId?: string                  // client-provided echo identifier
}

export interface TransactionError {
  ErrorId: number
  ErrorMessage: string
}

export interface TransactionEnvelope {
  TransactionId: string
  TransactionDate: string
  TransactionComment: string
  TransactionSuccessFlag: boolean
  TransactionErrors: TransactionError[]
}

export async function submitManageNurseList(requests: ManageNurseListRequest[]) {
  if (requests.length > 2000) {
    throw new Error('Manage Nurse List batch cannot exceed 2000 nurses')
  }
  const res = await call<{ Transaction: TransactionEnvelope }>('/managenurselist', {
    method: 'POST',
    body: { ManageNurseListRequests: requests },
  })
  return res.Transaction
}

export interface ManageNurseListResponse {
  SuccessFlag: boolean
  Errors: TransactionError[]
  ManageNurseListRequest: ManageNurseListRequest & { RecordId?: string }
}

export interface ManageNurseListRetrieveResponse {
  ProcessingCompleteFlag: boolean
  Transaction?: TransactionEnvelope
  ManageNurseListResponses: ManageNurseListResponse[]
}

export async function getManageNurseListResult(transactionId: string) {
  return call<ManageNurseListRetrieveResponse>(
    '/managenurselist?transactionId=' + encodeURIComponent(transactionId),
    { method: 'GET' }
  )
}

// ============================================================
// Nurse Lookup — per §3.4 (response confirmed).
// ============================================================

export interface NurseLookupRequest {
  JurisdictionAbbreviation?: string
  LicenseNumber?: string
  LicenseType?: string
  NcsbnId?: string
  RecordId?: string
}

export interface NurseLookupDiscipline {
  JurisdictionAbbreviation: string
  Jurisdiction: string
  DateActionWasTaken: string
  AgainstPrivilegeToPracticeFlag: boolean
  NurseLookupBasisForActions: Array<{ BasisForActionCode: string; BasisForActionDescription: string }>
  NurseLookupInitialActions: Array<{
    ActionDate: string
    ActionCode: string
    ActionDescription: string
    ActionStayedFlag: boolean
    StartDate?: string | null
    EndDate?: string | null
    Duration?: string
    AutomaticReinstatement?: string
  }>
  NurseLookupInitialActionDocuments?: Array<{ ActionDate: string; DocumentId: string; DocumentName: string }>
  NurseLookupRevisionReports?: Array<any>
}

export interface NurseLookupAdvancedPractice {
  FocusSpecialty: string
  PrescriptionAuthority: 'Yes' | 'No' | string
  CertificationExpirationDate?: string
  FocusSpecialtyExpirationDate?: string
}

export interface NurseLookupLicense {
  LastName: string
  FirstName: string
  LicenseType: string
  JurisdictionAbbreviation: string
  Jurisdiction: string
  LicenseNumber: string
  Active: 'YES' | 'NO' | '--' | string
  LicenseStatus: string            // "UNENCUMBERED", "UNENCUMBERED (see history)", "--", etc.
  LicenseOriginalIssueDate?: string | null
  LicenseExpirationDate?: string | null
  CompactStatus: 'MULTISTATE' | 'SINGLE STATE' | 'N/A' | '--' | string
  Messages: string[]
  NurseLookupDisciplines: NurseLookupDiscipline[]
  NurseLookupNotifications: Array<any>
  NurseLookupAdvancedPractices: NurseLookupAdvancedPractice[]
}

export interface AuthorizationToPractice {
  StateAbbreviation: string
  StateDescription: string
  AuthorizationToPracticeCode: 'Y' | 'R' | 'N' | string
  AuthorizationToPracticeDescription: string
  AuthorizationToPracticeNarrative: string
}

export interface NurseLookupResponseItem {
  Errors: TransactionError[]
  NurseLookupRequest: NurseLookupRequest
  SuccessFlag: boolean
  FirstName: string
  LastName: string
  NcsbnId: string
  Messages: string[]
  NurseLookupLicenses: NurseLookupLicense[]
  NurseLookupRNAuthorizationsToPractice?: AuthorizationToPractice[]
  NurseLookupPNAuthorizationsToPractice?: AuthorizationToPractice[]
}

export interface NurseLookupRetrieveResponse {
  // Note: Nursys uses "ProcessingComplete" here (not "ProcessingCompleteFlag" like /managenurselist).
  ProcessingComplete?: boolean
  ProcessingCompleteFlag?: boolean
  NurseLookupResponses: NurseLookupResponseItem[]
  Transaction: TransactionEnvelope
}

export async function submitNurseLookup(licenses: NurseLookupRequest[]) {
  const res = await call<{ Transaction: TransactionEnvelope }>('/nurselookup', {
    method: 'POST',
    body: { NurseLookupRequests: licenses },
  })
  return res.Transaction
}

export async function getNurseLookupResult(transactionId: string) {
  return call<NurseLookupRetrieveResponse>(
    '/nurselookup?transactionId=' + encodeURIComponent(transactionId),
    { method: 'GET' }
  )
}

/** True if a Nurse Lookup license record indicates a currently-valid, practice-ready license. */
export function isLicenseCurrentlyValid(license: NurseLookupLicense): {
  valid: boolean
  reason: string
} {
  if (license.Active !== 'YES') {
    return { valid: false, reason: `License Active=${license.Active}` }
  }
  const status = (license.LicenseStatus || '').toUpperCase()
  if (status === '--' || status === '') {
    return { valid: false, reason: `Missing license status` }
  }
  if (/REVOKED|SUSPENDED|EXPIRED|SURRENDER|DENIED|NULL AND VOID/i.test(status)) {
    return { valid: false, reason: `License status: ${license.LicenseStatus}` }
  }
  if (license.LicenseExpirationDate) {
    const expiry = new Date(license.LicenseExpirationDate)
    if (!isNaN(expiry.getTime()) && expiry < new Date()) {
      return { valid: false, reason: `License expired ${license.LicenseExpirationDate.slice(0, 10)}` }
    }
  }
  return { valid: true, reason: `Active ${license.LicenseStatus}` }
}

// ============================================================
// Notification Lookup — per §3.5 (response shape confirmed).
// TODO(nursys §3.4): paste the POST request body shape to lock it in.
// ============================================================

export interface NotificationLookupItem {
  NcsbnId?: string
  JurisdictionAbbreviation: string
  Jurisdiction: string
  LicenseNumber: string
  LicenseType: string
  FirstName: string
  LastName: string
  RecordId?: string
  NotificationDate: string
  LicenseStatusChange?: string        // e.g. "Active status changed", "Expiration date changed"
  DisciplineStatusChange?: string     // e.g. "Discipline added", "Discipline updated"
  DisciplineStatusChangeOther?: string
}

export interface NotificationLookupRetrieveResponse {
  ProcessingCompleteFlag: boolean
  NotificationLookupResponses: NotificationLookupItem[]
  Transaction: TransactionEnvelope
}

// Status-change phrases that should force us to re-verify this license.
// Any of these = we can no longer trust the cached license_verified=true.
export const STATUS_CHANGE_TRIGGERS_RECHECK = [
  'Active status changed',
  'License status changed',
  'Expiration date changed',
  'Compact status changed',
  'Nurse Alert added',
  'Temporary License Designation removed',
  'Discipline added',
  'Discipline updated',
]

export async function submitNotificationLookup({ startDate, endDate }: { startDate: string; endDate: string }) {
  // Per §3.5.1: StartDate and EndDate are required, both YYYY-MM-DD, both must be <= today.
  const res = await call<{ Transaction: TransactionEnvelope }>('/notificationlookup', {
    method: 'POST',
    body: { StartDate: startDate, EndDate: endDate },
  })
  return res.Transaction
}

export async function getNotificationLookupResult(transactionId: string) {
  return call<NotificationLookupRetrieveResponse>(
    '/notificationlookup?transactionId=' + encodeURIComponent(transactionId),
    { method: 'GET' }
  )
}

// ============================================================
// Retrieve Documents — per §3.6
// ============================================================

export interface RetrieveDocumentItem {
  SuccessFlag: boolean
  DocumentId: string
  DocumentName: string
  DocumentContents: string | null  // base64-encoded byte array
}

export interface RetrieveDocumentsResponse {
  Transaction: TransactionEnvelope
  Documents: RetrieveDocumentItem[]
}

export async function retrieveDocuments(documentIds: string[]) {
  if (documentIds.length === 0) throw new Error('No document IDs provided')
  if (documentIds.length > 5) throw new Error('Retrieve Documents accepts at most 5 IDs per call')
  const joined = documentIds.map(encodeURIComponent).join(',')
  return call<RetrieveDocumentsResponse>(`/retrievedocuments?documentIds=${joined}`, {
    method: 'GET',
  })
}

// ============================================================
// Change Password (rotate before temp expiry, then every 90 days)
// TODO(nursys): paste §3.5 (or whichever section) for exact field names.
// ============================================================

export async function changePassword(newPassword: string) {
  const { PASSWORD } = env()
  if (!PASSWORD) throw new Error('NURSYS_API_PASSWORD not set (required as currentPassword)')
  return call('/changepassword', {
    method: 'POST',
    body: {
      CurrentPassword: PASSWORD,
      NewPassword: newPassword,
    },
  })
}
