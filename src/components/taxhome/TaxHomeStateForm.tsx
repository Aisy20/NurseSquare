'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TaxHomeStateForm({ currentState }: { currentState: string | null }) {
  const router = useRouter()
  const [state, setState] = useState(currentState ?? '')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(null); setOk(false)
    const res = await fetch('/api/ledger/tax-home/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tax_home_state: state.toUpperCase().slice(0, 2) || null }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : 'Failed to save'); return }
    setOk(true)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border p-5 space-y-3" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <h3 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Tax home state</h3>
      <p className="text-xs" style={{ color: 'var(--g600)' }}>The state where you maintain duplicate housing expenses and have substantive ties.</p>
      <input value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
        placeholder="PA" maxLength={2}
        className="w-full px-3 py-2 rounded-lg border text-sm font-mono uppercase" style={{ borderColor: 'var(--g100)' }} />
      {err && <p className="text-sm" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
      {ok && <p className="text-sm" style={{ color: 'var(--sage)' }}>Saved.</p>}
      <button type="submit" disabled={loading} className="w-full px-4 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50" style={{ background: 'var(--plum)' }}>
        {loading ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
