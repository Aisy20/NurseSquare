'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { US_STATES } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'

export default function HospitalProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [user, setUser] = useState<any>(null)

  const [form, setForm] = useState({
    org_name: '',
    type: '',
    contact_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth/login'); return }
      setUser(u)

      const { data: ep } = await supabase.from('employer_profiles').select('*').eq('user_id', u.id).single()
      if (ep) {
        setForm({
          org_name: ep.org_name || '',
          type: ep.type || '',
          contact_name: ep.contact_name || '',
          phone: ep.phone || '',
          address: ep.address || '',
          city: ep.city || '',
          state: ep.state || '',
          zip: ep.zip || '',
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

    const { error: err } = await supabase.from('employer_profiles').update({
      org_name: form.org_name,
      type: form.type,
      contact_name: form.contact_name,
      phone: form.phone,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
    }).eq('user_id', user?.id)

    if (err) setError(err.message)
    else setSuccess('Profile saved successfully!')
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="role-bg-hospital flex min-h-screen flex-col">
        <Navbar userRole="hospital" userName={null} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--tang)] border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="role-bg-hospital flex min-h-screen flex-col">
      <Navbar userRole="hospital" userName={form.org_name} />

      <main className="container-shell w-full max-w-2xl flex-1 py-8 lg:py-10">
        <button onClick={() => router.push('/hospital/dashboard')}
          className="focus-ring mb-6 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--tang-mid)' }}>
          ← Dashboard
        </button>
        <div className="mb-8 rounded-lg border border-[var(--g100)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
          <div className="mb-3 inline-flex rounded-md bg-[var(--tang-50)] px-2.5 py-1 text-[10px] font-bold uppercase text-[var(--tang-mid)]">
            Hiring workspace
          </div>
          <h1 className="text-[32px] font-bold leading-tight text-[var(--ink)]">Organization profile</h1>
          <p className="mt-2 text-sm leading-7 text-[var(--g600)]">Keep contact, location, and facility details current.</p>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle className="w-4 h-4" /> {success}
          </div>
        )}

        <form onSubmit={handleSave}>
          <Card className="space-y-5">
            <Input label="Organization name" value={form.org_name} onChange={e => update('org_name', e.target.value)} required />

            <Select
              label="Organization type"
              value={form.type}
              onChange={e => update('type', e.target.value)}
              required
              options={[
                { value: 'hospital', label: 'Hospital' },
                { value: 'clinic', label: 'Clinic' },
                { value: 'home_health_agency', label: 'Home Health Agency' },
                { value: 'staffing_agency', label: 'Staffing Agency' },
              ]}
            />

            <Input label="Primary contact name" value={form.contact_name} onChange={e => update('contact_name', e.target.value)} required />
            <Input label="Phone number" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} />
            <Input label="Street address" value={form.address} onChange={e => update('address', e.target.value)} />

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1"><Input label="City" value={form.city} onChange={e => update('city', e.target.value)} /></div>
              <div className="col-span-1">
                <Select label="State" value={form.state} onChange={e => update('state', e.target.value)} placeholder="ST" options={US_STATES.map(s => ({ value: s, label: s }))} />
              </div>
              <div className="col-span-1"><Input label="ZIP" value={form.zip} onChange={e => update('zip', e.target.value)} /></div>
            </div>

            <Button type="submit" loading={saving} size="lg" className="w-full">
              Save Profile
            </Button>
          </Card>
        </form>
      </main>
    </div>
  )
}
