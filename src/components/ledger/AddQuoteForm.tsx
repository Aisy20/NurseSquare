'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddQuoteForm({ contractId }: { contractId: string }) {
  const router = useRouter()
  const [sourceType, setSourceType] = useState<'email' | 'sms' | 'voice' | 'manual'>('manual')
  const [rawContent, setRawContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(null)
    const res = await fetch(`/api/ledger/contracts/${contractId}/quotes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source_type: sourceType, raw_content: rawContent }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(json.error?.formErrors?.[0] ?? JSON.stringify(json.error) ?? 'Failed'); return }
    setRawContent('')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border p-5 space-y-3" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <h3 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Add quote</h3>
      <div className="flex gap-2">
        {(['email', 'sms', 'voice', 'manual'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setSourceType(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold border"
            style={sourceType === t
              ? { background: 'var(--plum)', color: 'white', borderColor: 'var(--plum)' }
              : { background: 'white', color: 'var(--g600)', borderColor: 'var(--g100)' }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      <textarea
        value={rawContent} onChange={(e) => setRawContent(e.target.value)}
        required minLength={5} rows={6}
        placeholder="Paste recruiter text exactly as received."
        className="w-full px-3 py-2 rounded-lg border text-sm font-mono"
        style={{ borderColor: 'var(--g100)' }}
      />
      {err && <p className="text-sm" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
      <button type="submit" disabled={loading || !rawContent}
        className="px-5 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50"
        style={{ background: 'var(--plum)' }}>
        {loading ? 'Extracting...' : 'Extract and save'}
      </button>
    </form>
  )
}
