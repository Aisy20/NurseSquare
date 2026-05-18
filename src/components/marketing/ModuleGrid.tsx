import Link from 'next/link'
import { Wallet, ShieldCheck, MapPin, ArrowRight } from 'lucide-react'

const MODULES = [
  {
    icon: Wallet,
    eyebrow: 'Module 01',
    title: 'Pay-Package Ledger',
    body: 'Structured extraction of every quote and signed contract. Per-field diff flags worse / better / shifted. Anonymized share links for negotiation leverage.',
    color: 'var(--plum)',
    bg: 'var(--plum-50)',
    href: '/auth/register/nurse',
    cta: 'Try the diff',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'Module 02',
    title: 'Credentialing Wallet',
    body: 'BLS, ACLS, RN license, vaccines, fit tests, drug screens. Upload once, we extract the expiration and email you 30 / 14 / 7 days out. Cross-references every contract.',
    color: 'var(--tang)',
    bg: 'var(--tang-50)',
    href: '/auth/register/nurse',
    cta: 'See the wallet',
  },
  {
    icon: MapPin,
    eyebrow: 'Module 03',
    title: 'Tax-Home Tracker',
    body: 'Track days at each location vs days at your tax home. Flag the 12-month-in-one-metro risk before the IRS does. Folk-wisdom heuristics, plain-English flags.',
    color: 'var(--sage)',
    bg: 'var(--sage-50)',
    href: '/auth/register/nurse',
    cta: 'Check exposure',
  },
] as const

export default function ModuleGrid() {
  return (
    <section className="py-24" style={{ background: 'var(--cream-mid)' }}>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-12">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold tracking-[0.8px] uppercase mb-4" style={{ color: 'var(--g400)' }}>
              What you get
            </p>
            <h2 className="font-display text-[42px] md:text-[50px] leading-[1.05] tracking-[-0.5px]" style={{ color: 'var(--ink)' }}>
              Three modules,{' '}
              <em className="italic" style={{ color: 'var(--tang)' }}>one place.</em>
            </h2>
          </div>
          <p className="text-[15px] max-w-sm leading-relaxed" style={{ color: 'var(--g600)' }}>
            Built for travel nurses by clinicians who got tired of bait-and-switch contracts and missed cert renewals.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {MODULES.map((m) => (
            <article
              key={m.title}
              className="rounded-3xl p-7 relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col"
              style={{ background: 'white', minHeight: '320px' }}
            >
              <div
                aria-hidden
                className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full opacity-50"
                style={{ background: m.bg }}
              />
              <div className="relative z-10 flex flex-col h-full">
                <div className="text-[10px] font-bold tracking-[1.2px] uppercase mb-5" style={{ color: m.color }}>
                  {m.eyebrow}
                </div>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: m.bg, color: m.color }}
                >
                  <m.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-[24px] mb-3 leading-tight" style={{ color: 'var(--ink)' }}>
                  {m.title}
                </h3>
                <p className="text-[14px] leading-[1.7] flex-1 mb-5" style={{ color: 'var(--g600)' }}>
                  {m.body}
                </p>
                <Link
                  href={m.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold no-underline"
                  style={{ color: m.color }}
                >
                  {m.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
