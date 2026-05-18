'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'

type Mode = 'pdf' | 'manual'

export default function NewLedgerContractPage() {
  const [mode, setMode] = useState<Mode>('pdf')

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" />
      <main className="max-w-2xl mx-auto w-full px-4 py-10">
        <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--ink)' }}>New contract thread</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--g600)' }}>
          Upload a recruiter PDF (offer letter, term sheet) and we will extract the pay package automatically. Or fill the fields in manually if you do not have a PDF yet.
        </p>

        <div className="flex gap-2 mb-5">
          <ModeButton active={mode === 'pdf'} onClick={() => setMode('pdf')} label="Upload PDF" />
          <ModeButton active={mode === 'manual'} onClick={() => setMode('manual')} label="Fill manually" />
        </div>

        {mode === 'pdf' ? <PdfForm /> : <ManualForm />}
      </main>
    </div>
  )
}

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
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

function PdfForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [agency, setAgency] = useState('')
  const [recruiter, setRecruiter] = useState('')
  const [recruiterEmail, setRecruiterEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true); setErr(null)
    const fd = new FormData()
    fd.append('pdf', file)
    if (agency) fd.append('agency_name', agency)
    if (recruiter) fd.append('recruiter_name', recruiter)
    if (recruiterEmail) fd.append('recruiter_email', recruiterEmail)
    const res = await fetch('/api/ledger/contracts/from-pdf', { method: 'POST', body: fd })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : 'Upload failed'); return }
    router.push(`/nurse/ledger/${json.contract.id}`)
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border p-6" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <label className="block">
        <span className="text-xs font-bold tracking-wider" style={{ color: 'var(--g600)' }}>RECRUITER PDF</span>
        <input type="file" accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm" />
        <p className="text-xs mt-2" style={{ color: 'var(--g600)' }}>PDF only, max 10 MB. We extract the pay package, location, dates, and required certifications directly from the document.</p>
      </label>

      <details className="text-sm" style={{ color: 'var(--g600)' }}>
        <summary className="cursor-pointer font-semibold" style={{ color: 'var(--ink)' }}>Recruiter details (optional)</summary>
        <div className="mt-3 space-y-3">
          <Field label="Agency" value={agency} onChange={setAgency} placeholder="Aya Healthcare, etc." />
          <Field label="Recruiter name" value={recruiter} onChange={setRecruiter} />
          <Field label="Recruiter email" type="email" value={recruiterEmail} onChange={setRecruiterEmail} />
        </div>
      </details>

      {err && <p className="text-sm" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
      <button type="submit" disabled={loading || !file}
        className="px-5 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50"
        style={{ background: 'var(--plum)' }}>
        {loading ? 'Extracting...' : 'Extract and create'}
      </button>
    </form>
  )
}

function ManualForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    agency_name: '', recruiter_name: '', recruiter_email: '',
    specialty: '', location_city: '', location_state: '',
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function update<K extends keyof typeof form>(k: K, v: string) { setForm({ ...form, [k]: v }) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(null)
    const body: Record<string, string> = {}
    for (const [k, v] of Object.entries(form)) if (v) body[k] = v
    const res = await fetch('/api/ledger/contracts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : 'Failed'); return }
    router.push(`/nurse/ledger/${json.contract.id}`)
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border p-6" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <Field label="Agency (optional)" value={form.agency_name} onChange={(v) => update('agency_name', v)} />
      <Field label="Recruiter name (optional)" value={form.recruiter_name} onChange={(v) => update('recruiter_name', v)} />
      <Field label="Recruiter email (optional)" type="email" value={form.recruiter_email} onChange={(v) => update('recruiter_email', v)} />
      <Field label="Specialty (optional)" value={form.specialty} onChange={(v) => update('specialty', v)} placeholder="ICU, ER, L&D, ..." />
      <div className="grid grid-cols-2 gap-3">
        <Field label="City" value={form.location_city} onChange={(v) => update('location_city', v)} />
        <Field label="State (2-letter)" value={form.location_state} onChange={(v) => update('location_state', v.toUpperCase().slice(0, 2))} />
      </div>
      {err && <p className="text-sm" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
      <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50" style={{ background: 'var(--plum)' }}>
        {loading ? 'Creating...' : 'Create contract'}
      </button>
    </form>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold tracking-wider" style={{ color: 'var(--g600)' }}>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--g100)' }} />
    </label>
  )
}
