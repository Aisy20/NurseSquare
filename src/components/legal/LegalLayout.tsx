import { ReactNode } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'

export interface LegalSection {
  heading: string
  body: ReactNode
}

/**
 * Shared chrome for static legal pages (Privacy, Terms, HIPAA). Renders the
 * role-aware navbar, a titled hero, numbered sections, and the footer.
 */
export default async function LegalLayout({
  eyebrow,
  title,
  intro,
  lastUpdated,
  sections,
}: {
  eyebrow: string
  title: string
  intro: string
  lastUpdated: string
  sections: LegalSection[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole = null
  let userName = null
  if (user) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    userRole = profile?.role
    userName = user.email?.split('@')[0]
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--cream)]">
      <Navbar userRole={userRole as 'nurse' | 'hospital' | 'admin' | null} userName={userName} />

      <main className="flex-1">
        <section className="surface-grid border-b border-[var(--g100)]">
          <div className="container-shell py-14 lg:py-18">
            <div className="mb-5 inline-flex rounded-md bg-[var(--plum-50)] px-2.5 py-1 text-xs font-bold uppercase text-[var(--plum)]">
              {eyebrow}
            </div>
            <h1 className="max-w-3xl text-[40px] font-bold leading-[1.06] text-[var(--ink)] md:text-[52px]">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-8 text-[var(--g600)]">{intro}</p>
            <p className="mt-4 text-sm text-[var(--g400)]">Last updated: {lastUpdated}</p>
          </div>
        </section>

        <section className="container-shell py-12 lg:py-16">
          <div className="mx-auto max-w-3xl space-y-10">
            {sections.map((section, i) => (
              <div key={section.heading}>
                <h2 className="text-xl font-bold text-[var(--ink)]">
                  <span className="mr-2 text-[var(--g400)]">{i + 1}.</span>
                  {section.heading}
                </h2>
                <div className="mt-3 space-y-3 text-[15px] leading-8 text-[var(--g600)]">
                  {section.body}
                </div>
              </div>
            ))}

            <div className="rounded-lg border border-[var(--g100)] bg-[var(--surface)] p-5 text-sm leading-7 text-[var(--g600)]">
              This document is provided for general information and does not constitute legal
              advice. Questions? Email{' '}
              <a href="mailto:hello@nursesquare.com" className="font-semibold no-underline text-[var(--plum)]">
                hello@nursesquare.com
              </a>
              .
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
