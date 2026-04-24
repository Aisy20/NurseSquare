'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { US_STATES } from '@/lib/utils'
import { PRACTICE_SETTING_LABELS } from '@/lib/nursys'
import { Shield, CheckCircle, Clock, ArrowLeft } from 'lucide-react'

function VerifyLicenseInner() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/nurse/dashboard'
  const supabase = createClient()

  const [nurseProfile, setNurseProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ transactionId?: string; submittedAt?: string } | null>(null)
  const [polling, setPolling] = useState(false)
  const [pollState, setPollState] = useState<'idle' | 'processing' | 'failed' | 'verified'>('idle')
  const [pollErrors, setPollErrors] = useState<string[]>([])

  const [form, setForm] = useState({
    licenseNumber: '',
    licenseState: '',
    licenseType: '',
    ncsbnId: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    lastFourSSN: '',
    birthYear: '',
    practiceSettingLabel: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: np } = await supabase.from('nurse_profiles').select('*').eq('user_id', user.id).single()
      if (!np) { router.push('/nurse/profile'); return }

      setNurseProfile(np)

      setForm(f => ({
        ...f,
        licenseNumber: np.license_number || '',
        licenseState: np.license_state || '',
        licenseType: np.license_type || '',
        address1: np.address1 || '',
        address2: np.address2 || '',
        city: np.city || '',
        state: np.state || np.license_state || '',
        zip: np.zip || '',
        lastFourSSN: np.ssn_last_four || '',
        birthYear: np.birth_year ? String(np.birth_year) : '',
        practiceSettingLabel: np.practice_setting || '',
        ncsbnId: np.ncsbn_id || '',
      }))

      if (np.nursys_transaction_id && !np.license_verified) {
        setResult({ transactionId: np.nursys_transaction_id, submittedAt: np.nursys_enrolled_at })
      }

      setLoading(false)
    }
    load()
  }, [])

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function checkStatus() {
    if (!nurseProfile) return
    setPolling(true)
    setPollErrors([])
    try {
      const res = await fetch(`/api/nursys/verify?nurseProfileId=${encodeURIComponent(nurseProfile.id)}`)
      const data = await res.json()

      if (!res.ok) {
        setPollErrors([data.error || 'Status check failed'])
        setPollState('failed')
        return
      }

      // Refresh profile so UI reflects DB updates (license_verified, etc.)
      const { data: np } = await supabase.from('nurse_profiles').select('*').eq('id', nurseProfile.id).single()
      if (np) setNurseProfile(np)

      switch (data.status) {
        case 'verified':
          setPollState('verified')
          break
        case 'processing_enrollment':
        case 'checking_license_status':
          setPollState('processing')
          break
        case 'failed':
          setPollState('failed')
          setPollErrors([data.reason || 'Verification failed'])
          break
        default:
          setPollState('processing')
      }
    } finally {
      setPolling(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nurseProfile) return
    setError('')
    setSubmitting(true)

    if (!/^\d{4}$/.test(form.lastFourSSN)) {
      setError('SSN last 4 must be 4 digits')
      setSubmitting(false)
      return
    }
    const birthYearNum = parseInt(form.birthYear, 10)
    if (!birthYearNum || birthYearNum < 1900 || birthYearNum > new Date().getFullYear() - 15) {
      setError('Enter a valid 4-digit birth year')
      setSubmitting(false)
      return
    }

    const res = await fetch('/api/nursys/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nurseProfileId: nurseProfile.id, ...form }),
    })
    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(data.error || 'Submission failed')
      return
    }

    if (data.source === 'dev_fallback' && data.verified) {
      router.push(next)
      return
    }

    setResult({ transactionId: data.transactionId, submittedAt: data.transactionDate })
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
        <Navbar userRole="nurse" userName={null} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 rounded-full"
            style={{ borderColor: 'var(--g100)', borderTopColor: 'var(--plum)' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole="nurse" userName={nurseProfile?.full_name} />

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Link href={next} className="inline-flex items-center gap-1.5 text-sm font-medium no-underline mb-6"
          style={{ color: 'var(--plum)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>

        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5" style={{ color: 'var(--plum)' }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--plum)' }}>
            License verification
          </span>
        </div>
        <h1 className="font-display text-[32px] mb-2" style={{ color: 'var(--ink)' }}>Verify your license</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--g600)' }}>
          Before applying to jobs, we verify your license with Nursys (the National Council of State Boards of Nursing).
          Your SSN last 4 and birth year are required by NCSBN to match you to your license record. They&apos;re transmitted over TLS and never shown to hospitals.
        </p>

        {result ? (
          <Card>
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: pollState === 'failed' ? 'var(--tang-50)' : 'var(--sage-50)' }}>
                {pollState === 'verified' || nurseProfile?.license_verified
                  ? <CheckCircle className="w-6 h-6" style={{ color: 'var(--sage)' }} />
                  : pollState === 'failed'
                    ? <Clock className="w-6 h-6" style={{ color: 'var(--tang)' }} />
                    : <Clock className="w-6 h-6" style={{ color: 'var(--tang)' }} />
                }
              </div>
              <h2 className="font-semibold text-lg mb-2" style={{ color: 'var(--ink)' }}>
                {pollState === 'verified' || nurseProfile?.license_verified
                  ? 'License verified'
                  : pollState === 'failed'
                    ? 'Verification failed'
                    : pollState === 'processing'
                      ? 'Still processing'
                      : 'Submission received'}
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--g600)' }}>
                {pollState === 'verified' || nurseProfile?.license_verified
                  ? 'Your license has been verified with NCSBN. You can now apply for jobs.'
                  : pollState === 'failed'
                    ? 'NCSBN was unable to match the details you provided. See below.'
                    : 'Nursys is processing your submission. Verification typically completes within 5 minutes — click Check status to refresh.'}
              </p>

              {pollErrors.length > 0 && (
                <div className="text-left rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3 mb-4">
                  <ul className="list-disc list-inside space-y-1">
                    {pollErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              {result.transactionId && (
                <p className="text-xs mb-6" style={{ color: 'var(--g400)' }}>
                  Tracking ID: <code>{result.transactionId}</code>
                </p>
              )}
              <div className="flex gap-3 justify-center flex-wrap">
                {pollState === 'verified' || nurseProfile?.license_verified ? (
                  <Link href={next}
                    className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl text-white no-underline"
                    style={{ background: 'var(--plum)' }}>
                    Continue
                  </Link>
                ) : pollState === 'failed' ? (
                  <>
                    <button onClick={() => { setResult(null); setPollState('idle'); setPollErrors([]) }}
                      className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl text-white"
                      style={{ background: 'var(--plum)' }}>
                      Edit and resubmit
                    </button>
                    <Link href="/nurse/dashboard"
                      className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl border no-underline"
                      style={{ background: 'white', borderColor: 'var(--g200)', color: 'var(--ink)' }}>
                      Back to dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Button onClick={() => checkStatus()}
                      loading={polling}
                      variant="outline">
                      Check status
                    </Button>
                    <Link href="/nurse/dashboard"
                      className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl text-white no-underline"
                      style={{ background: 'var(--plum)' }}>
                      Back to dashboard
                    </Link>
                  </>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input label="License number" value={form.licenseNumber}
                  onChange={e => update('licenseNumber', e.target.value)} required placeholder="RN-123456" />
                <Select label="License state" value={form.licenseState}
                  onChange={e => update('licenseState', e.target.value)} required placeholder="Select state"
                  options={US_STATES.map(s => ({ value: s, label: s }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select label="License type" value={form.licenseType}
                  onChange={e => update('licenseType', e.target.value)} required placeholder="Select type"
                  options={[
                    { value: 'RN', label: 'RN — Registered Nurse' },
                    { value: 'LPN', label: 'LPN — Licensed Practical Nurse' },
                    { value: 'NP', label: 'NP — Nurse Practitioner' },
                    { value: 'CRNA', label: 'CRNA' },
                    { value: 'CNA', label: 'CNA' },
                    { value: 'HHA', label: 'HHA' },
                  ]} />
                <Input label="NCSBN ID (optional)" value={form.ncsbnId}
                  onChange={e => update('ncsbnId', e.target.value)} placeholder="99912345" />
              </div>

              <Input label="Street address" value={form.address1}
                onChange={e => update('address1', e.target.value)} required placeholder="123 Main St" />
              <Input label="Address line 2" value={form.address2}
                onChange={e => update('address2', e.target.value)} placeholder="Apt 4B" />

              <div className="grid grid-cols-3 gap-4">
                <Input label="City" value={form.city}
                  onChange={e => update('city', e.target.value)} required placeholder="Austin" />
                <Select label="State" value={form.state}
                  onChange={e => update('state', e.target.value)} required placeholder="ST"
                  options={US_STATES.map(s => ({ value: s, label: s }))} />
                <Input label="ZIP" value={form.zip}
                  onChange={e => update('zip', e.target.value)} required placeholder="78701" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="SSN (last 4)" value={form.lastFourSSN}
                  onChange={e => update('lastFourSSN', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required placeholder="1234" inputMode="numeric" maxLength={4} />
                <Input label="Birth year" value={form.birthYear}
                  onChange={e => update('birthYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required placeholder="1985" inputMode="numeric" maxLength={4} />
              </div>

              <Select label="Primary practice setting"
                value={form.practiceSettingLabel}
                onChange={e => update('practiceSettingLabel', e.target.value)}
                required placeholder="Select setting"
                options={PRACTICE_SETTING_LABELS.map(l => ({ value: l, label: l }))} />

              <p className="text-xs rounded-xl p-3" style={{ background: 'var(--plum-50)', color: 'var(--plum)' }}>
                🔒 This information is used only to verify your license with NCSBN and is not shared with hospitals.
              </p>

              <Button type="submit" loading={submitting} className="w-full" size="lg">
                Submit for verification
              </Button>
            </form>
          </Card>
        )}
      </main>
    </div>
  )
}

export default function VerifyLicensePage() {
  return (
    <Suspense fallback={null}>
      <VerifyLicenseInner />
    </Suspense>
  )
}
