'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import PageHero from '@/components/ui/PageHero'
import Button from '@/components/ui/Button'
import { FileUp, PencilLine } from 'lucide-react'

type Mode = 'pdf' | 'manual'

export default function NewLedgerContractPage() {
  const [mode, setMode] = useState<Mode>('pdf')

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" />
      <main className="max-w-3xl mx-auto w-full px-4 py-10 lg:py-14">
        <PageHero
          eyebrow="New contract"
          title="Start a contract thread"
          subtitle="Upload a recruiter PDF and we extract the pay package automatically, or enter the details by hand."
        />

        <div role="tablist" className="inline-flex p-1 rounded-2xl mb-6" style={{ background: 'var(--cream-mid)' }}>
          <TabBtn active={mode === 'pdf'} onClick={() => setMode('pdf')} icon={<FileUp className="w-4 h-4" />} label="Upload PDF" />
          <TabBtn active={mode === 'manual'} onClick={() => setMode('manual')} icon={<PencilLine className="w-4 h-4" />} label="Fill manually" />
        </div>

        {mode === 'pdf' ? <PdfForm /> : <ManualForm />}
      </main>
    </div>
  )
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
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
    <form onSubmit={submit} className="rounded-3xl border p-6 space-y-5" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <label
        className="block rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors hover:bg-[var(--cream-mid)]"
        style={{ borderColor: file ? 'var(--plum)' : 'var(--g200)' }}
      >
        <input type="file" accept="application/pdf" className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <FileUp className="w-8 h-8 mx-auto mb-3" style={{ color: file ? 'var(--plum)' : 'var(--g400)' }} />
        <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          {file ? file.name : 'Click to choose a PDF'}
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--g600)' }}>
          {file ? `${(file.size / 1024).toFixed(0)} KB` : 'PDF only, max 10 MB. We extract specialty, location, dates, and pay package.'}
        </div>
      </label>

      <details className="text-sm" style={{ color: 'var(--g600)' }}>
        <summary className="cursor-pointer font-semibold" style={{ color: 'var(--ink)' }}>Recruiter details (optional)</summary>
        <div className="mt-3 grid sm:grid-cols-3 gap-3">
          <FieldInput label="Agency" value={agency} onChange={setAgency} placeholder="Aya, Cross Country, ..." />
          <FieldInput label="Recruiter name" value={recruiter} onChange={setRecruiter} />
          <FieldInput label="Recruiter email" type="email" value={recruiterEmail} onChange={setRecruiterEmail} />
        </div>
      </details>

      {err && <p className="text-sm font-medium" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
      <Button type="submit" disabled={!file} loading={loading} variant="primary" size="lg">
        {loading ? 'Extracting...' : 'Extract and create'}
      </Button>
    </form>
  )
}

function ManualForm() {
  const router = useRouter()
  const [form, setForm] = useState({ agency_name: '', recruiter_name: '', recruiter_email: '', specialty: '', location_city: '', location_state: '' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function update<K extends keyof typeof form>(k: K, v: string) { setForm({ ...form, [k]: v }) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(null)
    const body: Record<string, string> = {}
    for (const [k, v] of Object.entries(form)) if (v) body[k] = v
    const res = await fetch('/api/ledger/contracts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : 'Failed'); return }
    router.push(`/nurse/ledger/${json.contract.id}`)
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border p-6 space-y-4" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <FieldInput label="Agency" value={form.agency_name} onChange={(v) => update('agency_name', v)} />
      <FieldInput label="Recruiter name" value={form.recruiter_name} onChange={(v) => update('recruiter_name', v)} />
      <FieldInput label="Recruiter email" type="email" value={form.recruiter_email} onChange={(v) => update('recruiter_email', v)} />
      <FieldInput label="Specialty" value={form.specialty} onChange={(v) => update('specialty', v)} placeholder="ICU, ER, L&D" />
      <div className="grid grid-cols-2 gap-3">
        <FieldInput label="City" value={form.location_city} onChange={(v) => update('location_city', v)} />
        <FieldInput label="State (2-letter)" value={form.location_state} onChange={(v) => update('location_state', v.toUpperCase().slice(0, 2))} />
      </div>
      {err && <p className="text-sm font-medium" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
      <Button type="submit" loading={loading} variant="primary" size="lg">
        {loading ? 'Creating...' : 'Create contract'}
      </Button>
    </form>
  )
}

function FieldInput({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g600)' }}>{label}</span>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:border-[var(--plum)]"
        style={{ borderColor: 'var(--g100)' }}
      />
    </label>
  )
}
