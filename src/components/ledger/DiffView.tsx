import { formatCents, formatPct } from '@/lib/ledger/currency'
import type { FieldDeltas, NumericDelta, DateDelta, TextDelta, CategoricalDelta } from '@/lib/ledger/diff'

const NUMERIC_LABELS: Record<string, string> = {
  taxable_hourly_rate_cents: 'Taxable hourly',
  weekly_housing_stipend_cents: 'Weekly housing',
  weekly_meals_stipend_cents: 'Weekly meals',
  weekly_travel_stipend_cents: 'Weekly travel',
  one_time_travel_reimbursement_cents: 'Travel (one-time, outbound)',
  one_time_return_reimbursement_cents: 'Return (one-time)',
  weekly_gross_estimate_cents: 'Weekly gross',
  weekly_net_estimate_cents: 'Weekly net',
  weekly_net_estimate_cents_low: 'Weekly net (low)',
  weekly_net_estimate_cents_high: 'Weekly net (high)',
  guaranteed_hours_per_week: 'Guaranteed hrs/wk',
  sign_on_bonus_cents: 'Sign-on bonus',
  completion_bonus_cents: 'Completion bonus',
  extension_bonus_cents: 'Extension bonus',
  referral_bonus_cents_min: 'Referral (min)',
  referral_bonus_cents_max: 'Referral (max)',
  overtime_rate_cents: 'Overtime rate',
  contract_length_weeks: 'Length (weeks)',
  shift_length_hours: 'Shift length (hrs)',
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

const FLAG_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  worse: { bg: 'var(--tang-50)', color: 'var(--tang-mid)', label: 'WORSE' },
  better: { bg: 'var(--sage-50)', color: 'var(--sage)', label: 'BETTER' },
  shifted: { bg: 'var(--tang-50)', color: 'var(--tang-mid)', label: 'SHIFTED' },
  removed: { bg: 'var(--tang-50)', color: 'var(--tang-mid)', label: 'REMOVED' },
  added: { bg: 'var(--gold-50)', color: 'var(--ink)', label: 'ADDED' },
  same: { bg: 'var(--g100)', color: 'var(--g600)', label: 'SAME' },
  unknown: { bg: 'var(--g100)', color: 'var(--g400)', label: '—' },
  changed: { bg: 'var(--gold-50)', color: 'var(--ink)', label: 'CHANGED' },
  material: { bg: 'var(--tang-50)', color: 'var(--tang-mid)', label: 'MATERIAL CHANGE' },
}

const MONEY_FIELDS = [
  'taxable_hourly_rate_cents',
  'weekly_housing_stipend_cents',
  'weekly_meals_stipend_cents',
  'weekly_travel_stipend_cents',
  'weekly_gross_estimate_cents',
  'weekly_net_estimate_cents_low',
  'weekly_net_estimate_cents_high',
]
const ONE_TIME_FIELDS = [
  'one_time_travel_reimbursement_cents',
  'one_time_return_reimbursement_cents',
]
const BONUS_FIELDS = [
  'sign_on_bonus_cents',
  'completion_bonus_cents',
  'extension_bonus_cents',
  'referral_bonus_cents_min',
  'referral_bonus_cents_max',
]
const SCHEDULE_NUM_FIELDS = ['guaranteed_hours_per_week', 'contract_length_weeks', 'shift_length_hours', 'overtime_rate_cents']
const LOCATION_FIELDS = ['shift_type', 'location_city', 'location_state', 'facility_name', 'specialty', 'overtime_basis']

function countByFlag(deltas: FieldDeltas) {
  let worse = 0
  let better = 0
  let shifted = 0
  const monetary = [...MONEY_FIELDS, ...ONE_TIME_FIELDS, ...BONUS_FIELDS, 'overtime_rate_cents']
  for (const f of monetary) {
    const d = deltas[f as keyof FieldDeltas] as NumericDelta
    if (d?.flag === 'worse') worse++
    else if (d?.flag === 'better') better++
  }
  if ((deltas.start_date as DateDelta).flag === 'shifted') shifted++
  if ((deltas.end_date as DateDelta).flag === 'shifted') shifted++
  return { worse, better, shifted }
}

