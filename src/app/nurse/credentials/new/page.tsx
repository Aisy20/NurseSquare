'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import PageHero from '@/components/ui/PageHero'
import Button from '@/components/ui/Button'
import { CANONICAL_CREDENTIAL_TYPES } from '@/lib/ledger/credentials/types'
import { FileUp, PencilLine } from 'lucide-react'

type Mode = 'upload' | 'manual'

export default function NewCredentialPage() {
  const [mode, setMode] = useState<Mode>('upload')

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" />
      <main className="max-w-2xl mx-auto w-full px-4 py-10 lg:py-14">
        <PageHero
          eyebrow="New credential"
          title="Upload it once,"
          titleAccent="we will track the rest."
          subtitle="PDF, PNG, JPG, or WEBP. We extract the type, issuer, and expiration so we can email you before it lapses."
        />
        <div role="tablist" className="inline-flex p-1 rounded-2xl mb-6" style={{ background: 'var(--cream-mid)' }}>
          <Tab active={mode === 'upload'} onClick={() => setMode('upload')} icon={<FileUp className="w-4 h-4" />} label="Upload" />
          <Tab active={mode === 'manual'} onClick={() => setMode('manual')} icon={<PencilLine className="w-4 h-4" />} label="Manual entry" />
        </div>
        {mode === 'upload' ? <UploadForm /> : <ManualForm />}
      </main>
    </div>
  )
}

function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
      style={active
        ? { background: 'white', color: 'var(--ink)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
        : { background: 'transparent', color: 'var(--g600)' }}
    >
      {icon}
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
    <form onSubmit={submit} className="space-y-5 rounded-3xl border p-6" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <label
        className="block rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors hover:bg-[var(--cream-mid)]"
        style={{ borderColor: file ? 'var(--plum)' : 'var(--g200)' }}
      >
        <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <FileUp className="w-8 h-8 mx-auto mb-3" style={{ color: file ? 'var(--plum)' : 'var(--g400)' }} />
        <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          {file ? file.name : 'Click to choose a file'}
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--g600)' }}>
          {file ? `${(file.size / 1024).toFixed(0)} KB` : 'PDF, PNG, JPG, or WEBP. Max 10 MB.'}
        </div>
      </label>
      <details className="text-sm" style={{ color: 'var(--g600)' }}>
        <summary className="cursor-pointer font-semibold" style={{ color: 'var(--ink)' }}>Override extraction (optional)</summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g600)' }}>Type</span>
            <select value={typeOverride} onChange={(e) => setTypeOverride(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border text-sm" style={{ borderColor: 'var(--g100)' }}>
              <option value="">Let Claude detect</option>
              {CANONICAL_CREDENTIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g600)' }}>Expires at</span>
            <input type="date" value={expiresOverride} onChange={(e) => setExpiresOverride(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border text-sm" style={{ borderColor: 'var(--g100)' }} />
          </label>
        </div>
      </details>
      {err && <p className="text-sm font-medium" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
      <Button type="submit" disabled={!file} loading={loading} variant="primary" size="lg">
        {loading ? 'Extracting...' : 'Upload and extract'}
      </Button>
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
    <form onSubmit={submit} className="space-y-4 rounded-3xl border p-6" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <label className="block">
        <span className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g600)' }}>Type</span>
        <select value={form.type} onChange={(e) => update('type', e.target.value)}
          className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border text-sm" style={{ borderColor: 'var(--g100)' }}>
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
      {err && <p className="text-sm font-medium" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
      <Button type="submit" loading={loading} variant="primary" size="lg">
        {loading ? 'Saving...' : 'Save credential'}
      </Button>
    </form>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g600)' }}>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:border-[var(--plum)]" style={{ borderColor: 'var(--g100)' }} />
    </label>
  )
}
