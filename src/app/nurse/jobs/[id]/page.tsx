'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import Button from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MapPin, Clock, Building2, DollarSign, Calendar, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

export default function JobDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [job, setJob] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [nurseProfile, setNurseProfile] = useState<any>(null)
  const [existingApp, setExistingApp] = useState<any>(null)
  const [coverNote, setCoverNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)

      const { data: j } = await supabase
        .from('job_postings')
        .select('*, employer_profiles(org_name, city, state, type, address)')
        .eq('id', id as string)
        .single()
      setJob(j)

      if (u) {
        const { data: np } = await supabase.from('nurse_profiles').select('*').eq('user_id', u.id).single()
        setNurseProfile(np)
        if (np) {
          const { data: app } = await supabase.from('applications')
            .select('*').eq('nurse_id', np.id).eq('job_id', id as string).single()
          setExistingApp(app)
        }
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!user) { router.push(`/auth/login?next=/nurse/jobs/${id}`); return }
    setError('')
    setApplying(true)

    if (!nurseProfile) {
      setError('Please complete your profile before applying.')
      setApplying(false)
      return
    }
    if (!nurseProfile.license_verified) {
      router.push(`/nurse/verify-license?next=/nurse/jobs/${id}`)
      return
    }
    if (nurseProfile.background_check_status !== 'passed') {
      setError('A passed background check is required to apply.')
      setApplying(false)
      return
    }

    const { error: appError } = await supabase.from('applications').insert({
      nurse_id: nurseProfile.id,
      job_id: id,
      cover_note: coverNote,
    })

    if (appError) {
      setError(appError.message)
    } else {
      setSuccess(true)
      await fetch('/api/applications/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id, nurseName: nurseProfile.full_name }),
      })
    }
    setApplying(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 rounded-full"
            style={{ borderColor: 'var(--g100)', borderTopColor: 'var(--plum)' }} />
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-lg font-semibold" style={{ color: 'var(--g600)' }}>Job not found.</p>
          <Link href="/nurse/jobs" className="text-sm font-semibold no-underline" style={{ color: 'var(--plum)' }}>← Back to jobs</Link>
        </div>
      </div>
    )
  }

  const canApply = nurseProfile?.background_check_status === 'passed' && nurseProfile?.license_verified

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole={user ? 'nurse' : null} userName={nurseProfile?.full_name ?? null} />

      <main className="flex-1 max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-8 w-full">
        <Link href="/nurse/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium no-underline mb-6 transition-colors hover:opacity-70"
          style={{ color: 'var(--plum)' }}>
          <ArrowLeft className="w-4 h-4" /> Back to jobs
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl border p-7" style={{ background: 'white', borderColor: 'var(--g100)' }}>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--plum-50)', color: 'var(--plum-mid)' }}>
                  {job.specialty_required}
                </span>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--cream-mid)', color: 'var(--g600)' }}>
                  {job.duration_weeks}w contract
                </span>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--sage-50)', color: 'var(--sage)' }}>
                  {job.status}
                </span>
              </div>

              <h1 className="font-display text-2xl mb-3" style={{ color: 'var(--ink)' }}>{job.title}</h1>

              <div className="flex flex-wrap gap-4 text-sm mb-6" style={{ color: 'var(--g600)' }}>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />{job.employer_profiles?.org_name}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />{job.city}, {job.state}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />Starts {formatDate(job.start_date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />{job.duration_weeks} weeks
                </span>
              </div>

              {job.description && (
                <div className="mb-5">
                  <h2 className="font-semibold mb-2 text-sm" style={{ color: 'var(--ink)' }}>Job Description</h2>
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--g600)' }}>{job.description}</p>
                </div>
              )}
              {job.requirements && (
                <div>
                  <h2 className="font-semibold mb-2 text-sm" style={{ color: 'var(--ink)' }}>Requirements</h2>
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--g600)' }}>{job.requirements}</p>
                </div>
              )}
            </div>

            {/* Cancellation policy */}
            <div className="rounded-2xl border p-7" style={{ background: 'white', borderColor: 'var(--g100)' }}>
              <h2 className="font-semibold mb-4" style={{ color: 'var(--ink)' }}>Cancellation Policy</h2>
              <div className="space-y-0">
                {[
                  { time: '7+ days before start', fee: 'No charge to either party', color: 'var(--sage)' },
                  { time: '3–6 days before start', fee: '25% of first week rate', color: 'var(--gold)' },
                  { time: '24–72 hours before start', fee: '50% of first week rate', color: 'var(--tang)' },
                  { time: 'Under 24 hours', fee: '100% of first week rate', color: '#DC2626' },
                ].map((row, i, arr) => (
                  <div key={row.time} className={`flex justify-between py-3 ${i < arr.length - 1 ? 'border-b' : ''}`}
                    style={{ borderColor: 'var(--g100)' }}>
                    <span className="text-sm" style={{ color: 'var(--g600)' }}>{row.time}</span>
                    <span className="text-sm font-semibold" style={{ color: row.color }}>{row.fee}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Apply sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border p-6" style={{ background: 'white', borderColor: 'var(--g100)' }}>
              <div className="flex items-baseline gap-1 mb-1">
                <DollarSign className="w-4 h-4 mb-1" style={{ color: 'var(--sage)' }} />
                <span className="font-display text-3xl" style={{ color: 'var(--ink)' }}>{formatCurrency(job.weekly_rate)}</span>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--g400)' }}>per week · {job.duration_weeks}w contract</p>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--g600)' }}>Total contract value</p>
              <p className="font-display text-xl mb-5" style={{ color: 'var(--plum)' }}>
                {formatCurrency(job.weekly_rate * job.duration_weeks)}
              </p>

              {success ? (
                <div className="flex items-start gap-2 rounded-xl border p-4"
                  style={{ background: 'var(--sage-50)', borderColor: 'var(--sage)' }}>
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--sage)' }} />
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>Application submitted!</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--g600)' }}>The employer will review your profile and reach out if interested.</p>
                  </div>
                </div>
              ) : existingApp ? (
                <div className="rounded-xl border p-4" style={{ background: 'var(--plum-50)', borderColor: 'var(--plum-100)' }}>
                  <p className="font-semibold text-sm" style={{ color: 'var(--plum)' }}>Already applied</p>
                  <span className="text-xs mt-1 inline-block" style={{ color: 'var(--plum-mid)' }}>Status: {existingApp.status}</span>
                </div>
              ) : !user ? (
                <div className="space-y-3">
                  <Link href={`/auth/register/nurse`}
                    className="w-full flex items-center justify-center gap-2 font-bold py-3 rounded-[14px] text-white no-underline transition-all hover:opacity-90"
                    style={{ background: 'var(--plum)' }}>
                    Create account to apply
                  </Link>
                  <Link href="/auth/login"
                    className="w-full flex items-center justify-center font-semibold py-2.5 rounded-[14px] text-sm no-underline border transition-all"
                    style={{ borderColor: 'var(--g200)', color: 'var(--g800)' }}>
                    Sign in
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleApply}>
                  {error && (
                    <div className="mb-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs p-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                    </div>
                  )}
                  {!canApply && (
                    <div className="mb-3 rounded-xl border p-3 text-xs"
                      style={{ background: 'var(--gold-50)', borderColor: 'var(--gold)', color: 'var(--g800)' }}>
                      <p className="font-semibold mb-1">Complete before applying:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        {!nurseProfile?.license_verified && <li>Verify your nursing license</li>}
                        {nurseProfile?.background_check_status !== 'passed' && <li>Complete background check</li>}
                      </ul>
                      <Link href="/nurse/profile" className="mt-2 inline-block font-semibold no-underline" style={{ color: 'var(--plum)' }}>
                        Complete profile →
                      </Link>
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--g800)' }}>Cover note (optional)</label>
                    <textarea
                      value={coverNote}
                      onChange={e => setCoverNote(e.target.value)}
                      rows={3}
                      placeholder="Briefly introduce yourself..."
                      className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
                      style={{ borderColor: 'var(--g200)' }}
                    />
                  </div>
                  <Button type="submit" loading={applying} disabled={!canApply} className="w-full" size="lg">
                    Apply Now
                  </Button>
                </form>
              )}
            </div>

            <div className="rounded-2xl border p-4 text-center text-xs" style={{ background: 'white', borderColor: 'var(--g100)', color: 'var(--g400)' }}>
              NurseSquare collects 15% placement fee from the employer only. Nurses pay nothing.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
