'use client'

import { useState } from 'react'

export default function ShareCredentialModal({ credentialId }: { credentialId: string }) {
  const [open, setOpen] = useState(false)
  const [exposeDoc, setExposeDoc] = useState(false)
  const [days, setDays] = useState(30)
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function create() {
    setLoading(true); setErr(null); setUrl(null)
    const res = await fetch(`/api/ledger/credentials/${credentialId}/share`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ expires_in_days: days, expose_document: exposeDoc }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : 'Failed'); return }
    setUrl(json.share_link?.url ?? null)
  }

  async function copy() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-4 py-2 rounded-lg text-sm font-bold border" style={{ borderColor: 'var(--plum)', color: 'var(--plum)', background: 'white' }}>
        Share with employer
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,7,20,0.6)' }} onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-3xl p-6" style={{ background: 'white' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--ink)' }}>Share credential</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--g600)' }}>Generates a public link the employer or recruiter can open without an account.</p>

            <label className="block text-sm mb-3">
              <span className="text-xs font-bold tracking-wider" style={{ color: 'var(--g600)' }}>EXPIRES IN (DAYS)</span>
              <input type="number" min={1} max={365} value={days} onChange={(e) => setDays(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--g100)' }} />
            </label>
            <label className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--ink)' }}>
              <input type="checkbox" checked={exposeDoc} onChange={(e) => setExposeDoc(e.target.checked)} />
              Include link to the original document (otherwise metadata only)
            </label>

            {!url && (
              <button onClick={create} disabled={loading} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: 'var(--plum)' }}>
                {loading ? 'Generating...' : 'Generate link'}
              </button>
            )}
            {err && <p className="text-sm mt-3" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
            {url && (
              <div className="flex gap-2 mt-3">
                <input readOnly value={url} className="flex-1 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--g100)' }} />
                <button onClick={copy} className="px-4 py-2 rounded-lg font-bold text-sm text-white" style={{ background: 'var(--tang)' }}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
            <button onClick={() => setOpen(false)} className="mt-4 text-sm" style={{ color: 'var(--g600)' }}>Close</button>
          </div>
        </div>
      )}
    </>
  )
}
