export const dynamic = 'force-dynamic'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { ArrowRight, Shield, Heart, Zap } from 'lucide-react'
import HeroPhoto from '@/components/marketing/HeroPhoto'
import TestimonialCard from '@/components/marketing/TestimonialCard'
import { TESTIMONIALS, FEATURE_PHOTOS } from '@/lib/marketing/people'

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
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole={userRole as 'nurse' | 'hospital' | 'admin' | null} userName={userName} />

      {/* ── Hero ── */}
      <section className="max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-12 pt-20 pb-14 md:pt-28 md:pb-24">
        <div className="grid lg:grid-cols-[55%_45%] gap-14 items-center">
          <div>
            <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.8px] uppercase mb-8"
              style={{ background: 'var(--plum)', color: 'var(--plum-100)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--tang)', animation: 'pulse 2s infinite' }} />
              Live in 10 states · 2,400+ nurses
            </div>

            <h1 className="animate-fade-up delay-100 font-display text-[58px] md:text-[72px] leading-[1.02] tracking-[-0.5px] mb-7"
              style={{ color: 'var(--ink)' }}>
              Direct nurse hiring,<br />
              <span style={{ color: 'var(--tang)' }}>no middleman.</span>
            </h1>

            <p className="animate-fade-up delay-200 text-[17px] leading-[1.82] mb-10 max-w-[480px]" style={{ color: 'var(--g600)' }}>
              NurseSquare connects verified travel nurses directly with hospitals, then catches the bait-and-switch in your offers before you sign. License-verified. Escrow-protected. Built by clinicians.
            </p>

            <div className="animate-fade-up delay-300 flex flex-wrap gap-3 mb-12">
              <Link href="/auth/register/nurse"
                className="inline-flex items-center gap-2 font-bold text-[15px] px-7 py-3.5 rounded-[14px] text-white transition-all hover:-translate-y-px no-underline"
                style={{ background: 'var(--plum)', boxShadow: '0 8px 24px rgba(45,27,105,0.28)' }}>
                Join as a nurse
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/auth/register/hospital"
                className="inline-flex items-center gap-2 font-bold text-[15px] px-7 py-3.5 rounded-[14px] text-white transition-all hover:-translate-y-px no-underline"
                style={{ background: 'var(--tang)', boxShadow: '0 8px 24px rgba(255,121,64,0.32)' }}>
                I&apos;m hiring
              </Link>
            </div>

            <div className="animate-fade-up delay-400 flex flex-wrap gap-0 divide-x" style={{ borderColor: 'var(--cream-deep)' }}>
              {[
                { n: '2,400+', l: 'Verified nurses' },
                { n: '48hr', l: 'Escrow release' },
                { n: '$0', l: 'Cost to join' },
                { n: '10', l: 'States live' },
              ].map(p => (
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

      {/* ── Why NurseSquare ── */}
      <section className="py-24" style={{ background: 'var(--cream)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold tracking-[0.8px] uppercase mb-4" style={{ color: 'var(--g400)' }}>
              Why NurseSquare
            </p>
            <h2 className="font-display text-[42px] md:text-[50px] leading-tight mb-5" style={{ color: 'var(--ink)' }}>
              Built different.<br />For everyone.
            </h2>
            <p className="text-[17px] max-w-md mx-auto leading-relaxed" style={{ color: 'var(--g600)' }}>
              No middleman. Just nurses, hospitals, and the tools to work together.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Heart,
                title: 'Nurses first',
                desc: 'Free to join. Free to apply. Zero hidden fees. The rate you see is exactly what you earn, no agency skimming off the top.',
                bg: 'var(--plum-50)',
                iconColor: 'var(--plum)',
                border: 'var(--plum-100)',
                cta: { label: 'Join as a nurse', href: '/auth/register/nurse' },
              },
              {
                icon: Shield,
                title: 'Verified & trusted',
                desc: 'Every nurse is Nursys license-verified and Checkr background-cleared before they can apply. Hospitals know exactly who they’re hiring.',
                bg: 'var(--sage-50)',
                iconColor: 'var(--sage)',
                border: 'rgba(58,168,118,0.2)',
                cta: { label: 'See how it works', href: '/about' },
              },
              {
                icon: Zap,
                title: 'Hire direct',
                desc: 'No recruiter gatekeeper. Post a role, review vetted applicants, and hire directly. A transparent marketplace with no markup.',
                bg: 'var(--tang-50)',
                iconColor: 'var(--tang)',
                border: 'var(--tang-100)',
                cta: { label: 'Start hiring', href: '/auth/register/hospital' },
              },
            ].map(card => (
              <div key={card.title}
                className="rounded-2xl border p-8 flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{ background: 'white', borderColor: card.border }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: card.bg }}>
                  <card.icon className="w-6 h-6" style={{ color: card.iconColor }} />
                </div>
                <h3 className="font-display text-[22px] mb-3" style={{ color: 'var(--ink)' }}>{card.title}</h3>
                <p className="text-[14px] leading-[1.75] flex-1 mb-6" style={{ color: 'var(--g600)' }}>{card.desc}</p>
                <Link href={card.cta.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold no-underline transition-colors"
                  style={{ color: card.iconColor }}>
                  {card.cta.label} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust trio: photo strip ── */}
      <section className="py-12" style={{ background: 'var(--cream-mid)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {FEATURE_PHOTOS.map((p, i) => (
              <div key={p.url} className="relative rounded-2xl overflow-hidden aspect-[4/5]" style={{ animationDelay: `${i * 100}ms` }}>
                <Image
                  src={p.url}
                  alt={p.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(28,16,68,0) 60%, rgba(28,16,68,0.6) 100%)' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24" style={{ background: 'var(--cream)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold tracking-[0.8px] uppercase mb-4" style={{ color: 'var(--g400)' }}>
              Trusted by travel nurses
            </p>
            <h2 className="font-display text-[42px] md:text-[50px] leading-tight" style={{ color: 'var(--ink)' }}>
              The clinicians on the road,<br />
              <span style={{ color: 'var(--tang)' }}>not the recruiters.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.name} t={t} />
            ))}
          </div>
          <p className="text-xs text-center mt-8" style={{ color: 'var(--g400)' }}>
            Beta-user feedback. Names and photos used with consent.
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24" style={{ background: 'var(--plum-deep)' }}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-[42px] md:text-[52px] leading-tight mb-6 text-white">
            Ready to get paid<br />
            <em className="italic" style={{ color: 'var(--tang)' }}>what you deserve?</em>
          </h2>
          <p className="text-[17px] mb-10 leading-relaxed" style={{ color: 'var(--plum-100)' }}>
            Nurses keep more of every dollar. Hospitals fill roles for less. No middleman.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register/nurse"
              className="inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-[14px] text-white transition-all hover:-translate-y-px no-underline"
              style={{ background: 'var(--plum-light)', boxShadow: '0 8px 24px rgba(91,69,168,0.4)' }}>
              Join as a nurse
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/register/hospital"
              className="inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-[14px] text-white transition-all hover:-translate-y-px no-underline"
              style={{ background: 'var(--tang)', boxShadow: '0 8px 24px rgba(255,121,64,0.32)' }}>
              Post jobs as a hospital
              <ArrowRight className="w-4 h-4" />
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
