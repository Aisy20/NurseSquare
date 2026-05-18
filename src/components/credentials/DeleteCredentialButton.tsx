'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteCredentialButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function doDelete() {
    setLoading(true)
    const res = await fetch(`/api/ledger/credentials/${id}`, { method: 'DELETE' })
    setLoading(false)
    if (!res.ok) return
    router.push('/nurse/credentials')
  }

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="px-4 py-2 rounded-lg text-sm font-bold border"
        style={{ borderColor: 'var(--g100)', color: 'var(--tang-mid)', background: 'white' }}>
        Delete
      </button>
    )
  }
  return (
    <>
      <button onClick={doDelete} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-bold text-white"
        style={{ background: 'var(--tang)' }}>
        {loading ? 'Deleting...' : 'Confirm delete'}
      </button>
      <button onClick={() => setConfirming(false)} className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--g600)' }}>
        Cancel
      </button>
    </>
  )
}
