'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import PageHero from '@/components/ui/PageHero'
import Button from '@/components/ui/Button'
import { formatCents } from '@/lib/ledger/currency'
import type { Assessment, Flag, Severity } from '@/lib/ledger/contract-check'
import { ClipboardPaste, FileUp, AlertTriangle, ShieldCheck } from 'lucide-react'

type Mode = 'paste' | 'pdf'
type SourceType = 'email' | 'sms' | 'manual'

interface CheckResult {
  assessment: Assessment
  needs_review?: boolean
  payload: Record<string, unknown>
}

const SEVERITY_TONE: Record<Severity, { bg: string; color: string; label: string }> = {
  high: { bg: 'var(--tang-50)', color: 'var(--tang-mid)', label: 'High' },
  warning: { bg: '#FEF3C7', color: '#92400E', label: 'Warning' },
  info: { bg: 'var(--g100)', color: 'var(--g600)', label: 'Info' },
}

const TAXHOME_TONE: Record<string, { bg: string; color: string }> = {
  safe: { bg: 'var(--sage-50)', color: 'var(--sage)' },
  warning: { bg: '#FEF3C7', color: '#92400E' },
  risk: { bg: 'var(--tang-50)', color: 'var(--tang-mid)' },
}

export default function ContractCheckPage() {
  const [mode, setMode] = useState<Mode>('paste')

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" />
      <main className="max-w-3xl mx-auto w-full px-4 py-10 lg:py-14">
        <PageHero
          eyebrow="Contract Check"
          title="Is this quote as good"
          titleAccent="as it sounds?"
          subtitle="Paste a recruiter's pay quote or upload the offer PDF. We break down the package, compute your blended rate and bill-rate capture, and flag tax-home and stipend risks — in plain English, no comparison data needed."
        />

        <div role="tablist" className="inline-flex p-1 rounded-2xl mb-6" style={{ background: 'var(--cream-mid)' }}>
          <TabBtn active={mode === 'paste'} onClick={() => setMode('paste')} icon={<ClipboardPaste className="w-4 h-4" />} label="Paste quote" />
          <TabBtn active={mode === 'pdf'} onClick={() => setMode('pdf')} icon={<FileUp className="w-4 h-4" />} label="Upload PDF" />
        </div>

        {mode === 'paste' ? <PasteForm /> : <PdfForm />}

        <p className="text-xs mt-6" style={{ color: 'var(--g600)' }}>
          You can also forward recruiter emails or texts to your NurseSquare ledger address — they run the same check automatically.
        </p>
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

function PasteForm() {
  const [sourceType, setSourceType] = useState<SourceType>('manual')
  const [raw, setRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [result, setResult] = useState<CheckResult | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!raw.trim()) return
    setLoading(true); setErr(null); setResult(null)
    try {
      const res = await fetch('/api/ledger/contract-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ source_type: sourceType, raw_content: raw }),
      })
      const json = await res.json()
      if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : 'Check failed'); return }
      setResult({ assessment: json.assessment, needs_review: json.needs_review, payload: json.quote?.extracted_payload ?? {} })
    } catch {
      setErr('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={submit} className="rounded-3xl border p-6 space-y-4" style={{ borderColor: 'var(--g100)', background: 'white' }}>
        <label className="block">
          <span className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g600)' }}>Source</span>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as SourceType)}
            className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-[var(--plum)]"
            style={{ borderColor: 'var(--g100)' }}
          >
            <option value="manual">Pasted / typed</option>
            <option value="email">Email</option>
            <option value="sms">Text message</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g600)' }}>Recruiter quote</span>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={10}
            placeholder={'e.g. ICU in Austin TX, 6/2–8/25. $22/hr taxable + $1,800/wk housing + $700/wk meals. 36hr guarantee, 3x12s nights. Bill rate $85/hr.'}
            className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:border-[var(--plum)]"
            style={{ borderColor: 'var(--g100)' }}
          />
        </label>
        {err && <p className="text-sm font-medium" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
        <Button type="submit" disabled={!raw.trim()} loading={loading} variant="primary" size="lg">
          {loading ? 'Checking…' : 'Run Contract Check'}
        </Button>
      </form>
      {result && <ResultCard result={result} />}
    </>
  )
}

