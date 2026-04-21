'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Mail, MessageSquare, Building2, Stethoscope } from 'lucide-react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', role: 'nurse', message: '' })
  const [sent, setSent] = useState(false)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar />

      <section className="max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-12 pt-20 pb-24">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-20 items-start">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.8px] uppercase mb-7"
              style={{ background: 'var(--plum-50)', color: 'var(--plum)' }}>
              Get in touch
            </div>
            <h1 className="font-display text-[48px] leading-tight mb-5" style={{ color: 'var(--ink)' }}>
              We&apos;d love to<br />
              <em className="italic" style={{ color: 'var(--plum)' }}>hear from you.</em>
            </h1>
            <p className="text-[16px] leading-[1.78] mb-10" style={{ color: 'var(--g600)' }}>
              Whether you&apos;re a nurse with questions or a hospital ready to post your first job — our team responds within one business day.
            </p>

            <div className="space-y-6">
              {[
                { icon: Mail, title: 'General inquiries', value: 'hello@nursesquare.com' },
                { icon: Stethoscope, title: 'Nurse support', value: 'nurses@nursesquare.com' },
                { icon: Building2, title: 'Hospital partnerships', value: 'hospitals@nursesquare.com' },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0"
                    style={{ background: 'var(--plum-50)' }}>
                    <item.icon className="w-5 h-5" style={{ color: 'var(--plum)' }} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--ink)' }}>{item.title}</div>
                    <a href={`mailto:${item.value}`} className="text-sm no-underline" style={{ color: 'var(--plum)' }}>
                      {item.value}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border p-8" style={{ background: 'white', borderColor: 'var(--g100)' }}>
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                  style={{ background: 'var(--sage-50)' }}>
                  <MessageSquare className="w-8 h-8" style={{ color: 'var(--sage)' }} />
                </div>
                <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--ink)' }}>Message sent!</h2>
                <p className="text-sm" style={{ color: 'var(--g600)' }}>
                  We&apos;ll get back to you within one business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="font-display text-2xl mb-1" style={{ color: 'var(--ink)' }}>Send a message</h2>
                <p className="text-sm mb-5" style={{ color: 'var(--g600)' }}>We read every message.</p>

                {/* Role toggle */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--g800)' }}>I am a…</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'nurse', label: 'Nurse' },
                      { value: 'hospital', label: 'Hospital / Facility' },
                      { value: 'other', label: 'Other' },
                    ].map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => update('role', opt.value)}
                        className="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
                        style={{
                          background: form.role === opt.value ? 'var(--plum)' : 'white',
                          color: form.role === opt.value ? 'white' : 'var(--g600)',
                          borderColor: form.role === opt.value ? 'var(--plum)' : 'var(--g200)',
                        }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Your name"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  required
                  placeholder="Jane Smith"
                />
                <Input
                  label="Email address"
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  required
                  placeholder="you@example.com"
                />

                <div className="space-y-1">
                  <label className="block text-sm font-medium" style={{ color: 'var(--g800)' }}>Message</label>
                  <textarea
                    value={form.message}
                    onChange={e => update('message', e.target.value)}
                    required
                    rows={5}
                    placeholder="Tell us how we can help..."
                    className="block w-full rounded-xl border px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--g200)', color: 'var(--ink)' }}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Send message
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
