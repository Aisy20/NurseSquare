import Anthropic from '@anthropic-ai/sdk'
import {
  PayPackageSchema,
  type PayPackage,
  type SourceType,
  type LlmCallLog,
  type LedgerPurpose,
  LEDGER_MODELS,
} from './types'
import { EXTRACTOR_SYSTEM_PROMPT, FEW_SHOTS } from './prompts'

const REVIEW_CONFIDENCE_THRESHOLD = 0.6
const MAX_RETRIES = 3
const BASE_BACKOFF_MS = 500

const PAY_PACKAGE_TOOL: Anthropic.Tool = {
  name: 'submit_pay_package',
  description:
    'Submit the structured PayPackage extracted from the recruiter message or signed contract.',
  input_schema: {
    type: 'object',
    properties: {
      taxable_hourly_rate_cents: { type: ['integer', 'null'] },
      weekly_housing_stipend_cents: { type: ['integer', 'null'] },
      weekly_meals_stipend_cents: { type: ['integer', 'null'] },
      weekly_travel_stipend_cents: { type: ['integer', 'null'] },
      weekly_gross_estimate_cents: { type: ['integer', 'null'] },
      weekly_net_estimate_cents: { type: ['integer', 'null'] },
      guaranteed_hours_per_week: { type: ['integer', 'null'] },
      shift_type: {
        type: ['string', 'null'],
        enum: ['day', 'night', 'rotating', 'variable', null],
      },
      shift_length_hours: { type: ['integer', 'null'] },
      start_date: { type: ['string', 'null'], format: 'date' },
      end_date: { type: ['string', 'null'], format: 'date' },
      contract_length_weeks: { type: ['integer', 'null'] },
      location_city: { type: ['string', 'null'] },
      location_state: { type: ['string', 'null'], maxLength: 2, minLength: 2 },
      facility_name: { type: ['string', 'null'] },
      specialty: { type: ['string', 'null'] },
      sign_on_bonus_cents: { type: ['integer', 'null'] },
      completion_bonus_cents: { type: ['integer', 'null'] },
      cancellation_terms: { type: ['string', 'null'] },
      overtime_rate_cents: { type: ['integer', 'null'] },
      holiday_pay: { type: ['string', 'null'] },
      required_credentials: { type: 'array', items: { type: 'string' } },
      extraction_confidence: { type: 'number', minimum: 0, maximum: 1 },
      raw_notes: { type: ['string', 'null'] },
    },
    required: [
      'taxable_hourly_rate_cents',
      'weekly_housing_stipend_cents',
      'weekly_meals_stipend_cents',
      'weekly_travel_stipend_cents',
      'weekly_gross_estimate_cents',
      'weekly_net_estimate_cents',
      'guaranteed_hours_per_week',
      'shift_type',
      'shift_length_hours',
      'start_date',
      'end_date',
      'contract_length_weeks',
      'location_city',
      'location_state',
      'facility_name',
      'specialty',
      'sign_on_bonus_cents',
      'completion_bonus_cents',
      'cancellation_terms',
      'overtime_rate_cents',
      'holiday_pay',
      'required_credentials',
      'extraction_confidence',
      'raw_notes',
    ],
  },
}

function buildMessages(rawContent: string, sourceType: SourceType): Anthropic.Messages.MessageParam[] {
  const messages: Anthropic.Messages.MessageParam[] = []
  for (const shot of FEW_SHOTS) {
    messages.push({
      role: 'user',
      content: `Source type: ${shot.source_type}\n\n---\n${shot.input}\n---`,
    })
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'tool_use',
          id: `toolu_example_${shot.source_type}`,
          name: PAY_PACKAGE_TOOL.name,
          input: shot.output,
        },
      ],
    })
    messages.push({
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: `toolu_example_${shot.source_type}`,
          content: 'Recorded.',
        },
      ],
    })
  }
  messages.push({
    role: 'user',
    content: `Source type: ${sourceType}\n\n---\n${rawContent}\n---`,
  })
  return messages
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function defaultClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
}

export interface ExtractInput {
  rawContent: string
  sourceType: SourceType
  purpose?: LedgerPurpose
  userId?: string | null
  contractId?: string | null
  client?: Anthropic
  onCall?: (log: LlmCallLog) => void | Promise<void>
}

export interface ExtractResult {
  payload: PayPackage
  needsReview: boolean
  rawToolInput: unknown
}

