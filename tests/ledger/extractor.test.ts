import { describe, it, expect, vi } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type Anthropic from '@anthropic-ai/sdk'
import { extractPayPackage } from '../../src/lib/ledger/extractor'
import { PayPackageSchema, type SourceType } from '../../src/lib/ledger/types'

interface Fixture {
  name: string
  sourceType: SourceType
  input: string
  expected: Record<string, unknown>
}

const FIXTURE_DIR = path.join(__dirname, 'fixtures')

function loadFixtures(): Fixture[] {
  return readdirSync(FIXTURE_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(path.join(FIXTURE_DIR, f), 'utf-8')) as Fixture)
}

function cassetteClient(toolInput: unknown, opts?: { tokensIn?: number; tokensOut?: number }): Anthropic {
  return {
    messages: {
      create: vi.fn(async (params: { model: string }) => ({
        id: 'msg_cassette',
        type: 'message',
        role: 'assistant',
        model: params.model,
        content: [
          {
            type: 'tool_use',
            id: 'toolu_cassette',
            name: 'submit_pay_package',
            input: toolInput,
          },
        ],
        stop_reason: 'tool_use',
        stop_sequence: null,
        usage: {
          input_tokens: opts?.tokensIn ?? 250,
          output_tokens: opts?.tokensOut ?? 180,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 800,
        },
      })),
    },
  } as unknown as Anthropic
}

describe('extractPayPackage', () => {
  const fixtures = loadFixtures()

  it('loads exactly 5 fixtures', () => {
    expect(fixtures).toHaveLength(5)
  })

  for (const fx of loadFixtures()) {
    it(`extracts ${fx.name} via cassette`, async () => {
      const result = await extractPayPackage({
        rawContent: fx.input,
        sourceType: fx.sourceType,
        client: cassetteClient(fx.expected),
      })
      expect(result.payload).toEqual(PayPackageSchema.parse(fx.expected))
      expect(result.needsReview).toBe(fx.expected.extraction_confidence as number < 0.6)
    })
  }

  it('invokes onCall logger with usage metadata', async () => {
    const fx = fixtures[0]
    const onCall = vi.fn()
    await extractPayPackage({
      rawContent: fx.input,
      sourceType: fx.sourceType,
      client: cassetteClient(fx.expected, { tokensIn: 123, tokensOut: 45 }),
      onCall,
      userId: 'user-1',
      contractId: 'contract-1',
    })
    expect(onCall).toHaveBeenCalledOnce()
    const log = onCall.mock.calls[0][0]
    expect(log).toMatchObject({
      purpose: 'extract_quote',
      status: 'ok',
      prompt_tokens: 123,
      completion_tokens: 45,
      user_id: 'user-1',
      contract_id: 'contract-1',
    })
  })

  it('flags needsReview when confidence below 0.6', async () => {
    const fx = fixtures.find((f) => f.name === 'sms_casual')!
    const result = await extractPayPackage({
      rawContent: fx.input,
      sourceType: fx.sourceType,
      client: cassetteClient(fx.expected),
    })
    expect(result.needsReview).toBe(true)
  })

  it('throws when Claude does not invoke the tool', async () => {
    const noToolClient = {
      messages: {
        create: vi.fn(async () => ({
          id: 'msg_x',
          type: 'message',
          role: 'assistant',
          model: 'claude-sonnet-4-6',
          content: [{ type: 'text', text: 'I refuse.' }],
          stop_reason: 'end_turn',
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
        })),
      },
    } as unknown as Anthropic
    await expect(
      extractPayPackage({ rawContent: 'x', sourceType: 'manual', client: noToolClient }),
    ).rejects.toThrow(/did not invoke submit_pay_package/)
  })
})
