'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { SPECIALTIES, US_STATES } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'

export default function PostJobPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [employerProfile, setEmployerProfile] = useState<any>(null)

  const [job, setJob] = useState({
    title: '',
    city: '',
    state: '',
    location: '',
    start_date: '',
    duration_weeks: '',
    weekly_rate: '',
    specialty_required: '',
    description: '',
    requirements: '',
  })

  const [checklist, setChecklist] = useState({
    parking: '',
    report_to: '',
    dress_code: '',
    unit_protocols: '',
    badge_pickup: '',
    additional_notes: '',
  })

  function updateJob(field: string, value: string) {
    setJob(prev => ({ ...prev, [field]: value }))
  }

  function updateChecklist(field: string, value: string) {
    setChecklist(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: ep } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      if (!ep) { router.push('/hospital/profile'); return }
      setEmployerProfile(ep)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: jobData, error: jobError } = await supabase.from('job_postings').insert({
      employer_id: employerProfile.id,
      title: job.title,
      location: `${job.city}, ${job.state}`,
      city: job.city,
      state: job.state,
      start_date: job.start_date,
      duration_weeks: parseInt(job.duration_weeks),
      weekly_rate: parseFloat(job.weekly_rate),
      specialty_required: job.specialty_required,
      description: job.description,
      requirements: job.requirements,
      status: 'active',
    }).select().single()

    if (jobError || !jobData) {
      setError(jobError?.message || 'Failed to create job')
      setLoading(false)
      return
    }

    const { error: checklistError } = await supabase.from('onboarding_checklists').insert({
      job_id: jobData.id,
      employer_id: employerProfile.id,
      parking: checklist.parking,
      report_to: checklist.report_to,
      dress_code: checklist.dress_code,
      unit_protocols: checklist.unit_protocols,
      badge_pickup: checklist.badge_pickup,
      additional_notes: checklist.additional_notes,
    })

    if (checklistError) {
      setError(checklistError.message)
      setLoading(false)
      return
    }

    await fetch('/api/onboarding/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: jobData.id }),
    })

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar userRole="hospital" userName={employerProfile?.org_name} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Posted!</h2>
            <p className="text-gray-500 mb-6">Your job is now live and visible to nurses. An onboarding PDF has been generated.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/hospital/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Button onClick={() => { setSuccess(false); setStep(1); setJob({ title: '', city: '', state: '', location: '', start_date: '', duration_weeks: '', weekly_rate: '', specialty_required: '', description: '', requirements: '' }); setChecklist({ parking: '', report_to: '', dress_code: '', unit_protocols: '', badge_pickup: '', additional_notes: '' }) }}>
                Post Another Job
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar userRole="hospital" userName={employerProfile?.org_name} />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
        <button onClick={() => router.push('/hospital/dashboard')}
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-opacity hover:opacity-70"
          style={{ color: 'var(--tang-mid)' }}>
          ← Dashboard
        </button>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Post a Job</h1>
          <p className="text-gray-500 mt-1">Fill in the job details and onboarding checklist</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[{ n: 1, label: 'Job Details' }, { n: 2, label: 'Onboarding Checklist' }].map(s => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s.n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{s.n}</div>
              <span className={`text-sm ${step >= s.n ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{s.label}</span>
              {s.n < 2 && <div className={`w-12 h-0.5 ${step > s.n ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
        )}

        {step === 1 && (
          <Card>
            <form onSubmit={e => { e.preventDefault(); setStep(2) }} className="space-y-5">
              <Input
                label="Job title"
                value={job.title}
                onChange={e => updateJob('title', e.target.value)}
                required
                placeholder="ICU Travel Nurse — 13-Week Contract"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={job.city}
                  onChange={e => updateJob('city', e.target.value)}
                  required
                  placeholder="Chicago"
                />
                <Select
                  label="State"
                  value={job.state}
                  onChange={e => updateJob('state', e.target.value)}
                  required
                  placeholder="Select state"
                  options={US_STATES.map(s => ({ value: s, label: s }))}
                />
              </div>

              <Select
                label="Specialty required"
                value={job.specialty_required}
                onChange={e => updateJob('specialty_required', e.target.value)}
                required
                placeholder="Select specialty"
                options={SPECIALTIES.map(s => ({ value: s, label: s }))}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start date"
                  type="date"
                  value={job.start_date}
                  onChange={e => updateJob('start_date', e.target.value)}
                  required
                />
                <Input
                  label="Duration (weeks)"
                  type="number"
                  min="1"
                  max="52"
                  value={job.duration_weeks}
                  onChange={e => updateJob('duration_weeks', e.target.value)}
                  required
                  placeholder="13"
                />
              </div>

              <Input
                label="Weekly rate ($)"
                type="number"
                min="0"
                value={job.weekly_rate}
                onChange={e => updateJob('weekly_rate', e.target.value)}
                required
                placeholder="3500"
                hint="Total weekly compensation paid to the nurse"
              />

              <Textarea
                label="Job description"
                value={job.description}
                onChange={e => updateJob('description', e.target.value)}
                placeholder="Describe the role, unit, patient population, shift details..."
                rows={4}
              />

              <Textarea
                label="Requirements"
                value={job.requirements}
                onChange={e => updateJob('requirements', e.target.value)}
                placeholder="Minimum 2 years ICU experience, BLS/ACLS required, state license..."
                rows={3}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <strong>Pricing reminder:</strong> NurseSquare charges a 15% placement fee on the total contract value once a nurse is hired. No upfront fees.
              </div>

              <Button type="submit" className="w-full" size="lg">
                Continue to Onboarding Checklist
              </Button>
            </form>
          </Card>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <Card className="mb-4">
              <h2 className="font-semibold text-gray-900 mb-2">Onboarding Checklist</h2>
              <p className="text-sm text-gray-500 mb-5">
                This information will be compiled into a PDF automatically sent to your hired nurse. Fill it out once — we handle the rest.
              </p>
              <div className="space-y-5">
                <Textarea
                  label="Parking instructions"
                  value={checklist.parking}
                  onChange={e => updateChecklist('parking', e.target.value)}
                  placeholder="Employee parking in Lot B, badge required. Entrance on 3rd Ave."
                  rows={2}
                />
                <Textarea
                  label="Report to"
                  value={checklist.report_to}
                  onChange={e => updateChecklist('report_to', e.target.value)}
                  placeholder="Report to Charge Nurse on 4th floor ICU. Ask for Mary at the nursing station."
                  rows={2}
                />
                <Textarea
                  label="Dress code"
                  value={checklist.dress_code}
                  onChange={e => updateChecklist('dress_code', e.target.value)}
                  placeholder="Navy blue scrubs required. Closed-toe shoes only. ID badge must be visible."
                  rows={2}
                />
                <Textarea
                  label="Unit protocols"
                  value={checklist.unit_protocols}
                  onChange={e => updateChecklist('unit_protocols', e.target.value)}
                  placeholder="Review HIPAA policy on Day 1. Epic EMR training provided. ACLS cart location..."
                  rows={3}
                />
                <Textarea
                  label="Badge pickup"
                  value={checklist.badge_pickup}
                  onChange={e => updateChecklist('badge_pickup', e.target.value)}
                  placeholder="Pick up your badge at HR (Room 102, main building) before your first shift. Bring two forms of ID."
                  rows={2}
                />
                <Textarea
                  label="Additional notes (optional)"
                  value={checklist.additional_notes}
                  onChange={e => updateChecklist('additional_notes', e.target.value)}
                  placeholder="Any other important information for the nurse..."
                  rows={2}
                />
              </div>
            </Card>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button type="submit" loading={loading} className="flex-1" size="lg">
                Post Job
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
