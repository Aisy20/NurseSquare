import Anthropic from '@anthropic-ai/sdk'
import { CredentialExtractionSchema, type CredentialExtraction } from './types'
import { LEDGER_MODELS, type LlmCallLog } from '../types'

const SYSTEM_PROMPT = `You are a credential extractor for US travel nurse certifications and licenses (BLS, ACLS, PALS, NIHSS, NRP, TNCC, CCRN, state RN licenses, vaccination records, TB tests, fit tests, drug screens, etc.).

Read the input document and return a JSON object via the provided tool with:
- type: the canonical short code if you recognize it. Use UPPER_SNAKE_CASE: BLS, ACLS, PALS, NIHSS, NRP, TNCC, ENPC, CCRN, CEN, CFRN, CPN, CMSRN, OCN, RNC_OB, RNC_NIC, RN_LICENSE, TB_TEST, MMR, VARICELLA, TDAP, HEP_B, INFLUENZA_VAX, COVID_VAX, N95_FIT_TEST, DRUG_SCREEN. Use OTHER if unrecognized.
- display_name: the full human-readable name as it appears on the card or document (e.g. "Basic Life Support Provider"). If absent, null.
- issuer: the issuing body (e.g. "American Heart Association", "Arizona State Board of Nursing"). Null if absent.
- card_number: the provider card / certificate number if shown. Null if absent.
- issued_at: ISO date of issuance. Null if absent.
- expires_at: ISO date the credential expires. Null if absent.
- extraction_confidence: 0 to 1.
- raw_notes: free-form observations.

Fields not present in the input must be null, not guessed. Output via the provided tool only.`

const TOOL: Anthropic.Tool = {
  name: 'submit_credential',
  description: 'Submit the structured credential extracted from the document.',
  input_schema: {
    type: 'object',
    properties: {
      type: { type: ['string', 'null'] },
      display_name: { type: ['string', 'null'] },
      issuer: { type: ['string', 'null'] },
      card_number: { type: ['string', 'null'] },
      issued_at: { type: ['string', 'null'], format: 'date' },
      expires_at: { type: ['string', 'null'], format: 'date' },
      extraction_confidence: { type: 'number', minimum: 0, maximum: 1 },
      raw_notes: { type: ['string', 'null'] },
    },
    required: ['type', 'display_name', 'issuer', 'card_number', 'issued_at', 'expires_at', 'extraction_confidence', 'raw_notes'],
  },
}

const REVIEW_CONFIDENCE_THRESHOLD = 0.6

export interface ExtractCredentialInput {
  pdfBase64?: string
  imageBase64?: string
  imageMediaType?: 'image/png' | 'image/jpeg' | 'image/webp'
  userId?: string | null
  client?: Anthropic
  onCall?: (log: LlmCallLog) => void | Promise<void>
}

export interface ExtractCredentialResult {
  payload: CredentialExtraction
  needsReview: boolean
}

function defaultClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
}

export async function extractCredential(input: ExtractCredentialInput): Promise<ExtractCredentialResult> {
  if (!input.pdfBase64 && !input.imageBase64) {
    throw new Error('extractCredential requires pdfBase64 or imageBase64')
  }
  const client = input.client ?? defaultClient()
  const model = LEDGER_MODELS.extract
  const startedAt = Date.now()

  const documentBlock: Anthropic.Messages.ContentBlockParam = input.pdfBase64
    ? {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: input.pdfBase64 },
      }
    : {
        type: 'image',
        source: { type: 'base64', media_type: input.imageMediaType ?? 'image/png', data: input.imageBase64! },
      }

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 800,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: [TOOL],
      tool_choice: { type: 'tool', name: TOOL.name },
      messages: [
        {
          role: 'user',
          content: [documentBlock, { type: 'text', text: 'Extract the credential.' }],
        },
      ],
    })

    const toolBlock = response.content.find((b) => b.type === 'tool_use')
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      throw new Error('Claude did not invoke submit_credential tool')
    }
    const parsed = CredentialExtractionSchema.parse(toolBlock.input)

    await input.onCall?.({
      purpose: 'extract_signed',
      model,
      prompt_tokens: response.usage.input_tokens ?? null,
      completion_tokens: response.usage.output_tokens ?? null,
      cache_read_tokens: response.usage.cache_read_input_tokens ?? null,
      cache_creation_tokens: response.usage.cache_creation_input_tokens ?? null,
      latency_ms: Date.now() - startedAt,
      status: 'ok',
      error_message: null,
      user_id: input.userId ?? null,
      contract_id: null,
    })

    return {
      payload: parsed,
      needsReview: parsed.extraction_confidence < REVIEW_CONFIDENCE_THRESHOLD,
    }
  } catch (err) {
    await input.onCall?.({
      purpose: 'extract_signed',
      model,
      prompt_tokens: null,
      completion_tokens: null,
      cache_read_tokens: null,
      cache_creation_tokens: null,
      latency_ms: Date.now() - startedAt,
      status: 'error',
      error_message: err instanceof Error ? err.message : String(err),
      user_id: input.userId ?? null,
      contract_id: null,
    })
    throw err
  }
}
