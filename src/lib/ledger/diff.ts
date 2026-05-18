import Anthropic from '@anthropic-ai/sdk'
import type { PayPackage, LlmCallLog } from './types'
import { LEDGER_MODELS } from './types'

const WORSE_CENTS_THRESHOLD = 2500
const WORSE_PCT_THRESHOLD = 3
const DATE_SHIFT_DAYS_THRESHOLD = 7

export type NumericFlag = 'worse' | 'better' | 'same' | 'added' | 'removed' | 'unknown'
export type DateFlag = 'shifted' | 'same' | 'added' | 'removed' | 'unknown'

export interface NumericDelta {
  quoted: number | null
  signed: number | null
  delta: number | null
  pct: number | null
  flag: NumericFlag
}

export interface DateDelta {
  quoted: string | null
  signed: string | null
  days_shifted: number | null
  flag: DateFlag
}

export interface TextDelta {
  quoted: string | null
  signed: string | null
  material_change: boolean
  reason: string | null
}

export interface CategoricalDelta {
  quoted: string | null
  signed: string | null
  changed: boolean
}

export interface FieldDeltas {
  taxable_hourly_rate_cents: NumericDelta
  weekly_housing_stipend_cents: NumericDelta
  weekly_meals_stipend_cents: NumericDelta
  weekly_travel_stipend_cents: NumericDelta
  weekly_gross_estimate_cents: NumericDelta
  weekly_net_estimate_cents: NumericDelta
  guaranteed_hours_per_week: NumericDelta
  sign_on_bonus_cents: NumericDelta
  completion_bonus_cents: NumericDelta
  overtime_rate_cents: NumericDelta
  contract_length_weeks: NumericDelta
  shift_length_hours: NumericDelta
  start_date: DateDelta
  end_date: DateDelta
  shift_type: CategoricalDelta
  location_city: CategoricalDelta
  location_state: CategoricalDelta
  facility_name: CategoricalDelta
  specialty: CategoricalDelta
  cancellation_terms: TextDelta
  holiday_pay: TextDelta
  any_worse: boolean
  any_material_change: boolean
}

const MONEY_FIELDS_WORSE_WHEN_SMALLER: Array<keyof PayPackage> = [
  'taxable_hourly_rate_cents',
  'weekly_housing_stipend_cents',
  'weekly_meals_stipend_cents',
  'weekly_travel_stipend_cents',
  'weekly_gross_estimate_cents',
  'weekly_net_estimate_cents',
  'guaranteed_hours_per_week',
  'sign_on_bonus_cents',
  'completion_bonus_cents',
  'overtime_rate_cents',
]

const NEUTRAL_NUMERIC_FIELDS: Array<keyof PayPackage> = ['contract_length_weeks', 'shift_length_hours']
const DATE_FIELDS: Array<keyof PayPackage> = ['start_date', 'end_date']
const CATEGORICAL_FIELDS: Array<keyof PayPackage> = [
  'shift_type',
  'location_city',
  'location_state',
  'facility_name',
  'specialty',
]
const TEXT_FIELDS: Array<keyof PayPackage> = ['cancellation_terms', 'holiday_pay']

function diffNumeric(quoted: number | null, signed: number | null, worseWhenSmaller: boolean): NumericDelta {
  if (quoted == null && signed == null) {
    return { quoted: null, signed: null, delta: null, pct: null, flag: 'unknown' }
  }
  if (quoted == null) {
    return { quoted: null, signed, delta: null, pct: null, flag: 'added' }
  }
  if (signed == null) {
    return { quoted, signed: null, delta: null, pct: null, flag: 'removed' }
  }
  const delta = signed - quoted
  const pct = quoted === 0 ? null : Number(((delta / Math.abs(quoted)) * 100).toFixed(2))

  if (!worseWhenSmaller) {
    return { quoted, signed, delta, pct, flag: delta === 0 ? 'same' : 'unknown' }
  }

  const absDelta = Math.abs(delta)
  const meaningful = absDelta > WORSE_CENTS_THRESHOLD || (pct !== null && Math.abs(pct) > WORSE_PCT_THRESHOLD)

  if (!meaningful) return { quoted, signed, delta, pct, flag: 'same' }
  return { quoted, signed, delta, pct, flag: delta < 0 ? 'worse' : 'better' }
}

