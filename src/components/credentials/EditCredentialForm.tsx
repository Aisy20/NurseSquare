'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CANONICAL_CREDENTIAL_TYPES, type CredentialRow, type CredentialStatus } from '@/lib/ledger/credentials/types'

const STATUSES: CredentialStatus[] = ['pending', 'verified', 'expired', 'rejected']

export default function EditCredentialForm({ credential }: { credential: CredentialRow }) {
  const router = useRouter()
  const [form, setForm] = useState({
    type: credential.type,
    display_name: credential.display_name ?? '',
    status: credential.status,
    issuer: credential.issuer ?? '',
    card_number: credential.card_number ?? '',
    issued_at: credential.issued_at ?? '',
    expires_at: credential.expires_at ?? '',
    notes: credential.notes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  function update<K extends keyof typeof form>(k: K, v: string) { setForm({ ...form, [k]: v }); setOk(false) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(null); setOk(false)
    const body: Record<string, string | null> = {}
    for (const [k, v] of Object.entries(form)) body[k] = v === '' ? null : v
    const res = await fetch(`/api/ledger/credentials/${credential.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : JSON.stringify(json.error)); return }
    setOk(true)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border p-6 space-y-4" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <h3 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Edit details</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-bold tracking-wider" style={{ color: 'var(--g600)' }}>TYPE</span>
          <select value={form.type} onChange={(e) => update('type', e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--g100)' }}>
            {CANONICAL_CREDENTIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold tracking-wider" style={{ color: 'var(--g600)' }}>STATUS</span>
          <select value={form.status} onChange={(e) => update('status', e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--g100)' }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <TextField label="Display name" value={form.display_name} onChange={(v) => update('display_name', v)} />
      <TextField label="Issuer" value={form.issuer} onChange={(v) => update('issuer', v)} />
      <TextField label="Card / certificate number" value={form.card_number} onChange={(v) => update('card_number', v)} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Issued at" type="date" value={form.issued_at} onChange={(v) => update('issued_at', v)} />
        <TextField label="Expires at" type="date" value={form.expires_at} onChange={(v) => update('expires_at', v)} />
      </div>
      <TextField label="Notes" value={form.notes} onChange={(v) => update('notes', v)} />
      {err && <p className="text-sm" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
      {ok && <p className="text-sm" style={{ color: 'var(--sage)' }}>Saved.</p>}
      <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50" style={{ background: 'var(--plum)' }}>
        {loading ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}

function TextField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold tracking-wider" style={{ color: 'var(--g600)' }}>{label.toUpperCase()}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--g100)' }} />
    </label>
  )
}
