export const dynamic = 'force-dynamic'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'
import { ArrowRight, MapPin, Shield, Clock, CheckCircle, FileText, Search, Lock, Heart, Zap } from 'lucide-react'

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

  const { data: featuredJobs } = await supabase
    .from('job_postings')
    .select('*, employer_profiles(org_name, city, state)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(3)

  const tickerItems = [
    'ICU · Austin', 'ER · Miami', 'OR · Atlanta', 'NICU · Nashville',
    'Telemetry · Denver', 'L&D · Charlotte', 'PACU · Phoenix', 'ICU · Columbus',
    'ICU · Austin', 'ER · Miami', 'OR · Atlanta', 'NICU · Nashville',
    'Telemetry · Denver', 'L&D · Charlotte', 'PACU · Phoenix', 'ICU · Columbus',
  ]

  const states = [
    { state: 'Texas', why: 'Huge market, no state income tax, severe nurse shortage, business-friendly regulations.' },
    { state: 'Florida', why: 'Aging population drives massive HHA/CNA demand. Nation\'s fastest-growing healthcare market.' },
    { state: 'Georgia', why: 'Emerging healthcare hub. Atlanta attracts major hospital systems and lower cost of living.' },
    { state: 'North Carolina', why: 'Large academic hospital networks and one of the fastest-growing metros in the Southeast.' },
    { state: 'Tennessee', why: 'No state income tax. Nashville is a recognized healthcare industry HQ nationally.' },
    { state: 'Arizona', why: 'Consistently high travel-nurse demand, business-friendly climate, warm-weather draw.' },
    { state: 'Colorado', why: 'Strong healthcare market with premium pay rates and an attractive lifestyle for nurses.' },
    { state: 'Pennsylvania', why: 'Dense hospital network across Philadelphia and Pittsburgh — deep, consistent demand.' },
    { state: 'Ohio', why: 'Large skilled nursing and home-health market. Major cities all carry high HHA/CNA demand.' },
    { state: 'Michigan', why: 'Strong nursing workforce, high demand for HHAs, and growing rural hospital networks.' },
  ]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--cream)' }}>
      <Navbar userRole={userRole as 'nurse' | 'hospital' | 'admin' | null} userName={userName} />

      {/* ── Hero ── */}
      <section className="max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-12 pt-20 pb-14 md:pt-28 md:pb-20">
        <div className="grid lg:grid-cols-[55%_45%] gap-14 items-center">
          <div>
            {/* Eyebrow */}
            <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.8px] uppercase mb-8"
              style={{ background: 'var(--plum)', color: 'var(--plum-100)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--tang)', animation: 'pulse 2s infinite' }}></span>
              Live in 10 states · 2,400+ nurses
            </div>

            <h1 className="animate-fade-up delay-100 font-display text-[62px] md:text-[72px] leading-[1.02] tracking-[-0.5px] mb-7"
              style={{ color: 'var(--ink)' }}>
              Healthcare staffing<br />
              <em className="italic" style={{ color: 'var(--plum)' }}>without the</em><br />
              <span style={{ color: 'var(--tang)' }}>middleman.</span>
            </h1>

            <p className="animate-fade-up delay-200 text-[17px] leading-[1.82] mb-10 max-w-[480px]" style={{ color: 'var(--g600)' }}>
              NurseSquare connects verified travel nurses directly with hospitals. Nurses keep more of every dollar. Hospitals fill roles for less. No agency. No games.
            </p>

            {/* CTAs — both tang for visual harmony */}
            <div className="animate-fade-up delay-300 flex flex-wrap gap-3 mb-12">
              <Link href="/auth/register/nurse"
                className="inline-flex items-center gap-2 font-bold text-[15px] px-7 py-3.5 rounded-[14px] text-white transition-all hover:-translate-y-px no-underline"
                style={{ background: 'var(--tang)', boxShadow: '0 8px 24px rgba(255,121,64,0.32)' }}>
                Join as a nurse
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/auth/register/hospital"
                className="inline-flex items-center gap-2 font-bold text-[15px] px-7 py-3.5 rounded-[14px] text-white transition-all hover:-translate-y-px no-underline"
                style={{ background: 'var(--plum)', boxShadow: '0 8px 24px rgba(45,27,105,0.28)' }}>
                I&apos;m hiring
              </Link>
            </div>

            {/* Proof strip */}
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

          {/* Hero card */}
          <div className="hidden lg:block animate-scale-in delay-500">
            <div className="rounded-[24px] p-6 overflow-hidden relative"
              style={{ background: 'var(--plum-deep)', boxShadow: '0 32px 64px rgba(28,16,68,0.4)' }}>
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20" style={{ background: 'var(--plum-light)' }}></div>
              <div className="absolute -bottom-20 -left-10 w-44 h-44 rounded-full" style={{ background: 'var(--tang)', opacity: 0.07 }}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(200,190,255,0.15)', color: 'var(--plum-100)' }}>
                    ICU · Austin, TX
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--g400)' }}>13w contract</span>
                </div>
                <h3 className="font-display text-xl text-white mb-1">ICU Travel Nurse</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--plum-100)' }}>St. David's Medical Center</p>
                <div className="font-display text-[42px] mb-1" style={{ color: 'var(--tang)' }}>
                  $2,400<span className="text-base font-normal" style={{ color: 'var(--g400)' }}>/week</span>
                </div>
                <div className="h-px my-4" style={{ background: 'rgba(255,255,255,0.08)' }}></div>
                <div className="space-y-2 mb-5">
                  {['License verified via Nursys', 'Background check via Checkr', 'Escrow payment protected'].map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--g400)' }}>
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--sage)' }} />
                      {item}
                    </div>
                  ))}
                </div>
                <button className="w-full font-bold py-3 rounded-[14px] text-sm transition-all hover:opacity-90"
                  style={{ background: 'var(--tang)', color: 'white' }}>
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="py-3 overflow-hidden" style={{ background: 'var(--plum)' }}>
        <div className="flex gap-[60px] whitespace-nowrap" style={{ width: 'max-content', animation: 'scroll 32s linear infinite' }}>
          {tickerItems.map((item, i) => (
            <span key={i} className="flex items-center gap-2 text-[13px] font-medium" style={{ color: 'var(--plum-100)' }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--tang)' }}></span>
              {item}
            </span>
          ))}
        </div>
        <style>{`@keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      </div>

      {/* ── Feature cards: 3 core benefits ── */}
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
                desc: 'Free to join. Free to apply. Zero hidden fees. The rate you see is exactly what you earn — no agency skimming off the top.',
                bg: 'var(--plum-50)',
                iconColor: 'var(--plum)',
                border: 'var(--plum-100)',
                cta: { label: 'Join as a nurse', href: '/auth/register/nurse' },
              },
              {
                icon: Shield,
                title: 'Verified & trusted',
                desc: 'Every nurse is Nursys license-verified and Checkr background-cleared before they can apply. Hospitals know exactly who they\'re hiring.',
                bg: 'var(--sage-50)',
                iconColor: 'var(--sage)',
                border: 'rgba(58,168,118,0.2)',
                cta: { label: 'See how it works', href: '/about' },
              },
              {
                icon: Zap,
                title: 'Direct connections',
                desc: 'No recruiter gatekeeper. Nurses apply to facilities, facilities reach out to nurses — a two-way marketplace where both sides can initiate.',
                bg: 'var(--tang-50)',
                iconColor: 'var(--tang)',
                border: 'var(--tang-100)',
                cta: { label: 'Start hiring', href: '/auth/register/hospital' },
              },
            ].map(card => (
              <div key={card.title}
                className="rounded-2xl border p-8 flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{ background: 'white', borderColor: card.border }}>
                <div className="w-13 h-13 w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
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

      {/* ── Platform walkthrough ── */}
      <section className="py-24 border-y" style={{ background: 'white', borderColor: 'var(--g100)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="font-display text-[42px] md:text-[52px] leading-tight mb-5" style={{ color: 'var(--ink)' }}>
              The platform that finally<br />works for you.
            </h2>
            <p className="text-[17px] max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--g600)' }}>
              Nurses keep more of every dollar. Hospitals fill roles for less. No middleman.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            {/* Nurses column */}
            <div>
              <div className="flex items-center gap-3 mb-10">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ background: 'var(--plum-50)', color: 'var(--plum)' }}>N</span>
                <h3 className="font-display text-[22px]" style={{ color: 'var(--ink)' }}>Your skills. Your terms.</h3>
              </div>
              <div className="space-y-8">
                {[
                  { n: '01', icon: FileText, title: 'Build your verified profile', desc: 'License verified via Nursys. One background check via Checkr. Your profile works everywhere — no re-submitting per hospital.' },
                  { n: '02', icon: Search, title: 'Browse & apply directly', desc: 'Filter by specialty, location, and shift type. Apply to hospitals directly — no recruiter phone tag, no agency games.' },
                  { n: '03', icon: Lock, title: 'Get paid exactly what you see', desc: 'Zero hidden fees. Payment hits escrow when you accept, releases 48hrs after placement. Cancellation protection built in.' },
                ].map(item => (
                  <div key={item.n} className="flex gap-5">
                    <div className="font-display text-[80px] shrink-0 w-12 -mt-3 select-none"
                      style={{ color: 'var(--g100)', lineHeight: 1 }}>{item.n}</div>
                    <div className="pt-1">
                      <div className="font-semibold mb-1.5 text-[15px]" style={{ color: 'var(--ink)' }}>{item.title}</div>
                      <div className="text-[13px] leading-[1.7]" style={{ color: 'var(--g600)' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/auth/register/nurse"
                className="mt-10 inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-[12px] text-white no-underline transition-all hover:-translate-y-px"
                style={{ background: 'var(--tang)' }}>
                Join as a nurse <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Hospitals column */}
            <div>
              <div className="flex items-center gap-3 mb-10">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ background: 'var(--tang-50)', color: '#C04E20' }}>H</span>
                <h3 className="font-display text-[22px]" style={{ color: 'var(--ink)' }}>Hire direct. No markup.</h3>
              </div>
              <div className="space-y-8">
                {[
                  { n: '01', icon: FileText, title: 'Post your role', desc: 'Specialty, dates, weekly rate. Live in minutes. Seen by thousands of verified nurses immediately.' },
                  { n: '02', icon: Search, title: 'Review vetted applicants', desc: 'Every nurse is license-checked and background-cleared before they can apply. No surprises.' },
                  { n: '03', icon: Lock, title: 'Simple, transparent fee', desc: 'Funds held in Stripe escrow, released 48hrs after nurse starts. Cancellation policy enforced automatically.' },
                ].map(item => (
                  <div key={item.n} className="flex gap-5">
                    <div className="font-display text-[80px] shrink-0 w-12 -mt-3 select-none"
                      style={{ color: 'var(--g100)', lineHeight: 1 }}>{item.n}</div>
                    <div className="pt-1">
                      <div className="font-semibold mb-1.5 text-[15px]" style={{ color: 'var(--ink)' }}>{item.title}</div>
                      <div className="text-[13px] leading-[1.7]" style={{ color: 'var(--g600)' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/auth/register/hospital"
                className="mt-10 inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-[12px] text-white no-underline transition-all hover:-translate-y-px"
                style={{ background: 'var(--plum)' }}>
                Start hiring nurses <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10 States ── */}
      <section className="py-24" style={{ background: 'var(--cream-mid)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-[1fr_1.6fr] gap-16 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.8px] uppercase mb-6"
                style={{ background: 'var(--plum-50)', color: 'var(--plum)' }}>
                Where we operate
              </div>
              <h2 className="font-display text-[38px] md:text-[44px] leading-tight mb-5" style={{ color: 'var(--ink)' }}>
                10 states.<br />
                <em className="italic" style={{ color: 'var(--tang)' }}>Expanding fast.</em>
              </h2>
              <p className="text-[16px] leading-[1.78] mb-8" style={{ color: 'var(--g600)' }}>
                We launched in the highest-need, most business-friendly healthcare markets first — where nurses earn the most and hospitals need staff the most.
              </p>
              <Link href="/auth/register/nurse"
                className="inline-flex items-center gap-2 font-bold text-[15px] px-7 py-3.5 rounded-[14px] text-white no-underline transition-all hover:-translate-y-px"
                style={{ background: 'var(--tang)', boxShadow: '0 8px 24px rgba(255,121,64,0.28)' }}>
                Join as a nurse <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--g100)' }}>
              <div className="grid grid-cols-[1fr_2fr] bg-white border-b text-[11px] font-bold uppercase tracking-wider py-3 px-5"
                style={{ borderColor: 'var(--g100)', color: 'var(--g400)' }}>
                <span>State</span>
                <span>Why we launched here first</span>
              </div>
              {states.map((s, i) => (
                <div key={s.state}
                  className="grid grid-cols-[1fr_2fr] px-5 py-4 border-b last:border-0 items-start gap-4 transition-colors hover:bg-white"
                  style={{
                    borderColor: 'var(--g100)',
                    background: i % 2 === 0 ? 'white' : 'var(--cream)',
                  }}>
                  <span className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{s.state}</span>
                  <span className="text-sm leading-relaxed" style={{ color: 'var(--g600)' }}>{s.why}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Jobs ── */}
      {featuredJobs && featuredJobs.length > 0 && (
        <section className="py-24" style={{ background: 'white' }}>
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[11px] font-bold tracking-[0.8px] uppercase mb-3" style={{ color: 'var(--g400)' }}>Open positions</p>
                <h2 className="font-display text-[36px]" style={{ color: 'var(--ink)' }}>Apply directly.</h2>
                <p className="text-sm mt-1.5" style={{ color: 'var(--g600)' }}>No recruiter required.</p>
              </div>
              <Link href="/nurse/jobs" className="text-sm font-semibold flex items-center gap-1 no-underline mb-1"
                style={{ color: 'var(--plum)' }}>
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {featuredJobs.map((job: any) => (
                <div key={job.id} className="rounded-2xl p-5 border transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ background: 'var(--cream)', borderColor: 'var(--g100)' }}>
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'var(--plum-50)', color: 'var(--plum-mid)' }}>
                      {job.specialty_required}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--g400)' }}>{job.duration_weeks}w</span>
                  </div>
                  <h3 className="font-semibold mb-0.5" style={{ color: 'var(--ink)' }}>{job.title}</h3>
                  <p className="text-sm mb-3" style={{ color: 'var(--g600)' }}>{job.employer_profiles?.org_name}</p>
                  <div className="flex items-center gap-1 text-xs mb-5" style={{ color: 'var(--g400)' }}>
                    <MapPin className="w-3.5 h-3.5" />
                    {job.city}, {job.state}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xl" style={{ color: 'var(--ink)' }}>
                      ${job.weekly_rate?.toLocaleString()}<span className="text-xs font-normal" style={{ color: 'var(--g400)' }}>/wk</span>
                    </span>
                    <Link href={`/nurse/jobs/${job.id}`}
                      className="text-xs font-bold no-underline px-3 py-1.5 rounded-xl text-white transition-all"
                      style={{ background: 'var(--plum)' }}>
                      Apply →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ── */}
      <section className="py-24" style={{ background: 'var(--cream)' }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.8px] uppercase mb-5"
              style={{ background: 'var(--sage-50)', color: 'var(--sage)' }}>
              ★★★★★ Real stories
            </div>
            <h2 className="font-display text-[38px] md:text-[48px] leading-tight" style={{ color: 'var(--ink)' }}>
              Nurses and hospitals<br />love us.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "I made $18k more my first year on NurseSquare vs. my old agency. Zero hidden fees, just the rate I agreed to.",
                name: 'Kayla M.',
                role: 'ICU Travel Nurse · Austin, TX',
                initials: 'KM',
                accent: 'var(--plum)',
                bg: 'var(--plum-50)',
              },
              {
                quote: "We filled three ICU openings in 10 days. Background checks were done, licenses verified — we just said yes.",
                name: 'Dr. R. Thompson',
                role: 'Nursing Director · Regional Medical Center',
                initials: 'RT',
                accent: 'var(--sage)',
                bg: 'var(--sage-50)',
              },
              {
                quote: "Applied on a Tuesday, had an offer Wednesday morning. No recruiter phone tag. Just me and the hospital, direct.",
                name: 'Marcus J.',
                role: 'ER Travel Nurse · Miami, FL',
                initials: 'MJ',
                accent: 'var(--tang)',
                bg: 'var(--tang-50)',
              },
            ].map(t => (
              <div key={t.name} className="rounded-2xl p-8 border flex flex-col"
                style={{ background: 'white', borderColor: 'var(--g100)' }}>
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: 'var(--gold)' }}>★</span>
                  ))}
                </div>
                <p className="text-[15px] leading-[1.75] flex-1 mb-7" style={{ color: 'var(--g800)' }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: t.bg, color: t.accent }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{t.name}</div>
                    <div className="text-xs" style={{ color: 'var(--g400)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
              style={{ background: 'var(--tang)', boxShadow: '0 8px 24px rgba(255,121,64,0.32)' }}>
              Join as a nurse
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/register/hospital"
              className="inline-flex items-center justify-center font-bold px-8 py-4 rounded-[14px] transition-all border no-underline"
              style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'white' }}>
              Post jobs as a hospital
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
