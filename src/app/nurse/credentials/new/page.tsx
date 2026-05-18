'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { CANONICAL_CREDENTIAL_TYPES } from '@/lib/ledger/credentials/types'

type Mode = 'upload' | 'manual'

export default function NewCredentialPage() {
  const [mode, setMode] = useState<Mode>('upload')

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" />
      <main className="max-w-2xl mx-auto w-full px-4 py-10">
        <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--ink)' }}>Add credential</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--g600)' }}>
          Upload a PDF or photo of the certificate and we will extract the type, issuer, and expiration date. Or enter the details manually.
        </p>
        <div className="flex gap-2 mb-5">
          <Tab active={mode === 'upload'} onClick={() => setMode('upload')} label="Upload PDF or image" />
          <Tab active={mode === 'manual'} onClick={() => setMode('manual')} label="Manual entry" />
        </div>
        {mode === 'upload' ? <UploadForm /> : <ManualForm />}
      </main>
    </div>
  )
}

function Tab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="px-4 py-2 rounded-lg text-sm font-bold border"
      style={active
        ? { background: 'var(--plum)', color: 'white', borderColor: 'var(--plum)' }
        : { background: 'white', color: 'var(--g600)', borderColor: 'var(--g100)' }}>
      {label}
    </button>
  )
}

function UploadForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [typeOverride, setTypeOverride] = useState('')
  const [expiresOverride, setExpiresOverride] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true); setErr(null)
    const fd = new FormData()
    fd.append('document', file)
    if (typeOverride) fd.append('type', typeOverride)
    if (expiresOverride) fd.append('expires_at', expiresOverride)
    const res = await fetch('/api/ledger/credentials', { method: 'POST', body: fd })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : JSON.stringify(json.error)); return }
    router.push(`/nurse/credentials/${json.credential.id}`)
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border p-6" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <label className="block">
        <span className="text-xs font-bold tracking-wider" style={{ color: 'var(--g600)' }}>CERTIFICATE FILE</span>
        <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm" />
        <p className="text-xs mt-2" style={{ color: 'var(--g600)' }}>PDF, PNG, JPG, or WEBP. Max 10 MB.</p>
      </label>
      <details className="text-sm" style={{ color: 'var(--g600)' }}>
        <summary className="cursor-pointer font-semibold" style={{ color: 'var(--ink)' }}>Override extraction (optional)</summary>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs font-bold tracking-wider">TYPE</span>
            <select value={typeOverride} onChange={(e) => setTypeOverride(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--g100)' }}>
              <option value="">Let Claude detect</option>
              {CANONICAL_CREDENTIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold tracking-wider">EXPIRES AT</span>
            <input type="date" value={expiresOverride} onChange={(e) => setExpiresOverride(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--g100)' }} />
          </label>
        </div>
      </details>
      {err && <p className="text-sm" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
      <button type="submit" disabled={loading || !file}
        className="px-5 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50"
        style={{ background: 'var(--plum)' }}>
        {loading ? 'Extracting...' : 'Upload and extract'}
      </button>
    </form>
  )
}

function ManualForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    type: 'BLS', display_name: '', issuer: '', card_number: '',
    issued_at: '', expires_at: '', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function update<K extends keyof typeof form>(k: K, v: string) { setForm({ ...form, [k]: v }) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(null)
    const body: Record<string, string> = {}
    for (const [k, v] of Object.entries(form)) if (v) body[k] = v
    const res = await fetch('/api/ledger/credentials', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : JSON.stringify(json.error)); return }
    router.push(`/nurse/credentials/${json.credential.id}`)
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border p-6" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <label className="block">
        <span className="text-xs font-bold tracking-wider" style={{ color: 'var(--g600)' }}>TYPE</span>
        <select value={form.type} onChange={(e) => update('type', e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--g100)' }}>
          {CANONICAL_CREDENTIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <Field label="Display name" value={form.display_name} onChange={(v) => update('display_name', v)} placeholder='e.g. "BLS Provider - Adult, Child, Infant"' />
      <Field label="Issuer" value={form.issuer} onChange={(v) => update('issuer', v)} placeholder='e.g. "American Heart Association"' />
      <Field label="Card / certificate number" value={form.card_number} onChange={(v) => update('card_number', v)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Issued at" type="date" value={form.issued_at} onChange={(v) => update('issued_at', v)} />
        <Field label="Expires at" type="date" value={form.expires_at} onChange={(v) => update('expires_at', v)} />
      </div>
      <Field label="Notes" value={form.notes} onChange={(v) => update('notes', v)} />
      {err && <p className="text-sm" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
      <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50" style={{ background: 'var(--plum)' }}>
        {loading ? 'Saving...' : 'Save credential'}
      </button>
    </form>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold tracking-wider" style={{ color: 'var(--g600)' }}>{label.toUpperCase()}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--g100)' }} />
    </label>
  )
}