function PdfForm() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [result, setResult] = useState<CheckResult | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true); setErr(null); setResult(null)
    try {
      const fd = new FormData()
      fd.append('pdf', file)
      const createRes = await fetch('/api/ledger/contracts/from-pdf', { method: 'POST', body: fd })
      const createJson = await createRes.json()
      if (!createRes.ok) { setErr(typeof createJson.error === 'string' ? createJson.error : 'Upload failed'); return }

      const id = createJson.contract?.id
      const res = await fetch(`/api/ledger/contract-check?contractId=${id}`)
      const json = await res.json()
      if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : 'Check failed'); return }
      setResult({ assessment: json.assessment, payload: json.quote?.extracted_payload ?? {} })
    } catch {
      setErr('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={submit} className="rounded-3xl border p-6 space-y-5" style={{ borderColor: 'var(--g100)', background: 'white' }}>
        <label
          className="block rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors hover:bg-[var(--cream-mid)]"
          style={{ borderColor: file ? 'var(--plum)' : 'var(--g200)' }}
        >
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <FileUp className="w-8 h-8 mx-auto mb-3" style={{ color: file ? 'var(--plum)' : 'var(--g400)' }} />
          <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{file ? file.name : 'Click to choose a PDF'}</div>
          <div className="text-xs mt-1" style={{ color: 'var(--g600)' }}>
            {file ? `${(file.size / 1024).toFixed(0)} KB` : 'PDF only, max 10 MB.'}
          </div>
        </label>
        {err && <p className="text-sm font-medium" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
        <Button type="submit" disabled={!file} loading={loading} variant="primary" size="lg">
          {loading ? 'Checking…' : 'Run Contract Check'}
        </Button>
      </form>
      {result && <ResultCard result={result} />}
    </>
  )
}

function pct(fraction: number | null | undefined): string {
  if (fraction == null) return '--'
  return `${Math.round(fraction * 100)}%`
}

function ResultCard({ result }: { result: CheckResult }) {
  const { assessment } = result
  const wk = assessment.weekly
  const payload = result.payload
  const hours = typeof payload.guaranteed_hours_per_week === 'number' ? payload.guaranteed_hours_per_week : null
  const specialty = typeof payload.specialty === 'string' ? payload.specialty : null
  const city = typeof payload.location_city === 'string' ? payload.location_city : null
  const state = typeof payload.location_state === 'string' ? payload.location_state : null

  return (
    <section className="mt-8 space-y-5">
      <div className="rounded-3xl border p-6" style={{ borderColor: 'var(--g100)', background: 'white' }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-sora)', color: 'var(--ink)' }}>
            {specialty ?? 'Pay package'}{city ? ` · ${city}${state ? `, ${state}` : ''}` : ''}
          </h2>
          {result.needs_review && (
            <span className="text-[10px] font-bold tracking-[1px] uppercase px-2.5 py-1 rounded-md" style={{ background: '#FEF3C7', color: '#92400E' }}>
              Low confidence — review
            </span>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          <Metric label="Blended hourly" value={assessment.blended_hourly_cents != null ? `${formatCents(assessment.blended_hourly_cents)}/hr` : '--'} emphasis />
          <Metric label="Bill rate" value={assessment.bill_rate_cents != null ? `${formatCents(assessment.bill_rate_cents)}/hr` : 'Undisclosed'} />
          <Metric label="Bill-rate capture" value={pct(assessment.bill_rate_capture)} sub={assessment.bill_rate_capture == null ? 'needs bill rate' : 'of facility rate'} />
        </div>

        <div className="mt-5 rounded-2xl border divide-y" style={{ borderColor: 'var(--g100)' }}>
          <Row label={`Taxable base${hours ? ` (${hours} hrs)` : ''}`} value={formatCents(wk.taxable_cents)} />
          <Row label="Housing stipend / wk" value={formatCents(wk.housing_cents)} />
          <Row label="Meals stipend / wk" value={formatCents(wk.meals_cents)} />
          <Row label="Travel stipend / wk" value={formatCents(wk.travel_cents)} />
          <Row label="Weekly total" value={formatCents(wk.total_cents)} bold />
        </div>
      </div>

      {assessment.taxHome && (
        <div className="rounded-3xl border p-6" style={{ borderColor: 'var(--g100)', background: 'white' }}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: 'var(--plum)' }} />
            <h3 className="text-sm font-bold tracking-tight" style={{ fontFamily: 'var(--font-sora)', color: 'var(--ink)' }}>Tax-home impact</h3>
            <span className="text-[10px] font-bold tracking-[1px] uppercase px-2.5 py-1 rounded-md" style={TAXHOME_TONE[assessment.taxHome.flag] ?? TAXHOME_TONE.safe}>
              {assessment.taxHome.flag}
            </span>
          </div>
          {assessment.taxHome.reasons.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {assessment.taxHome.reasons.map((r, i) => (
                <li key={i} className="text-sm" style={{ color: 'var(--g600)' }}>{r}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm" style={{ color: 'var(--g600)' }}>No tax-home day-count concerns across your tracked contracts.</p>
          )}
        </div>
      )}

      <div className="rounded-3xl border p-6" style={{ borderColor: 'var(--g100)', background: 'white' }}>
        <h3 className="text-sm font-bold tracking-tight mb-3" style={{ fontFamily: 'var(--font-sora)', color: 'var(--ink)' }}>
          Red flags ({assessment.flags.length})
        </h3>
        {assessment.flags.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--sage)' }}>No red flags detected in this quote.</p>
        ) : (
          <ul className="space-y-3">
            {assessment.flags.map((f: Flag) => {
              const tone = SEVERITY_TONE[f.severity]
              return (
                <li key={f.code} className="flex gap-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tone.color }} />
                  <div>
                    <span className="text-[10px] font-bold tracking-[1px] uppercase px-2 py-0.5 rounded mr-2" style={{ background: tone.bg, color: tone.color }}>
                      {tone.label}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--ink)' }}>{f.message}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

function Metric({ label, value, sub, emphasis }: { label: string; value: string; sub?: string; emphasis?: boolean }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: emphasis ? 'var(--plum-50)' : 'var(--cream-mid)' }}>
      <div className="text-[10px] font-bold tracking-[1.2px] uppercase" style={{ color: 'var(--g600)' }}>{label}</div>
      <div className="text-xl font-bold mt-1" style={{ fontFamily: 'var(--font-sora)', color: emphasis ? 'var(--plum)' : 'var(--ink)' }}>{value}</div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: 'var(--g400)' }}>{sub}</div>}
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm" style={{ color: 'var(--g600)' }}>{label}</span>
      <span className="text-sm" style={{ color: 'var(--ink)', fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  )
}
