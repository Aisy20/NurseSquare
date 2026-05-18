import { formatCents, formatPct } from '@/lib/ledger/currency'
import type { FieldDeltas, NumericDelta, DateDelta, TextDelta, CategoricalDelta } from '@/lib/ledger/diff'

const NUMERIC_LABELS: Record<string, string> = {
  taxable_hourly_rate_cents: 'Taxable hourly',
  weekly_housing_stipend_cents: 'Weekly housing',
  weekly_meals_stipend_cents: 'Weekly meals',
  weekly_travel_stipend_cents: 'Weekly travel',
  one_time_travel_reimbursement_cents: 'Travel reimbursement (outbound, one-time)',
  one_time_return_reimbursement_cents: 'Return reimbursement (one-time)',
  weekly_gross_estimate_cents: 'Weekly gross',
  weekly_net_estimate_cents: 'Weekly net',
  weekly_net_estimate_cents_low: 'Weekly net (low)',
  weekly_net_estimate_cents_high: 'Weekly net (high)',
  guaranteed_hours_per_week: 'Guaranteed hrs/wk',
  sign_on_bonus_cents: 'Sign-on bonus',
  completion_bonus_cents: 'Completion bonus',
  extension_bonus_cents: 'Extension bonus',
  referral_bonus_cents_min: 'Referral bonus (min)',
  referral_bonus_cents_max: 'Referral bonus (max)',
  overtime_rate_cents: 'Overtime rate',
  contract_length_weeks: 'Length (weeks)',
  shift_length_hours: 'Shift length',
}
const CATEGORICAL_LABELS: Record<string, string> = {
  shift_type: 'Shift type',
  location_city: 'City',
  location_state: 'State',
  facility_name: 'Facility',
  specialty: 'Specialty',
  overtime_basis: 'OT basis',
}
const TEXT_LABELS: Record<string, string> = {
  cancellation_terms: 'Cancellation terms',
  call_off_policy: 'Call-off policy',
  floating_policy: 'Floating policy',
  holiday_pay: 'Holiday pay',
}

function flagStyle(flag: string): { bg: string; color: string; label: string } {
  switch (flag) {
    case 'worse': return { bg: 'var(--tang-50)', color: 'var(--tang-mid)', label: 'WORSE' }
    case 'better': return { bg: 'var(--sage-50)', color: 'var(--sage)', label: 'BETTER' }
    case 'shifted': return { bg: 'var(--tang-50)', color: 'var(--tang-mid)', label: 'SHIFTED' }
    case 'removed': return { bg: 'var(--tang-50)', color: 'var(--tang-mid)', label: 'REMOVED' }
    case 'added': return { bg: 'var(--gold-50)', color: 'var(--ink)', label: 'ADDED' }
    default: return { bg: 'var(--g100)', color: 'var(--g600)', label: 'SAME' }
  }
}

function NumericRow({ field, delta, isMoney }: { field: string; delta: NumericDelta; isMoney: boolean }) {
  const fmt = (v: number | null) => (isMoney ? formatCents(v) : v?.toString() ?? '--')
  const s = flagStyle(delta.flag)
  return (
    <tr style={{ borderBottom: '1px solid var(--g100)' }}>
      <td className="py-3 px-4 text-sm" style={{ color: 'var(--ink)' }}>{NUMERIC_LABELS[field] ?? field}</td>
      <td className="py-3 px-4 text-sm font-mono" style={{ color: 'var(--g800)' }}>{fmt(delta.quoted)}</td>
      <td className="py-3 px-4 text-sm font-mono" style={{ color: 'var(--g800)' }}>{fmt(delta.signed)}</td>
      <td className="py-3 px-4 text-sm font-mono" style={{ color: delta.delta != null && delta.delta < 0 ? 'var(--tang-mid)' : 'var(--g800)' }}>
        {delta.delta != null ? (isMoney ? formatCents(delta.delta) : delta.delta.toString()) : '--'}
        {delta.pct != null && <span className="ml-2 text-xs" style={{ color: 'var(--g400)' }}>{formatPct(delta.pct)}</span>}
      </td>
      <td className="py-3 px-4">
        <span className="text-[11px] font-bold tracking-wider px-2 py-1 rounded" style={{ background: s.bg, color: s.color }}>{s.label}</span>
      </td>
    </tr>
  )
}

function DateRow({ field, delta }: { field: string; delta: DateDelta }) {
  const s = flagStyle(delta.flag)
  return (
    <tr style={{ borderBottom: '1px solid var(--g100)' }}>
      <td className="py-3 px-4 text-sm" style={{ color: 'var(--ink)' }}>{field === 'start_date' ? 'Start date' : 'End date'}</td>
      <td className="py-3 px-4 text-sm font-mono" style={{ color: 'var(--g800)' }}>{delta.quoted ?? '--'}</td>
      <td className="py-3 px-4 text-sm font-mono" style={{ color: 'var(--g800)' }}>{delta.signed ?? '--'}</td>
      <td className="py-3 px-4 text-sm font-mono" style={{ color: delta.days_shifted != null && Math.abs(delta.days_shifted) > 7 ? 'var(--tang-mid)' : 'var(--g800)' }}>
        {delta.days_shifted != null ? `${delta.days_shifted > 0 ? '+' : ''}${delta.days_shifted}d` : '--'}
      </td>
      <td className="py-3 px-4">
        <span className="text-[11px] font-bold tracking-wider px-2 py-1 rounded" style={{ background: s.bg, color: s.color }}>{s.label}</span>
      </td>
    </tr>
  )
}

