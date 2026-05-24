import Link from 'next/link'
import { ArrowRight, Building2, CheckCircle, Stethoscope } from 'lucide-react'
import { Logo } from '@/components/layout/Navbar'

const choices = [
  {
    href: '/auth/register/nurse',
    icon: Stethoscope,
    title: 'Nurse workspace',
    body: 'Join free, apply directly, track credentials, and compare offer terms before signing.',
    cta: 'Join as a nurse',
    tone: 'plum',
    items: ['Free to join and apply', 'Direct access to hospitals', 'Credential wallet', 'Pay-package ledger'],
  },
  {
    href: '/auth/register/hospital',
    icon: Building2,
    title: 'Hospital workspace',
    body: 'Post roles, review verified clinicians, and manage placements without agency markup.',
    cta: 'Start hiring',
    tone: 'tang',
    items: ['Verified nurse profiles', 'Background-check workflow', 'Escrow payment support', 'Applicant tracking'],
  },
] as const

export default function RegisterChoicePage() {
  return (
    <div className="surface-grid flex min-h-screen flex-col items-center justify-center bg-[var(--cream)] px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-6 text-[34px] font-bold leading-tight text-[var(--ink)] md:text-[44px]">
            Choose your NurseSquare workspace
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--g600)]">
            Nurses and hospitals use different tools, but both work from the same verified hiring and contract evidence layer.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {choices.map(choice => {
            const isNurse = choice.tone === 'plum'
            return (
              <Link key={choice.href} href={choice.href} className="group rounded-lg border border-[var(--g100)] bg-[var(--surface-raised)] p-6 no-underline shadow-[var(--shadow-sm)] transition hover:-translate-y-px hover:shadow-[var(--shadow-md)]">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg" style={{ background: isNurse ? 'var(--plum-50)' : 'var(--tang-50)', color: isNurse ? 'var(--plum)' : 'var(--tang-mid)' }}>
                  <choice.icon className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-[var(--ink)]">{choice.title}</h2>
                <p className="mt-3 min-h-[78px] text-sm leading-7 text-[var(--g600)]">{choice.body}</p>
                <div className="mt-5 space-y-2.5">
                  {choice.items.map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm text-[var(--g600)]">
                      <CheckCircle className="h-4 w-4 shrink-0 text-[var(--sage)]" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: isNurse ? 'var(--plum)' : 'var(--tang-mid)' }}>
                  {choice.cta}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            )
          })}
        </div>

        <p className="mt-8 text-center text-sm text-[var(--g600)]">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-[var(--plum)] no-underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
