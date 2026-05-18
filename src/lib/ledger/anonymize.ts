import crypto from 'node:crypto'
import type { FieldDeltas, TextDelta, CategoricalDelta } from './diff'

export function hashLabel(input: string | null | undefined, prefix = 'X'): string {
  if (!input) return '—'
  const digest = crypto.createHash('sha256').update(input.trim().toLowerCase()).digest('hex')
  return `${prefix}-${digest.slice(0, 6).toUpperCase()}`
}

export interface RedactionInputs {
  agencyName?: string | null
  recruiterName?: string | null
  facilityName?: string | null
}

export function redactString(s: string | null, names: RedactionInputs): string | null {
  if (!s) return s
  let out = s
  if (names.agencyName) out = out.replaceAll(new RegExp(escapeRegExp(names.agencyName), 'gi'), hashLabel(names.agencyName, 'AGY'))
  if (names.recruiterName) out = out.replaceAll(new RegExp(escapeRegExp(names.recruiterName), 'gi'), hashLabel(names.recruiterName, 'REC'))
  if (names.facilityName) out = out.replaceAll(new RegExp(escapeRegExp(names.facilityName), 'gi'), hashLabel(names.facilityName, 'FAC'))
  return out
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function anonymizeDeltas(deltas: FieldDeltas, names: RedactionInputs): FieldDeltas {
  const facilityRedacted: CategoricalDelta = {
    quoted: deltas.facility_name.quoted ? hashLabel(deltas.facility_name.quoted, 'FAC') : null,
    signed: deltas.facility_name.signed ? hashLabel(deltas.facility_name.signed, 'FAC') : null,
    changed: deltas.facility_name.changed,
  }
  const redactText = (t: TextDelta): TextDelta => ({
    quoted: redactString(t.quoted, names),
    signed: redactString(t.signed, names),
    material_change: t.material_change,
    reason: redactString(t.reason, names),
  })
  return {
    ...deltas,
    facility_name: facilityRedacted,
    cancellation_terms: redactText(deltas.cancellation_terms),
    holiday_pay: redactText(deltas.holiday_pay),
  }
}
