'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function NursysAdminTools() {
  return (
    <div className="space-y-6">
      <NotificationBackfill />
      <RetrieveDocuments />
      <RemoveNurse />
      <RotatePassword />
    </div>
  )
}

function NotificationBackfill() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [polling, setPolling] = useState(false)

  async function submit() {
    setError(''); setResult(null); setTransactionId(null); setSubmitting(true)
    try {
      const res = await fetch('/api/nursys/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Submit failed'); return }
      setTransactionId(data.transactionId)
    } finally { setSubmitting(false) }
  }

  async function poll() {
    if (!transactionId) return
    setError(''); setPolling(true)
    try {
      const res = await fetch(`/api/nursys/notifications?transactionId=${encodeURIComponent(transactionId)}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Poll failed'); return }
      setResult(data)
    } finally { setPolling(false) }
  }

  return (
    <Card>
      <h2 className="font-semibold text-lg mb-1">Notification backfill</h2>
      <p className="text-sm text-gray-600 mb-4">
        Submit a notification lookup window. Use for backfills outside the daily cron window.
        Both dates must be YYYY-MM-DD and on or before today.
      </p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Input label="Start date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <Input label="End date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>
      <div className="flex gap-2 mb-3">
        <Button onClick={submit} loading={submitting} disabled={!startDate || !endDate}>Submit lookup</Button>
        {transactionId && (
          <Button variant="outline" onClick={poll} loading={polling}>Poll result</Button>
        )}
      </div>
      {transactionId && (
        <p className="text-xs text-gray-500 mb-2">
          Transaction: <code>{transactionId}</code>
        </p>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {result !== null && (
        <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto max-h-72">{JSON.stringify(result, null, 2)}</pre>
      )}
    </Card>
  )
}

function RetrieveDocuments() {
  const [ids, setIds] = useState('')
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState('')
  const [fetching, setFetching] = useState(false)

  async function fetchDocs() {
    setError(''); setResult(null); setFetching(true)
    try {
      const cleaned = ids.split(',').map(s => s.trim()).filter(Boolean).join(',')
      const res = await fetch(`/api/nursys/documents?ids=${encodeURIComponent(cleaned)}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Fetch failed'); return }
      setResult(data)
    } finally { setFetching(false) }
  }

  return (
    <Card>
      <h2 className="font-semibold text-lg mb-1">Retrieve discipline documents</h2>
      <p className="text-sm text-gray-600 mb-4">
        Document IDs come from Nurse Lookup discipline records. Max 5 per call. Contents are returned as base64.
      </p>
      <Input
        label="Document IDs (comma-separated)"
        value={ids}
        onChange={e => setIds(e.target.value)}
        placeholder="abc123, def456"
      />
      <div className="mt-3">
        <Button onClick={fetchDocs} loading={fetching} disabled={!ids.trim()}>Fetch</Button>
      </div>
      {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
      {result !== null && (
        <pre className="text-xs bg-gray-50 border rounded p-3 mt-3 overflow-auto max-h-72">{JSON.stringify(result, null, 2)}</pre>
      )}
    </Card>
  )
}

function RemoveNurse() {
  const [id, setId] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState(false)

  async function remove() {
    setError(''); setMsg(''); setRemoving(true)
    try {
      const res = await fetch('/api/nursys/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nurseProfileId: id.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Remove failed')
        return
      }
      setMsg(`Submitted. Transaction: ${data.transactionId || '(n/a)'}`)
      setId('')
    } finally { setRemoving(false) }
  }

  return (
    <Card>
      <h2 className="font-semibold text-lg mb-1">Remove nurse from NCSBN list</h2>
      <p className="text-sm text-gray-600 mb-4">
        Submits an &lsquo;R&rsquo; (Remove) so NCSBN stops monitoring this license. Use when a nurse leaves the
        platform. Local Nursys state on the nurse_profiles row is also cleared.
      </p>
      <Input
        label="Nurse profile ID"
        value={id}
        onChange={e => setId(e.target.value)}
        placeholder="UUID from nurse_profiles.id"
      />
      <div className="mt-3">
        <Button variant="danger" onClick={remove} loading={removing} disabled={!id.trim()}>Remove</Button>
      </div>
      {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
      {msg && <p className="text-sm text-green-700 mt-3">{msg}</p>}
    </Card>
  )
}

function RotatePassword() {
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [rotating, setRotating] = useState(false)

  async function rotate() {
    setError(''); setMsg(''); setRotating(true)
    try {
      const res = await fetch('/api/nursys/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: pw }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Rotation failed')
        return
      }
      setMsg(data.warning || 'Password rotated.')
      setPw('')
    } finally { setRotating(false) }
  }

  return (
    <Card>
      <h2 className="font-semibold text-lg mb-1">Rotate Nursys API password</h2>
      <p className="text-sm text-gray-600 mb-4">
        After rotating, you must update <code>NURSYS_API_PASSWORD</code> in env and redeploy before the next
        Nursys call — otherwise the next request will 401. Minimum 12 characters.
      </p>
      <Input
        label="New password"
        type="password"
        value={pw}
        onChange={e => setPw(e.target.value)}
        placeholder="At least 12 characters"
      />
      <div className="mt-3">
        <Button onClick={rotate} loading={rotating} disabled={pw.length < 12}>Rotate</Button>
      </div>
      {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
      {msg && <p className="text-sm text-yellow-700 mt-3">{msg}</p>}
    </Card>
  )
}