export async function extractPayPackage(input: ExtractInput): Promise<ExtractResult> {
  const client = input.client ?? defaultClient()
  const purpose: LedgerPurpose = input.purpose ?? 'extract_quote'
  const model = LEDGER_MODELS.extract
  const messages = buildMessages(input.rawContent, input.sourceType)

  let attempt = 0
  let lastError: unknown
  const startedAt = Date.now()

  while (attempt < MAX_RETRIES) {
    attempt++
    try {
      const response = await client.messages.create({
        model,
        max_tokens: 1500,
        system: [
          {
            type: 'text',
            text: EXTRACTOR_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        tools: [PAY_PACKAGE_TOOL],
        tool_choice: { type: 'tool', name: PAY_PACKAGE_TOOL.name },
        messages,
      })

      const toolBlock = response.content.find((b) => b.type === 'tool_use')
      if (!toolBlock || toolBlock.type !== 'tool_use') {
        throw new Error('Claude did not invoke submit_pay_package tool')
      }

      const parsed = PayPackageSchema.parse(toolBlock.input)
      const latency_ms = Date.now() - startedAt

      await input.onCall?.({
        purpose,
        model,
        prompt_tokens: response.usage.input_tokens ?? null,
        completion_tokens: response.usage.output_tokens ?? null,
        cache_read_tokens: response.usage.cache_read_input_tokens ?? null,
        cache_creation_tokens: response.usage.cache_creation_input_tokens ?? null,
        latency_ms,
        status: 'ok',
        error_message: null,
        user_id: input.userId ?? null,
        contract_id: input.contractId ?? null,
      })

      return {
        payload: parsed,
        needsReview: parsed.extraction_confidence < REVIEW_CONFIDENCE_THRESHOLD,
        rawToolInput: toolBlock.input,
      }
    } catch (err) {
      lastError = err
      const isRateLimit =
        err instanceof Anthropic.APIError && err.status === 429
      if (!isRateLimit || attempt >= MAX_RETRIES) {
        await input.onCall?.({
          purpose,
          model,
          prompt_tokens: null,
          completion_tokens: null,
          cache_read_tokens: null,
          cache_creation_tokens: null,
          latency_ms: Date.now() - startedAt,
          status: isRateLimit ? 'rate_limited' : 'error',
          error_message: err instanceof Error ? err.message : String(err),
          user_id: input.userId ?? null,
          contract_id: input.contractId ?? null,
        })
        throw err
      }
      await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1))
    }
  }

  throw lastError instanceof Error ? lastError : new Error('extractor: exhausted retries')
}

export interface ExtractPdfInput {
  pdfBase64: string
  purpose?: LedgerPurpose
  userId?: string | null
  contractId?: string | null
  client?: Anthropic
  onCall?: (log: LlmCallLog) => void | Promise<void>
}

export async function extractPayPackageFromPdf(input: ExtractPdfInput): Promise<ExtractResult> {
  const client = input.client ?? defaultClient()
  const purpose: LedgerPurpose = input.purpose ?? 'extract_signed'
  const model = LEDGER_MODELS.extract
  const startedAt = Date.now()

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 2000,
      system: [
        {
          type: 'text',
          text: EXTRACTOR_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: [PAY_PACKAGE_TOOL],
      tool_choice: { type: 'tool', name: PAY_PACKAGE_TOOL.name },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: input.pdfBase64 },
            },
            { type: 'text', text: 'Source type: signed contract PDF. Extract the pay package.' },
          ],
        },
      ],
    })
    const toolBlock = response.content.find((b) => b.type === 'tool_use')
    if (!toolBlock || toolBlock.type !== 'tool_use') throw new Error('Claude did not invoke submit_pay_package tool')
    const parsed = PayPackageSchema.parse(toolBlock.input)

    await input.onCall?.({
      purpose,
      model,
      prompt_tokens: response.usage.input_tokens ?? null,
      completion_tokens: response.usage.output_tokens ?? null,
      cache_read_tokens: response.usage.cache_read_input_tokens ?? null,
      cache_creation_tokens: response.usage.cache_creation_input_tokens ?? null,
      latency_ms: Date.now() - startedAt,
      status: 'ok',
      error_message: null,
      user_id: input.userId ?? null,
      contract_id: input.contractId ?? null,
    })

    return {
      payload: parsed,
      needsReview: parsed.extraction_confidence < REVIEW_CONFIDENCE_THRESHOLD,
      rawToolInput: toolBlock.input,
    }
  } catch (err) {
    await input.onCall?.({
      purpose,
      model,
      prompt_tokens: null,
      completion_tokens: null,
      cache_read_tokens: null,
      cache_creation_tokens: null,
      latency_ms: Date.now() - startedAt,
      status: 'error',
      error_message: err instanceof Error ? err.message : String(err),
      user_id: input.userId ?? null,
      contract_id: input.contractId ?? null,
    })
    throw err
  }
}
