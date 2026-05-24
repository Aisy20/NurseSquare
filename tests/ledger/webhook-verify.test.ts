import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyPostmarkBasicAuth, verifyTwilioSignature } from '@/lib/ledger/webhook-verify'

describe('webhook verification helpers', () => {
  it('validates Postmark basic auth by password only', () => {
    const header = `Basic ${Buffer.from('postmark:shared-secret').toString('base64')}`

    expect(verifyPostmarkBasicAuth(header, 'shared-secret')).toBe(true)
    expect(verifyPostmarkBasicAuth(header, 'wrong-secret')).toBe(false)
    expect(verifyPostmarkBasicAuth(null, 'shared-secret')).toBe(false)
  })

  it('validates Twilio signatures with sorted form params', () => {
    const token = 'twilio-token'
    const url = 'https://example.com/api/ledger/webhooks/twilio'
    const params = { Body: 'ICU offer $2600/wk', To: '+15550001111', From: '+15550002222' }
    const payload = url + 'Body' + params.Body + 'From' + params.From + 'To' + params.To
    const signature = crypto.createHmac('sha1', token).update(payload, 'utf8').digest('base64')

    expect(verifyTwilioSignature(token, url, params, signature)).toBe(true)
    expect(verifyTwilioSignature(token, url, { ...params, Body: 'changed' }, signature)).toBe(false)
    expect(verifyTwilioSignature(token, url, params, null)).toBe(false)
  })
})