function NumericRow({ field, delta, isMoney }: { field: string; delta: NumericDelta; isMoney: boolean }) {
  const fmt = (v: number | null) => (isMoney ? formatCents(v) : v?.toString() ?? '—')
  const s = FLAG_STYLE[delta.flag] ?? FLAG_STYLE.unknown
  const deltaIsNegative = delta.delta != null && delta.delta < 0
  return (
    <tr style={{ borderBottom: '1px solid var(--g100)' }}>
      <td className="py-3.5 px-5 text-sm" style={{ color: 'var(--ink)' }}>{NUMERIC_LABELS[field] ?? field}</td>
      <td className="py-3.5 px-5 text-sm font-mono" style={{ color: 'var(--g800)' }}>{fmt(delta.quoted)}</td>
      <td className="py-3.5 px-5 text-sm font-mono" style={{ color: 'var(--g800)' }}>{fmt(delta.signed)}</td>
      <td className="py-3.5 px-5 text-sm font-mono" style={{ color: deltaIsNegative ? 'var(--tang-mid)' : delta.delta != null && delta.delta > 0 ? 'var(--sage)' : 'var(--g800)' }}>
        {delta.delta != null ? (isMoney ? formatCents(delta.delta) : delta.delta.toString()) : '—'}
        {delta.pct != null && <span className="ml-2 text-xs" style={{ color: 'var(--g400)' }}>{formatPct(delta.pct)}</span>}
      </td>
      <td className="py-3.5 px-5">
        <span className="text-[10px] font-bold tracking-[1px] px-2 py-1 rounded-md" style={{ background: s.bg, color: s.color }}>{s.label}</span>
      </td>
    </tr>
  )
}

function DateRow({ field, delta }: { field: string; delta: DateDelta }) {
  const s = FLAG_STYLE[delta.flag] ?? FLAG_STYLE.unknown
  return (
    <tr style={{ borderBottom: '1px solid var(--g100)' }}>
      <td className="py-3.5 px-5 text-sm" style={{ color: 'var(--ink)' }}>{field === 'start_date' ? 'Start date' : 'End date'}</td>
      <td className="py-3.5 px-5 text-sm font-mono" style={{ color: 'var(--g800)' }}>{delta.quoted ?? '—'}</td>
      <td className="py-3.5 px-5 text-sm font-mono" style={{ color: 'var(--g800)' }}>{delta.signed ?? '—'}</td>
      <td className="py-3.5 px-5 text-sm font-mono" style={{ color: delta.days_shifted != null && Math.abs(delta.days_shifted) > 7 ? 'var(--tang-mid)' : 'var(--g800)' }}>
        {delta.days_shifted != null ? `${delta.days_shifted > 0 ? '+' : ''}${delta.days_shifted}d` : '—'}
      </td>
      <td className="py-3.5 px-5">
        <span className="text-[10px] font-bold tracking-[1px] px-2 py-1 rounded-md" style={{ background: s.bg, color: s.color }}>{s.label}</span>
      </td>
    </tr>
  )
}

function CategoricalRow({ field, delta }: { field: string; delta: CategoricalDelta }) {
  const s = delta.changed ? FLAG_STYLE.changed : FLAG_STYLE.same
  return (
    <tr style={{ borderBottom: '1px solid var(--g100)' }}>
      <td className="py-3.5 px-5 text-sm" style={{ color: 'var(--ink)' }}>{CATEGORICAL_LABELS[field] ?? field}</td>
      <td className="py-3.5 px-5 text-sm" style={{ color: 'var(--g800)' }}>{delta.quoted ?? '—'}</td>
      <td className="py-3.5 px-5 text-sm" style={{ color: 'var(--g800)' }}>{delta.signed ?? '—'}</td>
      <td className="py-3.5 px-5 text-sm" style={{ color: 'var(--g400)' }}>—</td>
      <td className="py-3.5 px-5">
        <span className="text-[10px] font-bold tracking-[1px] px-2 py-1 rounded-md" style={{ background: s.bg, color: s.color }}>{s.label}</span>
      </td>
    </tr>
  )
}

function TextBlock({ field, delta }: { field: string; delta: TextDelta }) {
  const s = delta.material_change ? FLAG_STYLE.material : FLAG_STYLE.same
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{TEXT_LABELS[field] ?? field}</h4>
        <span className="text-[10px] font-bold tracking-[1px] px-2 py-1 rounded-md" style={{ background: s.bg, color: s.color }}>{s.label}</span>
      </div>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-[10px] font-bold tracking-[1.2px] uppercase mb-1.5" style={{ color: 'var(--g400)' }}>Quoted</div>
          <p style={{ color: 'var(--g800)' }}>{delta.quoted ?? <em style={{ color: 'var(--g400)' }}>not specified</em>}</p>
        </div>
        <div>
          <div className="text-[10px] font-bold tracking-[1.2px] uppercase mb-1.5" style={{ color: 'var(--g400)' }}>Signed</div>
          <p style={{ color: 'var(--g800)' }}>{delta.signed ?? <em style={{ color: 'var(--g400)' }}>not specified</em>}</p>
        </div>
      </div>
      {delta.reason && (
        <p className="text-xs mt-3 italic" style={{ color: 'var(--g600)' }}>“{delta.reason}”</p>
      )}
    </div>
  )
}

