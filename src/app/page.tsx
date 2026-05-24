export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileSearch,
  MapPin,
  ShieldCheck,
  WalletCards,
} from 'lucide-react'
import ExampleDiff from '@/components/marketing/ExampleDiff'
import { HERO_PHOTO, ROLE_PHOTOS } from '@/lib/marketing/people'

const metrics = [
  { label: 'Verified nurses', value: '2,400+' },
  { label: 'States live', value: '10' },
  { label: 'Escrow release', value: '48hr' },
  { label: 'Nurse fee', value: '$0' },
]

const workflow = [
  {
    icon: FileSearch,
    title: 'Compare every offer',
    body: 'Upload quote PDFs, recruiter emails, and signed contracts. NurseSquare extracts the terms and flags material changes before signature.',
  },
  {
    icon: ShieldCheck,
    title: 'Keep credentials current',
    body: 'Track RN licenses, BLS, ACLS, vaccines, fit tests, and renewal reminders from one wallet.',
  },
  {
    icon: MapPin,
    title: 'Watch tax-home risk',
    body: 'See assignment days by metro, home visits, and plain-English exposure flags before one contract becomes a tax problem.',
  },
]

const rolePanels = [
  {
    icon: WalletCards,
    title: 'Nurse workspace',
    body: 'Browse jobs, apply directly, manage pay-package evidence, and keep credential renewals out of spreadsheets.',
    href: '/auth/register/nurse',
    cta: 'Join as a nurse',
  },
  {
    icon: Building2,
    title: 'Hospital workspace',
    body: 'Post roles, review verified candidates, track applicants, and manage placement activity without agency markup.',
    href: '/auth/register/hospital',
    cta: 'Hire nurses',
  },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole = null
  let userName = null

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role
    userName = user.email?.split('@')[0]
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[var(--cream)]">
      <Navbar userRole={userRole as 'nurse' | 'hospital' | 'admin' | null} userName={userName} />

      <main className="flex-1">
        <section className="surface-grid border-b border-[var(--g100)] bg-[var(--cream)]">
          <div className="container-shell grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:py-16">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-[var(--g100)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--g600)] shadow-[var(--shadow-sm)]">
                <span className="h-2 w-2 rounded-full bg-[var(--sage)]" />
                Direct hiring, pay-package review, and credential tracking
              </div>

              <h1 className="max-w-4xl text-[42px] font-bold leading-[1.04] text-[var(--ink)] md:text-[64px]">
                Travel nurse work, organized before the signature.
              </h1>

              <p className="mt-5 max-w-2xl text-[17px] leading-8 text-[var(--g600)]">
                NurseSquare gives nurses and hospitals one operational workspace for direct hiring, contract evidence, credential status, and assignment risk.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/register/nurse"
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--plum)] px-5 py-3 text-sm font-semibold text-white no-underline shadow-[0_8px_18px_rgba(45,27,105,0.18)] transition hover:-translate-y-px hover:bg-[var(--plum-mid)]"
                >
                  Join as a nurse
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/nurse/jobs"
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--g200)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--g800)] no-underline transition hover:border-[var(--plum)] hover:text-[var(--plum)]"
                >
                  Browse jobs
                  <BriefcaseBusiness className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {metrics.map(metric => (
                  <div key={metric.label} className="rounded-lg border border-[var(--g100)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
                    <div className="text-2xl font-bold leading-none text-[var(--ink)]">{metric.value}</div>
                    <div className="mt-2 text-xs font-medium text-[var(--g600)]">{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[520px] overflow-hidden rounded-lg border border-[var(--g100)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
              <Image
                src={HERO_PHOTO.url}
                alt={HERO_PHOTO.alt}
                fill
                priority
                sizes="(min-width: 1024px) 440px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,16,24,0)_30%,rgba(17,16,24,0.78)_100%)]" />
              <div className="absolute left-5 right-5 top-5 rounded-lg border border-white/20 bg-white/[0.92] p-4 shadow-[var(--shadow-md)] backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-[var(--g600)]">ICU Phoenix offer</p>
                    <p className="mt-1 text-2xl font-bold text-[var(--ink)]">$2,716/wk</p>
                  </div>
                  <span className="rounded-md bg-[var(--sage-50)] px-2.5 py-1 text-xs font-bold text-[var(--sage)]">Verified</span>
                </div>
              </div>
              <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/20 bg-[rgba(17,16,24,0.92)] p-4 text-white shadow-[var(--shadow-md)] backdrop-blur">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase text-[var(--tang-100)]">
                  <CheckCircle2 className="h-4 w-4" />
                  Signed contract check
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-white/55">Housing</p>
                    <p className="font-semibold text-[var(--tang-100)]">-$400/wk</p>
                  </div>
                  <div>
                    <p className="text-white/55">Bonus</p>
                    <p className="font-semibold text-[var(--tang-100)]">-$500</p>
                  </div>
                  <div>
                    <p className="text-white/55">Notice</p>
                    <p className="font-semibold text-[var(--tang-100)]">48h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--g100)] bg-[var(--surface)]">
          <div className="container-shell grid gap-6 py-12 md:grid-cols-3">
            {workflow.map(item => (
              <article key={item.title} className="rounded-lg border border-[var(--g100)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-sm)]">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--plum-50)] text-[var(--plum)]">
                  <item.icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-[var(--ink)]">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--g600)]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[var(--cream)] py-14 lg:py-18">
          <div className="container-shell">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase text-[var(--tang-mid)]">Product output</p>
                <h2 className="mt-2 max-w-2xl text-[32px] font-bold leading-tight text-[var(--ink)] md:text-[42px]">
                  Contract variance is visible before the decision point.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-[var(--g600)]">
                The ledger turns unstructured recruiter documents into terms nurses and hospitals can compare line by line.
              </p>
            </div>
            <ExampleDiff />
          </div>
        </section>

        <section className="border-y border-[var(--g100)] bg-[var(--surface)]">
          <div className="container-shell grid gap-6 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase text-[var(--tang-mid)]">Built for both sides</p>
              <h2 className="mt-2 text-[32px] font-bold leading-tight text-[var(--ink)] md:text-[42px]">
                Separate workspaces, shared evidence.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--g600)]">
                Nurses keep ownership of credentials and contract history. Hospitals get cleaner applications and faster direct placement.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {rolePanels.map(panel => (
                <Link
                  key={panel.title}
                  href={panel.href}
                  className="group rounded-lg border border-[var(--g100)] bg-[var(--surface-raised)] p-6 no-underline shadow-[var(--shadow-sm)] transition hover:-translate-y-px hover:shadow-[var(--shadow-md)]"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--teal-50)] text-[var(--teal)]">
                    <panel.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--ink)]">{panel.title}</h3>
                  <p className="mt-3 min-h-[84px] text-sm leading-7 text-[var(--g600)]">{panel.body}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--plum)]">
                    {panel.cta}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--cream)] py-12">
          <div className="container-shell">
            <div className="grid gap-3 sm:grid-cols-3 md:gap-5">
              {ROLE_PHOTOS.map((p) => (
                <div key={p.url} className="relative aspect-[4/5] overflow-hidden rounded-lg border border-[var(--g100)] bg-[var(--surface)]">
                  <Image
                    src={p.url}
                    alt={p.alt}
                    fill
                    loading="eager"
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,16,24,0)_52%,rgba(17,16,24,0.70)_100%)]" />
                  {p.caption && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="text-xs font-semibold text-white">{p.caption}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--plum-deep)] py-14">
          <div className="container-shell flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-[30px] font-bold leading-tight text-white md:text-[40px]">
                Start with the next contract.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--plum-100)]">
                Create a free nurse account, browse live roles, and keep the offer-to-signature trail in one place.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/register/nurse"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--tang)] px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-[var(--tang-mid)]"
              >
                Join as a nurse
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/register/hospital"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-white/10"
              >
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
