'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'

export default function NewLedgerContractPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    agency_name: '',
    recruiter_name: '',
    recruiter_email: '',
    specialty: '',
    location_city: '',
    location_state: '',
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
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" />
      <main className="max-w-2xl mx-auto w-full px-4 py-10">
        <h1 className="font-display text-3xl mb-6" style={{ color: 'var(--ink)' }}>New contract thread</h1>
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
      </main>
    </div>
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
