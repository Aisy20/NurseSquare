'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Star, Shield, CheckCircle, DollarSign, AlertCircle, MessageSquare } from 'lucide-react'

const STATUS_OPTIONS = ['pending', 'reviewing', 'offered', 'rejected'] as const

export default function ApplicationDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [app, setApp] = useState<any>(null)
  const [employerProfile, setEmployerProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [making, setMaking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const [{ data: ep }, { data: application }] = await Promise.all([
        supabase.from('employer_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('applications')
          .select('*, nurse_profiles(*), job_postings(*, employer_profiles(*))')
          .eq('id', id as string)
          .single(),
      ])

      setEmployerProfile(ep)
      setApp(application)
      setLoading(false)
    }
    load()
  }, [id])

  async function updateStatus(newStatus: string) {
    setUpdating(true)
    const res = await fetch('/api/applications/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: id, status: newStatus }),
    })
    const data = await res.json()

    if (res.ok) {
      setApp((prev: any) => ({ ...prev, status: newStatus }))
      setSuccess(`Status updated to ${newStatus}. Nurse has been notified.`)
    } else {
      setError(data.error || 'Failed to update status')
    }
    setUpdating(false)
  }

  async function makeOffer() {
    setMaking(true)
    setError('')

    const res = await fetch('/api/stripe/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: id }),
    })

    const data = await res.json()

    if (data.error) {
      setError(data.error)
    } else {
      setSuccess(`Offer made! Payment of ${formatCurrency(data.contractValue)} placed in escrow. Placement created.`)
      setApp((prev: any) => ({ ...prev, status: 'accepted' }))
    }
    setMaking(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar userRole="hospital" userName={null} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  if (!app) return null

  const nurse = app.nurse_profiles
  const job = app.job_postings
  const contractValue = job.weekly_rate * job.duration_weeks
  const platformFee = contractValue * 0.15
  const nurseEarnings = contractValue - platformFee

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar userRole="hospital" userName={employerProfile?.org_name} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Link href="/hospital/applicants"
          className="inline-flex items-center gap-1.5 text-sm font-medium no-underline mb-6 transition-opacity hover:opacity-70"
          style={{ color: 'var(--tang-mid)' }}>
          ← Back to applicants
        </Link>

        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {success}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Nurse profile */}
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-2xl">
                    {nurse?.full_name?.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{nurse?.full_name}</h1>
                    <p className="text-gray-600">{nurse?.specialty} · {nurse?.years_exp} years experience</p>
                    <div className="flex items-center gap-3 mt-2">
                      {nurse?.license_verified && (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" /> License Verified
                        </span>
                      )}
                      {nurse?.background_check_status === 'passed' && (
                        <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                          <Shield className="w-3 h-3" /> Background Check Passed
                        </span>
                      )}
                      {nurse?.rating_count > 0 && (
                        <span className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          {nurse?.rating_avg?.toFixed(1)} ({nurse?.rating_count})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant={
                  app.status === 'pending' ? 'warning' :
                  app.status === 'accepted' ? 'success' :
                  app.status === 'rejected' ? 'danger' : 'info'
                }>
                  {app.status}
                </Badge>
              </div>

              {nurse?.bio && (
                <div>
                  <h2 className="font-semibold text-gray-900 mb-2">About</h2>
                  <p className="text-gray-600 text-sm">{nurse.bio}</p>
                </div>
              )}

              {app.cover_note && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h2 className="font-semibold text-gray-900 mb-2 text-sm">Cover Note</h2>
                  <p className="text-gray-600 text-sm italic">&ldquo;{app.cover_note}&rdquo;</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">License</p>
                  <p className="font-semibold">{nurse?.license_state} #{nurse?.license_number}</p>
                </div>
                <div>
                  <p className="text-gray-500">Desired rate</p>
                  <p className="font-semibold">{formatCurrency(nurse?.hourly_rate || 0)}/hr</p>
                </div>
                <div>
                  <p className="text-gray-500">Applied</p>
                  <p className="font-semibold">{formatDate(app.applied_at)}</p>
                </div>
              </div>
            </Card>

            {/* Job being applied for */}
            <Card>
              <h2 className="font-semibold text-gray-900 mb-3">Job Applied For</h2>
              <p className="text-lg font-bold text-gray-900">{job.title}</p>
              <p className="text-sm text-gray-600">{job.city}, {job.state} · {job.specialty_required} · {job.duration_weeks}w</p>
              <p className="text-sm text-gray-500 mt-1">Start: {formatDate(job.start_date)}</p>
              <p className="text-xl font-bold text-gray-900 mt-2">{formatCurrency(job.weekly_rate)}/week</p>
            </Card>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {/* Make offer */}
            {app.status !== 'accepted' && app.status !== 'rejected' && (
              <Card className="border-green-200 bg-green-50">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  Make an Offer
                </h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contract value</span>
                    <span className="font-semibold">{formatCurrency(contractValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform fee (15%)</span>
                    <span className="font-semibold text-blue-700">{formatCurrency(platformFee)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total charged to you</span>
                    <span className="font-bold">{formatCurrency(contractValue + platformFee)}</span>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-yellow-800 flex items-start gap-1.5">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    Payment is held in escrow and automatically released 48 hours after the nurse starts.
                  </p>
                </div>

                <Button
                  onClick={makeOffer}
                  loading={making}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Confirm & Place in Escrow
                </Button>
              </Card>
            )}

            {/* Message nurse */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" style={{ color: 'var(--plum)' }} />
                Message nurse
              </h3>
              <p className="text-xs mb-3" style={{ color: 'var(--g600)' }}>
                Ask questions or discuss the role directly.
              </p>
              <Link href={`/messages/${id}`}
                className="block text-center w-full font-semibold text-sm py-2.5 rounded-xl text-white no-underline transition-opacity hover:opacity-90"
                style={{ background: 'var(--plum)' }}>
                Open conversation
              </Link>
            </Card>

            {/* Status update */}
            {app.status !== 'accepted' && (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
                <div className="space-y-2">
                  {STATUS_OPTIONS.filter(s => s !== app.status).map(status => (
                    <Button
                      key={status}
                      variant={status === 'rejected' ? 'danger' : 'outline'}
                      className="w-full capitalize"
                      loading={updating}
                      onClick={() => updateStatus(status)}
                    >
                      Mark as {status}
                    </Button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
