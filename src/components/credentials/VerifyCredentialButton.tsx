'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { canonicalizeType, type CredentialRow } from '@/lib/ledger/credentials/types'

const AHA_TYPES = new Set(['BLS', 'ACLS', 'PALS'])

export default function VerifyCredentialButton({ credential }: { credential: CredentialRow }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  if (!AHA_TYPES.has(canonicalizeType(credential.type))) return null

  async function verify() {
    setLoading(true); setErr(null); setMsg(null)
    const res = await fetch(`/api/ledger/credentials/${credential.id}/verify`, { method: 'POST' })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(typeof json.error === 'string' ? json.error : 'Verify failed'); return }
    setMsg(json.verification?.detail ?? 'Verified')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-1">
      <button onClick={verify} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-bold border disabled:opacity-50"
        style={{ borderColor: 'var(--sage)', color: 'var(--sage)', background: 'white' }}>
        {loading ? 'Verifying...' : 'Verify with AHA'}
      </button>
      {msg && <p className="text-xs" style={{ color: 'var(--sage)' }}>{msg}</p>}
      {err && <p className="text-xs" style={{ color: 'var(--tang-mid)' }}>{err}</p>}
    </div>
  )
}
