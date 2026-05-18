export const dynamic = 'force-dynamic'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { ArrowRight, Heart, FileText, BarChart3 } from 'lucide-react'
import HeroPhoto from '@/components/marketing/HeroPhoto'
import HowItWorks from '@/components/marketing/HowItWorks'
import ModuleGrid from '@/components/marketing/ModuleGrid'
import ExampleDiff from '@/components/marketing/ExampleDiff'
import { ROLE_PHOTOS } from '@/lib/marketing/people'

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

  const tickerItems = [
    'ICU · Austin', 'ER · Miami', 'OR · Atlanta', 'NICU · Nashville',
    'Telemetry · Denver', 'L&D · Charlotte', 'PACU · Phoenix', 'ICU · Columbus',
    'ICU · Austin', 'ER · Miami', 'OR · Atlanta', 'NICU · Nashville',
    'Telemetry · Denver', 'L&D · Charlotte', 'PACU · Phoenix', 'ICU · Columbus',
  ]

  return (
    <div className="flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--cream)' }}>
      <Navbar userRole={userRole as 'nurse' | 'hospital' | 'admin' | null} userName={userName} />

      {/* ── Hero ── */}
      <section className="relative max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-12 pt-20 pb-20 md:pt-28 md:pb-28">
        {/* organic background accents */}
        <div
          aria-hidden
          className="absolute -top-32 -left-20 w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--plum-50), transparent 65%)' }}
        />
        <div
          aria-hidden
          className="absolute top-40 right-0 w-[400px] h-[400px] rounded-full opacity-40 pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--sage-50), transparent 65%)' }}
        />

        <div className="relative grid lg:grid-cols-[55%_45%] gap-16 items-center">
          <div>
            <div
              className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.8px] uppercase mb-8"
              style={{ background: 'var(--plum)', color: 'var(--plum-100)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--tang)', animation: 'pulse 2s infinite' }} />
              Live in 10 states · 2,400+ verified nurses
            </div>

            <h1
              className="animate-fade-up delay-100 font-display text-[58px] md:text-[76px] leading-[1.00] tracking-[-0.6px] mb-7"
              style={{ color: 'var(--ink)' }}
            >
              The contract<br />
              <em className="italic" style={{ color: 'var(--tang)' }}>didn&apos;t match</em><br />
              the offer.
            </h1>

            <p className="animate-fade-up delay-200 text-[17px] leading-[1.82] mb-10 max-w-[480px]" style={{ color: 'var(--g600)' }}>
              NurseSquare reads every quote and signed contract you receive, flags the bait-and-switch before you e-sign, tracks every credential renewal, and watches your tax-home exposure. Built by clinicians.
            </p>

            <div className="animate-fade-up delay-300 flex flex-wrap gap-3 mb-12">
              <Link
                href="/auth/register/nurse"
                className="inline-flex items-center gap-2 font-bold text-[15px] px-7 py-3.5 rounded-[14px] text-white transition-all hover:-translate-y-px no-underline"
                style={{ background: 'var(--plum)', boxShadow: '0 8px 24px rgba(45,27,105,0.28)' }}
              >
                Join as a nurse
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/register/hospital"
                className="inline-flex items-center gap-2 font-bold text-[15px] px-7 py-3.5 rounded-[14px] transition-all hover:-translate-y-px no-underline border-2"
                style={{ borderColor: 'var(--ink)', color: 'var(--ink)' }}
              >
                I&apos;m hiring
              </Link>
            </div>

            <div className="animate-fade-up delay-400 flex flex-wrap gap-0 divide-x" style={{ borderColor: 'var(--cream-deep)' }}>
              {[
                { n: '2,400+', l: 'Verified nurses' },
                { n: '48hr', l: 'Escrow release' },
                { n: '$0', l: 'Cost to join' },
                { n: '10', l: 'States live' },
              ].map((p) => (
                <div key={p.l} className="px-6 first:pl-0">
                  <div className="font-display text-[30px] leading-none" style={{ color: 'var(--ink)' }}>{p.n}</div>
                  <div className="text-[11px] mt-1" style={{ color: 'var(--g600)' }}>{p.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <HeroPhoto />
          </div>
        </div>
      </section>

      {/* ── Example diff: the product, not a promise ── */}
      <section className="relative pb-24" style={{ background: 'var(--cream)' }}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-[11px] font-bold tracking-[0.8px] uppercase mb-4" style={{ color: 'var(--g400)' }}>
              Live from the product
            </p>
            <h2 className="font-display text-[42px] md:text-[52px] leading-[1.05] tracking-[-0.5px]" style={{ color: 'var(--ink)' }}>
              This is what NurseSquare{' '}
              <em className="italic" style={{ color: 'var(--tang)' }}>actually outputs.</em>
            </h2>
            <p className="text-[15px] mt-5 leading-relaxed" style={{ color: 'var(--g600)' }}>
              Not a screenshot of an aspirational mockup. A stylized render of the page you land on after uploading your offer PDF and your signed contract.
            </p>
          </div>
          <ExampleDiff />
        </div>
      </section>

      {/* ── Role photo strip ── */}
      <section className="py-12 relative overflow-hidden" style={{ background: 'var(--cream-mid)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-3 gap-3 md:gap-5">
            {ROLE_PHOTOS.map((p) => (
              <div key={p.url} className="relative rounded-[24px] overflow-hidden aspect-[4/5] group">
                <Image
                  src={p.url}
                  alt={p.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(28,16,68,0) 50%, rgba(28,16,68,0.75) 100%)' }} />
                {p.caption && (
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="text-[10px] font-bold tracking-[1.2px] uppercase opacity-80">Specialty</div>
                    <div className="font-display text-lg leading-tight mt-0.5">{p.caption}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <HowItWorks />

      {/* ── The three modules ── */}
      <ModuleGrid />

      {/* ── Why NurseSquare ── */}
      <section className="py-24" style={{ background: 'var(--cream)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: Heart,
                title: 'Nurses first',
                desc: 'Free to join. Free to apply. Zero hidden fees. The rate you see is exactly what you earn.',
                color: 'var(--plum)',
                bg: 'var(--plum-50)',
              },
              {
                icon: FileText,
                title: 'Structured, not vibes',
                desc: 'Every offer turns into a typed record. Currency in cents. Dates UTC. Diffs computed deterministically.',
                color: 'var(--tang)',
                bg: 'var(--tang-50)',
              },
              {
                icon: BarChart3,
                title: 'Receipts for negotiation',
                desc: 'Anonymized share links you can send to a recruiter mid-negotiation. They see the diff. They back off.',
                color: 'var(--sage)',
                bg: 'var(--sage-50)',
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-3xl p-7 transition-all hover:-translate-y-1"
                style={{ background: 'white', boxShadow: '0 4px 16px rgba(28,16,68,0.04)' }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: c.bg, color: c.color }}
                >
                  <c.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-[22px] mb-3" style={{ color: 'var(--ink)' }}>{c.title}</h3>
                <p className="text-[14px] leading-[1.7]" style={{ color: 'var(--g600)' }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative py-24 overflow-hidden" style={{ background: 'var(--plum-deep)' }}>
        <div
          aria-hidden
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--tang), transparent 65%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--plum-light), transparent 65%)' }}
        />

        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-[42px] md:text-[58px] leading-[1.05] tracking-[-0.5px] mb-6 text-white">
            Stop signing<br />
            <em className="italic" style={{ color: 'var(--tang)' }}>blind.</em>
          </h2>
          <p className="text-[17px] mb-10 leading-relaxed" style={{ color: 'var(--plum-100)' }}>
            Built for travel nurses. Free to use. No agency in the middle.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/register/nurse"
              className="inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-[14px] text-white transition-all hover:-translate-y-px no-underline"
              style={{ background: 'var(--tang)', boxShadow: '0 8px 24px rgba(255,121,64,0.32)' }}
            >
              Join as a nurse
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/register/hospital"
              className="inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-[14px] transition-all hover:-translate-y-px no-underline border-2"
              style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
            >
              Post jobs as a hospital
            </Link>
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="py-3 overflow-hidden" style={{ background: 'var(--plum)' }}>
        <div className="flex gap-[60px] whitespace-nowrap" style={{ width: 'max-content', animation: 'scroll 32s linear infinite' }}>
          {tickerItems.map((item, i) => (
            <span key={i} className="flex items-center gap-2 text-[13px] font-medium" style={{ color: 'var(--plum-100)' }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--tang)' }} />
              {item}
            </span>
          ))}
        </div>
        <style>{`@keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      </div>

      <Footer />
    </div>
  )
}
