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
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar userRole="hospital" userName={null} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar userRole="hospital" userName={form.org_name} />

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-8 w-full">
        <button onClick={() => router.push('/hospital/dashboard')}
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-opacity hover:opacity-70"
          style={{ color: 'var(--tang-mid)' }}>
          ← Dashboard
        </button>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Organization Profile</h1>
          <p className="text-gray-500 mt-1">Keep your information up to date</p>
        </div>

        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 flex items-center gap-2">
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
