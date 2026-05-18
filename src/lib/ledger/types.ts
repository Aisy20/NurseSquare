import { z } from 'zod'

export const PayPackageSchema = z.object({
  taxable_hourly_rate_cents: z.number().int().nullable(),
  weekly_housing_stipend_cents: z.number().int().nullable(),
  weekly_meals_stipend_cents: z.number().int().nullable(),
  weekly_travel_stipend_cents: z.number().int().nullable(),
  weekly_gross_estimate_cents: z.number().int().nullable(),
  weekly_net_estimate_cents: z.number().int().nullable(),
  guaranteed_hours_per_week: z.number().int().nullable(),
  shift_type: z.enum(['day', 'night', 'rotating', 'variable']).nullable(),
  shift_length_hours: z.number().int().nullable(),
  start_date: z.iso.date().nullable(),
  end_date: z.iso.date().nullable(),
  contract_length_weeks: z.number().int().nullable(),
  location_city: z.string().nullable(),
  location_state: z.string().length(2).nullable(),
  facility_name: z.string().nullable(),
  specialty: z.string().nullable(),
  sign_on_bonus_cents: z.number().int().nullable(),
  completion_bonus_cents: z.number().int().nullable(),
  cancellation_terms: z.string().nullable(),
  overtime_rate_cents: z.number().int().nullable(),
  holiday_pay: z.string().nullable(),
  required_credentials: z.array(z.string()).default([]),
  extraction_confidence: z.number().min(0).max(1),
  raw_notes: z.string().nullable(),
})

export type PayPackage = z.infer<typeof PayPackageSchema>

export const SourceTypeSchema = z.enum(['email', 'sms', 'voice', 'manual'])
export type SourceType = z.infer<typeof SourceTypeSchema>

export const LEDGER_MODELS = {
  extract: 'claude-sonnet-4-6',
  diff: 'claude-haiku-4-5-20251001',
} as const

export type LedgerPurpose = 'extract_quote' | 'extract_signed' | 'diff_text'

export interface LlmCallLog {
  purpose: LedgerPurpose
  model: string
  prompt_tokens: number | null
  completion_tokens: number | null
  cache_read_tokens: number | null
  cache_creation_tokens: number | null
  latency_ms: number
  status: 'ok' | 'rate_limited' | 'error'
  error_message: string | null
  user_id?: string | null
  contract_id?: string | null
}