function parseISODate(d: string | null): Date | null {
  if (!d) return null
  const parsed = new Date(`${d}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function diffDate(quoted: string | null, signed: string | null): DateDelta {
  if (quoted == null && signed == null) return { quoted: null, signed: null, days_shifted: null, flag: 'unknown' }
  if (quoted == null) return { quoted: null, signed, days_shifted: null, flag: 'added' }
  if (signed == null) return { quoted, signed: null, days_shifted: null, flag: 'removed' }
  const q = parseISODate(quoted)
  const s = parseISODate(signed)
  if (!q || !s) return { quoted, signed, days_shifted: null, flag: 'unknown' }
  const days = Math.round((s.getTime() - q.getTime()) / 86_400_000)
  return {
    quoted,
    signed,
    days_shifted: days,
    flag: Math.abs(days) > DATE_SHIFT_DAYS_THRESHOLD ? 'shifted' : 'same',
  }
}

function diffCategorical(quoted: string | null, signed: string | null): CategoricalDelta {
  const norm = (v: string | null) => (v == null ? null : v.trim().toLowerCase())
  return { quoted, signed, changed: norm(quoted) !== norm(signed) }
}

export type TextComparator = (
  quoted: string | null,
  signed: string | null,
  fieldName: string,
) => Promise<{ material_change: boolean; reason: string | null }>

const TEXT_DIFF_TOOL: Anthropic.Tool = {
  name: 'report_text_diff',
  description: 'Report whether two contract clauses materially differ.',
  input_schema: {
    type: 'object',
    properties: {
      material_change: { type: 'boolean' },
      reason: { type: 'string' },
    },
    required: ['material_change', 'reason'],
  },
}

const TEXT_DIFF_SYSTEM = `You compare two clauses from a US travel nurse pay package. Decide whether the signed clause materially differs from the quoted clause. "Material" means the obligations, penalties, notice periods, or rights of either party change. Wording-only changes that preserve meaning are NOT material. Output via the provided tool only.`

export function defaultTextComparator(opts?: {
  client?: Anthropic
  onCall?: (log: LlmCallLog) => void | Promise<void>
  contractId?: string | null
  userId?: string | null
}): TextComparator {
  const client = opts?.client ?? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
  return async (quoted, signed, fieldName) => {
    if (quoted == null && signed == null) return { material_change: false, reason: null }
    if (quoted == null || signed == null) {
      return { material_change: true, reason: quoted == null ? 'Field added in signed contract.' : 'Field removed from signed contract.' }
    }
    const started = Date.now()
    try {
      const response = await client.messages.create({
        model: LEDGER_MODELS.diff,
        max_tokens: 300,
        system: TEXT_DIFF_SYSTEM,
        tools: [TEXT_DIFF_TOOL],
        tool_choice: { type: 'tool', name: TEXT_DIFF_TOOL.name },
        messages: [
          { role: 'user', content: `Field: ${fieldName}\nQUOTED:\n${quoted}\n\nSIGNED:\n${signed}` },
        ],
      })
      const block = response.content.find((b) => b.type === 'tool_use')
      if (!block || block.type !== 'tool_use') throw new Error('haiku did not call report_text_diff')
      const input = block.input as { material_change: boolean; reason: string }
      await opts?.onCall?.({
        purpose: 'diff_text',
        model: LEDGER_MODELS.diff,
        prompt_tokens: response.usage.input_tokens ?? null,
        completion_tokens: response.usage.output_tokens ?? null,
        cache_read_tokens: response.usage.cache_read_input_tokens ?? null,
        cache_creation_tokens: response.usage.cache_creation_input_tokens ?? null,
        latency_ms: Date.now() - started,
        status: 'ok',
        error_message: null,
        user_id: opts?.userId ?? null,
        contract_id: opts?.contractId ?? null,
      })
      return { material_change: input.material_change, reason: input.reason }
    } catch (err) {
      await opts?.onCall?.({
        purpose: 'diff_text',
        model: LEDGER_MODELS.diff,
        prompt_tokens: null,
        completion_tokens: null,
        cache_read_tokens: null,
        cache_creation_tokens: null,
        latency_ms: Date.now() - started,
        status: 'error',
        error_message: err instanceof Error ? err.message : String(err),
        user_id: opts?.userId ?? null,
        contract_id: opts?.contractId ?? null,
      })
      throw err
    }
  }
}

export interface ComputeDiffInput {
  quoted: PayPackage
  signed: PayPackage
  compareText?: TextComparator
}

export async function computeDiff({ quoted, signed, compareText }: ComputeDiffInput): Promise<FieldDeltas> {
  const comparator = compareText ?? defaultTextComparator()

  const numeric: Partial<FieldDeltas> = {}
  for (const f of MONEY_FIELDS_WORSE_WHEN_SMALLER) {
    numeric[f as keyof FieldDeltas] = diffNumeric(
      quoted[f] as number | null,
      signed[f] as number | null,
      true,
    ) as never
  }
  for (const f of NEUTRAL_NUMERIC_FIELDS) {
    numeric[f as keyof FieldDeltas] = diffNumeric(
      quoted[f] as number | null,
      signed[f] as number | null,
      false,
    ) as never
  }

  const dates: Partial<FieldDeltas> = {}
  for (const f of DATE_FIELDS) {
    dates[f as keyof FieldDeltas] = diffDate(quoted[f] as string | null, signed[f] as string | null) as never
  }

  const categorical: Partial<FieldDeltas> = {}
  for (const f of CATEGORICAL_FIELDS) {
    categorical[f as keyof FieldDeltas] = diffCategorical(
      quoted[f] as string | null,
      signed[f] as string | null,
    ) as never
  }

  const text: Partial<FieldDeltas> = {}
  for (const f of TEXT_FIELDS) {
    const r = await comparator(quoted[f] as string | null, signed[f] as string | null, f)
    text[f as keyof FieldDeltas] = {
      quoted: quoted[f] as string | null,
      signed: signed[f] as string | null,
      material_change: r.material_change,
      reason: r.reason,
    } as never
  }

  const merged = { ...numeric, ...dates, ...categorical, ...text } as Omit<FieldDeltas, 'any_worse' | 'any_material_change'>
  const any_worse = MONEY_FIELDS_WORSE_WHEN_SMALLER.some(
    (f) => (merged[f as keyof typeof merged] as NumericDelta).flag === 'worse',
  )
  const any_material_change =
    any_worse ||
    DATE_FIELDS.some((f) => (merged[f as keyof typeof merged] as DateDelta).flag === 'shifted') ||
    TEXT_FIELDS.some((f) => (merged[f as keyof typeof merged] as TextDelta).material_change) ||
    CATEGORICAL_FIELDS.some((f) => (merged[f as keyof typeof merged] as CategoricalDelta).changed)

  return { ...merged, any_worse, any_material_change } as FieldDeltas
}
