'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { US_STATES } from '@/lib/utils'
import { Logo } from '@/components/layout/Navbar'

export default function HospitalRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    orgName: '',
    type: '',
    contactName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { role: 'hospital', org_name: form.orgName },
      },
    })

    if (signUpError || !authData.user) {
      setError(signUpError?.message || 'Registration failed')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase.from('employer_profiles').insert({
      user_id: authData.user.id,
      org_name: form.orgName,
      type: form.type,
      contact_name: form.contactName,
      phone: form.phone,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
    })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    router.push('/hospital/dashboard?welcome=true')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>
      {/* Brand sidebar */}
      <div className="hidden lg:flex lg:w-[380px] flex-col justify-between p-12"
        style={{ background: '#FFA574' }}>
        <Logo inv variant="hospital" />
        <div>
          <p className="font-display text-[28px] leading-snug mb-6" style={{ color: 'var(--plum-deep)' }}>
            Hire direct.<br />No markup.
          </p>
          <div className="space-y-3">
            {['Every nurse is license-verified', 'Checkr background checks', 'Escrow-protected placement'].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--plum-deep)', opacity: 0.82 }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--plum-deep)' }}></span>
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--plum-deep)', opacity: 0.55 }}>© {new Date().getFullYear()} NurseSquare</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-start justify-center px-4 py-12 overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo variant="hospital" />
          </div>

          <h1 className="font-display text-[28px] mb-1" style={{ color: 'var(--ink)' }}>Create your employer account</h1>
          <p className="text-sm mb-7" style={{ color: 'var(--g600)' }}>Start hiring verified travel nurses at 15%</p>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[{ n: 1, label: 'Account' }, { n: 2, label: 'Organization' }].map((s, i) => (
              <div key={s.n} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                    style={{
                      background: step >= s.n ? 'var(--tang)' : 'var(--g100)',
                      color: step >= s.n ? 'white' : 'var(--g400)',
                    }}>
                    {s.n}
                  </div>
                  <span className="text-sm font-medium" style={{ color: step >= s.n ? 'var(--tang-mid)' : 'var(--g400)' }}>
                    {s.label}
                  </span>
                </div>
                {i < 1 && <div className="w-10 h-0.5" style={{ background: step > s.n ? 'var(--tang)' : 'var(--g100)' }} />}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border p-7" style={{ background: 'white', borderColor: 'var(--g100)' }}>
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3">
                {error}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-5">
                <Input
                  label="Work email address"
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  required
                  placeholder="admin@hospital.com"
                />
                <Input
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  required
                  placeholder="At least 8 characters"
                />
                <Input
                  label="Confirm password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)}
                  required
                  placeholder="Repeat password"
                />
                <Button type="submit" variant="tang" className="w-full" size="lg">
                  Continue
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Organization name"
                  value={form.orgName}
                  onChange={e => update('orgName', e.target.value)}
                  required
                  placeholder="Regional Medical Center"
                />

                <Select
                  label="Organization type"
                  value={form.type}
                  onChange={e => update('type', e.target.value)}
                  required
                  placeholder="Select type"
                  options={[
                    { value: 'hospital', label: 'Hospital' },
                    { value: 'clinic', label: 'Clinic' },
                    { value: 'home_health_agency', label: 'Home Health Agency' },
                    { value: 'staffing_agency', label: 'Staffing Agency' },
                  ]}
                />

                <Input
                  label="Primary contact name"
                  value={form.contactName}
                  onChange={e => update('contactName', e.target.value)}
                  required
                  placeholder="Dr. Sarah Johnson"
                />

                <Input
                  label="Phone number"
                  type="tel"
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                  placeholder="(555) 555-5555"
                />

                <Input
                  label="Street address"
                  value={form.address}
                  onChange={e => update('address', e.target.value)}
                  placeholder="123 Healthcare Blvd"
                />

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="City"
                    value={form.city}
                    onChange={e => update('city', e.target.value)}
                    placeholder="Chicago"
                  />
                  <Select
                    label="State"
                    value={form.state}
                    onChange={e => update('state', e.target.value)}
                    placeholder="ST"
                    options={US_STATES.map(s => ({ value: s, label: s }))}
                  />
                  <Input
                    label="ZIP"
                    value={form.zip}
                    onChange={e => update('zip', e.target.value)}
                    placeholder="60601"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" variant="tang" loading={loading} className="flex-1" size="lg">
                    Create Account
                  </Button>
                </div>

                <p className="text-xs text-center" style={{ color: 'var(--g400)' }}>
                  By creating an account you agree to our{' '}
                  <Link href="/terms" className="no-underline" style={{ color: 'var(--tang-mid)' }}>Terms</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="no-underline" style={{ color: 'var(--tang-mid)' }}>Privacy Policy</Link>.
                  A 15% placement fee applies per successful hire.
                </p>
              </form>
            )}
          </div>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--g600)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold no-underline" style={{ color: 'var(--tang-mid)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
