'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { SPECIALTIES, US_STATES } from '@/lib/utils'
import { Shield, CheckCircle, ExternalLink } from 'lucide-react'

export default function NurseProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  const [form, setForm] = useState({
    full_name: '',
    license_number: '',
    license_state: '',
    specialty: '',
    years_exp: '',
    hourly_rate: '',
    bio: '',
    availability: 'available',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)

      const { data: p } = await supabase.from('nurse_profiles').select('*').eq('user_id', u.id).single()
      if (p) {
        setProfile(p)
        setForm({
          full_name: p.full_name || '',
          license_number: p.license_number || '',
          license_state: p.license_state || '',
          specialty: p.specialty || '',
          years_exp: p.years_exp?.toString() || '',
          hourly_rate: p.hourly_rate?.toString() || '',
          bio: p.bio || '',
          availability: p.availability || 'available',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const licenseChanged =
      form.license_number !== (profile?.license_number || '') ||
      form.license_state !== (profile?.license_state || '')

    const update: Record<string, unknown> = {
      full_name: form.full_name,
      license_number: form.license_number,
      license_state: form.license_state,
      specialty: form.specialty,
      years_exp: parseInt(form.years_exp) || 0,
      hourly_rate: parseFloat(form.hourly_rate) || 0,
      bio: form.bio,
      availability: form.availability,
    }
    if (licenseChanged) {
      update.license_verified = false
      update.license_verified_at = null
      update.nursys_lookup_transaction_id = null
    }

    const { error: err } = await supabase
      .from('nurse_profiles')
      .update(update)
      .eq('user_id', user?.id)

    if (err) {
      setError(err.message)
    } else {
      setSuccess('Profile saved successfully!')
      setProfile((prev: any) => ({
        ...prev,
        ...form,
        ...(licenseChanged ? { license_verified: false } : {}),
      }))
    }
    setSaving(false)
  }

  async function handleStartBackgroundCheck() {
    const res = await fetch('/api/checkr/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nurseProfileId: profile?.id, email: user?.email }),
    })
    const data = await res.json()
    if (data.invitationUrl) {
      window.open(data.invitationUrl, '_blank')
    } else {
      setError(data.error || 'Failed to start background check')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar userRole="nurse" userName={null} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar userRole="nurse" userName={form.full_name} />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
        <button onClick={() => router.push('/nurse/dashboard')}
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-opacity hover:opacity-70"
          style={{ color: 'var(--plum)' }}>
          ← Dashboard
        </button>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Keep your profile up to date to attract the best opportunities</p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
        )}
        {success && (
          <div className="mb-5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <h2 className="font-semibold text-gray-900 mb-5">Basic Information</h2>
            <div className="space-y-4">
              <Input label="Full name" value={form.full_name} onChange={e => update('full_name', e.target.value)} required />
              <Select
                label="Availability"
                value={form.availability}
                onChange={e => update('availability', e.target.value)}
                options={[
                  { value: 'available', label: 'Available now' },
                  { value: 'open_to_offers', label: 'Open to offers' },
                  { value: 'unavailable', label: 'Not available' },
                ]}
              />
              <Textarea
                label="Bio"
                value={form.bio}
                onChange={e => update('bio', e.target.value)}
                placeholder="Tell hospitals about your experience, specialties, and what makes you a great travel nurse..."
                rows={4}
              />
            </div>
          </Card>

          {/* License */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Nursing License</h2>
              {profile?.license_verified && <Badge variant="success">Verified via Nursys</Badge>}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="License number"
                  value={form.license_number}
                  onChange={e => update('license_number', e.target.value)}
                  placeholder="RN-123456"
                  required
                />
                <Select
                  label="License state"
                  value={form.license_state}
                  onChange={e => update('license_state', e.target.value)}
                  placeholder="Select state"
                  options={US_STATES.map(s => ({ value: s, label: s }))}
                />
              </div>
              {!profile?.license_verified && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/nurse/verify-license?next=/nurse/profile')}
                  disabled={!form.license_number || !form.license_state}
                >
                  Verify via Nursys
                </Button>
              )}
            </div>
          </Card>

          {/* Professional Details */}
          <Card>
            <h2 className="font-semibold text-gray-900 mb-5">Professional Details</h2>
            <div className="space-y-4">
              <Select
                label="Primary specialty"
                value={form.specialty}
                onChange={e => update('specialty', e.target.value)}
                placeholder="Select specialty"
                options={SPECIALTIES.map(s => ({ value: s, label: s }))}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Years of experience"
                  type="number"
                  min="0"
                  max="50"
                  value={form.years_exp}
                  onChange={e => update('years_exp', e.target.value)}
                  required
                />
                <Input
                  label="Desired hourly rate ($)"
                  type="number"
                  min="0"
                  value={form.hourly_rate}
                  onChange={e => update('hourly_rate', e.target.value)}
                  hint="This helps employers match you with appropriate jobs"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Background Check */}
          <div id="background-check"><Card>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="font-semibold text-gray-900">Background Check</h2>
                  <Badge variant={
                    profile?.background_check_status === 'passed' ? 'success' :
                    profile?.background_check_status === 'failed' ? 'danger' :
                    profile?.background_check_status === 'in_progress' ? 'info' : 'warning'
                  }>
                    {profile?.background_check_status?.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Required before applying for jobs. Powered by Checkr. Cost is $20–30 paid directly to Checkr.
                  Results typically available within 1–3 business days.
                </p>
                {profile?.background_check_status === 'not_started' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleStartBackgroundCheck}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Start background check via Checkr
                  </Button>
                )}
                {profile?.background_check_status === 'in_progress' && (
                  <p className="text-sm text-blue-600">Your background check is in progress. We&apos;ll notify you when it&apos;s complete.</p>
                )}
                {profile?.background_check_status === 'passed' && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Background check passed. You can apply for jobs.
                  </p>
                )}
              </div>
            </div>
          </Card></div>

          <Button type="submit" loading={saving} size="lg" className="w-full">
            Save Profile
          </Button>
        </form>
      </main>
    </div>
  )
}