function Table({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--g100)', background: 'var(--cream-mid)' }}>
        <div>
          {eyebrow && <div className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--tang)' }}>{eyebrow}</div>}
          <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--ink)' }}>{title}</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--g100)' }}>
              <th className="text-left py-3 px-5 text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g400)' }}>Field</th>
              <th className="text-left py-3 px-5 text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g400)' }}>Quoted</th>
              <th className="text-left py-3 px-5 text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g400)' }}>Signed</th>
              <th className="text-left py-3 px-5 text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g400)' }}>Delta</th>
              <th className="text-left py-3 px-5 text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g400)' }}>Flag</th>
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  )
}

export default function DiffView({ deltas }: { deltas: FieldDeltas }) {
  const counts = countByFlag(deltas)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl p-5" style={{ background: counts.worse > 0 ? 'var(--tang)' : 'var(--cream-mid)', color: counts.worse > 0 ? 'white' : 'var(--ink)' }}>
          <div className="text-[10px] font-bold tracking-[1.2px] uppercase opacity-80">Worse</div>
          <div className="text-4xl font-bold mt-2 leading-none">{counts.worse}</div>
          <div className="text-xs mt-2 opacity-80">money fields cut</div>
        </div>
        <div className="rounded-2xl p-5" style={{ background: 'var(--sage-50)', color: 'var(--sage)' }}>
          <div className="text-[10px] font-bold tracking-[1.2px] uppercase">Better</div>
          <div className="text-4xl font-bold mt-2 leading-none">{counts.better}</div>
          <div className="text-xs mt-2">improved vs quote</div>
        </div>
        <div className="rounded-2xl p-5" style={{ background: counts.shifted > 0 ? 'var(--gold-50)' : 'var(--cream-mid)', color: 'var(--ink)' }}>
          <div className="text-[10px] font-bold tracking-[1.2px] uppercase">Dates shifted</div>
          <div className="text-4xl font-bold mt-2 leading-none">{counts.shifted}</div>
          <div className="text-xs mt-2 opacity-80">&gt; 7 days</div>
        </div>
        <div className="rounded-2xl p-5" style={{ background: 'var(--plum)', color: 'white' }}>
          <div className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--plum-100)' }}>Status</div>
          <div className="text-xl font-bold mt-2 leading-tight">
            {deltas.any_worse ? 'Bait & switch' : deltas.any_material_change ? 'Material change' : 'Clean match'}
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--plum-100)' }}>
            {deltas.any_worse ? 'review before signing' : deltas.any_material_change ? 'review the deltas' : 'signed matches quote'}
          </div>
        </div>
      </div>

      <Table eyebrow="Weekly compensation" title="Pay package">
        {MONEY_FIELDS.map((f) => (
          <NumericRow key={f} field={f} delta={deltas[f as keyof FieldDeltas] as NumericDelta} isMoney />
        ))}
      </Table>

      <Table eyebrow="One-time payments" title="Pre / post-assignment reimbursements">
        {ONE_TIME_FIELDS.map((f) => (
          <NumericRow key={f} field={f} delta={deltas[f as keyof FieldDeltas] as NumericDelta} isMoney />
        ))}
      </Table>

      <Table eyebrow="Bonuses" title="Sign-on / completion / extension / referral">
        {BONUS_FIELDS.map((f) => (
          <NumericRow key={f} field={f} delta={deltas[f as keyof FieldDeltas] as NumericDelta} isMoney />
        ))}
      </Table>

      <Table eyebrow="Schedule" title="Hours, length, overtime">
        {SCHEDULE_NUM_FIELDS.map((f) => (
          <NumericRow key={f} field={f} delta={deltas[f as keyof FieldDeltas] as NumericDelta} isMoney={f === 'overtime_rate_cents'} />
        ))}
        <DateRow field="start_date" delta={deltas.start_date} />
        <DateRow field="end_date" delta={deltas.end_date} />
      </Table>

      <Table eyebrow="Location & identity" title="Where you are working, who for">
        {LOCATION_FIELDS.map((f) => (
          <CategoricalRow key={f} field={f} delta={deltas[f as keyof FieldDeltas] as CategoricalDelta} />
        ))}
      </Table>

      <div className="grid md:grid-cols-2 gap-4">
        <TextBlock field="cancellation_terms" delta={deltas.cancellation_terms} />
        <TextBlock field="call_off_policy" delta={deltas.call_off_policy} />
        <TextBlock field="floating_policy" delta={deltas.floating_policy} />
        <TextBlock field="holiday_pay" delta={deltas.holiday_pay} />
      </div>
    </div>
  )
}
