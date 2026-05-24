import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { ArrowRight, Clock, FileSearch, ShieldCheck, Stethoscope, Users } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const principles = [
  {
    icon: Stethoscope,
    title: 'Nurses keep leverage',
    desc: 'Contract terms, credential status, and rate history stay visible to the clinician who owns the work.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust is operational',
    desc: 'Licenses, background checks, and credential renewals belong in workflow, not scattered across inboxes.',
  },
  {
    icon: FileSearch,
    title: 'Evidence beats negotiation theatre',
    desc: 'Every quote and signed contract can become a structured record with clear variance flags.',
  },
]

const stats = [
  { icon: Users, n: '2,400+', l: 'Verified nurses' },
  { icon: ShieldCheck, n: '15%', l: 'Hospital fee' },
  { icon: Clock, n: '48hr', l: 'Escrow release' },
]

export default async function AboutPage() {
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
          <div className="container-shell grid gap-10 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:py-18">
            <div>
              <div className="mb-5 inline-flex rounded-md bg-[var(--plum-50)] px-2.5 py-1 text-xs font-bold uppercase text-[var(--plum)]">
                Our story
              </div>
              <h1 className="max-w-3xl text-[40px] font-bold leading-[1.06] text-[var(--ink)] md:text-[58px]">
                We built NurseSquare for the work after the job post.
              </h1>
            </div>
            <div className="rounded-lg border border-[var(--g100)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
              <p className="text-[16px] leading-8 text-[var(--g600)]">
                Direct hiring is only useful when the operational details are clear. NurseSquare combines job access, contract evidence, credential tracking, and escrow workflows so nurses and hospitals can work without the agency layer.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--g100)] bg-[var(--surface)]">
          <div className="container-shell grid gap-5 py-12 md:grid-cols-3">
            {principles.map(item => (
              <article key={item.title} className="rounded-lg border border-[var(--g100)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-sm)]">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--plum-50)] text-[var(--plum)]">
                  <item.icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-[var(--ink)]">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--g600)]">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[var(--cream)] py-14">
          <div className="container-shell grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase text-[var(--tang-mid)]">Why it matters</p>
              <h2 className="mt-2 text-[32px] font-bold leading-tight text-[var(--ink)] md:text-[42px]">
                The old staffing model hides too much at the moment decisions get expensive.
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--g600)]">
                <p>
                  Travel nurses often compare recruiter promises, partial PDFs, contract changes, credential deadlines, and assignment-location rules by hand. Hospitals carry a different version of the same problem: unclear candidate readiness and avoidable placement drag.
                </p>
                <p>
                  NurseSquare moves those details into a structured workspace. The result is less ambiguity, faster direct placement, and better proof when a contract no longer matches the offer.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--g100)] bg-[var(--plum-deep)] p-6 text-white shadow-[var(--shadow-md)]">
              <p className="text-xs font-bold uppercase text-[var(--plum-100)]">Operating principle</p>
              <p className="mt-4 text-2xl font-bold leading-snug">
                If a rate, credential, date, or tax-home assumption can change the decision, it should be visible before anyone signs.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--g100)] bg-[var(--surface)]">
          <div className="container-shell grid gap-4 py-10 md:grid-cols-3">
            {stats.map(stat => (
              <div key={stat.l} className="rounded-lg border border-[var(--g100)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-sm)]">
                <stat.icon className="h-5 w-5 text-[var(--plum)]" />
                <div className="mt-4 text-3xl font-bold text-[var(--ink)]">{stat.n}</div>
                <div className="mt-1 text-sm text-[var(--g600)]">{stat.l}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[var(--cream)] py-14">
          <div className="container-shell flex flex-col items-start justify-between gap-6 rounded-lg border border-[var(--g100)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-[var(--ink)]">Use NurseSquare on the next contract.</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--g600)]">
                Start as a nurse or open a hiring workspace for your facility.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/register/nurse" className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--plum)] px-5 py-3 text-sm font-semibold text-white no-underline">
                Join as a nurse <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/auth/register/hospital" className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--g200)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--g800)] no-underline">
                Hire nurses
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
