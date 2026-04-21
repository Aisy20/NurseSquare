'use client'
export const dynamic = 'force-dynamic'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { SPECIALTIES, US_STATES } from '@/lib/utils'
import { Logo } from '@/components/layout/Navbar'
import { ArrowLeft, ArrowRight, Upload, CheckCircle } from 'lucide-react'

const LICENSE_TYPES = [
  { value: 'RN', label: 'RN — Registered Nurse', nursys: true },
  { value: 'LPN', label: 'LPN — Licensed Practical Nurse', nursys: true },
  { value: 'NP', label: 'NP — Nurse Practitioner', nursys: true },
  { value: 'CRNA', label: 'CRNA — Certified Registered Nurse Anesthetist', nursys: true },
  { value: 'CNA', label: 'CNA — Certified Nursing Assistant', nursys: false },
  { value: 'HHA', label: 'HHA — Home Health Aide', nursys: false },
]

const STEPS = ['Account', 'License', 'Details', 'Availability']

export default function NurseRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const certRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [certFileName, setCertFileName] = useState<string | null>(null)

  const [form, setForm] = useState({
    // Step 0 — Account
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Step 1 — License
    licenseType: '',
    licenseState: '',
    licenseNumber: '',
    certFile: null as File | null,
    // Step 2 — Details
    specialty: '',
    yearsExp: '',
    weeklyRate: '',
    hourlyRate: '',
    bio: '',
    photo: null as File | null,
    // Step 3 — Availability
    availabilityDate: '',
    zip: '',
    city: '',
    state: '',
  })

  function update(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const selectedLicense = LICENSE_TYPES.find(l => l.value === form.licenseType)
  const isNursys = selectedLicense?.nursys ?? true
  const isHourly = form.licenseType === 'CNA' || form.licenseType === 'HHA'

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    update('photo', file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function handleCertChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    update('certFile', file)
    setCertFileName(file.name)
  }

  function validateStep(s: number): string {
    if (s === 0) {
      if (!form.fullName.trim()) return 'Full name is required'
      if (!form.email.trim()) return 'Email is required'
      if (form.password.length < 8) return 'Password must be at least 8 characters'
      if (form.password !== form.confirmPassword) return 'Passwords do not match'
    }
    if (s === 1) {
      if (!form.licenseType) return 'Select a license type'
      if (!form.licenseState) return 'Select your license state'
      if (isNursys && !form.licenseNumber.trim()) return 'License number is required'
      if (!isNursys && !form.certFile) return 'Please upload your certification document'
    }
    if (s === 2) {
      if (!form.specialty) return 'Select a specialty'
      if (!form.yearsExp) return 'Years of experience is required'
      if (isHourly && !form.hourlyRate) return 'Desired hourly rate is required'
      if (!isHourly && !form.weeklyRate) return 'Desired weekly rate is required'
    }
    if (s === 3) {
      if (!form.availabilityDate) return 'Availability date is required'
      if (!form.zip.trim()) return 'ZIP code is required'
    }
    return ''
  }

  function nextStep(e: React.FormEvent) {
    e.preventDefault()
    const err = validateStep(step)
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validateStep(3)
    if (err) { setError(err); return }
    setError('')
    setLoading(true)

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { role: 'nurse', full_name: form.fullName } },
    })

    if (signUpError || !authData.user) {
      setError(signUpError?.message || 'Registration failed')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase.from('nurse_profiles').insert({
      user_id: authData.user.id,
      full_name: form.fullName,
      license_type: form.licenseType,
      license_number: form.licenseNumber,
      license_state: form.licenseState,
      specialty: form.specialty,
      years_exp: parseInt(form.yearsExp) || 0,
      hourly_rate: isHourly ? parseFloat(form.hourlyRate) || 0 : parseFloat(form.weeklyRate) / 40 || 0,
      weekly_rate: !isHourly ? parseFloat(form.weeklyRate) || 0 : null,
      bio: form.bio,
      availability: 'available',
      availability_date: form.availabilityDate,
      zip: form.zip,
      city: form.city,
      state: form.state,
    })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    router.push('/nurse/dashboard?welcome=true')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>
      {/* Brand sidebar */}
      <div className="hidden lg:flex lg:w-[360px] flex-col justify-between p-12"
        style={{ background: 'var(--plum-deep)' }}>
        <Logo inv />
        <div>
          <p className="font-display text-[26px] leading-snug text-white mb-3">
            Your skills.<br />Your terms.
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--plum-100)' }}>
            Join 2,400+ nurses earning more through direct hospital connections.
          </p>
          <div className="space-y-3">
            {['RN, LPN, NP, CRNA, CNA, HHA welcome', 'Free to join & apply', 'Escrow-protected payments', 'No agency, no games'].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--g400)' }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--tang)' }}></span>
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--g400)' }}>© {new Date().getFullYear()} NurseSquare</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-start justify-center px-4 py-12 overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>

          <h1 className="font-display text-[26px] mb-1" style={{ color: 'var(--ink)' }}>Create your nurse profile</h1>
          <p className="text-sm mb-7" style={{ color: 'var(--g600)' }}>Free forever — no credit card required</p>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: step > i ? 'var(--sage)' : step === i ? 'var(--plum)' : 'var(--g100)',
                      color: step >= i ? 'white' : 'var(--g400)',
                    }}>
                    {step > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:block"
                    style={{ color: step >= i ? 'var(--ink)' : 'var(--g400)' }}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-6 h-0.5 shrink-0"
                    style={{ background: step > i ? 'var(--sage)' : 'var(--g100)' }} />
                )}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border p-7" style={{ background: 'white', borderColor: 'var(--g100)' }}>
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">
                {error}
              </div>
            )}

            {/* Step 0 — Account */}
            {step === 0 && (
              <form onSubmit={nextStep} className="space-y-5 step-enter">
                <h2 className="font-semibold text-base mb-4" style={{ color: 'var(--ink)' }}>Your account</h2>

                {/* Optional photo at top */}
                <div className="flex items-center gap-4 mb-2">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer border-2 border-dashed overflow-hidden transition-all hover:border-[var(--plum)]"
                    style={{ borderColor: 'var(--g200)', background: 'var(--cream-mid)' }}>
                    {photoPreview
                      ? <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                      : <Upload className="w-5 h-5" style={{ color: 'var(--g400)' }} />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Profile photo</p>
                    <p className="text-xs" style={{ color: 'var(--g400)' }}>Optional · JPG or PNG</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>

                <Input label="Full name" value={form.fullName} onChange={e => update('fullName', e.target.value)}
                  required placeholder="Jane Smith, RN" />
                <Input label="Email address" type="email" value={form.email} onChange={e => update('email', e.target.value)}
                  required placeholder="jane@example.com" />
                <Input label="Password" type="password" value={form.password} onChange={e => update('password', e.target.value)}
                  required placeholder="At least 8 characters" />
                <Input label="Confirm password" type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)}
                  required placeholder="Repeat password" />
                <Button type="submit" className="w-full" size="lg">
                  Continue <ArrowRight className="w-4 h-4 inline ml-1" />
                </Button>
              </form>
            )}

            {/* Step 1 — License */}
            {step === 1 && (
              <form onSubmit={nextStep} className="space-y-5 step-enter">
                <h2 className="font-semibold text-base mb-4" style={{ color: 'var(--ink)' }}>License & verification</h2>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--g800)' }}>Worker type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LICENSE_TYPES.map(lt => (
                      <button key={lt.value} type="button"
                        onClick={() => update('licenseType', lt.value)}
                        className="text-left p-3 rounded-xl border text-sm transition-all"
                        style={{
                          borderColor: form.licenseType === lt.value ? 'var(--plum)' : 'var(--g200)',
                          background: form.licenseType === lt.value ? 'var(--plum-50)' : 'white',
                          color: form.licenseType === lt.value ? 'var(--plum)' : 'var(--g800)',
                        }}>
                        <div className="font-bold">{lt.value}</div>
                        <div className="text-xs mt-0.5 opacity-70">{lt.label.split('—')[1]?.trim()}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Select label="License / certification state"
                  value={form.licenseState}
                  onChange={e => update('licenseState', e.target.value)}
                  required
                  placeholder="Select state"
                  options={US_STATES.map(s => ({ value: s, label: s }))} />

                {isNursys ? (
                  <div>
                    <Input label="License number" value={form.licenseNumber}
                      onChange={e => update('licenseNumber', e.target.value)}
                      required placeholder="RN-123456" />
                    <p className="text-xs mt-1.5" style={{ color: 'var(--g400)' }}>
                      Verified via Nursys API after registration
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--g800)' }}>
                      State certification document
                    </label>
                    <div
                      onClick={() => certRef.current?.click()}
                      className="rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all hover:border-[var(--plum)]"
                      style={{ borderColor: certFileName ? 'var(--sage)' : 'var(--g200)', background: certFileName ? 'var(--sage-50)' : 'var(--cream)' }}>
                      {certFileName ? (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" style={{ color: 'var(--sage)' }} />
                          <span className="text-sm font-medium" style={{ color: 'var(--sage)' }}>{certFileName}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--g400)' }} />
                          <p className="text-sm" style={{ color: 'var(--g600)' }}>Click to upload PDF or image</p>
                          <p className="text-xs mt-1" style={{ color: 'var(--g400)' }}>State-issued certification document</p>
                        </>
                      )}
                    </div>
                    <input ref={certRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleCertChange} />
                  </div>
                )}

                <p className="text-xs rounded-xl p-3" style={{ background: 'var(--plum-50)', color: 'var(--plum)' }}>
                  All workers complete a Checkr background check after registration. Worker pays the Checkr fee directly.
                </p>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => { setError(''); setStep(0) }} className="flex-1">
                    <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
                  </Button>
                  <Button type="submit" className="flex-1" size="lg">
                    Continue <ArrowRight className="w-4 h-4 inline ml-1" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2 — Details */}
            {step === 2 && (
              <form onSubmit={nextStep} className="space-y-5 step-enter">
                <h2 className="font-semibold text-base mb-4" style={{ color: 'var(--ink)' }}>Your experience</h2>

                <Select label="Primary specialty"
                  value={form.specialty}
                  onChange={e => update('specialty', e.target.value)}
                  required
                  placeholder="Select specialty"
                  options={SPECIALTIES.map(s => ({ value: s, label: s }))} />

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Years of experience" type="number" min="0" max="50"
                    value={form.yearsExp} onChange={e => update('yearsExp', e.target.value)}
                    required placeholder="5" />
                  {isHourly ? (
                    <Input label="Desired hourly rate ($)" type="number" min="0"
                      value={form.hourlyRate} onChange={e => update('hourlyRate', e.target.value)}
                      required placeholder="22" />
                  ) : (
                    <Input label="Desired weekly rate ($)" type="number" min="0"
                      value={form.weeklyRate} onChange={e => update('weeklyRate', e.target.value)}
                      required placeholder="2400" />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium" style={{ color: 'var(--g800)' }}>Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={e => update('bio', e.target.value)}
                    rows={3}
                    placeholder="Tell hospitals about your experience and what makes you a great hire..."
                    className="block w-full rounded-xl border px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--g200)', color: 'var(--ink)' }}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => { setError(''); setStep(1) }} className="flex-1">
                    <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
                  </Button>
                  <Button type="submit" className="flex-1" size="lg">
                    Continue <ArrowRight className="w-4 h-4 inline ml-1" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3 — Availability */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-5 step-enter">
                <h2 className="font-semibold text-base mb-4" style={{ color: 'var(--ink)' }}>Availability & location</h2>

                <Input label="Available from" type="date" value={form.availabilityDate}
                  onChange={e => update('availabilityDate', e.target.value)} required />

                <div className="grid grid-cols-2 gap-4">
                  <Input label="City" value={form.city}
                    onChange={e => update('city', e.target.value)} placeholder="Seattle" />
                  <Select label="State" value={form.state}
                    onChange={e => update('state', e.target.value)}
                    placeholder="Select state"
                    options={US_STATES.map(s => ({ value: s, label: s }))} />
                </div>
                <Input label="ZIP code" value={form.zip}
                  onChange={e => update('zip', e.target.value)} required placeholder="98101" />

                <p className="text-xs text-center" style={{ color: 'var(--g400)' }}>
                  By creating an account you agree to our{' '}
                  <Link href="/terms" className="no-underline" style={{ color: 'var(--plum)' }}>Terms</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="no-underline" style={{ color: 'var(--plum)' }}>Privacy Policy</Link>.
                </p>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => { setError(''); setStep(2) }} className="flex-1">
                    <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
                  </Button>
                  <Button type="submit" loading={loading} className="flex-1" size="lg">
                    Create Profile
                  </Button>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--g600)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold no-underline" style={{ color: 'var(--plum)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