function CategoricalRow({ field, delta }: { field: string; delta: CategoricalDelta }) {
  const s = delta.changed ? { bg: 'var(--gold-50)', color: 'var(--ink)', label: 'CHANGED' } : flagStyle('same')
  return (
    <tr style={{ borderBottom: '1px solid var(--g100)' }}>
      <td className="py-3 px-4 text-sm" style={{ color: 'var(--ink)' }}>{CATEGORICAL_LABELS[field] ?? field}</td>
      <td className="py-3 px-4 text-sm" style={{ color: 'var(--g800)' }}>{delta.quoted ?? '--'}</td>
      <td className="py-3 px-4 text-sm" style={{ color: 'var(--g800)' }}>{delta.signed ?? '--'}</td>
      <td className="py-3 px-4 text-sm" style={{ color: 'var(--g400)' }}>--</td>
      <td className="py-3 px-4">
        <span className="text-[11px] font-bold tracking-wider px-2 py-1 rounded" style={{ background: s.bg, color: s.color }}>{s.label}</span>
      </td>
    </tr>
  )
}

function TextBlock({ field, delta }: { field: string; delta: TextDelta }) {
  const s = delta.material_change ? { bg: 'var(--tang-50)', color: 'var(--tang-mid)', label: 'MATERIAL CHANGE' } : flagStyle('same')
  return (
    <div className="border rounded-2xl p-5" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{TEXT_LABELS[field] ?? field}</h4>
        <span className="text-[11px] font-bold tracking-wider px-2 py-1 rounded" style={{ background: s.bg, color: s.color }}>{s.label}</span>
      </div>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-[11px] font-bold tracking-wider mb-1" style={{ color: 'var(--g400)' }}>QUOTED</div>
          <p style={{ color: 'var(--g800)' }}>{delta.quoted ?? <em style={{ color: 'var(--g400)' }}>not specified</em>}</p>
        </div>
        <div>
          <div className="text-[11px] font-bold tracking-wider mb-1" style={{ color: 'var(--g400)' }}>SIGNED</div>
          <p style={{ color: 'var(--g800)' }}>{delta.signed ?? <em style={{ color: 'var(--g400)' }}>not specified</em>}</p>
        </div>
      </div>
      {delta.reason && <p className="text-xs mt-3 italic" style={{ color: 'var(--g600)' }}>{delta.reason}</p>}
    </div>
  )
}

export default function DiffView({ deltas }: { deltas: FieldDeltas }) {
  const moneyFields = [
    'taxable_hourly_rate_cents',
    'weekly_housing_stipend_cents',
    'weekly_meals_stipend_cents',
    'weekly_travel_stipend_cents',
    'one_time_travel_reimbursement_cents',
    'one_time_return_reimbursement_cents',
    'weekly_gross_estimate_cents',
    'weekly_net_estimate_cents',
    'weekly_net_estimate_cents_low',
    'weekly_net_estimate_cents_high',
    'sign_on_bonus_cents',
    'completion_bonus_cents',
    'extension_bonus_cents',
    'referral_bonus_cents_min',
    'referral_bonus_cents_max',
    'overtime_rate_cents',
  ]
  const numericFields = ['guaranteed_hours_per_week', 'contract_length_weeks', 'shift_length_hours']

  return (
    <div className="space-y-6">
      {deltas.any_worse && (
        <div className="border-2 rounded-2xl p-5" style={{ borderColor: 'var(--tang)', background: 'var(--tang-50)' }}>
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--tang-deep)' }}>Bait and switch detected</h3>
          <p className="text-sm" style={{ color: 'var(--tang-deep)' }}>One or more pay fields are materially worse in the signed contract than the original quote.</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--g100)', background: 'white' }}>
        <table className="w-full">
          <thead style={{ background: 'var(--cream-mid)' }}>
            <tr>
              <th className="text-left py-3 px-4 text-[11px] font-bold tracking-wider" style={{ color: 'var(--g600)' }}>FIELD</th>
              <th className="text-left py-3 px-4 text-[11px] font-bold tracking-wider" style={{ color: 'var(--g600)' }}>QUOTED</th>
              <th className="text-left py-3 px-4 text-[11px] font-bold tracking-wider" style={{ color: 'var(--g600)' }}>SIGNED</th>
              <th className="text-left py-3 px-4 text-[11px] font-bold tracking-wider" style={{ color: 'var(--g600)' }}>DELTA</th>
              <th className="text-left py-3 px-4 text-[11px] font-bold tracking-wider" style={{ color: 'var(--g600)' }}>FLAG</th>
            </tr>
          </thead>
          <tbody>
            {moneyFields.map((f) => (
              <NumericRow key={f} field={f} delta={deltas[f as keyof FieldDeltas] as NumericDelta} isMoney />
            ))}
            {numericFields.map((f) => (
              <NumericRow key={f} field={f} delta={deltas[f as keyof FieldDeltas] as NumericDelta} isMoney={false} />
            ))}
            <DateRow field="start_date" delta={deltas.start_date} />
            <DateRow field="end_date" delta={deltas.end_date} />
            {Object.keys(CATEGORICAL_LABELS).map((f) => (
              <CategoricalRow key={f} field={f} delta={deltas[f as keyof FieldDeltas] as CategoricalDelta} />
            ))}
          </tbody>
        </table>
      </div>

      <TextBlock field="cancellation_terms" delta={deltas.cancellation_terms} />
      <TextBlock field="call_off_policy" delta={deltas.call_off_policy} />
      <TextBlock field="floating_policy" delta={deltas.floating_policy} />
      <TextBlock field="holiday_pay" delta={deltas.holiday_pay} />
    </div>
  )
}
