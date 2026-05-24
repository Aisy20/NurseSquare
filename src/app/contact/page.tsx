'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Building2, Mail, MessageSquare, Stethoscope } from 'lucide-react'

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
    <div className="flex min-h-screen flex-col bg-[var(--cream)]">
      <Navbar />

      <main className="flex-1">
        <section className="surface-grid border-b border-[var(--g100)]">
          <div className="container-shell grid gap-10 py-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <div className="mb-5 inline-flex rounded-md bg-[var(--plum-50)] px-2.5 py-1 text-xs font-bold uppercase text-[var(--plum)]">
                Contact
              </div>
              <h1 className="max-w-xl text-[40px] font-bold leading-[1.06] text-[var(--ink)] md:text-[56px]">
                Talk to the team building the workspace.
              </h1>
              <p className="mt-5 max-w-xl text-[16px] leading-8 text-[var(--g600)]">
                Questions about nurse onboarding, hospital hiring, credentials, or contract review usually get a response within one business day.
              </p>

              <div className="mt-9 grid gap-4">
                {[
                  { icon: Mail, title: 'General inquiries', value: 'hello@nursesquare.com' },
                  { icon: Stethoscope, title: 'Nurse support', value: 'nurses@nursesquare.com' },
                  { icon: Building2, title: 'Hospital partnerships', value: 'hospitals@nursesquare.com' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-4 rounded-lg border border-[var(--g100)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--plum-50)] text-[var(--plum)]">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--ink)]">{item.title}</div>
                      <a href={`mailto:${item.value}`} className="text-sm text-[var(--plum)] no-underline">
                        {item.value}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--g100)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-md)]">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--sage-50)] text-[var(--sage)]">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--ink)]">Message sent</h2>
                  <p className="mt-2 text-sm text-[var(--g600)]">
                    We&apos;ll get back to you within one business day.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--ink)]">Send a message</h2>
                    <p className="mt-1 text-sm text-[var(--g600)]">We read every message.</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--g800)]">I am a...</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'nurse', label: 'Nurse' },
                        { value: 'hospital', label: 'Facility' },
                        { value: 'other', label: 'Other' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => update('role', opt.value)}
                          className="focus-ring rounded-lg border px-3 py-2 text-sm font-medium transition-all"
                          style={{
                            background: form.role === opt.value ? 'var(--plum)' : 'var(--surface)',
                            color: form.role === opt.value ? 'white' : 'var(--g600)',
                            borderColor: form.role === opt.value ? 'var(--plum)' : 'var(--g200)',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input label="Your name" value={form.name} onChange={e => update('name', e.target.value)} required placeholder="Jane Smith" />
                  <Input label="Email address" type="email" value={form.email} onChange={e => update('email', e.target.value)} required placeholder="you@example.com" />

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-[var(--g800)]">Message</label>
                    <textarea
                      value={form.message}
                      onChange={e => update('message', e.target.value)}
                      required
                      rows={5}
                      placeholder="Tell us how we can help..."
                      className="focus-ring block w-full resize-y rounded-lg border border-[var(--g200)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--ink)] shadow-[var(--shadow-sm)] placeholder:text-[var(--g400)]"
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
      </main>

      <Footer />
    </div>
  )
}
