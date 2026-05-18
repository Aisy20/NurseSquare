'use client'

import { useState } from 'react'

export default function ShareModal({ contractId }: { contractId: string }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function createShare() {
    setLoading(true); setErr(null)
    const res = await fetch(`/api/ledger/contracts/${contractId}/share`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ expires_in_days: 30 }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(json.error ?? 'Failed to create share link'); return }
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
      <button
        onClick={() => { setOpen(true); if (!url) createShare() }}
        className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl text-white transition-all hover:-translate-y-px"
        style={{ background: 'var(--plum)' }}
      >
        Share diff
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,7,20,0.6)' }} onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-3xl p-6" style={{ background: 'white' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--ink)' }}>Anonymized share link</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--g600)' }}>
              Agency and recruiter names are hashed. Link expires in 30 days. Anyone with the link can view the diff.
            </p>
            {loading && <p className="text-sm" style={{ color: 'var(--g600)' }}>Generating...</p>}
            {err && <p className="text-sm" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
            {url && (
              <div className="flex gap-2">
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
