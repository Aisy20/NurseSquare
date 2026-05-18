'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadSignedForm({ contractId }: { contractId: string }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true); setErr(null)
    const fd = new FormData()
    fd.append('pdf', file)
    const res = await fetch(`/api/ledger/contracts/${contractId}/signed`, { method: 'POST', body: fd })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(json.error ?? 'Upload failed'); return }
    setFile(null)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border p-5 space-y-3" style={{ borderColor: 'var(--g100)', background: 'white' }}>
      <h3 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Upload signed contract</h3>
      <p className="text-xs" style={{ color: 'var(--g600)' }}>PDF only, max 10 MB. We extract the pay package directly from the document.</p>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      {err && <p className="text-sm" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
      <button type="submit" disabled={loading || !file}
        className="px-5 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50"
        style={{ background: 'var(--tang)' }}>
        {loading ? 'Uploading and extracting...' : 'Upload signed PDF'}
      </button>
    </form>
  )
}
